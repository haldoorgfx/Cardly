export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import MessagingClient from '@/components/messaging/MessagingClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

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

  // Platform-wide kill-switch, checked ALONGSIDE the per-event section gate
  // above — both must pass. This one only the super_admin controls.
  if (!(await isPlatformFeatureEnabled('networking'))) notFound();

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
