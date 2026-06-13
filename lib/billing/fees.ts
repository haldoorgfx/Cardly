import type { Plan } from './plans';

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
 * Returns 0 for free tickets and Studio organizers. Rounded to 2 dp.
 */
export function computePlatformFee(faceAmount: number, plan: Plan): number {
  if (!faceAmount || faceAmount <= 0) return 0;
  const pct = PLATFORM_FEE_PERCENT[plan] ?? PLATFORM_FEE_PERCENT.free;
  if (pct <= 0) return 0;
  return Math.round(faceAmount * pct * 100) / 100;
}

/**
 * Given the ticket face price, the organizer's plan, and who bears the fee,
 * returns the money split:
 *  - charged:      what the attendee actually pays (gross)
 *  - platformFee:  Karta's cut
 *  - organizerNet: what the organizer is owed (always = charged − platformFee)
 *
 * absorb → attendee pays face; fee comes out of the organizer's revenue.
 * pass   → attendee pays face + fee; organizer keeps the full face value.
 */
export function splitTicketAmount(faceAmount: number, plan: Plan, bearer: FeeBearer) {
  const platformFee = computePlatformFee(faceAmount, plan);
  if (bearer === 'pass') {
    const charged = Math.round((faceAmount + platformFee) * 100) / 100;
    return { charged, platformFee, organizerNet: faceAmount };
  }
  // absorb
  return { charged: faceAmount, platformFee, organizerNet: Math.round((faceAmount - platformFee) * 100) / 100 };
}
