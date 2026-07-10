export const dynamic = 'force-dynamic';

import { SpeedNetworkingClient } from '@/components/events/SpeedNetworkingClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Networking' };

export default async function AttendingNetworkingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/networking`,
  );

  return (
    <SpeedNetworkingClient
      eventId={event.id}
      eventName={eventPageTitle ?? event.name}
      eventSlug={slug}
      registrationId={registrationId}
      embedded
    />
  );
}
