import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { hasModeratorAccess } from '@/lib/rbac/ownership';
import { getEventOwnerPlan } from '@/lib/billing/can';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';
import { z } from 'zod';
import { sendQAAnsweredEmail } from '@/lib/email';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

/** How many questions earn leaderboard points per attendee, per event. */
const SCORED_QUESTIONS_PER_EVENT = 5;

const AskSchema = z.object({
  registration_id: z.string().uuid().optional(),
  question: z.string().min(1).max(500),
  is_anonymous: z.boolean().default(false),
  session_id: z.string().uuid().nullable().optional(),
  qr_code_token: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('qa'))) return NextResponse.json({ error: 'Q&A is currently unavailable.' }, { status: 404 });

  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const status = searchParams.get('status');

  let query = admin
    .from('qa_questions')
    .select('*, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', params.id)
    .order('upvotes_count', { ascending: false })
    .order('created_at', { ascending: true });

  // `status` is caller-supplied, so `?status=hidden` used to hand back exactly
  // the questions a moderator removed (spam, abuse, doxxing) to anyone who
  // asked. Hidden questions are moderator-only; everyone else never sees them,
  // whatever they pass.
  let canSeeHidden = false;
  if (status === 'hidden') {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    canSeeHidden = !!user && (await hasModeratorAccess(user.id, params.id));
    if (!canSeeHidden) return NextResponse.json({ questions: [] });
  }

  if (sessionId) query = query.eq('session_id', sessionId);
  if (status) query = query.eq('status', status);
  else query = query.neq('status', 'hidden');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Both QandAClient and QAModerationClient already hide the name client-side
  // when is_anonymous — but the raw registration_id + real attendee_name were
  // still sitting in the JSON payload, defeating that for anyone reading the
  // network response directly. Redact server-side so "anonymous" is actually
  // anonymous, matching the app's own intent.
  const questions = (data ?? []).map((q) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { registration_id: _registrationId, registrations, ...rest } = q as typeof q & {
      registrations: { attendee_name: string } | null;
    };
    return {
      ...rest,
      registrations: q.is_anonymous ? null : registrations,
    };
  });

  return NextResponse.json({ questions });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('qa'))) return NextResponse.json({ error: 'Q&A is currently unavailable.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = AskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Identity: when a registration is supplied, it must be the caller's own.
  if (parsed.data.registration_id) {
    const identity = await assertOwnsRegistration(params.id, parsed.data.registration_id, parsed.data.qr_code_token);
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: identity.status });
    }
  }

  // Q&A is a Pro-plan feature (see app/(app)/events/[id]/q-and-a/page.tsx and
  // UpgradeSlideOver) — enforce server-side using the EVENT OWNER's plan, since
  // the caller here is an attendee/guest, not the organizer.
  const ownerPlan = await getEventOwnerPlan(params.id);
  if (!ownerPlan || PLAN_RANK[ownerPlan] < PLAN_RANK.pro) {
    return NextResponse.json({ error: 'Q&A requires the organizer to be on the Pro plan.' }, { status: 402 });
  }

  const admin = createAdminClient();

  const { data: epQa } = await admin.from('event_pages').select('ends_at').eq('event_id', params.id).maybeSingle();
  if (epQa?.ends_at && new Date(epQa.ends_at) < new Date()) {
    return NextResponse.json({ error: 'Q&A is closed — this event has already ended' }, { status: 422 });
  }

  // qr_code_token is an identity credential, not a qa_questions column — strip
  // it before the insert so it can't be spread into a row.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { qr_code_token: _qrCodeToken, ...questionFields } = parsed.data;

  const { data, error } = await admin
    .from('qa_questions')
    .insert({ event_id: params.id, ...questionFields })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award leaderboard points, up to a per-event cap.
  //
  // This used to score EVERY question with no dedup and no ceiling, so posting
  // two hundred questions bought a thousand points and the top of a leaderboard
  // that gets projected on a screen at the venue. Polls already guard against
  // repeat scoring and messages only score the first message in a thread — this
  // was the one open path.
  //
  // A cap rather than a one-off award: asking several good questions is exactly
  // the behaviour the feature exists to encourage, so the fix should not stop
  // paying out at the first one.
  //
  // award_qa_points (migration 121) does the count-check and insert inside one
  // advisory-locked transaction, so concurrent submissions from the same
  // attendee can no longer each read the same stale count and all pass the
  // cap simultaneously. Until that migration is applied by hand the RPC does
  // not exist — fall back to the previous read-then-write path so this
  // endpoint keeps working either way (same pattern as the waitlist route's
  // invite_waitlist_entry fallback).
  if (parsed.data.registration_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcErr } = await (admin as any).rpc('award_qa_points', {
      p_event_id: params.id,
      p_registration_id: parsed.data.registration_id,
      p_question_id: data.id,
      p_points: 5,
      p_cap: SCORED_QUESTIONS_PER_EVENT,
    });

    if (rpcErr) {
      // Fallback: pre-121 behaviour (read-then-write, racy but functional).
      const { count: scored } = await admin
        .from('leaderboard_points')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', params.id)
        .eq('registration_id', parsed.data.registration_id)
        .eq('action_type', 'question_asked');

      if ((scored ?? 0) < SCORED_QUESTIONS_PER_EVENT) {
        await admin.from('leaderboard_points').insert({
          event_id: params.id, registration_id: parsed.data.registration_id,
          action_type: 'question_asked', points: 5, ref_id: data.id,
        });
      }
    }
  }

  return NextResponse.json({ question: data }, { status: 201 });
}

