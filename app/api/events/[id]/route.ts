import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
