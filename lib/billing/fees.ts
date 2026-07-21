import type { Plan } from './plans';
import { roundToCurrencyUnit } from '@/lib/payments/currency';

/**
 * Platform fee on PAID tickets — the take-rate engine.
 *
 * The subscription "buys the rate down": free organizers pay the most,
 * Studio pays nothing. This is the core money model — see the
 * monetization-model note. Free tickets are NEVER charged a fee.
 *
 * v1 is percentage-only (no cross-currency min-flat, to avoid FX guesswork).
 * A per-currency minimum can be layered in once pricing policy is finalized.
 */
export const PLATFORM_FEE_PERCENT: Record<Plan, number> = {
  free:   0.05, // 5%
  pro:    0.02, // 2%
  studio: 0,    // 0% — fully waived by the Studio subscription
};

export type FeeBearer = 'absorb' | 'pass';

/**
 * Platform fee for a face amount + organizer plan, in the ticket's own currency.
 * Returns 0 for free tickets and Studio organizers. Rounded to the currency's
 * smallest real unit (whole numbers for zero-decimal currencies like DJF/UGX/
 * XOF — a 2 dp fee there is unchargeable and desyncs organizer_net).
 */
export function computePlatformFee(faceAmount: number, plan: Plan, currency?: string | null): number {
  if (!faceAmount || faceAmount <= 0) return 0;
  const pct = PLATFORM_FEE_PERCENT[plan] ?? PLATFORM_FEE_PERCENT.free;
  if (pct <= 0) return 0;
  return roundToCurrencyUnit(faceAmount * pct, currency);
}

/**
 * Given the ticket face price, the organizer's plan, and who bears the fee,
 * returns the money split:
 *  - charged:      what the attendee actually pays (gross)
 *  - platformFee:  Eventera's cut
 *  - organizerNet: what the organizer is owed (always = charged − platformFee)
 *
 * absorb → attendee pays face; fee comes out of the organizer's revenue.
 * pass   → attendee pays face + fee; organizer keeps the full face value.
 */
export function splitTicketAmount(faceAmount: number, plan: Plan, bearer: FeeBearer, currency?: string | null) {
  const platformFee = computePlatformFee(faceAmount, plan, currency);
  if (bearer === 'pass') {
    const charged = roundToCurrencyUnit(faceAmount + platformFee, currency);
    // organizerNet is derived from `charged`, never assumed to equal faceAmount —
    // the currency rounding above can shift `charged` by a fraction of a unit, and
    // the invariant revenue reporting relies on is charged − fee = net.
    return { charged, platformFee, organizerNet: roundToCurrencyUnit(charged - platformFee, currency) };
  }
  // absorb
  const charged = roundToCurrencyUnit(faceAmount, currency);
  return { charged, platformFee, organizerNet: roundToCurrencyUnit(charged - platformFee, currency) };
}
