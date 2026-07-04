export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { SpeedNetworkingClient } from '@/components/events/SpeedNetworkingClient';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

export default async function SpeedNetworkingPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  return (
    <SpeedNetworkingClient
      eventId={event.id}
      eventName={eventPageTitle ?? event.name}
      eventSlug={params.slug}
      registrationId={searchParams.reg ?? null}
    />
  );
}
