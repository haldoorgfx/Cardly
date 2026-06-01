export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ConfirmPage } from '@/components/registration/ConfirmPage';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

export default async function RegisterConfirmPage({ params, searchParams }: Props) {
  const qrToken = searchParams.reg;
  if (!qrToken) notFound();

  const admin = createAdminClient();

  const { data: registration } = await admin
    .from('registrations')
    .select('*')
    .eq('qr_code_token', qrToken)
    .single();

  if (!registration) notFound();

  // Load event page for the event title
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('title, event_id, events!event_id(slug)')
    .eq('event_id', registration.event_id)
    .single();

  // Load ticket type name
  const { data: ticket } = registration.ticket_type_id
    ? await admin.from('ticket_types').select('name').eq('id', registration.ticket_type_id).single()
    : { data: null };

  const eventTitle = eventPage?.title ?? 'Event';
  const eventSlug = (eventPage?.events as { slug: string } | null)?.slug ?? params.slug;

  return (
    <ConfirmPage
      registration={registration}
      eventTitle={eventTitle}
      eventSlug={eventSlug}
      ticketName={ticket?.name ?? null}
    />
  );
}
