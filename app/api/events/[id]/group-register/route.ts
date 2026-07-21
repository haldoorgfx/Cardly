import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { getUserPlan } from '@/lib/billing/can';
import { PLANS } from '@/lib/billing/plans';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Params { params: Promise<{ id: string }> }

interface Seat {
  ticketTypeId: string;
  name: string;
  email: string;
  whatsapp?: string;
}

const seatSchema = z.object({
  ticketTypeId: z.string().uuid(),
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(254).transform(v => v.toLowerCase().trim()),
  whatsapp: z.string().max(40).optional(),
});
const bodySchema = z.object({
  seats: z.array(seatSchema).min(1).max(50),
});

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Each seat needs a name, a valid email, and a ticket type. Max 50 seats.' }, { status: 400 });
  }
  const seats: Seat[] = parsed.data.seats;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Verify the caller owns the event
  const { data: event } = await admin.from('events').select('id').eq('id', eventId).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Every seat's ticket type must belong to THIS event — otherwise a caller
  // could point seats at another tenant's ticket type and corrupt its counter.
  const { data: validTypes } = await admin
    .from('ticket_types')
    .select('id')
    .eq('event_id', eventId);
  const validTypeIds = new Set((validTypes ?? []).map(t => t.id));
  const hasForeignType = seats.some(s => !validTypeIds.has(s.ticketTypeId));
  if (hasForeignType) {
    return NextResponse.json({ error: 'One or more ticket types do not belong to this event.' }, { status: 400 });
  }

  const { data: ep } = await admin.from('event_pages').select('ends_at, max_capacity').eq('event_id', eventId).maybeSingle();
  if (ep?.ends_at && new Date(ep.ends_at) < new Date()) {
    return NextResponse.json({ error: 'This event has already ended — group registration is not available' }, { status: 422 });
  }
  if (ep?.max_capacity) {
    const { count } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['confirmed', 'checked_in']);
    const remaining = ep.max_capacity - (count ?? 0);
    if (seats.length > remaining) {
      return NextResponse.json({
        error: `Not enough capacity. Registering ${seats.length} people but only ${remaining} spot${remaining === 1 ? '' : 's'} remain${remaining === 1 ? 's' : ''}.`,
      }, { status: 409 });
    }
  }

  // Free-tier plan cap (CLAUDE.md: Free = 1 event, 50 registrations).
  const plan = await getUserPlan(user.id);
  const planLimit = PLANS[plan].registrationsPerEvent;
  if (planLimit !== null) {
    const { count: planCount } = await admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', eventId).in('status', ['confirmed', 'checked_in']);
    const planRemaining = planLimit - (planCount ?? 0);
    if (seats.length > planRemaining) {
      return NextResponse.json({
        error: planRemaining <= 0
          ? 'This event has reached the registration limit for your current plan. Upgrade to add more attendees.'
          : `Your plan allows ${planRemaining} more registration${planRemaining === 1 ? '' : 's'} for this event. Upgrade to add more.`,
      }, { status: 409 });
    }
  }

  // `registrations` has a case-insensitive unique index on
  // (event_id, lower(attendee_email)) (047). One duplicate — two seats sharing
  // an email, or an email already on the list — aborts the whole batch with a
  // raw 23505. Pre-check so the organizer gets a plain-language reason and the
  // request fails atomically before any partial work.
  const normalized = seats.map(s => s.email.trim().toLowerCase());
  const dupeInBatch = normalized.filter((e, i) => normalized.indexOf(e) !== i);
  if (dupeInBatch.length) {
    return NextResponse.json({
      error: `The same email is used more than once: ${Array.from(new Set(dupeInBatch)).join(', ')}. Each seat needs a different email.`,
    }, { status: 409 });
  }
  const { data: existing } = await admin
    .from('registrations')
    .select('attendee_email')
    .eq('event_id', eventId)
    .in('attendee_email', normalized);
  const already = Array.from(new Set((existing ?? []).map(r => (r.attendee_email as string).toLowerCase())));
  if (already.length) {
    return NextResponse.json({
      error: already.length === 1
        ? `${already[0]} is already registered for this event.`
        : `${already.length} of these people are already registered: ${already.join(', ')}.`,
    }, { status: 409 });
  }

  // Capacity pre-check per ticket type. increment_ticket_quantity_sold silently
  // NO-OPS when it would push quantity_sold past quantity, so without this the
  // seats got inserted while the counter stayed put — a permanent oversell that
  // surfaced no error to anyone.
  const wanted: Record<string, number> = {};
  for (const s of seats as Seat[]) {
    if (s.ticketTypeId) wanted[s.ticketTypeId] = (wanted[s.ticketTypeId] ?? 0) + 1;
  }
  const wantedIds = Object.keys(wanted);
  if (wantedIds.length > 0) {
    const { data: tts } = await adminAny
      .from('ticket_types')
      .select('id, name, quantity, quantity_sold')
      .in('id', wantedIds);
    for (const tt of (tts ?? []) as { id: string; name: string; quantity: number | null; quantity_sold: number }[]) {
      if (tt.quantity == null) continue; // unlimited
      const remaining = tt.quantity - (tt.quantity_sold ?? 0);
      const need = wanted[tt.id] ?? 0;
      if (need > remaining) {
        return NextResponse.json({
          error: `Only ${Math.max(0, remaining)} seat${remaining === 1 ? '' : 's'} left on “${tt.name}” — you tried to register ${need}.`,
        }, { status: 409 });
      }
    }
  }

  const rows = seats.map((s: Seat) => ({
    event_id: eventId,
    ticket_type_id: s.ticketTypeId,
    attendee_name: s.name,
    attendee_email: s.email,
    attendee_data: s.whatsapp ? { whatsapp: s.whatsapp } : {},
    status: 'confirmed',
    // Be explicit: a group registration is confirmed by the organizer with any
    // payment handled out-of-band, so Eventera processed nothing. Leaving these
    // unset left the rows looking like confirmed-but-unpaid and made them
    // ambiguous to every revenue query.
    payment_status: 'free',
    amount_paid: 0,
    source: 'group_registration',
  }));

  const { data, error } = await adminAny
    .from('registrations')
    .insert(rows)
    .select('id, attendee_name, attendee_email');

  if (error) {
    // A duplicate that slipped past the pre-check (a race) reads far better as
    // a 409 than a raw Postgres 500.
    if (error.code === '23505') {
      return NextResponse.json({
        error: 'One of these people was just registered by someone else. Refresh the list and retry the remaining seats.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment quantity_sold per ticket type
  const qtyCounts: Record<string, number> = {};
  for (const seat of seats) {
    if (seat.ticketTypeId) qtyCounts[seat.ticketTypeId] = (qtyCounts[seat.ticketTypeId] ?? 0) + 1;
  }
  await Promise.all(
    Object.entries(qtyCounts).map(([ticketId, qty]) =>
      admin.rpc('increment_ticket_quantity_sold', { ticket_id: ticketId, qty })
    )
  );

  // Roles write-path: each confirmed seat → 'attendee' role for that person's
  // account, if one exists (matched by email). Best-effort; never blocks.
  await Promise.all(
    seats.map(async (s: Seat) => {
      const attendeeAccountId = await resolveAccountIdByEmail(s.email);
      if (attendeeAccountId) await upsertEventRole({ userId: attendeeAccountId, eventId, role: 'attendee' });
    }),
  );

  return NextResponse.json({ registrations: data });
}
