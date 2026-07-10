import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  const body = await req.json();
  const { token, company_name, tagline, description, website_url, logo_url } = body;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id')
    .eq('invite_token', token)
    .single();

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Only include defined fields in the patch
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (company_name !== undefined) patch.company_name = company_name;
  if (tagline      !== undefined) patch.tagline      = tagline;
  if (description  !== undefined) patch.description  = description;
  if (website_url  !== undefined) patch.website_url  = website_url;
  if (logo_url     !== undefined) patch.logo_url     = logo_url;

  const { error } = await admin
    .from('sponsors')
    .update(patch)
    .eq('id', sponsor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
