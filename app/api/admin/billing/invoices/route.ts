import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { stripe } from '@/lib/billing/stripe';

// GET /api/admin/billing/invoices?customerId=cus_xxx — list invoices for a Stripe customer
export async function GET(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;

  const url = new URL(request.url);
  const customerId = url.searchParams.get('customerId');
  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    const formatted = invoices.data.map(inv => ({
      id:       inv.id,
      number:   inv.number,
      amount:   inv.amount_paid,
      currency: inv.currency,
      status:   inv.status,
      created:  inv.created,
      pdf:      inv.invoice_pdf,
      hosted:   inv.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices: formatted });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
