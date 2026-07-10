import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';

interface Params { params: Promise<{ id: string; sessionId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: eventId, sessionId } = await params;
  const body = await req.json();
  const { registrationId } = body;
  if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Verify registration is confirmed (not pending/cancelled)
  const { data: reg } = await adminAny
    .from('registrations')
    .select('id, status')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .maybeSingle();
  if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  if (!['confirmed', 'checked_in'].includes(reg.status)) {
    return NextResponse.json({ error: 'Only confirmed attendees can book sessions' }, { status: 403 });
  }

  // Identity: when authenticated, the registration must belong to the caller (guests allowed).
  const identity = await assertOwnsRegistration(eventId, registrationId);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  // Check capacity
  const { data: session } = await adminAny
    .from('sessions')
    .select('capacity, registrations_count')
    .eq('id', sessionId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const isFull = session.capacity != null && (session.registrations_count ?? 0) >= session.capacity;

  // Upsert agenda entry. `attendee_agendas` only stores (registration_id,
  // session_id) — there is no waitlist column in the schema, so capacity is
  // surfaced in the response only, never persisted.
  const { error } = await adminAny.from('attendee_agendas').upsert(
    { registration_id: registrationId, session_id: sessionId },
    { onConflict: 'registration_id,session_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ booked: !isFull, waitlisted: isFull });
}
