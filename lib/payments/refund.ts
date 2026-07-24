import { getStripe } from '@/lib/billing/stripe';
import { logAudit } from '@/lib/audit/log';
import type { SessionUser } from '@/lib/auth/guards';
import { isFlutterwaveCurrency, refundFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { isWaafiPayCurrency, reverseWaafiPayTransaction } from '@/lib/payments/waafipay';

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
 * 'refunded'. Kept as its own function (used by refundPaymentIfNeeded below)
 * since Stripe identifies the transaction by its own dedicated column
 * (stripe_payment_intent_id), unlike Flutterwave/WaafiPay which share one
 * reused text column and need the registration's currency to tell apart.
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

interface RefundablePayment {
  stripe_payment_intent_id: string | null;
  flutterwave_tx_ref: string | null;
  currency: string;
  payment_status: string;
}

/**
 * The one dispatcher for "issue a real refund, whichever processor this
 * registration actually paid through." `flutterwave_tx_ref` is a reused
 * column — Flutterwave stores its own numeric transaction id there, WaafiPay
 * stores its TXNID — so a registration's `currency` (the two gateways'
 * supported currency lists are disjoint, see FLUTTERWAVE_CURRENCIES /
 * WAAFIPAY_CURRENCIES) is what tells them apart, not the column itself.
 *
 * WaafiPay reversal is unverified against a live sandbox (see
 * reverseWaafiPayTransaction's own caveat) — it fails closed like every path
 * here, so a bad response just blocks the refund with an error rather than
 * silently marking it refunded.
 */
export async function refundPaymentIfNeeded(reg: RefundablePayment): Promise<RefundResult> {
  if (reg.payment_status !== 'paid') return { attempted: false, ok: true };

  if (reg.stripe_payment_intent_id) {
    return refundStripeTicketIfNeeded(reg);
  }
  if (reg.flutterwave_tx_ref) {
    if (isFlutterwaveCurrency(reg.currency)) {
      const result = await refundFlutterwaveTransaction(reg.flutterwave_tx_ref);
      return { attempted: true, ok: result.ok, error: result.error };
    }
    if (isWaafiPayCurrency(reg.currency)) {
      const result = await reverseWaafiPayTransaction(reg.flutterwave_tx_ref);
      return { attempted: true, ok: result.ok, error: result.error };
    }
  }
  // Manual/imported/free registrations never charged through a processor —
  // nothing to reverse; the ledger reversal + status flip are the whole story.
  return { attempted: false, ok: true };
}

interface RegistrationBeforeRefund {
  id: string;
  event_id: string;
  status: string;
  payment_status: string;
  ticket_type_id: string | null;
  stripe_payment_intent_id: string | null;
  flutterwave_tx_ref: string | null;
  attendee_email: string;
  platform_fee: number | null;
  organizer_net: number | null;
  currency: string;
}

export interface RefundRegistrationResult {
  ok: boolean;
  error?: string;
  /** The registration as it was immediately before the refund — callers use
   *  this to decide whether a held seat needs releasing (only confirmed/
   *  checked_in registrations ever incremented quantity_sold). */
  before?: RegistrationBeforeRefund;
  /** True only if THIS call performed the pending/confirmed→refunded flip.
   *  False means it was already refunded (by a concurrent call or earlier) —
   *  callers must not release a seat or notify again in that case. */
  flipped?: boolean;
}

/**
 * The one writer for "a registration was refunded." Used by every refund
 * call site (organizer PATCH, admin PATCH, Stripe webhook) so payment_status
 * can never again drift out of sync with status the way it did when each
 * site patched the DB by hand — the admin Billing page sums fees WHERE
 * payment_status = 'paid', so a refund that only flipped `status` kept being
 * counted as earned revenue forever.
 *
 * Steps: real refund via whichever processor the ticket was actually paid
 * through (Stripe, Flutterwave, or WaafiPay — refundPaymentIfNeeded above) →
 * one row update (status + payment_status together) → reversing
 * refund_fee/refund_net ledger rows (idempotent — a retried call can't
 * double-write, see migration 124's partial unique index) → audit log, only
 * when a real human actor triggered this (a webhook-initiated refund has no
 * SessionUser to log as; the ledger row itself, with created_by null and the
 * real provider recorded, is the record of that system-initiated event).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refundRegistration(admin: any, registrationId: string, actor?: SessionUser): Promise<RefundRegistrationResult> {
  const { data: before } = await admin
    .from('registrations')
    .select('id, event_id, status, payment_status, ticket_type_id, stripe_payment_intent_id, flutterwave_tx_ref, attendee_email, platform_fee, organizer_net, currency')
    .eq('id', registrationId)
    .maybeSingle();

  if (!before) return { ok: false, error: 'Registration not found' };

  // Already refunded — idempotent no-op. The unique index on the ledger
  // would block a duplicate reversal anyway; this just skips a redundant
  // Stripe call.
  if (before.status === 'refunded' && before.payment_status === 'refunded') {
    return { ok: true, before, flipped: false };
  }

  const refund = await refundPaymentIfNeeded(before);
  if (!refund.ok) return { ok: false, error: refund.error };

  // Guarded on the prior status so two concurrent refund calls for the same
  // registration (a double-clicked button, a webhook racing an organizer
  // action) can't both "win" — only the first actually flips the row and
  // proceeds to write the ledger reversal; the second matches zero rows and
  // is treated as the same idempotent success.
  const { data: flipped, error: updateError } = await admin
    .from('registrations')
    .update({ status: 'refunded', payment_status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', registrationId)
    .neq('status', 'refunded')
    .select('id')
    .maybeSingle();
  if (updateError) return { ok: false, error: updateError.message };
  if (!flipped) return { ok: true, before, flipped: false };

  const { data: event } = await admin.from('events').select('user_id').eq('id', before.event_id).maybeSingle();
  const platformFee = Number(before.platform_fee ?? 0);
  const organizerNet = Number(before.organizer_net ?? 0);
  if (event?.user_id && (platformFee > 0 || organizerNet > 0)) {
    // Reverse with the SAME provider/reference the original sale was recorded
    // under (manual/import/stripe/flutterwave/waafipay) — hardcoding 'stripe'
    // here mislabeled every non-Stripe reversal (walk-in, import, Flutterwave,
    // WaafiPay) in the accounting-grade export, which exists specifically so
    // an external bookkeeper can trust the provider column.
    const { data: originalEntry } = await admin
      .from('financial_transactions')
      .select('provider, provider_ref')
      .eq('registration_id', registrationId)
      .eq('entry_type', 'organizer_net')
      .maybeSingle();
    const provider = originalEntry?.provider ?? (before.stripe_payment_intent_id ? 'stripe' : 'manual');
    const providerRef = originalEntry?.provider_ref ?? before.stripe_payment_intent_id;

    const rows: Record<string, unknown>[] = [];
    if (platformFee > 0) {
      rows.push({
        entry_type: 'refund_fee', event_id: before.event_id, organizer_id: event.user_id, registration_id: registrationId,
        amount: -platformFee, currency: before.currency, provider, provider_ref: providerRef,
      });
    }
    if (organizerNet > 0) {
      rows.push({
        entry_type: 'refund_net', event_id: before.event_id, organizer_id: event.user_id, registration_id: registrationId,
        amount: -organizerNet, currency: before.currency, provider, provider_ref: providerRef,
      });
    }
    const { error: ledgerError } = await admin.from('financial_transactions').insert(rows);
    // Unique-violation (23505) means this reversal already exists — expected
    // on a retried refund, not a real failure.
    if (ledgerError && ledgerError.code !== '23505') {
      console.error('[refund] ledger insert failed (migration 124 applied?):', ledgerError.message);
    }
  }

  if (actor) {
    await logAudit(actor, 'registration.refunded', 'registration', registrationId, {
      before: { status: before.status, payment_status: before.payment_status, attendee_email: before.attendee_email },
      after: { status: 'refunded', payment_status: 'refunded' },
    });
  }

  return { ok: true, before, flipped: true };
}
