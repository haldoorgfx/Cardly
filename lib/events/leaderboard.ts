/**
 * Leaderboard aggregation — shared by the public guest surface
 * (/e/[slug]/leaderboard) and the dashboard attendee surface
 * (/attending/[slug]/leaderboard). SERVER-ONLY (admin client).
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { LeaderboardEntry } from '@/components/events/LeaderboardView';

interface RegRow {
  id: string;
  attendee_name: string;
  user_id: string | null;
}

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
  // The viewer's own row is fetched too even when they rank below 50, so their
  // "You're #83" line shows a real name rather than the "You" fallback.
  const ids = Array.from(new Set([
    ...visible.map(([id]) => id),
    ...(myRegistrationId ? [myRegistrationId] : []),
  ]));
  const { data: regs } = ids.length
    ? await admin.from('registrations').select('id, attendee_name, user_id').in('id', ids)
    : { data: [] as RegRow[] };

  // Honour the attendee directory opt-out. This board is shown to every other
  // attendee at the event (and, via the API route, to the organiser), so an
  // attendee who set `directory_visible: false` — the same switch speed
  // networking already respects in app/api/events/[id]/connections — must not
  // be named here either. They keep their points and their rank; only the name
  // is withheld, so the ranking stays truthful.
  const regRows: RegRow[] = (regs ?? []) as RegRow[];
  const userIds = Array.from(new Set(
    regRows.map(r => r.user_id).filter((u): u is string => !!u),
  ));
  const hiddenUserIds = new Set<string>();
  if (userIds.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profs } = await (admin as any)
      .from('profiles')
      .select('id, directory_visible')
      .in('id', userIds);
    for (const p of profs ?? []) {
      if (p.directory_visible === false) hiddenUserIds.add(p.id as string);
    }
  }

  const nameMap = new Map<string, string>(
    regRows.map(r => [
      r.id,
      // The viewer always sees their own real name — hiding it from themselves
      // would just look broken.
      r.user_id && hiddenUserIds.has(r.user_id) && r.id !== myRegistrationId
        ? 'Private attendee'
        : (r.attendee_name as string),
    ]),
  );

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
