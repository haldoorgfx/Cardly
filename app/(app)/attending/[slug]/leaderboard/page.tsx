export const dynamic = 'force-dynamic';

import { getLeaderboard } from '@/lib/events/leaderboard';
import { LeaderboardView } from '@/components/events/LeaderboardView';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props { params: Promise<{ slug: string }>; searchParams: Promise<{ reg?: string }> }

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'gamification' });

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
