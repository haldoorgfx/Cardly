import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Load original event (verify ownership)
  const { data: src, error: srcErr } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (srcErr || !src) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Generate new slug
  const base = (src.name as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  const newSlug = `${base}-${suffix}`;
  const newName = `${src.name} (copy)`;

  // Create duplicate event
  const { data: newEvent, error: createErr } = await admin
    .from('events')
    .insert({
      user_id: user.id,
      name: newName,
      slug: newSlug,
      status: 'draft',
      background_url: src.background_url,
      background_width: src.background_width,
      background_height: src.background_height,
      zones: src.zones,
    })
    .select('id, slug')
    .single();

  if (createErr || !newEvent) {
    return NextResponse.json({ error: createErr?.message ?? 'Failed to duplicate' }, { status: 500 });
  }

  // Duplicate ticket types
  const { data: tickets } = await admin
    .from('ticket_types')
    .select('*')
    .eq('event_id', id);

  if (tickets?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('ticket_types').insert(tickets.map((t: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, event_id: _eid, created_at: _ca, ...rest } = t;
      return { ...rest, event_id: newEvent.id, sales_start: null, sales_end: null };
    }));
  }

  // Duplicate event page (cover/metadata) but clear dates
  const { data: srcPage } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', id)
    .single();

  if (srcPage) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcPageAny = srcPage as any;
    // Build new page fields, omitting identity/date columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageFields: any = {};
    for (const k of Object.keys(srcPageAny)) {
      if (['id', 'event_id', 'created_at', 'custom_slug'].includes(k)) continue;
      pageFields[k] = srcPageAny[k];
    }
    await admin.from('event_pages').insert({
      ...pageFields,
      event_id: newEvent.id,
      starts_at: null,
      ends_at: null,
      is_public: false,
      view_count: 0,
    });
  }

  // Duplicate variants
  const { data: variants } = await admin
    .from('event_variants')
    .select('*')
    .eq('event_id', id);

  if (variants?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await admin.from('event_variants').insert(variants.map((v: any) => ({
      event_id: newEvent.id,
      variant_name: v.variant_name,
      variant_slug: v.variant_slug,
      background_url: v.background_url,
      background_width: v.background_width,
      background_height: v.background_height,
      zones: v.zones,
      position: v.position,
    })));
  }

  return NextResponse.json({ id: newEvent.id, slug: newEvent.slug });
}
