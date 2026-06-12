import { NextRequest, NextResponse } from 'next/server';
import { verifyWaafiPayWebhook } from '@/lib/payments/waafipay';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';

// WaafiPay async callback — handles post-payment confirmations and reversals.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-waafipay-signature');

  if (!verifyWaafiPayWebhook(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const params      = body?.params as Record<string, unknown> | undefined;
  const issuer      = params?.issuer as Record<string, unknown> | undefined;
  const txInfo      = params?.transactionInfo as Record<string, unknown> | undefined;
  const state       = params?.state ?? body?.responseCode;
  const invoiceId   = txInfo?.invoiceId ?? body?.invoiceId;
  const txId        = issuer?.TXNID ?? body?.transactionId;

  if (!invoiceId) return NextResponse.json({ received: true });

  const admin = createAdminClient();

  if (state === 'APPROVED' || state === '2001') {
    const { data: updated } = await admin
      .from('registrations')
      .update({
        payment_status:     'paid',
        status:             'confirmed',
        flutterwave_tx_ref: String(txId ?? ''),
        updated_at:         new Date().toISOString(),
      })
      .eq('qr_code_token', String(invoiceId))
      .eq('payment_status', 'pending')
      .select('id, attendee_name, attendee_email, event_id, ticket_type_id, qr_code_token')
      .single();

    if (updated) {
      const [{ data: eventPage }, { data: ticket }] = await Promise.all([
        admin.from('event_pages').select('title, starts_at, timezone, venue_name, venue_address, is_online').eq('event_id', updated.event_id).single(),
        admin.from('ticket_types').select('name').eq('id', updated.ticket_type_id ?? '').single(),
      ]);
      if (eventPage) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
        const { data: event } = await admin.from('events').select('slug').eq('id', updated.event_id).single();
        sendRegistrationConfirmEmail({
          to: updated.attendee_email,
          attendeeName: updated.attendee_name,
          eventTitle: eventPage.title,
          eventDate: new Date(eventPage.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? 'UTC' }),
          eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
          qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
          kartaCardUrl: null,
          eventSlug: event?.slug ?? updated.event_id,
          ticketType: ticket?.name ?? 'General Admission',
        }).catch(() => { /* non-blocking */ });
      }
    }
  } else if (state === 'DECLINED' || state === 'FAILED') {
    await admin
      .from('registrations')
      .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
      .eq('qr_code_token', String(invoiceId))
      .eq('payment_status', 'pending');
  }

  return NextResponse.json({ received: true });
}
