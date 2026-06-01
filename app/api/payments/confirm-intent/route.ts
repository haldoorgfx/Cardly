import { NextRequest, NextResponse } from 'next/server';
import { getTicketStripe } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';

// Called by the confirm page after Stripe redirect to verify payment and mark registration as paid.
// Idempotent — safe to call multiple times (webhook may have already done the update).
export async function POST(req: NextRequest) {
  const { payment_intent_id, qr_code_token } = await req.json();
  if (!payment_intent_id || !qr_code_token) {
    return NextResponse.json({ error: 'payment_intent_id and qr_code_token required' }, { status: 400 });
  }

  // Verify with Stripe
  const stripe = getTicketStripe();
  const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

  const admin = createAdminClient();

  if (pi.status === 'succeeded') {
    await admin
      .from('registrations')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('qr_code_token', qr_code_token)
      .in('payment_status', ['pending', 'free']); // idempotent
    return NextResponse.json({ status: 'succeeded' });
  }

  if (pi.status === 'processing') {
    return NextResponse.json({ status: 'processing' });
  }

  return NextResponse.json({ status: pi.status });
}
