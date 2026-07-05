/**
 * Leaderboard aggregation — shared by the public guest surface
 * (/e/[slug]/leaderboard) and the dashboard attendee surface
 * (/attending/[slug]/leaderboard). SERVER-ONLY (admin client).
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { LeaderboardEntry } from '@/components/events/LeaderboardView';

export interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  /** The viewer's own entry (rank across ALL entries), or null. */
  myEntry: LeaderboardEntry | null;
}

export async function getLeaderboard(
  eventId: string,
  myRegistrationId: string | null,
): Promise<LeaderboardData> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('leaderboard_points')
    .select('registration_id, points')
    .eq('event_id', eventId);

  const totals = new Map<string, number>();
  for (const r of (rows ?? [])) {
    totals.set(r.registration_id, (totals.get(r.registration_id) ?? 0) + r.points);
  }

  const allSorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
  const visible = allSorted.slice(0, 50);
  const ids = visible.map(([id]) => id);
  const { data: regs } = ids.length
    ? await admin.from('registrations').select('id, attendee_name').in('id', ids)
    : { data: [] };

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));
  const leaderboard: LeaderboardEntry[] = visible.map(([rid, pts], i) => ({
    rank: i + 1,
    registration_id: rid,
    attendee_name: nameMap.get(rid) ?? 'Attendee',
    total_points: pts,
  }));

  let myEntry: LeaderboardEntry | null = null;
  if (myRegistrationId) {
    const myIdx = allSorted.findIndex(([id]) => id === myRegistrationId);
    if (myIdx >= 0) {
      myEntry = {
        rank: myIdx + 1,
        registration_id: myRegistrationId,
        attendee_name: nameMap.get(myRegistrationId) ?? 'You',
        total_points: allSorted[myIdx][1],
      };
    }
  }

  return { leaderboard, myEntry };
}
