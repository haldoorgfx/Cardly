export const dynamic = 'force-dynamic';

import MessagingClient from '@/components/messaging/MessagingClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Messages' };

export default async function AttendingMessagesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/messages`,
  );

  return <MessagingClient eventId={event.id} registrationId={registrationId} />;
}
