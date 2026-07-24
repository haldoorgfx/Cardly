import { getStripe } from '@/lib/billing/stripe';
import { logAudit } from '@/lib/audit/log';
import type { SessionUser } from '@/lib/auth/guards';

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

interface RegistrationBeforeRefund {
  id: string;
  event_id: string;
  status: string;
  payment_status: string;
  ticket_type_id: string | null;
  stripe_payment_intent_id: string | null;
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
 * Steps: real Stripe refund (unchanged existing helper) → one row update
 * (status + payment_status together) → reversing refund_fee/refund_net
 * ledger rows (idempotent — a retried call can't double-write, see migration
 * 124's partial unique index) → audit log, only when a real human actor
 * triggered this (a webhook-initiated refund has no SessionUser to log as;
 * the ledger row itself, with created_by null and provider 'stripe', is the
 * record of that system-initiated event).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function refundRegistration(admin: any, registrationId: string, actor?: SessionUser): Promise<RefundRegistrationResult> {
  const { data: before } = await admin
    .from('registrations')
    .select('id, event_id, status, payment_status, ticket_type_id, stripe_payment_intent_id, attendee_email, platform_fee, organizer_net, currency')
    .eq('id', registrationId)
    .maybeSingle();

  if (!before) return { ok: false, error: 'Registration not found' };

  // Already refunded — idempotent no-op. The unique index on the ledger
  // would block a duplicate reversal anyway; this just skips a redundant
  // Stripe call.
  if (before.status === 'refunded' && before.payment_status === 'refunded') {
    return { ok: true, before, flipped: false };
  }

  const refund = await refundStripeTicketIfNeeded(before);
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
    const rows: Record<string, unknown>[] = [];
    if (platformFee > 0) {
      rows.push({
        entry_type: 'refund_fee', event_id: before.event_id, organizer_id: event.user_id, registration_id: registrationId,
        amount: -platformFee, currency: before.currency, provider: 'stripe', provider_ref: before.stripe_payment_intent_id,
      });
    }
    if (organizerNet > 0) {
      rows.push({
        entry_type: 'refund_net', event_id: before.event_id, organizer_id: event.user_id, registration_id: registrationId,
        amount: -organizerNet, currency: before.currency, provider: 'stripe', provider_ref: before.stripe_payment_intent_id,
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
