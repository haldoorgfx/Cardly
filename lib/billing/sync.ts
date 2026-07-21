import type Stripe from 'stripe';
import { stripe } from './stripe';
import { getPlanFromPriceId } from './plans';
import { createAdminClient } from '@/lib/supabase/server';
import type { BillingCycle } from '@/types/database';

export async function syncSubscription(subscriptionId: string): Promise<void> {
  const admin = createAdminClient();

  // Always fetch fresh data from Stripe — never trust webhook payload state
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });

  const priceId = sub.items.data[0]?.price.id ?? null;
  // `null` here means "this price is not one of ours" — NOT "free". Collapsing
  // an unrecognized price to 'free' meant a single stale/rotated
  // STRIPE_PRICE_* env var downgraded every paying customer to Free on their
  // next webhook (renewals fire invoice.payment_succeeded monthly), while
  // Stripe kept charging them $19/$49. Kept distinct so the write below can
  // decline to touch `plan` instead of destroying a live subscriber's tier.
  const pricedPlan = priceId ? getPlanFromPriceId(priceId) : 'free';
  const billingCycle: BillingCycle =
    sub.items.data[0]?.price.recurring?.interval === 'year' ? 'annual' : 'monthly';

  // Normalize Stripe status to our enum (incomplete_expired → canceled)
  const knownStatuses = ['active', 'trialing', 'past_due', 'canceled', 'incomplete', 'none'] as const;
  type KnownStatus = typeof knownStatuses[number];
  const rawStatus = sub.status as string;
  const subscriptionStatus: KnownStatus = knownStatuses.includes(rawStatus as KnownStatus)
    ? (rawStatus as KnownStatus)
    : 'canceled';

  // A cancelled subscription must write `plan` itself back to 'free', not just
  // the status. getUserPlan() compensates, but plenty of surfaces read the raw
  // `profiles.plan` column (settings/developer, settings/white-label, billing,
  // dashboard, admin) — leaving it on 'pro'/'studio' left cancelled users
  // looking and feeling subscribed forever. past_due/incomplete keep the plan
  // so a recovered payment restores the tier without a re-checkout.
  //
  // If the price is UNRECOGNIZED (pricedPlan === null) on a still-live
  // subscription, we cannot say what tier they bought — so we say nothing:
  // status/period/cycle are still synced, but `plan` is left exactly as it is
  // and the misconfiguration is logged. Downgrading a customer Stripe is
  // actively billing is far worse than briefly trusting the stored tier.
  const planUnknown = subscriptionStatus !== 'canceled' && pricedPlan === null;
  if (planUnknown) {
    console.error(
      '[billing/sync] unrecognized price',
      priceId,
      'on subscription',
      sub.id,
      '- STRIPE_PRICE_* env vars are stale or missing. Leaving profiles.plan untouched.',
    );
  }
  // The `?? 'free'` is unreachable when planUnknown is false; it only keeps the
  // type non-nullable, and the value is never written when planUnknown is true.
  const plan = subscriptionStatus === 'canceled' ? 'free' : (pricedPlan ?? 'free');

  // Find the Supabase user via stripe_customer_id
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

  const patch = {
    ...(planUnknown ? {} : { plan }),
    stripe_subscription_id: sub.id,
    subscription_status: subscriptionStatus,
    billing_cycle: billingCycle,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
  };

  const { data: matched } = await admin
    .from('profiles')
    .update(patch)
    .eq('stripe_customer_id', customerId)
    .select('id');

  // The customer-id match silently updates ZERO rows if the profile never got
  // its stripe_customer_id persisted (write failed after customers.create, or
  // the customer was made in the Stripe dashboard). That is the "paid but never
  // upgraded" path. Fall back to the supabase_user_id we stamp on subscription
  // metadata at checkout, and heal the missing customer id while we're here.
  if (!matched || matched.length === 0) {
    const userId = sub.metadata?.supabase_user_id;
    if (userId) {
      const { data: healed } = await admin
        .from('profiles')
        .update({ ...patch, stripe_customer_id: customerId })
        .eq('id', userId)
        .select('id');
      if (healed && healed.length > 0) return;
    }
    console.error(
      '[billing/sync] no profile matched for subscription',
      sub.id,
      'customer',
      customerId,
    );
  }
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
