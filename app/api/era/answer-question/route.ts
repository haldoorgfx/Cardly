import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/billing/can';
import { hasERA } from '@/lib/ai/gate';
import { ERA } from '@/lib/ai/era';

// Public FAQ bot on event pages. No end-user auth (attendees are anonymous),
// but the feature is gated on the ORGANIZER's plan: ERA Q&A is a Pro/Studio
// feature, so we resolve the referenced event, look up its owner's plan, and
// only answer when ERA is enabled for that plan. This stops the route being an
// open, unauthenticated LLM proxy that burns GOOGLE_AI_KEY for anyone.
const schema = z.object({
  eventId: z.string().uuid(),
  question: z.string().min(1).max(500),
  event: z.object({
    name: z.string().min(1).max(300),
    description: z.string().max(5000).optional().default(''),
    date: z.string().max(200).optional().default(''),
    venue: z.string().max(300).optional().default(''),
    agenda: z.string().max(5000).optional(),
  }),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }
  const { eventId, question, event } = parsed.data;

  // Resolve the event's organizer and gate on their plan.
  const admin = createAdminClient();
  const { data: eventRow } = await admin
    .from('events')
    .select('user_id')
    .eq('id', eventId)
    .single();
  if (!eventRow?.user_id) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const plan = await getUserPlan(eventRow.user_id);
  if (!hasERA(plan)) {
    return NextResponse.json(
      { error: 'The ERA assistant is not enabled for this event.' },
      { status: 403 },
    );
  }

  try {
    // ERA gracefully falls back when GOOGLE_AI_KEY is missing (see lib/ai/era.ts).
    const result = await ERA.answerQuestion(question, event);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
