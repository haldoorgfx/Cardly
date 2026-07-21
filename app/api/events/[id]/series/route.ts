import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  // Authorization: the caller must be able to manage THIS event. Without this,
  // any signed-in user could upsert a series row for any event id (onConflict
  // parent_event_id lets them overwrite another organizer's recurrence config
  // and claim owner_id). Every event-level mutation goes through
  // manageableOwnerIds so Studio teammates are included, never a bare user_id.
  const { data: owned } = await admin
    .from('events')
    .select('id')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { frequency, default_time } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data, error } = await adminAny.from('event_series').upsert(
    { parent_event_id: id, frequency, default_time, owner_id: user.id },
    { onConflict: 'parent_event_id' }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
