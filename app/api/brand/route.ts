import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/** GET /api/brand — returns current user's brand_kit */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('brand_kit')
    .eq('id', user.id)
    .single();

  return NextResponse.json(data?.brand_kit ?? { assets: [] });
}

/** PATCH /api/brand — merge partial fields into brand_kit */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch existing kit to merge
  const { data: profile } = await admin
    .from('profiles')
    .select('brand_kit')
    .eq('id', user.id)
    .single();

  const existing = (profile?.brand_kit as Record<string, unknown>) ?? {};
  const merged = { ...existing, ...body };

  const { error } = await admin
    .from('profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ brand_kit: merged as any })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(merged);
}
