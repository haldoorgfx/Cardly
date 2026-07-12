import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';

const BodySchema = z.object({
  registration_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5).optional(),
  highlights: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { registration_id, ...rest } = parsed.data;

  // Identity: feedback must be tied to the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, registration_id);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  // Feedback opens once the event has started — OR as soon as the attendee has
  // been checked in (they've clearly attended, e.g. rolling / early check-in),
  // regardless of the scheduled start date.
  const { data: epFb } = await admin.from('event_pages').select('starts_at').eq('event_id', params.id).maybeSingle();
  if (epFb?.starts_at && new Date(epFb.starts_at) > new Date()) {
    const { data: regRow } = await admin
      .from('registrations')
      .select('status')
      .eq('id', registration_id)
      .maybeSingle();
    if (regRow?.status !== 'checked_in') {
      return NextResponse.json({ error: 'Feedback opens once the event begins.' }, { status: 422 });
    }
  }

  const { error } = await admin
    .from('event_feedback')
    .upsert({ registration_id, event_id: params.id, ...rest }, { onConflict: 'registration_id,event_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
