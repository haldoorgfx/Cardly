import { NextRequest, NextResponse } from 'next/server';
import { chargeWaafiPay } from '@/lib/payments/waafipay';
import { createAdminClient } from '@/lib/supabase/server';

// Called by WaafiPayStep after pending registration is created.
// Synchronous: WaafiPay responds immediately with success/failure.
export async function POST(req: NextRequest) {
  const { registration_id, phone_number } = await req.json();

  if (!registration_id || !phone_number) {
    return NextResponse.json({ error: 'registration_id and phone_number required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Load registration
  const { data: reg } = await admin
    .from('registrations')
    .select('id, qr_code_token, amount_paid, currency, event_id, ticket_type_id, payment_status')
    .eq('id', registration_id)
    .single();

  if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  if (reg.payment_status === 'paid') {
    return NextResponse.json({ status: 'already_paid', qr_code_token: reg.qr_code_token });
  }

  // Load event page for description
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('title')
    .eq('event_id', reg.event_id)
    .single();

  const { data: ticket } = reg.ticket_type_id
    ? await admin.from('ticket_types').select('name').eq('id', reg.ticket_type_id).single()
    : { data: null };

  // Charge via WaafiPay
  const result = await chargeWaafiPay({
    phoneNumber:  phone_number,
    amount:       reg.amount_paid,
    currency:     reg.currency as 'USD' | 'SOS' | 'DJF',
    referenceId:  reg.qr_code_token,
    description:  `${ticket?.name ?? 'Ticket'} — ${eventPage?.title ?? 'Event'}`,
  });

  if (result.success) {
    // Mark registration as paid — guarded flip returns a row only the first time.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: flipped } = await (admin as any)
      .from('registrations')
      .update({
        payment_status:  'paid',
        status:          'confirmed',
        flutterwave_tx_ref: result.transactionId, // reusing this column for WaafiPay tx ID
        updated_at:      new Date().toISOString(),
      })
      .eq('id', registration_id)
      .eq('payment_status', 'pending')
      .select('id')
      .maybeSingle();

    // Increment sold count only on the first pending→paid flip (prevents oversell + double-count).
    if (flipped && reg.ticket_type_id) {
      await admin.rpc('increment_ticket_quantity_sold', { ticket_id: reg.ticket_type_id!, qty: 1 });
    }

    return NextResponse.json({ status: 'paid', qr_code_token: reg.qr_code_token });
  }

  return NextResponse.json({
    status: 'failed',
    error:  result.errorCode ?? 'PAYMENT_FAILED',
    detail: result.errorMessage ?? 'Payment was declined. Please check your mobile money account.',
  }, { status: 402 });
}
