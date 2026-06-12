export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { SpeedNetworkingClient } from '@/components/events/SpeedNetworkingClient';

interface Props { params: Promise<{ slug: string }> }

export default async function SpeedNetworkingPage({ params }: Props) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  let ep = null;
  const { data: byCustom } = await db.from('event_pages')
    .select('id, title, events!inner(id, name, slug, status)')
    .eq('custom_slug', slug).maybeSingle();
  ep = byCustom;
  if (!ep) {
    const { data: bySlug } = await db.from('event_pages')
      .select('id, title, events!inner(id, name, slug, status)')
      .eq('events.slug', slug).maybeSingle();
    ep = bySlug;
  }

  if (!ep || ep.events?.status !== 'published') notFound();

  // Get attendees who are networking
  const { data: attendees } = await db.from('registrations')
    .select('id, attendee_name, karta_card_url')
    .eq('event_id', ep.events.id)
    .in('status', ['confirmed', 'checked_in'])
    .limit(20);

  return (
    <SpeedNetworkingClient
      eventName={ep.title ?? ep.events.name}
      eventSlug={slug}
      attendees={attendees ?? []}
    />
  );
}
