export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import PollsClient from '@/components/polls/PollsClient';
import type { Poll } from '@/components/polls/PollsClient';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

interface EventPageRow {
  id: string;
  title: string;
  event_id: string;
}

export default async function PollsPage({ params, searchParams }: Props) {
  const { slug } = params;
  const regParam = searchParams.reg ?? null;

  const admin = createAdminClient();

  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('id, title, event_id')
    .eq('custom_slug', slug)
    .single() as { data: EventPageRow | null };

  if (!eventPage) notFound();

  let polls: Poll[] = [];
  let myVotes: Record<string, string> = {};

  try {
    // Fetch polls with options
    const { data: pollsData } = await (admin as any)
      .from('polls')
      .select('id, event_id, question, is_active, is_closed, total_votes, created_at, poll_options(id, poll_id, text, votes_count, position)')
      .eq('event_id', eventPage.event_id)
      .order('created_at', { ascending: false }) as { data: any[] | null };

    if (pollsData) {
      polls = pollsData.map((p) => ({
        ...p,
        options: p.poll_options ?? [],
      }));
    }

    // Fetch votes if registration provided
    if (regParam) {
      const { data: votesData } = await (admin as any)
        .from('poll_votes')
        .select('poll_id, option_id')
        .eq('registration_id', regParam)
        .in('poll_id', polls.map((p) => p.id)) as { data: { poll_id: string; option_id: string }[] | null };

      for (const v of votesData ?? []) {
        myVotes[v.poll_id] = v.option_id;
      }
    }
  } catch { /* tables may not exist yet */ }

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
      <main className="max-w-[600px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-medium" style={{ fontSize: 28, color: '#1F4D3A' }}>
            Polls
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Cast your vote on live questions
          </p>
        </div>
        <PollsClient
          eventId={eventPage.event_id}
          registrationId={regParam}
          initialPolls={polls}
          myVotes={myVotes}
        />
      </main>
    </div>
  );
}
