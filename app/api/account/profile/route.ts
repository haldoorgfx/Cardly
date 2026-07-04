import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  interests:          z.array(z.string()).optional(),
  city:               z.string().nullable().optional(),
  phone:              z.string().nullable().optional(),
  notification_prefs: z.record(z.string(), z.boolean()).optional(),
  language:           z.string().optional(),
  onboarding_done:    z.boolean().optional(),
  full_name:          z.string().optional(),
  avatar_url:         z.string().nullable().optional(),
});

export async function PATCH(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
