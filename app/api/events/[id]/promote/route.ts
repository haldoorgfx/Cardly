import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { daily_budget, duration_days, placements } = body;

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data, error } = await adminAny.from('promoted_listings').upsert(
    {
      event_id: id,
      owner_id: user.id,
      daily_budget,
      duration_days,
      placements,
      status: 'pending_review',
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'event_id' }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
