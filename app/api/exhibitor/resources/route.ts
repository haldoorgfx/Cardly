import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveSponsor(admin: any, token: string) {
  const { data } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  return data as { id: string } | null;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { token, name, url } = body;

  if (!token || !name || !url) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const sponsor = await resolveSponsor(admin, token);
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: resource, error } = await admin
    .from('sponsor_resources')
    .insert({ sponsor_id: sponsor.id, name, url, kind: url.startsWith('http') ? 'Link' : null })
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
