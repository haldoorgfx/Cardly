import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';
import type { Plan } from '@/lib/billing/plans';

const PRICE_IDS: Record<Plan, Record<'monthly' | 'annual', string | undefined>> = {
  free: { monthly: undefined, annual: undefined },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    annual:  process.env.STRIPE_PRICE_PRO_ANNUAL,
  },
  studio: {
    monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
    annual:  process.env.STRIPE_PRICE_STUDIO_ANNUAL,
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stripe = getStripe();
  // Malformed/empty bodies threw an unhandled 500 here instead of a 400.
  let body: { plan?: Plan; billingCycle?: 'monthly' | 'annual' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { plan, billingCycle } = body;

  const cycle: 'monthly' | 'annual' | null =
    billingCycle === 'monthly' || billingCycle === 'annual' ? billingCycle : null;
  const priceId = plan && cycle ? PRICE_IDS[plan]?.[cycle] : undefined;
  if (!priceId) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, email, full_name')
    .eq('id', user.id)
    .single();

  // Get or create Stripe customer
  let customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (profile?.email as string | null) ?? user.email ?? undefined,
      name: (profile?.full_name as string | null) ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
  }

  // Existing subscriptions on this customer decide two things:
  //  1. A customer who already has a live subscription must NOT be sent through
  //     checkout again — Stripe would happily create a second subscription and
  //     bill them twice. Plan changes belong in the customer portal.
  //  2. The 14-day trial was granted unconditionally, so subscribe → cancel →
  //     resubscribe looped free Pro/Studio forever. Only ever trial once.
  const existing = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 100,
  });
  const hasLiveSubscription = existing.data.some(s =>
    ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status),
  );
  if (hasLiveSubscription) {
    return NextResponse.json(
      { error: 'You already have an active subscription. Use “Manage billing” to change your plan.' },
      { status: 409 },
    );
  }
  const hasSubscribedBefore = existing.data.length > 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    subscription_data: {
      ...(hasSubscribedBefore ? {} : { trial_period_days: 14 }),
      metadata: { supabase_user_id: user.id, billing_cycle: cycle ?? 'monthly' },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
