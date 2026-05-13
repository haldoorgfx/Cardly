import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('brand_kit')
    .eq('id', user.id)
    .single();

  return NextResponse.json(data?.brand_kit ?? {});
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Merge with existing brand_kit so partial updates don't wipe fields
  const { data: existing } = await supabase
    .from('profiles')
    .select('brand_kit')
    .eq('id', user.id)
    .single();

  const merged = { ...((existing?.brand_kit ?? {}) as Record<string, unknown>), ...body };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ brand_kit: merged })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, brand_kit: merged });
}
