import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_ROLE_CHANGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { UserRole } from '@/lib/auth/permissions';

/** Roles an admin (non-super_admin) is allowed to assign */
const ADMIN_ASSIGNABLE_ROLES: UserRole[] = ['user', 'studio'];

/** Roles a super_admin is allowed to assign */
const SUPER_ADMIN_ASSIGNABLE_ROLES: UserRole[] = ['user', 'studio', 'admin', 'super_admin'];

// PATCH /api/admin/users/role — change a user's role
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(USER_ROLE_CHANGE);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { userId?: string; role?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { userId, role } = body;
  if (!userId || !role) {
    return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
  }

  // Determine which roles this actor can assign
  const assignable = user.role === 'super_admin'
    ? SUPER_ADMIN_ASSIGNABLE_ROLES
    : ADMIN_ASSIGNABLE_ROLES;

  if (!assignable.includes(role as UserRole)) {
    return NextResponse.json(
      { error: `Role '${role}' cannot be assigned by a ${user.role}` },
      { status: 403 }
    );
  }

  // Cannot change your own role (prevents accidental self-demotion)
  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Read before state
  const { data: before } = await adminClient
    .from('profiles')
    .select('id, email, role')
    .eq('id', userId)
    .single();

  if (!before) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Apply the change
  const { data: after, error } = await adminClient
    .from('profiles')
    .update({ role: role as UserRole })
    .eq('id', userId)
    .select('id, email, role')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'user.role_change', 'profile', userId, {
    before: { role: before.role },
    after:  { role: after.role  },
  });

  return NextResponse.json({ ok: true, role: after.role });
}
