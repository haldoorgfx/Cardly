export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LiveDisplayClient } from '@/components/events/LiveDisplayClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

export async function generateMetadata() {
  return { title: 'Live Display' };
}

export default async function LiveDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }] = await Promise.all([
    admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('title').eq('event_id', id).maybeSingle(),
  ]);
  if (!event) redirect('/dashboard');

  // Fetch top Q&A questions by votes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qaRows } = await (admin as any)
    .from('qa_questions')
    .select('id, question, upvotes_count, is_anonymous, status, created_at, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', id)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .limit(6);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (qaRows ?? []).map((q: any) => ({
    id: q.id,
    question: q.question,
    votes: q.upvotes_count,
    asker_name: q.is_anonymous ? null : (q.registrations?.attendee_name ?? null),
    created_at: q.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('id, question, is_active, poll_options(id, text, votes_count, position)')
    .eq('event_id', id)
    .eq('is_active', true)
    .eq('is_closed', false)
    .order('created_at', { ascending: false })
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPoll = polls?.[0] as any;
  const activePoll = rawPoll
    ? {
        id: rawPoll.id,
        question: rawPoll.question,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (rawPoll.poll_options ?? [])
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((o: { text: string; votes_count: number }) => ({ label: o.text, votes: o.votes_count })),
      }
    : null;

  return (
    <LiveDisplayClient
      eventId={id}
      eventName={event.name}
      sessionLabel={(eventPage as { title?: string } | null)?.title ?? event.name}
      initialQuestions={questions ?? []}
      activePoll={activePoll}
    />
  );
}
