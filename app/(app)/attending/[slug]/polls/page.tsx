export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import PollsClient from '@/components/polls/PollsClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Polls' };

export default async function AttendingPollsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/polls`,
  );

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  // My votes
  const myVotes: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: votes } = await (admin as any)
    .from('poll_votes')
    .select('poll_id, option_id')
    .eq('registration_id', registrationId);
  for (const v of (votes ?? [])) myVotes[v.poll_id] = v.option_id;

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Polls
        </h1>
        <p className="text-[14px] sm:text-[14.5px] mt-1.5" style={{ color: '#3A4A42' }}>{eventPageTitle ?? event.name}</p>
      </div>
      <PollsClient
        eventId={event.id}
        registrationId={registrationId}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPolls={(polls ?? []) as any}
        myVotes={myVotes}
      />
    </div>
  );
}
