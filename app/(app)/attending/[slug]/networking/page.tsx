export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import PeopleDiscoveryClient from '@/components/networking/PeopleDiscoveryClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

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

  // Platform-wide kill-switch, checked ALONGSIDE the per-event section gate
  // above — both must pass. This one only the super_admin controls.
  if (!(await isPlatformFeatureEnabled('networking'))) notFound();

  return (
    <PeopleDiscoveryClient
      eventId={ws.eventId}
      eventSlug={slug}
      registrationId={ws.registrationId}
      qrToken={ws.qrToken}
    />
  );
}
