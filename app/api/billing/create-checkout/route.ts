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
  const { plan, billingCycle } = await req.json() as { plan: Plan; billingCycle: 'monthly' | 'annual' };

  const priceId = PRICE_IDS[plan]?.[billingCycle];
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=canceled`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { supabase_user_id: user.id, billing_cycle: billingCycle },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
