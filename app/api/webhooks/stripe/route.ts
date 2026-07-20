import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { syncSubscription, handleCustomerDeleted } from '@/lib/billing/sync';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

const HANDLED_EVENTS = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]);

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Without the secret key the Stripe proxy resolves to undefined and
  // constructEvent blew up into a 400 — which Stripe records as a permanent
  // failure and eventually disables the endpoint. 503 keeps it retrying.
  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Billing not configured' }, { status: 503 });
  }
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const obj = event.data.object as Stripe.Subscription | Stripe.Invoice;
        const subscriptionId =
          'subscription' in obj && typeof obj.subscription === 'string'
            ? obj.subscription
            : 'id' in obj && obj.object === 'subscription'
            ? obj.id
            : null;
        if (subscriptionId) {
          await syncSubscription(subscriptionId);
        }
        break;
      }
      case 'customer.deleted': {
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook]', event.type, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
