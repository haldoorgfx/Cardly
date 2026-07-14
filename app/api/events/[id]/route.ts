import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';
import { isNotifAllowed } from '@/lib/notifications/prefs';
import { fireWebhooks } from '@/lib/webhooks';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('events')
    .select('*, event_variants(id, variant_name, variant_slug, background_url, background_width, background_height, zones, position, created_at)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const allowed = ['name', 'status', 'slug'] as const;
  type UpdateKey = typeof allowed[number];
  const patch: Partial<Record<UpdateKey, unknown>> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  const admin = createAdminClient();

  // Validate status if provided
  const validStatuses = ['draft', 'published', 'archived'];
  if ('status' in patch && !validStatuses.includes(patch.status as string)) {
    return NextResponse.json({ error: 'Invalid status — must be draft, published, or archived' }, { status: 400 });
  }

  // Normalize and guard slug changes
  if (typeof patch.slug === 'string') {
    const normalized = patch.slug
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
    if (!normalized) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    patch.slug = normalized;

    // Block slug changes on published events — every existing attendee link (/e/[slug]/...)
    // would 404 immediately. Organizer must archive the event first.
    const { data: current } = await admin
      .from('events')
      .select('status, slug')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    if (current?.status === 'published' && current.slug !== normalized) {
      return NextResponse.json(
        { error: 'The event URL cannot be changed while the event is published. Archive the event first, or keep the current URL.' },
        { status: 409 },
      );
    }
  }

  // Read the prior status so we can detect a genuine draft→published transition
  // (only fire the "new event" notification on the transition, not on re-saves).
  const { data: prior } = await admin
    .from('events')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  const { data, error } = await admin
    .from('events')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // Unique slug collision
    if (error.code === '23505') return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
    // No row updated (not found / not owned)
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Task 2: newly published event → notify followers of this organizer who opted in.
  if (patch.status === 'published' && prior?.status !== 'published') {
    try {
      const { data: ep } = await admin
        .from('event_pages')
        .select('title, custom_slug')
        .eq('event_id', id)
        .maybeSingle();
      const slug = (ep as { custom_slug?: string | null } | null)?.custom_slug ?? data.slug ?? id;
      const eventTitle = (ep as { title?: string | null } | null)?.title ?? data.name ?? 'a new event';

      // Fire the documented `event.published` webhook (fire-and-forget).
      fireWebhooks(user.id, 'event.published', {
        event_id: id,
        slug,
        title: eventTitle,
      }).catch(() => { /* non-critical */ });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: followers } = await (admin as any)
        .from('organizer_follows')
        .select('follower_id')
        .eq('organizer_id', user.id)
        .eq('notify_new_events', true);

      for (const f of (followers ?? []) as { follower_id: string }[]) {
        if (!f.follower_id) continue;
        // Respect the follower's "Organizers you follow" preference (opt-out;
        // default ON). This is on top of the per-follow notify_new_events flag.
        if (!(await isNotifAllowed(f.follower_id, 'organizer_follows', 'inapp'))) continue;
        createNotification({
          userId: f.follower_id,
          eventId: id,
          type: 'new_event',
          title: 'New event from an organizer you follow',
          body: eventTitle,
          actionUrl: `/e/${slug}`,
        });
      }
    } catch { /* notifications are non-critical */ }
  }

  return NextResponse.json(data);
}

function extractStoragePath(publicUrl: string, bucket: string): string | null {
  const marker = `/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  return idx >= 0 ? publicUrl.slice(idx + marker.length) : null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Verify ownership before touching storage — avoids leaking paths for events
  // the caller doesn't own (the DELETE below is also scoped to user_id, but this
  // ensures we don't collect storage paths for someone else's event first).
  const { data: owned } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Collect all storage paths before deleting the event
  const { data: variants } = await admin
    .from('event_variants')
    .select('background_url')
    .eq('event_id', id);

  const { error } = await admin
    .from('events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: remove background files from storage (don't block response on failure)
  if (variants && variants.length > 0) {
    const paths = variants
      .map(v => v.background_url ? extractStoragePath(v.background_url, 'event-backgrounds') : null)
      .filter((p): p is string => p !== null);
    if (paths.length > 0) {
      try { await admin.storage.from('event-backgrounds').remove(paths); } catch { /* best-effort */ }
    }
  }

  return NextResponse.json({ ok: true });
}
