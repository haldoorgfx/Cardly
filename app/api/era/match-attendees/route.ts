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
    profileA: { name: string; role: string; company: string; interests: string[] };
    profileB: { name: string; role: string; company: string; interests: string[] };
  };
  const { profileA, profileB } = body;

  try {
    const result = await ERA.matchAttendees(profileA, profileB);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
