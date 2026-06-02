import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ invoices: [] });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ invoices: [] });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' });
    const { data: stripeInvoices } = await stripe.invoices.list({
      customer: profile.stripe_customer_id,
      limit: 24,
    });

    const invoices = stripeInvoices.map(inv => ({
      id:          inv.id,
      date:        new Date(inv.created * 1000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      description: inv.lines.data[0]?.description ?? inv.description ?? 'Subscription',
      amount:      inv.amount_paid,
      currency:    inv.currency.toUpperCase(),
      status:      inv.status ?? 'void',
      pdf_url:     inv.invoice_pdf,
    }));

    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ invoices: [] });
  }
}
