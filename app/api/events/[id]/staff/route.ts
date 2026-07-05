import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

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
  const db = admin as any;

  // Block duplicate active assignment (same email + role already active)
  const { data: existing } = await db
    .from('event_staff')
    .select('id')
    .eq('event_id', id)
    .eq('email', email.toLowerCase())
    .eq('role', role)
    .neq('status', 'removed')
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `${email} already has an active ${role} role for this event` }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from('event_staff').insert({
    event_id: id, owner_id: user.id, email, role, expires: expires ?? '24h_after', status: 'pending',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write-path parity (migration 055): if the invited email belongs to an
  // account, record the staff role so the unified dashboard resolver sees it.
  // Best-effort — never blocks the invite.
  const staffAccountId = await resolveAccountIdByEmail(email);
  if (staffAccountId) {
    await upsertEventRole({ userId: staffAccountId, eventId: id, role: 'staff' });
  }

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
    const { data: removedRow } = await db
      .from('event_staff')
      .select('email')
      .eq('id', staffId)
      .eq('event_id', id)
      .maybeSingle();
    await db.from('event_staff').update({ status: 'removed' }).eq('id', staffId).eq('event_id', id);

    // Write-path parity: revoke the mirrored staff role if the email maps to an
    // account and no OTHER active staff assignment remains for this event.
    if (removedRow?.email) {
      const accountId = await resolveAccountIdByEmail(removedRow.email as string);
      if (accountId) {
        const { data: remaining } = await db
          .from('event_staff')
          .select('id')
          .eq('event_id', id)
          .eq('email', (removedRow.email as string).toLowerCase())
          .neq('status', 'removed')
          .limit(1);
        if (!remaining || remaining.length === 0) {
          await db
            .from('user_event_roles')
            .update({ status: 'revoked' })
            .eq('user_id', accountId)
            .eq('event_id', id)
            .eq('role', 'staff');
        }
      }
    }
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
