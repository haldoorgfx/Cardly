export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import PollsClient from '@/components/polls/PollsClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

export default async function PollsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'polls' });

  const admin = createAdminClient();
  // PollsClient filters drafts out visually, but that is client-side only — the
  // unlaunched poll questions still shipped inside this page's payload, which is
  // exactly the leak /api/events/[id]/polls was already fixed for. Attendees see
  // opened (active) or resolved (closed) polls; never a pure draft.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', ws.eventId)
    .or('is_active.eq.true,is_closed.eq.true')
    .order('created_at', { ascending: false });

  const myVotes: Record<string, string> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: votes } = await (admin as any)
    .from('poll_votes')
    .select('poll_id, option_id')
    .eq('registration_id', ws.registrationId);
  for (const v of (votes ?? [])) myVotes[v.poll_id] = v.option_id;

  return (
    <div className="max-w-[760px]">
      <PollsClient
        eventId={ws.eventId}
        registrationId={ws.registrationId}
        qrToken={ws.qrToken}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialPolls={(polls ?? []) as any}
        myVotes={myVotes}
      />
    </div>
  );
}
