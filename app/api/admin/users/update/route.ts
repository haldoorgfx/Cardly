import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { USER_ROLE_CHANGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

const VALID_PLANS = ['free', 'pro', 'studio'];

// PATCH /api/admin/users/update — edit basic profile fields (name, plan).
// Email + role have their own dedicated endpoints; this covers the inline
// admin edits. Gated on the same permission as role changes.
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(USER_ROLE_CHANGE);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { userId?: string; full_name?: string; plan?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { userId, full_name, plan } = body;
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  // NOTE: `profiles` has no `updated_at` column (only `created_at`) — writing
  // one here fails every update with Postgres 42703, which is what surfaced as
  // "Could not save the change." Only ever set columns that actually exist.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};

  if (full_name !== undefined) {
    const trimmed = String(full_name).trim();
    if (trimmed.length > 200) {
      return NextResponse.json({ error: 'Name must be 200 characters or less' }, { status: 400 });
    }
    update.full_name = trimmed || null;
  }
  if (plan !== undefined) {
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}` }, { status: 400 });
    }
    update.plan = plan;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: before } = await adminClient
    .from('profiles')
    .select('id, email, full_name, plan')
    .eq('id', userId)
    .single();
  if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: after, error } = await (adminClient as any)
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select('id, email, full_name, plan')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'user.updated', 'user', userId, {
    before: { full_name: before.full_name, plan: before.plan },
    after:  { full_name: after.full_name,  plan: after.plan },
  });

  return NextResponse.json({ ok: true, user: after });
}
