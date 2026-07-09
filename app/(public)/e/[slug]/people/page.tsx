export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
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
  const enriched = (people ?? []).map((p: any) => ({
    id: p.id,
    name: p.attendee_name ?? 'Attendee',
    headline: (p.custom_fields as Record<string, string> | null)?.headline ?? (p.custom_fields as Record<string, string> | null)?.title ?? null,
    photo_url: p.karta_card_url ?? null,
    interests: (p.custom_fields as Record<string, string> | null)?.interests
      ? String((p.custom_fields as Record<string, string>).interests).split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    mutual_count: 0,
    is_online: false,
    connection_status: connMap.get(p.id) ?? null,
  }));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav eventSlug={params.slug} eventName={event.name} />
      <PeopleDiscoveryClient
        people={enriched}
        currentUserId={null}
        eventName={eventPage.title ?? event.name}
        registrationId={searchParams.reg ?? null}
      />
    </div>
  );
}
