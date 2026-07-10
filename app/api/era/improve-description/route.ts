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

  const body = await request.json() as { draft: string; eventName: string };
  const { draft, eventName } = body;

  try {
    const result = await ERA.improveDescription(draft, eventName);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
