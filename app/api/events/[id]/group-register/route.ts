import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

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
  const { data: event } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', user.id).single();
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

  const rows = seats.map((s: Seat) => ({
    event_id: eventId,
    ticket_type_id: s.ticketTypeId,
    attendee_name: s.name,
    attendee_email: s.email,
    attendee_data: s.whatsapp ? { whatsapp: s.whatsapp } : {},
    status: 'confirmed',
    source: 'group_registration',
  }));

  const { data, error } = await adminAny
    .from('registrations')
    .insert(rows)
    .select('id, attendee_name, attendee_email');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
