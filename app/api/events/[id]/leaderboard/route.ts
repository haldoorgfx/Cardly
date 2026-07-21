import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { assertOwnsRegistration } from '@/lib/attendee-identity';
import { hasModeratorAccess } from '@/lib/rbac/ownership';
import { getLeaderboard } from '@/lib/events/leaderboard';

/**
 * GET /api/events/[id]/leaderboard?reg=<registration_id>
 *
 * This route used to take no identity at all: an event UUID was the entire
 * credential, and the reply was the names of the fifty most engaged attendees.
 * The leaderboard is an attendees-only surface everywhere it is rendered
 * (/attending/[slug]/leaderboard resolves a registration before it will draw
 * anything), so the JSON behind it must ask the same question the page does.
 *
 * Two ways in, matching the rest of the attendee APIs:
 *  - `?reg=` — a registration the caller genuinely holds (guests included).
 *  - a signed-in organiser / moderator for this event.
 *
 * Aggregation is delegated to lib/events/leaderboard so the directory opt-out
 * is applied here too, instead of this route quietly re-implementing the query
 * without it.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const reg = searchParams.get('reg');
  const token = searchParams.get('token');

  let viewerRegistrationId: string | null = null;

  if (reg) {
    const identity = await assertOwnsRegistration(params.id, reg, token);
    if (!identity.ok) {
      return NextResponse.json({ error: identity.error }, { status: identity.status });
    }
    viewerRegistrationId = reg;
  } else {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !(await hasModeratorAccess(user.id, params.id))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  const { leaderboard, myEntry } = await getLeaderboard(params.id, viewerRegistrationId);

  return NextResponse.json({
    leaderboard: leaderboard.map(e => ({
      ...e,
      is_you: !!viewerRegistrationId && e.registration_id === viewerRegistrationId,
    })),
    you: myEntry ? { rank: myEntry.rank, total_points: myEntry.total_points } : null,
  });
}
