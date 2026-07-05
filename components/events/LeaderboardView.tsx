/**
 * LeaderboardView — shared presentation for the event gamification leaderboard.
 * Rendered by BOTH the public guest surface (/e/[slug]/leaderboard) and the
 * dashboard attendee surface (/attending/[slug]/leaderboard) so the two stay
 * pixel-identical. Pure JSX — no hooks — safe in server components.
 */

export interface LeaderboardEntry {
  rank: number;
  registration_id: string;
  attendee_name: string;
  total_points: number;
}

interface Props {
  leaderboard: LeaderboardEntry[];
  /** The viewer's registration id (null when anonymous). */
  myRegistrationId: string | null;
  /** The viewer's own entry when they rank outside the visible list. */
  myEntry: LeaderboardEntry | null;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function LeaderboardView({ leaderboard, myRegistrationId, myEntry }: Props) {
  const isYou = (rid: string) => !!myRegistrationId && rid === myRegistrationId;
  const myEntryVisible = myEntry ? leaderboard.some(e => e.registration_id === myRegistrationId) : false;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (leaderboard.length === 0) {
    return (
      <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>No points yet. Ask questions, vote in polls, and connect with people to earn points.</p>
      </div>
    );
  }

  return (
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
  );
}
