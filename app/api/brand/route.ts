import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';

// Whitelist of brand-kit fields. The PATCH used to spread arbitrary JSON into
// the profile row — any authenticated user could stuff unbounded data in.
const BrandKitPatchSchema = z.object({
  logos: z.object({
    light: z.string().url().max(500).optional(),
    dark: z.string().url().max(500).optional(),
  }).strip().optional(),
  assets: z.array(z.object({
    url: z.string().url().max(500),
    name: z.string().max(120).optional(),
    type: z.string().max(40).optional(),
  }).strip()).max(50).optional(),
}).strip();

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

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BrandKitPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid brand kit fields' }, { status: 400 });
  }
  const body = parsed.data;

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
