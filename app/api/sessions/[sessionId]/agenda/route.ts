import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const BodySchema = z.object({
  registration_id: z.string().uuid(),
  action: z.enum(['add', 'remove']),
});

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { registration_id, action } = parsed.data;
  const admin = createAdminClient();

  if (action === 'add') {
    const { error } = await admin
      .from('attendee_agendas')
      .upsert({ registration_id, session_id: params.sessionId }, { onConflict: 'registration_id,session_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: true });
  } else {
    const { error } = await admin
      .from('attendee_agendas')
      .delete()
      .eq('registration_id', registration_id)
      .eq('session_id', params.sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ saved: false });
  }
}
