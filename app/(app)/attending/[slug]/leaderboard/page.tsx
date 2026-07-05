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
      <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight mb-1.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Leaderboard</h1>
      <p className="text-[14px] sm:text-[14.5px] mb-8" style={{ color: '#6B7A72' }}>{eventPageTitle ?? event.name}</p>
      <LeaderboardView leaderboard={leaderboard} myRegistrationId={registrationId} myEntry={myEntry} />
    </div>
  );
}
