export const dynamic = 'force-dynamic';

import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';
import { getLeaderboard } from '@/lib/events/leaderboard';
import { LeaderboardView } from '@/components/events/LeaderboardView';

export const metadata = { title: 'Leaderboard' };

export default async function AttendingLeaderboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { registrationId, event, eventPageTitle } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/leaderboard`,
  );

  const { leaderboard, myEntry } = await getLeaderboard(event.id, registrationId);

  return (
    <div className="max-w-[700px]">
      <h1 className="font-display font-normal text-[28px] mb-2" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>Leaderboard</h1>
      <p className="text-[15px] mb-8" style={{ color: '#6B7A72' }}>{eventPageTitle ?? event.name}</p>
      <LeaderboardView leaderboard={leaderboard} myRegistrationId={registrationId} myEntry={myEntry} />
    </div>
  );
}
