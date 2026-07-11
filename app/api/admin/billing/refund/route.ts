import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { stripe } from '@/lib/billing/stripe';
import { logAudit } from '@/lib/audit/log';
import { createAdminClient } from '@/lib/supabase/server';
import { markRegistrationRefunded } from '@/lib/payments/refund';

// POST /api/admin/billing/refund — issue a refund.
//   • Stripe payments: pass `paymentIntentId` (or a `registrationId` whose payment
//     is a Stripe PI) → refunds via the Stripe API; the charge.refunded webhook
//     flips the registration and returns inventory.
//   • WaafiPay / Flutterwave payments: pass `registrationId` → the money is
//     refunded in the provider dashboard; this flips the registration to
//     `refunded` and returns the ticket to inventory (idempotent).
// Requires BILLING_MANAGE + super_admin.
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
    registrationId?: string; // refund by registration (auto-detects provider)
    amount?: number;         // in cents; omit for full refund (Stripe only)
    reason?: string;
    userId?: string;         // for audit trail
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  let { paymentIntentId } = body;
  const { registrationId, amount, reason, userId } = body;

  // Refund-by-registration: detect the provider from the stored payment ids.
  if (!paymentIntentId && registrationId) {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reg } = await (admin as any)
      .from('registrations')
      .select('id, stripe_payment_intent_id, payment_status')
      .eq('id', registrationId)
      .maybeSingle();
    if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

    if (reg.stripe_payment_intent_id) {
      // Stripe-backed → fall through to the Stripe refund below.
      paymentIntentId = reg.stripe_payment_intent_id as string;
    } else {
      // WaafiPay / Flutterwave → money refunded externally; reflect the state.
      const marked = await markRegistrationRefunded(registrationId);
      await logAudit(user, 'billing.refund_marked', 'registration', registrationId, {
        after: { result: marked.ok ? 'refunded' : marked.reason, ticketReturned: marked.ok && marked.ticketReturned, reason: reason ?? 'requested_by_customer', user_id: userId ?? null },
      });
      if (!marked.ok) {
        return NextResponse.json({ error: marked.reason === 'already_refunded' ? 'Already refunded or not refundable' : 'Registration not found' }, { status: 409 });
      }
      return NextResponse.json({ ok: true, refund: { provider: 'manual', registrationId, ticketReturned: marked.ticketReturned } });
    }
  }

  if (!paymentIntentId) {
    return NextResponse.json({ error: 'paymentIntentId or registrationId is required' }, { status: 400 });
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
