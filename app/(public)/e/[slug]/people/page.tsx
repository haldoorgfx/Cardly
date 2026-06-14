export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PeopleDiscoveryClient from '@/components/networking/PeopleDiscoveryClient';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function PeoplePage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: people } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, custom_fields, karta_card_url, ticket_types(name)')
    .eq('event_id', event.id)
    .in('status', ['confirmed', 'checked_in'])
    .limit(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let connections: any[] = [];
  if (searchParams.reg) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('attendee_connections')
      .select('requester_id, recipient_id, status')
      .eq('event_id', event.id)
      .or(`requester_id.eq.${searchParams.reg},recipient_id.eq.${searchParams.reg}`);
    connections = data ?? [];
  }

  const connMap = new Map<string, string>();
  for (const c of connections) {
    const other = c.requester_id === searchParams.reg ? c.recipient_id : c.requester_id;
    connMap.set(other, c.status);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enriched = (people ?? []).map((p: any) => ({ ...p, connection_status: connMap.get(p.id) ?? null }));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[1000px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Who&apos;s here
          </h1>
          <p className="text-[16px] mt-2" style={{ color: '#6B7A72' }}>
            {enriched.length} {enriched.length === 1 ? 'person' : 'people'} at {eventPage.title}
          </p>
        </div>
        <PeopleDiscoveryClient
          eventId={event.id}
          registrationId={searchParams.reg ?? null}
          initialPeople={enriched}
        />
      </div>
    </div>
  );
}
