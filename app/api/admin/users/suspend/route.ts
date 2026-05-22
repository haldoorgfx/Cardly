import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_SUSPEND } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

// PATCH /api/admin/users/suspend — suspend or unsuspend a user
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(USER_SUSPEND);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { userId?: string; suspend?: boolean; reason?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { userId, suspend, reason } = body;
  if (!userId || typeof suspend !== 'boolean') {
    return NextResponse.json({ error: 'Missing userId or suspend flag' }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Read target user
  const { data: target } = await adminClient
    .from('profiles')
    .select('id, email, role, suspended')
    .eq('id', userId)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Cannot suspend/unsuspend a super_admin
  if (target.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot suspend a super_admin' }, { status: 403 });
  }

  // Cannot suspend yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 403 });
  }

  const updatePayload = suspend
    ? {
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason?.trim() || 'Suspended by administrator.',
      }
    : {
        suspended: false,
        suspended_at: null,
        suspended_reason: null,
      };

  const { error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, suspend ? 'user.suspended' : 'user.unsuspended', 'profile', userId, {
    before: { suspended: target.suspended },
    after:  { suspended: suspend, reason: suspend ? updatePayload.suspended_reason : null },
  });

  return NextResponse.json({ ok: true, suspended: suspend });
}
