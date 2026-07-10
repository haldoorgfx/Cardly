import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/billing/can';
import { assertERA } from '@/lib/ai/gate';
import { ERA } from '@/lib/ai/era';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plan = await getUserPlan(user.id);
  try {
    assertERA(plan);
  } catch {
    return NextResponse.json({ error: 'ERA_UPGRADE_REQUIRED' }, { status: 403 });
  }

  const body = await request.json() as {
    stats: {
      eventName: string; totalRegistered: number; totalCheckedIn: number;
      checkInRate: number; topSessions?: string[]; cardDownloads: number;
    };
  };
  const { stats } = body;

  try {
    const result = await ERA.narrateAnalytics(stats);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
