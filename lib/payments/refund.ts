import { getStripe } from '@/lib/billing/stripe';

export interface RefundableRegistration {
  stripe_payment_intent_id: string | null;
  payment_status: string;
}

export interface RefundResult {
  /** Whether a live refund call was actually attempted (vs. skipped as not applicable). */
  attempted: boolean;
  ok: boolean;
  error?: string;
}

/**
 * Issues a real Stripe refund when a paid Stripe ticket transitions to
 * 'refunded'. Flutterwave and WaafiPay registrations have no reversal API
 * wired up yet — this deliberately leaves those untouched (same DB-only
 * status flip as before), so a Stripe outage or missing key never blocks a
 * refund an organizer needs to record for a non-Stripe payment.
 */
export async function refundStripeTicketIfNeeded(reg: RefundableRegistration): Promise<RefundResult> {
  if (!reg.stripe_payment_intent_id || reg.payment_status !== 'paid') {
    return { attempted: false, ok: true };
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create({ payment_intent: reg.stripe_payment_intent_id });
    return { attempted: true, ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe refund failed';
    // Already refunded (e.g. an operator retrying after an unrelated DB error
    // on a prior attempt) means the money is already back — treat as success
    // rather than blocking the status flip a second time.
    if (/already been refunded/i.test(message)) {
      return { attempted: true, ok: true };
    }
    return { attempted: true, ok: false, error: message };
  }
}
