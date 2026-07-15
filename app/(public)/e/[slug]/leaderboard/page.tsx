export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';
import { getLeaderboard } from '@/lib/events/leaderboard';
import { LeaderboardView } from '@/components/events/LeaderboardView';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  // Leaderboard is the "gamification" section; 404 when explicitly disabled.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'gamification')) notFound();

  const myReg = await resolveViewerRegistrationId(event.id, searchParams.reg);
  const { leaderboard, myEntry } = await getLeaderboard(event.id, myReg);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[700px] mx-auto px-5 py-10">
        <h1 className="font-display font-normal text-[32px] mb-2" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>Leaderboard</h1>
        <p className="text-[15px] mb-8" style={{ color: '#6B7A72' }}>{eventPageTitle ?? event.name}</p>
        <LeaderboardView leaderboard={leaderboard} myRegistrationId={myReg} myEntry={myEntry} />
      </div>
    </div>
  );
}
