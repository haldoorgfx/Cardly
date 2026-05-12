import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : null;
  if (!full_name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ full_name })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
