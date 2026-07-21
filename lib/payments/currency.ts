/**
 * Stripe amount conversion.
 *
 * Stripe expects amounts in the currency's *smallest unit*. For most currencies
 * that's 1/100 of the major unit (USD 10.00 → 1000). But a set of currencies is
 * "zero-decimal": the amount field IS the major unit, so multiplying by 100
 * overcharges by 100×.
 *
 * This matters directly for Eventera's primary markets — DJF (Djibouti), UGX
 * (Uganda), RWF (Rwanda), KMF (Comoros), XOF/XAF (West/Central African CFA) are
 * all zero-decimal. A DJF 5,000 ticket must be sent to Stripe as 5000, not
 * 500000.
 *
 * Source: https://docs.stripe.com/currencies#zero-decimal
 */

const ZERO_DECIMAL_CURRENCIES = new Set([
  'bif', 'clp', 'djf', 'gnf', 'jpy', 'kmf', 'krw', 'mga',
  'pyg', 'rwf', 'ugx', 'vnd', 'vuv', 'xaf', 'xof', 'xpf',
]);

/** True when Stripe treats this currency's amount as the major unit. */
export function isZeroDecimalCurrency(currency: string | null | undefined): boolean {
  return ZERO_DECIMAL_CURRENCIES.has((currency ?? '').trim().toLowerCase());
}

/**
 * Convert a human/major-unit amount (what we store in `amount_paid` and show
 * the attendee) into the integer Stripe expects for this currency.
 */
export function toStripeMinorUnits(amount: number, currency: string | null | undefined): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return isZeroDecimalCurrency(currency)
    ? Math.round(amount)
    : Math.round(amount * 100);
}

/**
 * Round a money amount to the smallest unit the currency actually has.
 *
 * Zero-decimal currencies have NO subunit — there is no such thing as 0.05 DJF.
 * A percentage promo (or a percentage platform fee) routinely lands on a
 * fraction, and without this we would store `amount_paid = 2833.05`, send
 * `2833` to Stripe, and hand `2833.05` straight to WaafiPay/Flutterwave, which
 * cannot charge a fraction of an indivisible unit. Rounding once, here, keeps
 * the stored amount, the fee split and every processor in agreement.
 */
export function roundToCurrencyUnit(amount: number, currency?: string | null): number {
  if (!Number.isFinite(amount)) return 0;
  return isZeroDecimalCurrency(currency) ? Math.round(amount) : Math.round(amount * 100) / 100;
}

/**
 * Inverse of {@link toStripeMinorUnits} — turn a Stripe amount back into the
 * major unit, for reconciling a webhook payload against a stored `amount_paid`.
 */
export function fromStripeMinorUnits(amount: number, currency: string | null | undefined): number {
  if (!Number.isFinite(amount)) return 0;
  return isZeroDecimalCurrency(currency) ? amount : amount / 100;
}
