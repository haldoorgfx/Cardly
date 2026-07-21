import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { safeExternalUrl } from '@/lib/url/safeUrl';

// Booth resources are exhibitor-supplied links. They are stored to be opened by
// a human later, so the scheme is restricted to http(s) for the same reason as
// the booth website field — a `javascript:` value that reaches an href is a
// stored-XSS payload. `url` was previously unvalidated, and `url.startsWith(...)`
// below would also throw a 500 on any non-string body value.
const CreateSchema = z.object({
  token: z.string().min(1).max(200),
  name:  z.string().min(1).max(200).trim(),
  url:   z.string().min(1).max(2000).trim(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSponsor(admin: any, token: string) {
  const { data } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  return data as { id: string } | null;
}

export async function POST(req: Request) {
  const raw = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }
  const { token, name } = parsed.data;

  const url = safeExternalUrl(parsed.data.url);
  if (!url) return NextResponse.json({ error: 'Must be a valid http(s) URL' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: resource, error } = await admin
    .from('sponsor_resources')
    .insert({ sponsor_id: sponsor.id, name, url, kind: 'Link' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ resource });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id    = searchParams.get('id');
  const token = searchParams.get('token');

  if (!id || !token) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin
    .from('sponsor_resources')
    .delete()
    .eq('id', id)
    .eq('sponsor_id', sponsor.id); // scope to this sponsor

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
