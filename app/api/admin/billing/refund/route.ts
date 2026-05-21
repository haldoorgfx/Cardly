import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { stripe } from '@/lib/billing/stripe';
import { logAudit } from '@/lib/audit/log';

// POST /api/admin/billing/refund — issue a refund on a Stripe payment intent or invoice
// Requires BILLING_MANAGE + super_admin (enforced by hasPermission check — super_admin only has BILLING_MANAGE)
export async function POST(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  // super_admin-only guard (BILLING_MANAGE is already super_admin-only, but be explicit)
  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only super_admin can issue refunds' }, { status: 403 });
  }

  let body: {
    paymentIntentId?: string;
    amount?: number;       // in cents; omit for full refund
    reason?: string;
    userId?: string;       // for audit trail
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { paymentIntentId, amount, reason, userId } = body;
  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId is required' }, { status: 400 });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: (reason as 'duplicate' | 'fraudulent' | 'requested_by_customer') ?? 'requested_by_customer',
      ...(amount ? { amount } : {}),
    });

    await logAudit(user, 'billing.refund_issued', 'payment', paymentIntentId, {
      after: {
        refund_id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: reason ?? 'requested_by_customer',
        user_id: userId ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
