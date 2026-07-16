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
//
// The event details fed to the model are always looked up server-side from
// event_pages by eventId — never taken from the request body. A caller could
// otherwise pass a real (Pro/Studio) eventId to pass the plan gate, then swap
// in an entirely fabricated "event" description/agenda of their own choosing,
// turning this into a free-form prompt against the organizer's paid AI quota.
const schema = z.object({
  eventId: z.string().uuid(),
  question: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }
  const { eventId, question } = parsed.data;

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

  const { data: page } = await admin
    .from('event_pages')
    .select('title, description, starts_at, timezone, venue_name, venue_address, is_online')
    .eq('event_id', eventId)
    .maybeSingle();
  if (!page) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const event = {
    name: page.title ?? 'This event',
    description: page.description ?? '',
    date: page.starts_at
      ? new Date(page.starts_at).toLocaleString('en', {
          dateStyle: 'medium', timeStyle: 'short', timeZone: page.timezone ?? undefined,
        })
      : '',
    venue: page.is_online ? 'Online' : (page.venue_name ?? page.venue_address ?? 'TBD'),
  };

  try {
    // ERA gracefully falls back when GOOGLE_AI_KEY is missing (see lib/ai/era.ts).
    const result = await ERA.answerQuestion(question, event);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
