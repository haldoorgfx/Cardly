import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();
  const { searchParams } = new URL(req.url);
  const reg = searchParams.get('reg');

  // Aggregate points per registration
  const { data: rows, error } = await admin
    .from('leaderboard_points')
    .select('registration_id, points')
    .eq('event_id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sum points per registration
  const totals = new Map<string, number>();
  for (const r of rows ?? []) {
    totals.set(r.registration_id, (totals.get(r.registration_id) ?? 0) + r.points);
  }

  // Sort and get top 50
  const sorted = Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);

  // Fetch names
  const ids = sorted.map(([id]) => id);
  const { data: regs } = await admin
    .from('registrations')
    .select('id, attendee_name')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);

  const nameMap = new Map((regs ?? []).map(r => [r.id, r.attendee_name]));

  const leaderboard = sorted.map(([registration_id, total_points], i) => ({
    rank: i + 1,
    registration_id,
    attendee_name: nameMap.get(registration_id) ?? 'Attendee',
    total_points,
    is_you: reg ? registration_id === reg : false,
  }));

  // Where does the caller sit if they're outside the top 50?
  let you: { rank: number; total_points: number } | null = null;
  if (reg) {
    const inTop = leaderboard.find(e => e.registration_id === reg);
    if (inTop) {
      you = { rank: inTop.rank, total_points: inTop.total_points };
    } else {
      const allSorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
      const idx = allSorted.findIndex(([id]) => id === reg);
      if (idx >= 0) you = { rank: idx + 1, total_points: allSorted[idx][1] };
    }
  }

  return NextResponse.json({ leaderboard, you });
}
