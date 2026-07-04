export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';
import MessagingClient from '@/components/messaging/MessagingClient';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function MessagesPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <MessagingClient
        eventId={event.id}
        registrationId={await resolveViewerRegistrationId(event.id, searchParams.reg)}
      />
    </div>
  );
}
