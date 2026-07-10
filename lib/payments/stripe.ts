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

export interface CreatePaymentIntentParams {
  amount: number;        // in smallest currency unit (cents)
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
