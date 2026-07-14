import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/billing/can';
import { assertERA } from '@/lib/ai/gate';
import { ERA } from '@/lib/ai/era';

const schema = z.object({
  draft: z.string().min(1).max(5000),
  eventName: z.string().min(1).max(300),
});

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

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { draft, eventName } = parsed.data;

  try {
    const result = await ERA.improveDescription(draft, eventName);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
