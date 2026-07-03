import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';

const BodySchema = z.object({
  registration_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
});

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { registration_id, rating } = parsed.data;
  const admin = createAdminClient();

  // Resolve the session's event so we can verify the caller owns a registration for it.
  const { data: session } = await admin
    .from('sessions')
    .select('event_id')
    .eq('id', params.sessionId)
    .maybeSingle();
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Identity: the rater must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(session.event_id, registration_id);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const { error } = await admin
    .from('session_ratings')
    .upsert({ registration_id, session_id: params.sessionId, rating }, { onConflict: 'registration_id,session_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
