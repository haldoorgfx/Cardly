import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BodySchema = z.object({
  registration_id: z.string().uuid(),
  overall_rating: z.number().int().min(1).max(5).optional(),
  highlights: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { registration_id, ...rest } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin
    .from('event_feedback')
    .upsert({ registration_id, event_id: params.id, ...rest }, { onConflict: 'registration_id,event_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
