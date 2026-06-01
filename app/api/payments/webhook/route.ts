import { NextRequest, NextResponse } from 'next/server';
import { constructTicketWebhookEvent } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = constructTicketWebhookEvent(rawBody, sig);
  } catch (err) {
    console.error('[Stripe webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      const { error } = await admin
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('payment_status', 'pending'); // idempotent guard
      if (error) console.error('[Stripe webhook] update failed:', error.message);
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      await admin
        .from('registrations')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('payment_status', 'pending');
      break;
    }

    case 'payment_intent.canceled': {
      const pi = event.data.object;
      await admin
        .from('registrations')
        .update({ status: 'cancelled', payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id)
        .in('payment_status', ['pending', 'failed']);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
