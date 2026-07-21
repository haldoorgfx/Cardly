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

  // Capacity check + insert happen atomically inside book_session_seat (migration
  // 107) with the session row locked. Doing it here as read-then-write let two
  // people take the same last seat, and — worse — the old code ran the upsert
  // even when it had just decided the session was full, so `capacity` never
  // actually stopped anyone.
  const { data: outcome, error: rpcError } = await adminAny.rpc('book_session_seat', {
    p_event_id: eventId,
    p_session_id: sessionId,
    p_registration_id: registrationId,
  });

  if (!rpcError) {
    if (outcome === 'not_found') return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (outcome === 'full') {
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

  // ── Fallback: migration 107 not applied yet ──────────────────────────────
  // Keep booking working (non-atomic, best-effort cap) until the RPC exists.
  const { data: session } = await adminAny
    .from('sessions')
    .select('capacity, registrations_count')
    .eq('id', sessionId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  if (session.capacity != null) {
    // Count real rows — registrations_count is only truthful once migration 099
    // has been applied, and reads 0 forever before that.
    const { count } = await adminAny
      .from('attendee_agendas')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if ((count ?? 0) >= session.capacity) {
      return NextResponse.json(
        { booked: false, waitlisted: false, full: true, error: 'This session is full' },
        { status: 409 }
      );
    }
  }

  const { error } = await adminAny.from('attendee_agendas').upsert(
    { registration_id: registrationId, session_id: sessionId },
    { onConflict: 'registration_id,session_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ booked: true, waitlisted: false, full: false });
}
