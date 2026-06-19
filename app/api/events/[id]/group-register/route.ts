import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string }> }

interface Seat {
  ticketTypeId: string;
  name: string;
  email: string;
  whatsapp?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const { seats } = body as { seats: Seat[] };

  if (!seats || seats.length === 0) {
    return NextResponse.json({ error: 'No seats provided' }, { status: 400 });
  }
  if (seats.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 seats per group registration' }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Verify the caller owns the event
  const { data: event } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

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
  return NextResponse.json({ registrations: data });
}
