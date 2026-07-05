export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

interface Props { params: { slug: string }; searchParams: { reg?: string } }

interface LeaderboardEntry { rank: number; registration_id: string; attendee_name: string; total_points: number }

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { eventPageTitle, event } = resolved;
  const eventPage = { title: eventPageTitle };

  // Aggregate points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('leaderboard_points')
    .select('registration_id, points')
    .eq('event_id', event.id);

  const totals = new Map<string, number>();
  for (const r of (rows ?? [])) {
    totals.set(r.registration_id, (totals.get(r.registration_id) ?? 0) + r.points);
  }

  const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 50);
  const ids = sorted.map(([id]) => id);
  const { data: regs } = ids.length
    ? await admin.from('registrations').select('id, attendee_name').in('id', ids)
    : { data: [] };

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));
  const leaderboard: LeaderboardEntry[] = sorted.map(([rid, pts], i) => ({
    rank: i + 1, registration_id: rid,
    attendee_name: nameMap.get(rid) ?? 'Attendee',
    total_points: pts,
  }));

  const myReg = await resolveViewerRegistrationId(event.id, searchParams.reg);
  const isYou = (rid: string) => !!myReg && rid === myReg;

  // Resolve caller's rank even if they're outside the visible top 50.
  const allSorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const myIdx = myReg ? allSorted.findIndex(([id]) => id === myReg) : -1;
  const myEntry = myReg && myIdx >= 0
    ? { rank: myIdx + 1, registration_id: myReg, attendee_name: nameMap.get(myReg) ?? 'You', total_points: allSorted[myIdx][1] }
    : null;
  const myEntryVisible = myEntry ? leaderboard.some(e => e.registration_id === myReg) : false;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[700px] mx-auto px-5 py-10">
        <h1 className="font-display font-normal text-[32px] mb-2" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>Leaderboard</h1>
        <p className="text-[15px] mb-8" style={{ color: '#6B7A72' }}>{eventPage.title}</p>

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>No points yet. Ask questions, vote in polls, and connect with people to earn points.</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-8">
                {[top3[1], top3[0], top3[2]].map((entry, i) => {
                  if (!entry) return <div key={i} className="w-24" />;
                  const isFirst = entry.rank === 1;
                  const size = isFirst ? 72 : 56;
                  return (
                    <div key={entry.registration_id} className="flex flex-col items-center gap-2">
                      {isFirst && <span style={{ color: '#E8C57E', fontSize: 20 }}>★</span>}
                      <div
                        className="rounded-full flex items-center justify-center font-display font-semibold text-white"
                        style={{ width: size, height: size, background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', border: isFirst ? '2px solid #E8C57E' : 'none', fontSize: isFirst ? 22 : 17 }}
                      >
                        {initials(entry.attendee_name)}
                      </div>
                      <div className="text-center">
                        <div className="font-display font-medium text-[13px] truncate max-w-[80px]" style={{ color: isYou(entry.registration_id) ? '#1F4D3A' : '#0F1F18' }}>{isYou(entry.registration_id) ? 'You' : entry.attendee_name.split(' ')[0]}</div>
                        <div className=" text-[13px] font-semibold" style={{ color: isFirst ? '#E8C57E' : '#1F4D3A' }}>{entry.total_points}pts</div>
                        <div className=" text-[11px]" style={{ color: '#6B7A72' }}>#{entry.rank}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ranks 4+ */}
            {rest.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                {rest.map((entry, i) => {
                  const you = isYou(entry.registration_id);
                  return (
                  <div key={entry.registration_id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < rest.length - 1 ? '1px solid #F0EBE3' : 'none', background: you ? '#E8EFEB' : 'transparent' }}>
                    <span className=" text-[13px] w-8" style={{ color: you ? '#1F4D3A' : '#6B7A72' }}>#{entry.rank}</span>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-display font-semibold shrink-0" style={{ background: '#1F4D3A' }}>{initials(entry.attendee_name)}</div>
                    <span className="flex-1 text-[14px] font-medium" style={{ color: you ? '#1F4D3A' : '#0F1F18' }}>{you ? 'You' : entry.attendee_name}</span>
                    <span className=" text-[14px] font-semibold" style={{ color: '#1F4D3A' }}>{entry.total_points}pts</span>
                  </div>
                  );
                })}
              </div>
            )}

            {/* Your position — shown when the caller isn't already visible above */}
            {myEntry && !myEntryVisible && (
              <div className="mt-4 rounded-xl px-4 py-3" style={{ background: '#E8EFEB', border: '1px solid #1F4D3A' }}>
                <span className="text-[14px]" style={{ color: '#1F4D3A' }}>
                  You&apos;re <strong>#{myEntry.rank}</strong> with <strong className="">{myEntry.total_points}pts</strong>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
