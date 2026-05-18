import type Stripe from 'stripe';
import { stripe } from './stripe';
import { getPlanFromPriceId } from './plans';
import { createAdminClient } from '@/lib/supabase/server';

export async function syncSubscription(subscriptionId: string): Promise<void> {
  const admin = createAdminClient();

  // Always fetch fresh data from Stripe — never trust webhook payload state
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });

  const priceId = sub.items.data[0]?.price.id ?? null;
  const plan = priceId ? (getPlanFromPriceId(priceId) ?? 'free') : 'free';
  const billingCycle =
    sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  // Normalize Stripe status to our enum (incomplete_expired → canceled)
  const knownStatuses = ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'none'] as const;
  type KnownStatus = typeof knownStatuses[number];
  const rawStatus = sub.status as string;
  const subscriptionStatus: KnownStatus = knownStatuses.includes(rawStatus as KnownStatus)
    ? (rawStatus as KnownStatus)
    : 'canceled';

  // Find the Supabase user via stripe_customer_id
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  await admin
    .from('profiles')
    .update({
      plan,
      stripe_subscription_id: sub.id,
      subscription_status: subscriptionStatus,
      billing_cycle: billingCycle,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
    })
    .eq('stripe_customer_id', customerId);
}

export async function handleCustomerDeleted(customer: Stripe.Customer): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('profiles')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      subscription_status: 'none',
      billing_cycle: 'none',
      current_period_end: null,
      cancel_at_period_end: false,
    })
    .eq('stripe_customer_id', customer.id);
}
