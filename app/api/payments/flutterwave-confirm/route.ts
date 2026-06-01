import { NextRequest, NextResponse } from 'next/server';
import { verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { createAdminClient } from '@/lib/supabase/server';

// Called by the confirm page on Flutterwave redirect return.
// tx_ref = qr_code_token. Verifies the transaction and marks registration paid.
export async function POST(req: NextRequest) {
  const { transaction_id, tx_ref } = await req.json();
  if (!tx_ref) return NextResponse.json({ error: 'tx_ref required' }, { status: 400 });

  try {
    const verification = await verifyFlutterwaveTransaction(transaction_id ?? tx_ref);
    const { status, amount, currency } = verification.data ?? {};

    const admin = createAdminClient();

    if (status === 'successful') {
      await admin
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          amount_paid: amount ?? 0,
          currency: currency ?? 'USD',
          updated_at: new Date().toISOString(),
        })
        .eq('qr_code_token', tx_ref)
        .in('payment_status', ['pending', 'free']); // idempotent

      return NextResponse.json({ status: 'successful' });
    }

    return NextResponse.json({ status: status ?? 'failed' });
  } catch (err) {
    console.error('[FW confirm]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
