import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string; sessionId: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id: eventId, sessionId } = await params;
  const body = await req.json();
  const { registrationId } = body;
  if (!registrationId) return NextResponse.json({ error: 'registrationId required' }, { status: 400 });

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Check capacity
  const { data: session } = await adminAny
    .from('sessions')
    .select('capacity, registrations_count')
    .eq('id', sessionId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const isFull = session.capacity != null && (session.registrations_count ?? 0) >= session.capacity;

  // Upsert agenda entry (book or waitlist)
  const { error } = await adminAny.from('attendee_agendas').upsert(
    { registration_id: registrationId, session_id: sessionId, is_waitlisted: isFull },
    { onConflict: 'registration_id,session_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Increment count if not waitlisted
  if (!isFull && session.capacity != null) {
    await adminAny.rpc('increment_session_registrations', { session_id: sessionId });
  }

  return NextResponse.json({ booked: !isFull, waitlisted: isFull });
}
