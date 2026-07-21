import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { authorizeEventContent } from '@/lib/auth/event-content';
import { getUserPlan, getEventOwnerPlan } from '@/lib/billing/can';
import { generateMatches, generateMatchesForOne } from '@/lib/matchmaking';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

// GET /api/events/[id]/matches?registration_id=xxx
// Returns cached match suggestions for an attendee. Generates on-demand if none exist.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const registrationId = searchParams.get('registration_id');

  if (!registrationId) {
    return NextResponse.json({ error: 'registration_id required' }, { status: 400 });
  }

  // Without this, anyone could read another attendee's match suggestions
  // (name + custom profile fields) by swapping the registration_id.
  const identity = await assertOwnsRegistration(params.id, registrationId);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  // Return cached suggestions if available
  const { data: cached } = await admin
    .from('match_suggestions')
    .select('matched_registration_id, score, reason')
    .eq('registration_id', registrationId)
    .eq('event_id', params.id)
    .order('score', { ascending: false })
    .limit(5);

  if (cached && cached.length > 0) {
    // Enrich with names
    const ids = cached.map(c => c.matched_registration_id);
    const { data: regs } = await admin
      .from('registrations')
      .select('id, attendee_name, custom_fields')
      .eq('event_id', params.id)
      .in('id', ids);

    const regMap = new Map((regs ?? []).map(r => [r.id, r]));
    const enriched = cached.map(c => ({
      ...c,
      registration: regMap.get(c.matched_registration_id) ?? null,
    }));

    return NextResponse.json({ matches: enriched, cached: true });
  }

  // Same Pro gate the bulk POST below enforces. Without it this branch was the
  // way around it: the POST is organiser-triggered and plan-checked, but THIS
  // path runs an LLM call over a 100-attendee pool on demand for any attendee
  // who opens the networking tab — so a Free event still generated (and paid
  // for) matchmaking, one Gemini call per attendee, simply by being visited.
  // Cached reads above are deliberately left alone: matches already generated
  // while the organiser was on Pro stay visible after a downgrade.
  const ownerPlan = await getEventOwnerPlan(params.id);
  if (!ownerPlan || PLAN_RANK[ownerPlan] < PLAN_RANK.pro) {
    return NextResponse.json({ matches: [], cached: false });
  }

  // Generate on demand for this attendee
  const { data: event } = await admin.from('events').select('name').eq('id', params.id).single();
  const eventName = event?.name ?? 'the event';

  const { data: target } = await admin
    .from('registrations')
    .select('id, attendee_name, custom_fields')
    .eq('id', registrationId)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  const { data: pool } = await admin
    .from('registrations')
    .select('id, attendee_name, custom_fields')
    .eq('event_id', params.id)
    .neq('id', registrationId)
    .limit(100);

  if (!pool || pool.length === 0) {
    return NextResponse.json({ matches: [], cached: false });
  }

  try {
    const suggestions = await generateMatchesForOne(
      {
        registration_id: target.id,
        attendee_name: target.attendee_name,
        attendee_data: (target.custom_fields as Record<string, string>) ?? {},
      },
      pool.map(r => ({
        registration_id: r.id,
        attendee_name: r.attendee_name,
        attendee_data: (r.custom_fields as Record<string, string>) ?? {},
      })),
      eventName,
      5
    );

    if (suggestions.length > 0) {
      await admin.from('match_suggestions').upsert(
        suggestions.map(s => ({
          event_id: params.id,
          registration_id: s.registration_id,
          matched_registration_id: s.matched_registration_id,
          score: s.score,
          reason: s.reason,
        })),
        { onConflict: 'event_id,registration_id,matched_registration_id' }
      );
    }

    // Enrich with names
    const matchedIds = suggestions.map(s => s.matched_registration_id);
    // Scope to THIS event. These ids come back from the model, so they are not
    // trustworthy by construction — an id it echoes wrong (or is talked into
    // emitting) would otherwise return another event's attendee name and custom
    // fields to someone who never registered for that event.
    const { data: matchedRegs } = await admin
      .from('registrations')
      .select('id, attendee_name, custom_fields')
      .eq('event_id', params.id)
      .in('id', matchedIds.length ? matchedIds : ['00000000-0000-0000-0000-000000000000']);

    const regMap = new Map((matchedRegs ?? []).map(r => [r.id, r]));

    const enriched = suggestions.map(s => ({
      matched_registration_id: s.matched_registration_id,
      score: s.score,
      reason: s.reason,
      registration: regMap.get(s.matched_registration_id) ?? null,
    }));

    return NextResponse.json({ matches: enriched, cached: false });
  } catch (err) {
    console.error('[matchmaking] error:', err);
    return NextResponse.json({ error: 'Matchmaking temporarily unavailable' }, { status: 503 });
  }
}

// POST /api/events/[id]/matches — organiser-triggered bulk generation.
// Gated to the event owner/contributors: this runs LLM generation over up to
// 200 attendees, so it must not be publicly triggerable.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authorizeEventContent(params.id);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Networking / matchmaking is a Pro-plan feature (see app/(app)/events/[id]/page.tsx
  // ACTION_CARDS minPlan and UpgradeSlideOver) — enforce server-side, not just the
  // dashboard page gate. This also runs LLM generation over up to 200 attendees, so
  // it must not be triggerable for a Free/no-plan event.
  const plan = await getUserPlan(auth.userId);
  if (PLAN_RANK[plan] < PLAN_RANK.pro) {
    return NextResponse.json({ error: 'Matchmaking requires the Pro plan.' }, { status: 402 });
  }

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name')
    .eq('id', params.id)
    .single();

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  const { data: registrations } = await admin
    .from('registrations')
    .select('id, attendee_name, custom_fields')
    .eq('event_id', params.id)
    .limit(200);

  if (!registrations || registrations.length < 2) {
    return NextResponse.json({ message: 'Not enough attendees to match', count: 0 });
  }

  try {
    const profiles = registrations.map(r => ({
      registration_id: r.id,
      attendee_name: r.attendee_name,
      attendee_data: (r.custom_fields as Record<string, string>) ?? {},
    }));

    const suggestions = await generateMatches(profiles, event.name, 3);

    if (suggestions.length > 0) {
      // Store bidirectionally so each attendee can query their own suggestions
      const rows = suggestions.flatMap(s => [
        {
          event_id: params.id,
          registration_id: s.registration_id,
          matched_registration_id: s.matched_registration_id,
          score: s.score,
          reason: s.reason,
        },
        {
          event_id: params.id,
          registration_id: s.matched_registration_id,
          matched_registration_id: s.registration_id,
          score: s.score,
          reason: s.reason,
        },
      ]);

      await admin
        .from('match_suggestions')
        .upsert(rows, { onConflict: 'event_id,registration_id,matched_registration_id' });
    }

    return NextResponse.json({ message: 'Matches generated', count: suggestions.length });
  } catch (err) {
    console.error('[matchmaking bulk] error:', err);
    return NextResponse.json({ error: 'Matchmaking failed' }, { status: 500 });
  }
}
