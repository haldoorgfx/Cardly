import { NextRequest, NextResponse } from 'next/server';
import { verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';

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
      const { data: updated } = await admin
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          amount_paid: amount ?? 0,
          currency: currency ?? 'USD',
          updated_at: new Date().toISOString(),
        })
        .eq('qr_code_token', tx_ref)
        .in('payment_status', ['pending', 'free']) // idempotent
        .select('id, attendee_name, attendee_email, event_id, ticket_type_id, qr_code_token')
        .single();

      if (updated) {
        const [{ data: eventPage }, { data: ticket }] = await Promise.all([
          admin.from('event_pages').select('title, starts_at, timezone, venue_name, venue_address, is_online').eq('event_id', updated.event_id).single(),
          admin.from('ticket_types').select('name').eq('id', updated.ticket_type_id).single(),
        ]);
        if (eventPage) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
          const { data: event } = await admin.from('events').select('slug').eq('id', updated.event_id).single();
          sendRegistrationConfirmEmail({
            to: updated.attendee_email,
            attendeeName: updated.attendee_name,
            eventTitle: eventPage.title,
            eventDate: new Date(eventPage.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? 'UTC' }),
            eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
            qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
            kartaCardUrl: null,
            eventSlug: event?.slug ?? updated.event_id,
            ticketType: ticket?.name ?? 'General Admission',
          }).catch(() => { /* non-blocking */ });
        }
      }

      return NextResponse.json({ status: 'successful' });
    }

    return NextResponse.json({ status: status ?? 'failed' });
  } catch (err) {
    console.error('[FW confirm]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
