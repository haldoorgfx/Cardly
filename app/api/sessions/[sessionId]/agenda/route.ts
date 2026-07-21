import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { bookSessionSeat } from '@/lib/sessions/bookSeat';
import { z } from 'zod';

const BodySchema = z.object({
  registration_id: z.string().uuid(),
  action: z.enum(['add', 'remove']),
});

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { registration_id, action } = parsed.data;
  const admin = createAdminClient();

  // Resolve the session's event so we can verify the caller owns a registration for it.
  const { data: session } = await admin
    .from('sessions')
    .select('event_id')
    .eq('id', params.sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Identity: the caller must act through their own registration (guests allowed).
  const identity = await assertOwnsRegistration(session.event_id, registration_id);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  if (action === 'add') {
    // Go through the shared seat-taker. This route used to upsert straight into
    // attendee_agendas with no capacity check whatsoever, which meant a
    // capacity-limited session was only actually capped for attendees who
    // booked from the Workshops list. The public session-detail page's "Save to
    // my agenda" button calls THIS route — so a full workshop could be joined
    // from the very page that displayed "30 / 30 seats".
    const result = await bookSessionSeat(session.event_id, params.sessionId, registration_id);

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 500 });
    if (result.outcome === 'not_found') return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (result.outcome === 'full') {
      return NextResponse.json({ saved: false, full: true, error: 'This session is full' }, { status: 409 });
    }
    return NextResponse.json({ saved: true, full: false });
  } else {
    const { error } = await admin
      .from('attendee_agendas')
      .delete()
      .eq('registration_id', registration_id)
      .eq('session_id', params.sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: false });
  }
}
