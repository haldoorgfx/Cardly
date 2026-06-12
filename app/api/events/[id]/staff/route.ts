import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).from('event_staff').select('*').eq('event_id', id).neq('status', 'removed').order('invited_at');
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { email, role, expires } = body as { email: string; role: string; expires: string };
  if (!email || !role) return NextResponse.json({ error: 'email and role required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from('event_staff').insert({
    event_id: id, owner_id: user.id, email, role, expires: expires ?? '24h_after', status: 'pending',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { staffId, action, role } = body as { staffId: string; action: 'remove' | 'resend' | 'update_role'; role?: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  if (action === 'remove') {
    await db.from('event_staff').update({ status: 'removed' }).eq('id', staffId).eq('event_id', id);
    return NextResponse.json({ ok: true });
  }
  if (action === 'update_role' && role) {
    const { data } = await db.from('event_staff').update({ role }).eq('id', staffId).eq('event_id', id).select().single();
    return NextResponse.json(data);
  }
  if (action === 'resend') {
    await db.from('event_staff').update({ invited_at: new Date().toISOString() }).eq('id', staffId).eq('event_id', id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
