import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getTicketStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia', typescript: true });
  }
  return _stripe;
}

// Currencies Stripe treats as zero-decimal (no minor unit). Amounts for these
// must be passed as the integer major-unit value, NOT multiplied by 100.
// https://docs.stripe.com/currencies#zero-decimal
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG',
  'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

/**
 * Convert a human-facing amount (e.g. 25.00) to the integer Stripe expects for
 * the given currency. 2-decimal currencies are ×100 (cents); zero-decimal
 * currencies (DJF, JPY, XOF, …) are passed as-is. Prevents a 100× overcharge.
 */
export function toStripeMinorUnit(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

export interface CreatePaymentIntentParams {
  amount: number;        // in smallest currency unit (already converted)
  currency: string;
  registrationId: string;
  eventId: string;
  attendeeEmail: string;
}

export async function createTicketPaymentIntent(params: CreatePaymentIntentParams) {
  const stripe = getTicketStripe();
  return stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    metadata: {
      registration_id: params.registrationId,
      event_id: params.eventId,
    },
    receipt_email: params.attendeeEmail,
    automatic_payment_methods: { enabled: true },
  });
}

export function constructTicketWebhookEvent(payload: string | Buffer, sig: string) {
  const secret = process.env.STRIPE_TICKET_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_TICKET_WEBHOOK_SECRET is not set');
  return getTicketStripe().webhooks.constructEvent(payload, sig, secret);
}
