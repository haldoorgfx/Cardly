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

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Messages
        </h1>
        <p className="text-[14px] sm:text-[14.5px] mt-1.5" style={{ color: '#3A4A42' }}>{event.name}</p>
      </div>
      <MessagingClient eventId={event.id} registrationId={registrationId} embedded />
    </div>
  );
}
