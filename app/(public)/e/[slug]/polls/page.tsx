export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import PollsClient from '@/components/polls/PollsClient';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function PollsPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('event_id, title, events!inner(id, slug, name)')
    .or(`custom_slug.eq.${params.slug},events.slug.eq.${params.slug}`)
    .eq('is_public', true)
    .single();

  if (!eventPage) notFound();
  const event = eventPage.events as unknown as { id: string; slug: string; name: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('*, poll_options(id, text, votes_count, position)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false });

  // My votes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myVotes: Record<string, string> = {};
  if (searchParams.reg) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: votes } = await (admin as any)
      .from('poll_votes')
      .select('poll_id, option_id')
      .eq('registration_id', searchParams.reg);
    for (const v of (votes ?? [])) myVotes[v.poll_id] = v.option_id;
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <div className="max-w-[760px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Polls
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>{eventPage.title}</p>
        </div>
        <PollsClient
          eventId={event.id}
          registrationId={searchParams.reg ?? null}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialPolls={(polls ?? []) as any}
          myVotes={myVotes}
        />
      </div>
    </div>
  );
}
