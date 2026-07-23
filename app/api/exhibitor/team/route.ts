import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export async function POST(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const body = await req.json();
  const { token, email, role } = body;

  if (!token || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id, event_id')
    .eq('invite_token', token)
    .single();

  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: member, error } = await admin
    .from('sponsor_members')
    .insert({ sponsor_id: sponsor.id, invited_email: email, role: role || null, status: 'invited' })
    .select('id, invited_email, role, status, user_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Best-effort: if the invited teammate already has an account, grant them the
  // event-scoped 'sponsor' role so the mobile Sponsor tools unlock for them too.
  try {
    const memberUserId = await resolveAccountIdByEmail(email);
    if (memberUserId && sponsor.event_id) {
      await upsertEventRole({ userId: memberUserId, eventId: sponsor.event_id as string, role: 'sponsor' });
    }
  } catch { /* never block the invite */ }

  return NextResponse.json({ member });
}

export async function PATCH(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const token     = body?.token as string | undefined;
  const memberId  = body?.id as string | undefined;
  const scanAccess = body?.scan_access;

  if (!token || !memberId || typeof scanAccess !== 'boolean') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify the token belongs to the sponsor that owns this member
  const { data: sponsor } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin
    .from('sponsor_members')
    .update({ scan_access: scanAccess })
    .eq('id', memberId)
    .eq('sponsor_id', sponsor.id);

  // If the scan_access column hasn't been migrated yet (059), fail cleanly so the
  // client reverts its optimistic toggle instead of surfacing a 500 crash.
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await isPlatformFeatureEnabled('exhibitors'))) return NextResponse.json({ error: 'Exhibitors is currently unavailable.' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get('id');
  const token    = searchParams.get('token');

  if (!memberId || !token) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Verify the token belongs to the sponsor that owns this member
  const { data: sponsor } = await admin.from('sponsors').select('id').eq('invite_token', token).single();
  if (!sponsor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { error } = await admin.from('sponsor_members').delete().eq('id', memberId).eq('sponsor_id', sponsor.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
