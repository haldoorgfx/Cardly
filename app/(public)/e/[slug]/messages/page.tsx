export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';
import { createAdminClient } from '@/lib/supabase/server';
import MessagingClient from '@/components/messaging/MessagingClient';

interface Props { params: { slug: string }; searchParams: { reg?: string; to?: string } }

export default async function MessagesPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // `to` deep-links from the People directory's "Message" button — resolve the
  // target's display name so the composer can open directly on that person.
  let initialRecipientName: string | undefined;
  if (searchParams.to) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('registrations')
      .select('attendee_name')
      .eq('id', searchParams.to)
      .eq('event_id', event.id)
      .maybeSingle();
    initialRecipientName = data?.attendee_name ?? undefined;
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <MessagingClient
        eventId={event.id}
        registrationId={await resolveViewerRegistrationId(event.id, searchParams.reg)}
        initialRecipientId={searchParams.to}
        initialRecipientName={initialRecipientName}
      />
    </div>
  );
}
