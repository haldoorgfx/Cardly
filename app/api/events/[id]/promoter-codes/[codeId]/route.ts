import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; codeId: string } }) {
  if (!(await isPlatformFeatureEnabled('promote'))) return NextResponse.json({ error: 'Promote is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', params.id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { error } = await admin.from('promoter_codes').delete().eq('id', params.codeId).eq('event_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
