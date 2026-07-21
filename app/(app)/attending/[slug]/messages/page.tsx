export const dynamic = 'force-dynamic';

import MessagingClient from '@/components/messaging/MessagingClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reg?: string; to?: string; name?: string }>;
}

export default async function MessagesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg, to, name } = await searchParams;
  // The public copy had no section gate, so messaging stayed reachable after
  // an organizer turned networking off.
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'networking' });

  return (
    <MessagingClient
      eventId={ws.eventId}
      registrationId={ws.registrationId}
      qrToken={ws.qrToken}
      initialRecipientId={to}
      initialRecipientName={name}
    />
  );
}
