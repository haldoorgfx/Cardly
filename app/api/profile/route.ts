import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  type ProfileUpdate = {
    full_name?: string | null;
    avatar_url?: string | null;
    notify_downloads?: boolean;
    notify_views?: boolean;
  };

  const patch: ProfileUpdate = {};
  if ('full_name' in body) patch.full_name = typeof body.full_name === 'string' ? body.full_name : null;
  if ('avatar_url' in body) patch.avatar_url = typeof body.avatar_url === 'string' ? body.avatar_url : null;
  if ('notify_downloads' in body) patch.notify_downloads = Boolean(body.notify_downloads);
  if ('notify_views' in body) patch.notify_views = Boolean(body.notify_views);

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update(patch).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