// PATCH — organiser moderation: feature / answer / hide
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('qa'))) return NextResponse.json({ error: 'Q&A is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasModeratorAccess(user.id, params.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { questionId, status, is_featured } = await req.json();
  if (!questionId) return NextResponse.json({ error: 'questionId required' }, { status: 400 });

  const admin = createAdminClient();
  const updates = { ...(status !== undefined && { status }), ...(is_featured !== undefined && { is_featured }) };

  const { data, error } = await admin
    .from('qa_questions')
    .update(updates)
    .eq('id', questionId)
    .eq('event_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget: notify the asker when their question is marked answered
  if (status === 'answered' && data?.registration_id) {
    (async () => {
      const [{ data: event }, { data: reg }] = await Promise.all([
        admin.from('events').select('name, slug').eq('id', params.id).single(),
        admin
          .from('registrations')
          .select('attendee_name, attendee_email, qr_code_token')
          .eq('id', data.registration_id!)
          .single(),
      ]);
      if (!event || !reg) return;
      await sendQAAnsweredEmail({
        to: reg.attendee_email,
        attendeeName: reg.attendee_name,
        question: data.question,
        eventName: event.name,
        eventSlug: event.slug,
        qrCodeToken: reg.qr_code_token,
      });
    })().catch(() => {});
  }

  return NextResponse.json({ question: data });
}

// PUT — toggle upvote
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { question_id, registration_id, qr_code_token } = await req.json();
  if (!question_id || !registration_id) return NextResponse.json({ error: 'question_id and registration_id required' }, { status: 400 });

  // Identity: the upvoter must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, registration_id, qr_code_token);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  // registration_id is verified against THIS event, but question_id wasn't —
  // a registration for event A could upvote (and so re-rank the live display
  // of) event B's questions. Pin the question to this event.
  const { data: question } = await admin
    .from('qa_questions')
    .select('id, status')
    .eq('id', question_id)
    .eq('event_id', params.id)
    .maybeSingle();
  if (!question || question.status === 'hidden') {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const { data, error } = await admin.rpc('toggle_qa_upvote', { p_question_id: question_id, p_registration_id: registration_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ upvoted: data });
}
