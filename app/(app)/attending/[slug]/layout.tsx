export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { AttendingTabs } from '@/components/attending/AttendingTabs';

/**
 * The attendee's workspace for one event.
 *
 * Organizers, speakers and sponsors each already had a per-event workspace in
 * the dashboard (/events/[id], /speaking/[id], /sponsoring/[id]). Attendees did
 * not — their tools lived on the public /e/[slug] routes, so anything about
 * THEM (their agenda, their messages, the room only ticket-holders can enter)
 * arrived wrapped in the marketing nav and never felt part of the product.
 * This is the missing peer.
 *
 * Tabs are assembled from what the organizer has actually switched on, so a
 * lean event shows two tabs and a full conference shows nine — and nothing is
 * rendered that would dead-end.
 */
export default async function AttendingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolvePublicSlug(slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;
  const features = await getEventFeatures(event.id);

  const base = `/attending/${slug}`;
  const all: { href: string; label: string; section?: string }[] = [
    { href: base, label: 'Overview' },
    { href: `${base}/agenda`, label: 'My agenda', section: 'agenda' },
    { href: `${base}/q-and-a`, label: 'Q&A', section: 'qa' },
    { href: `${base}/polls`, label: 'Polls', section: 'polls' },
    { href: `${base}/community`, label: 'Community', section: 'community' },
    { href: `${base}/networking`, label: 'People', section: 'networking' },
    { href: `${base}/messages`, label: 'Messages', section: 'networking' },
    { href: `${base}/leaderboard`, label: 'Leaderboard', section: 'gamification' },
    { href: `${base}/feedback`, label: 'Feedback', section: 'feedback' },
  ];

  const tabs = all
    .filter(t => !t.section || isSectionEnabled(features, t.section))
    .map(({ href, label }) => ({ href, label }));

  return (
    <AttendingTabs
      eventName={eventPageTitle ?? event.name}
      eventSlug={slug}
      tabs={tabs}
    >
      {children}
    </AttendingTabs>
  );
}
