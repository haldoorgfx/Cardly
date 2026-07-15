export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PollsClient from '@/components/polls/PollsClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function PollsPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  // 404 when the organizer has explicitly disabled this section.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'polls')) notFound();
  const eventPage = { title: eventPageTitle };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  const registrationId = await resolveViewerRegistrationId(event.id, searchParams.reg);

  // My votes
  const myVotes: Record<string, string> = {};
  if (registrationId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: votes } = await (admin as any)
      .from('poll_votes')
      .select('poll_id, option_id')
      .eq('registration_id', registrationId);
    for (const v of (votes ?? [])) myVotes[v.poll_id] = v.option_id;
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[760px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Polls
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>{eventPage.title}</p>
        </div>
        <PollsClient
          eventId={event.id}
          registrationId={registrationId}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialPolls={(polls ?? []) as any}
          myVotes={myVotes}
        />
      </div>
    </div>
  );
}
