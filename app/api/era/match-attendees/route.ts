import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/billing/can';
import { assertERA } from '@/lib/ai/gate';
import { ERA } from '@/lib/ai/era';

const profileSchema = z.object({
  name: z.string().min(1).max(200),
  role: z.string().max(200),
  company: z.string().max(200),
  interests: z.array(z.string().max(100)).max(30),
});
const schema = z.object({ profileA: profileSchema, profileB: profileSchema });

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
  const { profileA, profileB } = parsed.data;

  try {
    const result = await ERA.matchAttendees(profileA, profileB);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
