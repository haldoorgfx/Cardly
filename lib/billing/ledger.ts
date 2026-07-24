import type { Plan } from './plans';
import { splitTicketAmount, type FeeBearer } from './fees';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

export type LedgerProvider = 'stripe' | 'flutterwave' | 'waafipay' | 'manual' | 'import';

/**
 * Computes the platform-fee split for a face amount and stores it on the
 * registration row (platform_fee/organizer_net/fee_bearer). Does NOT write a
 * ledger entry — call this at the moment a registration is CREATED, before
 * payment is confirmed (e.g. a Stripe PaymentIntent that hasn't succeeded
 * yet). Recording a ledger row here would count fee revenue for money that
 * hasn't actually been collected and might still fail or be abandoned.
 */
export async function computeAndStoreFeeSplit(params: {
  admin: AdminClient;
  registrationId: string;
  faceAmount: number;
  plan: Plan;
  feeBearer: FeeBearer;
  currency: string;
}) {
  const { admin, registrationId, faceAmount, plan, feeBearer, currency } = params;
  const split = splitTicketAmount(faceAmount, plan, feeBearer, currency);
  await admin
    .from('registrations')
    .update({ platform_fee: split.platformFee, organizer_net: split.organizerNet, fee_bearer: feeBearer })
    .eq('id', registrationId);
  return split;
}

export interface RecordConfirmedSaleParams {
  admin: AdminClient;
  eventId: string;
  /** events.user_id. No ledger row is written if this can't be resolved. */
  organizerId: string | null | undefined;
  registrationId: string;
  platformFee: number | null | undefined;
  organizerNet: number | null | undefined;
  currency: string;
  provider: LedgerProvider;
  providerRef?: string | null;
}

/**
 * The one writer for "money was actually collected for a ticket." Call this
 * ONLY at the moment payment is confirmed — the synchronous walk-in/import
 * paths (already confirmed at creation) via recordTicketSaleLedger below, or
 * the pending→paid flip in a payment webhook/confirm route. Writing this any
 * earlier (e.g. at pending-registration creation) would book fee revenue
 * against a charge that might still fail.
 *
 * Best-effort: financial_transactions (migration 124) is applied by hand,
 * same as every other migration here. Until then this no-ops loudly via
 * console.error; the registration's own fee columns are unaffected.
 */
export async function recordConfirmedSaleLedger(params: RecordConfirmedSaleParams): Promise<void> {
  const { admin, eventId, organizerId, registrationId, currency, provider, providerRef } = params;
  const platformFee = Number(params.platformFee ?? 0);
  const organizerNet = Number(params.organizerNet ?? 0);
  if (!organizerId || (platformFee <= 0 && organizerNet <= 0)) return;

  const rows: Record<string, unknown>[] = [];
  if (platformFee > 0) {
    rows.push({
      entry_type: 'platform_fee', event_id: eventId, organizer_id: organizerId, registration_id: registrationId,
      amount: platformFee, currency, provider, provider_ref: providerRef ?? null,
    });
  }
  if (organizerNet > 0) {
    rows.push({
      entry_type: 'organizer_net', event_id: eventId, organizer_id: organizerId, registration_id: registrationId,
      amount: organizerNet, currency, provider, provider_ref: providerRef ?? null,
    });
  }
  if (rows.length === 0) return;

  const { error } = await admin.from('financial_transactions').insert(rows);
  if (error) console.error('[ledger] recordConfirmedSaleLedger insert failed (migration 124 applied?):', error.message);
}

export interface RecordTicketSaleParams {
  admin: AdminClient;
  registrationId: string;
  eventId: string;
  organizerId: string | null;
  /** The ticket's face price (before the platform fee split), in the ticket's own currency. */
  faceAmount: number;
  plan: Plan;
  feeBearer: FeeBearer;
  currency: string;
  provider: LedgerProvider;
  providerRef?: string | null;
}

/**
 * For code paths where the sale is confirmed SYNCHRONOUSLY at creation —
 * organizer walk-in entry and CSV import both insert the registration
 * already `status: 'confirmed'`, with no async payment step afterward.
 * Computes the split, stores it on the registration, and writes the ledger
 * rows in one call. Online checkout (Stripe/Flutterwave/WaafiPay) must NOT
 * use this at registration time — see computeAndStoreFeeSplit +
 * recordConfirmedSaleLedger instead, split across creation and confirmation.
 */
export async function recordTicketSaleLedger(params: RecordTicketSaleParams) {
  const split = await computeAndStoreFeeSplit(params);
  await recordConfirmedSaleLedger({
    admin: params.admin,
    eventId: params.eventId,
    organizerId: params.organizerId,
    registrationId: params.registrationId,
    platformFee: split.platformFee,
    organizerNet: split.organizerNet,
    currency: params.currency,
    provider: params.provider,
    providerRef: params.providerRef,
  });
  return split;
}
