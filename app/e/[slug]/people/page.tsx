export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import PeopleDiscoveryClient from '@/components/networking/PeopleDiscoveryClient';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

interface EventPageRow {
  id: string;
  title: string;
  event_id: string;
}

interface Registration {
  id: string;
  attendee_name: string;
  ticket_type_id: string | null;
  custom_fields: Record<string, string> | null;
  karta_card_url: string | null;
}

export default async function PeoplePage({ params, searchParams }: Props) {
  const { slug } = params;
  const regParam = searchParams.reg ?? null;

  const admin = createAdminClient();

  // Resolve event via event_pages (custom_slug) or events table slug
  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('id, title, event_id')
    .eq('custom_slug', slug)
    .single() as { data: EventPageRow | null };

  if (!eventPage) notFound();

  // Fetch confirmed + checked-in registrations (limit 200)
  const { data: registrationsData } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, ticket_type_id, custom_fields, karta_card_url')
    .eq('event_id', eventPage.event_id)
    .in('status', ['confirmed', 'checked_in'])
    .limit(200) as { data: Registration[] | null };

  const registrations = registrationsData ?? [];

  // Fetch connections if reg param provided
  let connectionMap: Record<string, string> = {}; // registration_id → status
  if (regParam) {
    const { data: conns } = await (admin as any)
      .from('connections')
      .select('recipient_id, status')
      .eq('requester_id', regParam)
      .eq('event_id', eventPage.event_id) as {
        data: { recipient_id: string; status: string }[] | null;
      };

    const { data: connsInbound } = await (admin as any)
      .from('connections')
      .select('requester_id, status')
      .eq('recipient_id', regParam)
      .eq('event_id', eventPage.event_id) as {
        data: { requester_id: string; status: string }[] | null;
      };

    for (const c of conns ?? []) {
      connectionMap[c.recipient_id] = c.status;
    }
    for (const c of connsInbound ?? []) {
      if (!connectionMap[c.requester_id]) {
        connectionMap[c.requester_id] = c.status;
      }
    }
  }

  const people = registrations.map((r) => ({
    id: r.id,
    attendee_name: r.attendee_name,
    custom_fields: r.custom_fields,
    karta_card_url: r.karta_card_url,
    ticket_type_id: r.ticket_type_id,
    connection_status: connectionMap[r.id] ?? null,
  }));

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-medium" style={{ fontSize: 28, color: '#1F4D3A' }}>
            People
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            {people.length} attendee{people.length !== 1 ? 's' : ''}
          </p>
        </div>
        <PeopleDiscoveryClient
          eventId={eventPage.event_id}
          registrationId={regParam}
          initialPeople={people}
        />
      </main>
    </div>
  );
}
