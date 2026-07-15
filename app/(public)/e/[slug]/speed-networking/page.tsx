export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { SpeedNetworkingClient } from '@/components/events/SpeedNetworkingClient';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

export default async function SpeedNetworkingPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;
  // Speed networking is part of the "networking" section; 404 when disabled.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'networking')) notFound();

  return (
    <SpeedNetworkingClient
      eventId={event.id}
      eventName={eventPageTitle ?? event.name}
      eventSlug={params.slug}
      registrationId={await resolveViewerRegistrationId(event.id, searchParams.reg)}
    />
  );
}
