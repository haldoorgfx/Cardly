import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { token, email, role } = body;

  if (!token || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id')
    .eq('invite_token', token)
    .single();

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: member, error } = await admin
    .from('sponsor_members')
    .insert({ sponsor_id: sponsor.id, invited_email: email, role: role || null, status: 'invited' })
    .select('id, invited_email, role, status, user_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member });
}
