import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_DELETE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

// DELETE /api/admin/users/delete — permanently delete a user account
export async function DELETE(request: Request) {
  const result = await getAuthorizedUser(USER_DELETE);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { userId?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  // Cannot delete yourself
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Read target user for audit and safety check
  const { data: target } = await adminClient
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Cannot delete a super_admin
  if (target.role === 'super_admin') {
    return NextResponse.json({ error: 'Cannot delete a super_admin' }, { status: 403 });
  }

  // Log before deletion (after this, the record is gone)
  await logAudit(user, 'user.deleted', 'profile', userId, {
    before: { email: target.email, role: target.role },
  });

  // Delete from auth.users — cascades to profiles (and events via cascade)
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
