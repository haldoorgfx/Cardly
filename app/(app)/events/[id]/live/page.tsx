export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LiveDisplayClient } from '@/components/events/LiveDisplayClient';

export async function generateMetadata() {
  return { title: 'Live Display' };
}

export default async function LiveDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
  const { data: questions } = await (admin as any)
    .from('qa_questions')
    .select('id, question, votes, asker_name, asker_affiliation, is_answered, created_at')
    .eq('event_id', id)
    .eq('is_hidden', false)
    .order('votes', { ascending: false })
    .limit(6);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('id, question, options, is_active')
    .eq('event_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  return (
    <LiveDisplayClient
      eventId={id}
      eventName={event.name}
      sessionLabel={(eventPage as { title?: string } | null)?.title ?? event.name}
      initialQuestions={questions ?? []}
      activePoll={polls?.[0] ?? null}
    />
  );
}
