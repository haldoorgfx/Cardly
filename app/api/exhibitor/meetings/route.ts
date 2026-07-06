import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  token:          z.string().min(1).max(200),
  meeting_id:     z.string().uuid(),
  action:         z.enum(['accept', 'propose', 'decline']),
  scheduled_time: z.string().datetime().optional(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSponsor(admin: any, token: string) {
  const { data } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  return data as { id: string } | null;
}

export async function PATCH(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });
  }
  const { token, meeting_id, action, scheduled_time } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Load the request (scoped to this sponsor) so Accept can fall back to the requested_time.
  const { data: existing } = await admin
    .from('meeting_requests')
    .select('id, requested_time, scheduled_time')
    .eq('id', meeting_id)
    .eq('sponsor_id', sponsor.id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (action === 'decline') {
    patch.status = 'declined';
  } else if (action === 'propose') {
    if (!scheduled_time) return NextResponse.json({ error: 'scheduled_time required' }, { status: 400 });
    patch.status = 'scheduled';
    patch.scheduled_time = scheduled_time;
  } else {
    // accept — confirm at the requested time (or any previously proposed time)
    patch.status = 'scheduled';
    patch.scheduled_time = existing.scheduled_time ?? existing.requested_time ?? new Date().toISOString();
  }

  const { data: meeting, error } = await admin
    .from('meeting_requests')
    .update(patch)
    .eq('id', meeting_id)
    .eq('sponsor_id', sponsor.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meeting });
}
