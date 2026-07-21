export const dynamic = 'force-dynamic';

import PeopleDiscoveryClient from '@/components/networking/PeopleDiscoveryClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

/**
 * The attendee directory. It previously had no page of its own at all — the
 * public /e/[slug]/people route just bounced to a tab on the event page, so
 * "see who's coming" was a query string rather than a place you could link to.
 */
export default async function NetworkingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'networking' });

  return (
    <PeopleDiscoveryClient
      eventId={ws.eventId}
      eventSlug={slug}
      registrationId={ws.registrationId}
      qrToken={ws.qrToken}
    />
  );
}
