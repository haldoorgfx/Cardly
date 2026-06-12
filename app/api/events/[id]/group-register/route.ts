import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string }> }

interface Seat {
  ticketTypeId: string;
  name: string;
  email: string;
  whatsapp?: string;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: eventId } = await params;
  const body = await req.json();
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
