import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const Schema = z.object({
  company_name: z.string().min(1).max(200).trim().optional(),
  tagline: z.string().max(300).trim().nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  website_url: z.string().url().nullable().optional().or(z.literal('')).transform(v => v === '' ? null : v),
  booth_location: z.string().max(100).trim().nullable().optional(),
  offerings: z.array(z.object({
    title: z.string().max(200),
    type: z.string().max(50).optional(),
    url: z.string().max(2000).optional(),
    opens: z.number().int().min(0).optional(),
  })).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { sponsorId: string } }
) {
  const raw = await req.json().catch(() => null);
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('sponsors')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.sponsorId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
