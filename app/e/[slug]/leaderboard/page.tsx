export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

interface EventPageRow {
  id: string;
  title: string;
  event_id: string;
}

interface LeaderboardEntry {
  registration_id: string;
  attendee_name: string;
  ticket_type_name: string | null;
  points: number;
  rank: number;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default async function LeaderboardPage({ params, searchParams }: Props) {
  const { slug } = params;
  const regParam = searchParams.reg ?? null;

  const admin = createAdminClient();

  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('id, title, event_id')
    .eq('custom_slug', slug)
    .single() as { data: EventPageRow | null };

  if (!eventPage) notFound();

  let entries: LeaderboardEntry[] = [];

  try {
    const { data } = await (admin as any)
      .from('leaderboard_entries')
      .select('registration_id, attendee_name, ticket_type_name, points, rank')
      .eq('event_id', eventPage.event_id)
      .order('rank', { ascending: true })
      .limit(50) as { data: LeaderboardEntry[] | null };
    entries = data ?? [];
  } catch { /* table may not exist */ }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 10);
  const myEntry = regParam ? entries.find((e) => e.registration_id === regParam) ?? null : null;

  // Podium order: 2nd, 1st, 3rd
  const podium: (LeaderboardEntry | undefined)[] = [top3[1], top3[0], top3[2]];
  const podiumSizes = [56, 72, 56];
  const podiumHeights = [64, 96, 48];

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      <PublicNav eventSlug={slug} eventTitle={eventPage.title} />
      <main className="max-w-[640px] mx-auto px-4 sm:px-6 py-10">
        <h1
          className="font-display font-medium mb-8 text-center"
          style={{ fontSize: 32, color: '#1F4D3A' }}
        >
          Leaderboard
        </h1>

        {entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              No points yet. Attend sessions, ask questions, and connect with attendees to earn points.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-4 mb-10">
                {podium.map((entry, idx) => {
                  if (!entry) return <div key={idx} className="w-20" />;
                  const size = podiumSizes[idx];
                  const isFirst = idx === 1;
                  return (
                    <div key={entry.registration_id} className="flex flex-col items-center gap-1.5">
                      {isFirst && (
                        <span style={{ fontSize: 20 }}>★</span>
                      )}
                      {/* Avatar */}
                      <div
                        className="rounded-full flex items-center justify-center font-display font-medium text-white"
                        style={{
                          width: size,
                          height: size,
                          background: isFirst
                            ? 'linear-gradient(135deg, #1F4D3A 0%, #E8C57E 100%)'
                            : 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)',
                          border: isFirst ? '2px solid #E8C57E' : 'none',
                          fontSize: isFirst ? 22 : 18,
                        }}
                      >
                        {getInitials(entry.attendee_name)}
                      </div>
                      {/* Podium block */}
                      <div
                        className="w-20 rounded-t-xl flex items-end justify-center pb-2"
                        style={{
                          height: podiumHeights[idx],
                          background: isFirst ? '#E8C57E' : '#E8EFEB',
                        }}
                      >
                        <span
                          className="font-mono font-medium text-[11px]"
                          style={{ color: isFirst ? '#163828' : '#1F4D3A' }}
                        >
                          #{entry.rank}
                        </span>
                      </div>
                      <p
                        className="text-[12px] font-medium text-center max-w-[80px] truncate"
                        style={{ color: '#0F1F18' }}
                      >
                        {entry.attendee_name}
                      </p>
                      <p className="font-mono text-[13px] font-medium" style={{ color: '#1F4D3A' }}>
                        {entry.points.toLocaleString()} pts
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ranks 4–10 */}
            {rest.length > 0 && (
              <div
                className="bg-white border rounded-2xl overflow-hidden mb-6"
                style={{ borderColor: '#E5E0D4' }}
              >
                {rest.map((entry, idx) => (
                  <div
                    key={entry.registration_id}
                    className="flex items-center gap-3 px-4 py-3 border-b"
                    style={{
                      borderColor: idx < rest.length - 1 ? '#E5E0D4' : 'transparent',
                    }}
                  >
                    <span
                      className="font-mono text-[13px] w-6 text-right shrink-0"
                      style={{ color: '#6B7A72' }}
                    >
                      {entry.rank}
                    </span>
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-[12px] text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
                    >
                      {getInitials(entry.attendee_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>
                        {entry.attendee_name}
                      </p>
                      {entry.ticket_type_name && (
                        <p className="text-[12px] truncate" style={{ color: '#6B7A72' }}>
                          {entry.ticket_type_name}
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-[14px] font-medium shrink-0" style={{ color: '#1F4D3A' }}>
                      {entry.points.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Your position */}
            {myEntry && myEntry.rank > 10 && (
              <div
                className="bg-white border-2 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ borderColor: '#1F4D3A' }}
              >
                <span
                  className="font-mono text-[13px] w-6 text-right shrink-0"
                  style={{ color: '#1F4D3A' }}
                >
                  {myEntry.rank}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-[12px] text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
                >
                  {getInitials(myEntry.attendee_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate" style={{ color: '#1F4D3A' }}>
                    {myEntry.attendee_name}
                    <span className="ml-2 text-[11px] font-mono" style={{ color: '#2D7A4F' }}>
                      You
                    </span>
                  </p>
                </div>
                <span className="font-mono text-[14px] font-medium shrink-0" style={{ color: '#1F4D3A' }}>
                  {myEntry.points.toLocaleString()}
                </span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
