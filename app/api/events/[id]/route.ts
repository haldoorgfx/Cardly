import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createNotification } from '@/lib/notifications';
import { isNotifAllowed } from '@/lib/notifications/prefs';
import { fireWebhooks } from '@/lib/webhooks';
import { slugifyBase } from '@/lib/slug';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

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
    .in('user_id', await manageableOwnerIds(user.id))
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
    const normalized = slugifyBase(patch.slug, 60);
    if (!normalized) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    patch.slug = normalized;

    // Block slug changes on published events — every existing attendee link (/e/[slug]/...)
    // would 404 immediately. Organizer must archive the event first.
    const { data: current } = await admin
      .from('events')
      .select('status, slug')
      .eq('id', id)
      .in('user_id', await manageableOwnerIds(user.id))
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
    .in('user_id', await manageableOwnerIds(user.id))
    .maybeSingle();
  const { data, error } = await admin
    .from('events')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .select()
    .single();

  if (error) {
    // Unique slug collision
    if (error.code === '23505') return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
    // No row updated (not found / not owned)
    if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Keep the public page's visibility switch in sync with the event status.
  // The public event page (and the register API) resolve purely on
  // event_pages.is_public — events.status is NOT consulted. So "Unpublish"
  // (status → draft/archived) left the page fully live at /e/[slug] and still
  // selling tickets to anyone holding the link; it only disappeared from the
  // /events listing, which does filter on status.
  if (patch.status && prior?.status && patch.status !== prior.status) {
    const shouldBePublic = patch.status === 'published';
    if (shouldBePublic !== (prior.status === 'published')) {
      await admin
        .from('event_pages')
        .update({ is_public: shouldBePublic })
        .eq('event_id', id);
    }
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

      // Bounded, AWAITED fan-out. These were fired without await, so on
      // serverless the function could freeze on response and drop the whole
      // batch — a popular organizer's followers would silently never hear that
      // a new event went live. Chunking also caps concurrency, and runs the
      // per-follower preference check in parallel instead of one at a time.
      // Respects the "Organizers you follow" preference (opt-out; default ON),
      // on top of the per-follow notify_new_events flag.
      const followerIds = ((followers ?? []) as { follower_id: string }[])
        .map(f => f.follower_id)
        .filter(Boolean);

      const NOTIFY_CHUNK = 25;
      for (let i = 0; i < followerIds.length; i += NOTIFY_CHUNK) {
        await Promise.allSettled(
          followerIds.slice(i, i + NOTIFY_CHUNK).map(async (followerId) => {
            if (!(await isNotifAllowed(followerId, 'organizer_follows', 'inapp'))) return;
            await createNotification({
              userId: followerId,
              eventId: id,
              type: 'new_event',
              title: 'New event from an organizer you follow',
              body: eventTitle,
              actionUrl: `/e/${slug}`,
            });
          }),
        );
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
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Collect ALL storage paths before deleting the event. The DB rows cascade
  // away, but Storage objects don't — anything not collected here is orphaned
  // forever and billed forever. Previously only variant backgrounds were
  // cleaned, so every cover image, event background, sponsor logo/resource and
  // session slide deck leaked on each event deletion.
  const { data: variants } = await admin
    .from('event_variants')
    .select('background_url')
    .eq('event_id', id);

  const { data: eventRow } = await admin
    .from('events')
    .select('background_url, cover_image_url')
    .eq('id', id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sponsorRows } = await (admin as any)
    .from('sponsors')
    .select('logo_url')
    .eq('event_id', id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionRows } = await (admin as any)
    .from('sessions')
    .select('slides_url')
    .eq('event_id', id);

  const { error } = await admin
    .from('events')
    .delete()
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: remove the files from storage (don't block the response on
  // failure — the event row is already gone and a stray object is not fatal).
  const collect = (urls: Array<string | null | undefined>, bucket: string) =>
    urls
      .map(u => (u ? extractStoragePath(u, bucket) : null))
      .filter((p): p is string => p !== null);

  const bgPaths = collect(
    [
      ...(variants ?? []).map(v => v.background_url),
      (eventRow as { background_url?: string | null } | null)?.background_url,
      (eventRow as { cover_image_url?: string | null } | null)?.cover_image_url,
    ],
    'event-backgrounds',
  );

  const assetPaths = collect(
    [
      ...((sponsorRows ?? []) as Array<{ logo_url?: string | null }>).map(s => s.logo_url),
      ...((sessionRows ?? []) as Array<{ slides_url?: string | null }>).map(s => s.slides_url),
    ],
    'event-assets',
  );

  if (bgPaths.length > 0) {
    try { await admin.storage.from('event-backgrounds').remove(bgPaths); } catch { /* best-effort */ }
  }
  if (assetPaths.length > 0) {
    try { await admin.storage.from('event-assets').remove(assetPaths); } catch { /* best-effort */ }
  }

  // Anonymous application-form uploads are keyed by event id, so they can be
  // swept by prefix without needing a DB row to point at them.
  try {
    const { data: appFiles } = await admin.storage
      .from('event-assets')
      .list(`application-files/${id}`, { limit: 1000 });
    if (appFiles && appFiles.length > 0) {
      await admin.storage
        .from('event-assets')
        .remove(appFiles.map(f => `application-files/${id}/${f.name}`));
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ ok: true });
}
