import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getUserPlan } from '@/lib/billing/can';
import { assertStudioERA } from '@/lib/ai/gate';
import { ERA } from '@/lib/ai/era';

const schema = z.object({
  event: z.object({
    name: z.string().min(1).max(300),
    date: z.string().max(200),
    venue: z.string().max(300),
    description: z.string().max(5000),
  }),
  type: z.enum(['email', 'whatsapp']),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const plan = await getUserPlan(user.id);
  try {
    assertStudioERA(plan);
  } catch {
    return NextResponse.json({ error: 'ERA_STUDIO_REQUIRED' }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { event, type } = parsed.data;

  try {
    const result = await ERA.writeCampaign(event, type);
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'ERA_FAILED' }, { status: 500 });
  }
}
