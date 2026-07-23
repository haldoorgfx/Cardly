import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { zSafeUrl } from '@/lib/url/safeUrl';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

// This route is authorised by a bearer invite token and writes fields that are
// rendered on the PUBLIC event booth page. `website_url` in particular lands in
// an `href`, so it is validated as an http(s)-only URL — see lib/url/safeUrl.ts
// for why `z.string().url()` is not sufficient on its own. Free-text fields are
// length-capped; previously this route accepted an unvalidated body of any size
// and any type straight into the sponsors row.
const PatchSchema = z.object({
  token:        z.string().min(1).max(200),
  company_name: z.string().min(1).max(200).trim().optional(),
  tagline:      z.string().max(300).trim().nullable().optional(),
  description:  z.string().max(5000).nullable().optional(),
  website_url:  zSafeUrl,
  logo_url:     zSafeUrl,
});

export async function PATCH(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const raw = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { token, ...fields } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id')
    .eq('invite_token', token)
    .single();

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only include fields the caller actually sent. Key presence is read off the
  // raw body because zod's optional+nullable transforms collapse an absent key
  // and an explicit null into the same `null`, and those must stay distinct:
  // absent means "leave alone", null means "clear it".
  const sent = (raw ?? {}) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['company_name', 'tagline', 'description', 'website_url', 'logo_url'] as const) {
    if (key in sent) patch[key] = fields[key];
  }

  const { error } = await admin
    .from('sponsors')
    .update(patch)
    .eq('id', sponsor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
