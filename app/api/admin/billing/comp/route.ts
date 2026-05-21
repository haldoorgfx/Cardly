import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import type { Plan } from '@/types/database';

const VALID_PLANS: Plan[] = ['free', 'pro', 'studio'];

// PATCH /api/admin/billing/comp — comp (grant) a plan to a user, bypassing Stripe
// This is an admin override — noted in audit log as Stripe-bypassing.
// Requires BILLING_MANAGE permission.
export async function PATCH(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { userId?: string; plan?: string; reason?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { userId, plan, reason } = body;
  if (!userId || !plan) {
    return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 });
  }
  if (!VALID_PLANS.includes(plan as Plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: target } = await adminClient
    .from('profiles')
    .select('id, email, plan')
    .eq('id', userId)
    .single();

  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Cannot comp to the same plan
  if (target.plan === plan) {
    return NextResponse.json({ error: `User is already on ${plan}` }, { status: 400 });
  }

  const { error } = await adminClient
    .from('profiles')
    .update({ plan: plan as Plan })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(user, 'billing.plan_comped', 'profile', userId, {
    before: { plan: target.plan },
    after:  { plan, reason: reason?.trim() || 'Admin comp — Stripe-bypassing override.' },
  });

  return NextResponse.json({ ok: true, plan });
}
