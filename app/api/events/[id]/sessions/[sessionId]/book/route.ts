import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { bookSessionSeat } from '@/lib/sessions/bookSeat';

interface Params { params: Promise<{ id: string; sessionId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: eventId, sessionId } = await params;
  const body = await req.json();
  const { registrationId, qrCodeToken } = body;
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
  const identity = await assertOwnsRegistration(eventId, registrationId, qrCodeToken);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  // Capacity check + insert are done in lib/sessions/bookSeat — the one place
  // that writes attendee_agendas, so the cap cannot be skipped by entering
  // through the other agenda route.
  const result = await bookSessionSeat(eventId, sessionId, registrationId);

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 });

  if (result.outcome === 'not_found') {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  if (result.outcome === 'full') {
    // `attendee_agendas` has no waitlist column, so there is nothing to join.
    // Say so plainly rather than writing a normal booking row and telling the
    // attendee they are "on the waitlist".
    return NextResponse.json(
      { booked: false, waitlisted: false, full: true, error: 'This session is full' },
      { status: 409 }
    );
  }

  return NextResponse.json({ booked: true, waitlisted: false, full: false });
}
