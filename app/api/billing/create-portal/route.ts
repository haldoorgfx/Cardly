import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/billing/stripe';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Payments are not configured.' }, { status: 503 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const stripe = getStripe();

  try {
    // A manually-comped / never-checked-out user has no Stripe customer yet.
    // Create one on demand so "Manage billing" / "Add card" work for everyone,
    // not just people who already paid — then persist it.
    let customerId = profile?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/settings/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    // Most common cause in a fresh account: the Stripe Customer Portal hasn't
    // been activated in the Stripe dashboard yet. Surface a real reason instead
    // of a dead button.
    const msg = e instanceof Error ? e.message : 'Could not open the billing portal.';
    const notConfigured = /portal|configuration/i.test(msg);
    return NextResponse.json(
      { error: notConfigured
          ? 'Billing portal isn’t enabled yet. Activate the Customer Portal in your Stripe dashboard to manage cards and invoices here.'
          : msg },
      { status: 502 },
    );
  }
}
