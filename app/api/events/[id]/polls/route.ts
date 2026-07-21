import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { hasModeratorAccess } from '@/lib/rbac/ownership';
import { getUserPlan } from '@/lib/billing/can';
import { z } from 'zod';

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, studio: 2 };

const CreateSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  session_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(false),
});

const VoteSchema = z.object({
  poll_id: z.string().uuid(),
  option_id: z.string().uuid(),
  registration_id: z.string().uuid(),
  qr_code_token: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('active') === 'true';

  // This route is public (the live display and the attendee polls page both
  // read it unauthenticated), so it must not hand out polls the organizer has
  // written but not launched. PollsClient already filters drafts out visually —
  // that was client-side only, so the draft questions still shipped in the JSON.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isModerator = user ? await hasModeratorAccess(user.id, params.id) : false;

  let query = admin
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', params.id)
    .order('created_at', { ascending: false });

  if (activeOnly) query = query.eq('is_active', true).eq('is_closed', false);
  else if (!isModerator) query = query.or('is_active.eq.true,is_closed.eq.true');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ polls: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await hasModeratorAccess(user.id, params.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Q&A & Polls is a Pro-plan feature (see app/(app)/events/[id]/q-and-a/page.tsx
  // and UpgradeSlideOver) — enforce server-side, not just the dashboard page gate.
  const plan = await getUserPlan(user.id);
  if (PLAN_RANK[plan] < PLAN_RANK.pro) {
    return NextResponse.json({ error: 'Polls require the Pro plan.' }, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const admin = createAdminClient();

  const { data: epPoll } = await admin.from('event_pages').select('ends_at').eq('event_id', params.id).maybeSingle();
  if (epPoll?.ends_at && new Date(epPoll.ends_at) < new Date()) {
    return NextResponse.json({ error: 'Cannot create polls for an event that has already ended' }, { status: 422 });
  }

  const { options, ...pollData } = parsed.data;
  const { data: poll, error } = await admin
    .from('polls')
    .insert({ event_id: params.id, organizer_id: user.id, ...pollData })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from('poll_options').insert(options.map((text, i) => ({ poll_id: poll.id, text, position: i })));
  return NextResponse.json({ poll }, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await hasModeratorAccess(user.id, params.id))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { pollId, is_active, is_closed } = await req.json();
  if (!pollId) return NextResponse.json({ error: 'pollId required' }, { status: 400 });

  const admin = createAdminClient();

  if (is_active === true) {
    const { data: epActive } = await admin.from('event_pages').select('ends_at').eq('event_id', params.id).maybeSingle();
    if (epActive?.ends_at && new Date(epActive.ends_at) < new Date()) {
      return NextResponse.json({ error: 'Cannot activate a poll after the event has ended' }, { status: 422 });
    }
  }

  const updates = { ...(is_active !== undefined && { is_active }), ...(is_closed !== undefined && { is_closed }) };

  const { data, error } = await admin
    .from('polls')
    .update(updates)
    .eq('id', pollId)
    .eq('event_id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ poll: data });
}

// PUT — cast a vote
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { poll_id, option_id, registration_id, qr_code_token } = parsed.data;

  // Identity: the voter must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, registration_id, qr_code_token);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();

  // The registration is verified for THIS event, but poll_id/option_id were
  // caller-supplied and unchecked — an attendee of event A could vote on event
  // B's poll, or point option_id at an option belonging to a different poll
  // entirely (which just incremented that unrelated counter). Pin both.
  const { data: poll } = await admin
    .from('polls')
    .select('id, is_active, is_closed')
    .eq('id', poll_id)
    .eq('event_id', params.id)
    .maybeSingle();
  if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  if (!poll.is_active || poll.is_closed) {
    return NextResponse.json({ error: 'This poll is not open for voting' }, { status: 422 });
  }

  const { data: option } = await admin
    .from('poll_options')
    .select('id')
    .eq('id', option_id)
    .eq('poll_id', poll_id)
    .maybeSingle();
  if (!option) return NextResponse.json({ error: 'Option not found' }, { status: 404 });

  // One vote per registration per poll. The RPC is the atomic guard (migration
  // 108), but check first so repeat calls don't award repeat leaderboard points.
  const { data: existingVote } = await admin
    .from('poll_votes')
    .select('option_id')
    .eq('poll_id', poll_id)
    .eq('registration_id', registration_id)
    .maybeSingle();

  if (existingVote) {
    const { data: current } = await admin.from('poll_options').select('id, votes_count').eq('poll_id', poll_id);
    return NextResponse.json({ voted: true, already_voted: true, options: current });
  }

  const { error } = await admin.rpc('cast_poll_vote', { p_poll_id: poll_id, p_option_id: option_id, p_registration_id: registration_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award leaderboard point
  await admin.from('leaderboard_points').insert({ event_id: params.id, registration_id, action_type: 'poll_voted', points: 5, ref_id: poll_id });

  // Return updated options
  const { data: opts } = await admin.from('poll_options').select('id, votes_count').eq('poll_id', poll_id);
  return NextResponse.json({ voted: true, options: opts });
}
