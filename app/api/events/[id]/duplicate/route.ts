import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole } from '@/lib/rbac/assign';
import { generateSlug } from '@/lib/slug';
import { canCreateEvent } from '@/lib/billing/can';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Duplicating creates a real, billable event. /api/events/create and
  // /create-basic both enforce the plan's event cap; this route did not, so a
  // Free user at their 1-event limit could duplicate their way past it.
  if (!(await canCreateEvent(user.id))) {
    return NextResponse.json({ error: 'PLAN_LIMIT' }, { status: 402 });
  }

  const admin = createAdminClient();

  // Load original event (verify ownership)
  const { data: src, error: srcErr } = await admin
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (srcErr || !src) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const newName = `${src.name} (copy)`;

  // Create duplicate event. Retry on slug collision (23505) like the other two
  // create routes — the old 4-char suffix had no retry, so a collision surfaced
  // as a raw Postgres constraint message in the UI.
  let newEvent: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error: createErr } = await admin
      .from('events')
      .insert({
        user_id: user.id,
        name: newName,
        slug: generateSlug(newName),
        status: 'draft',
        background_url: src.background_url,
        background_width: src.background_width,
        background_height: src.background_height,
        zones: src.zones,
      })
      .select('id, slug')
      .single();
    if (!data && createErr?.code !== '23505') {
      return NextResponse.json({ error: createErr?.message ?? 'Failed to duplicate' }, { status: 500 });
    }
    if (data) { newEvent = data; break; }
  }

  if (!newEvent) {
    return NextResponse.json({ error: 'Could not generate a unique URL for the copy. Please try again.' }, { status: 500 });
  }

  // Roles write-path: the creator is the organizer of the duplicated event.
  await upsertEventRole({ userId: user.id, eventId: newEvent.id, role: 'organizer' });

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
