export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getLeaderboard } from '@/lib/events/leaderboard';
import { LeaderboardView } from '@/components/events/LeaderboardView';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'gamification' });

  // Platform-wide kill-switch, checked ALONGSIDE the per-event section gate
  // above — both must pass. This one only the super_admin controls.
  if (!(await isPlatformFeatureEnabled('gamification'))) notFound();

  const { leaderboard, myEntry } = await getLeaderboard(ws.eventId, ws.registrationId);

  return (
    <div className="max-w-[700px]">
      <LeaderboardView
        leaderboard={leaderboard}
        myRegistrationId={ws.registrationId}
        myEntry={myEntry}
      />
    </div>
  );
}
