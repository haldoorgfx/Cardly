import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  code:  z.string().min(2).max(32).regex(/^[A-Za-z0-9_-]+$/, 'Code may only contain letters, numbers, hyphens, and underscores').toUpperCase(),
  label: z.string().max(100).optional(),
});

// Was a literal `.eq('user_id', userId)` — Studio team members could never
// manage promoter codes on an event they don't personally own, even though
// Teams promises "EVENT ACCESS: All events". See lib/rbac/canManageEvent.ts.
async function verifyOrganizer(eventId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('events').select('id').eq('id', eventId).in('user_id', await manageableOwnerIds(userId)).single();
  return !!data;
}

// GET — list codes with registration stats
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('promote'))) return NextResponse.json({ error: 'Promote is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOrganizer(params.id, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const [{ data: codes }, { data: regs }] = await Promise.all([
    admin.from('promoter_codes').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
    admin
      .from('registrations')
      .select('referral_code, amount_paid, status')
      .eq('event_id', params.id)
      .not('referral_code', 'is', null)
      .in('status', ['confirmed', 'checked_in', 'pending_approval']),
  ]);

  // Aggregate per code
  const statsMap: Record<string, { uses: number; revenue: number }> = {};
  for (const r of regs ?? []) {
    if (!r.referral_code) continue;
    const key = r.referral_code.toUpperCase();
    if (!statsMap[key]) statsMap[key] = { uses: 0, revenue: 0 };
    statsMap[key].uses++;
    if (r.status !== 'pending_approval') statsMap[key].revenue += r.amount_paid ?? 0;
  }

  const result = (codes ?? []).map(c => ({
    ...c,
    uses:    statsMap[c.code]?.uses    ?? 0,
    revenue: statsMap[c.code]?.revenue ?? 0,
  }));

  return NextResponse.json(result);
}

// POST — create a promoter code
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('promote'))) return NextResponse.json({ error: 'Promote is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOrganizer(params.id, user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Validation failed' }, { status: 400 });

  const admin = createAdminClient();

  const { data: ep } = await admin.from('event_pages').select('ends_at').eq('event_id', params.id).maybeSingle();
  if (ep?.ends_at && new Date(ep.ends_at) < new Date()) {
    return NextResponse.json({ error: 'Cannot create promoter codes for an event that has already ended' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('promoter_codes')
    .insert({ event_id: params.id, code: parsed.data.code, label: parsed.data.label ?? null })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'That code already exists for this event' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ...data, uses: 0, revenue: 0 }, { status: 201 });
}
