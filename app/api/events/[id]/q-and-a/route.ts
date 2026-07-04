import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { z } from 'zod';
import { sendQAAnsweredEmail } from '@/lib/email';

const AskSchema = z.object({
  registration_id: z.string().uuid().optional(),
  question: z.string().min(1).max(500),
  is_anonymous: z.boolean().default(false),
  session_id: z.string().uuid().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

  if (sessionId) query = query.eq('session_id', sessionId);
  if (status) query = query.eq('status', status);
  else query = query.neq('status', 'hidden');

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = AskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Identity: when a registration is supplied, it must be the caller's own.
  if (parsed.data.registration_id) {
    const identity = await assertOwnsRegistration(params.id, parsed.data.registration_id);
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: identity.status });
    }
  }

  const admin = createAdminClient();

  const { data: epQa } = await admin.from('event_pages').select('ends_at').eq('event_id', params.id).maybeSingle();
  if (epQa?.ends_at && new Date(epQa.ends_at) < new Date()) {
    return NextResponse.json({ error: 'Q&A is closed — this event has already ended' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('qa_questions')
    .insert({ event_id: params.id, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Award leaderboard points
  if (parsed.data.registration_id) {
    await admin.from('leaderboard_points').insert({
      event_id: params.id, registration_id: parsed.data.registration_id,
      action_type: 'question_asked', points: 5, ref_id: data.id,
    });
  }

  return NextResponse.json({ question: data }, { status: 201 });
}

// PATCH — organiser moderation: feature / answer / hide
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
          .select('attendee_name, attendee_email')
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
        registrationId: data.registration_id!,
      });
    })().catch(() => {});
  }

  return NextResponse.json({ question: data });
}

// PUT — toggle upvote
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { question_id, registration_id } = await req.json();
  if (!question_id || !registration_id) return NextResponse.json({ error: 'question_id and registration_id required' }, { status: 400 });

  // Identity: the upvoter must be the caller's own registration (guests allowed).
  const identity = await assertOwnsRegistration(params.id, registration_id);
  if (!identity.ok) {
    return NextResponse.json({ error: identity.error }, { status: identity.status });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('toggle_qa_upvote', { p_question_id: question_id, p_registration_id: registration_id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ upvoted: data });
}
