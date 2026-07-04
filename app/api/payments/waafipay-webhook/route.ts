import { NextRequest, NextResponse } from 'next/server';
import { verifyWaafiPayWebhook } from '@/lib/payments/waafipay';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

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
    // Amount check — the signed payload carries the paid amount/currency.
    // Confirming on state alone would let an underpayment or wrong-currency
    // callback mark a paid ticket as confirmed. Compare to the registration's
    // expected amount_paid (1-unit tolerance for rounding).
    const paidAmount   = txInfo?.amount != null ? Number(txInfo.amount) : null;
    const paidCurrency = txInfo?.currency != null ? String(txInfo.currency) : null;
    const { data: expected } = await admin
      .from('registrations')
      .select('amount_paid, currency')
      .eq('qr_code_token', String(invoiceId))
      .eq('payment_status', 'pending')
      .maybeSingle();
    if (expected && (expected.amount_paid ?? 0) > 0) {
      if (paidAmount == null || Number.isNaN(paidAmount) || paidAmount < (expected.amount_paid as number) - 1) {
        console.error(`[WaafiPay webhook] amount mismatch for ${invoiceId}: got ${paidAmount}, expected ${expected.amount_paid}`);
        return NextResponse.json({ received: true });
      }
      if (expected.currency && paidCurrency && paidCurrency !== expected.currency) {
        console.error(`[WaafiPay webhook] currency mismatch for ${invoiceId}: got ${paidCurrency}, expected ${expected.currency}`);
        return NextResponse.json({ received: true });
      }
    }

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
      .select('id, attendee_name, attendee_email, event_id, ticket_type_id, qr_code_token, user_id')
      .maybeSingle();

    if (updated) {
      // First pending→paid flip only — increment sold count once.
      if (updated.ticket_type_id) {
        await admin.rpc('increment_ticket_quantity_sold', { ticket_id: updated.ticket_type_id, qty: 1 });
      }
      const [{ data: eventPage }, { data: ticket }] = await Promise.all([
        admin.from('event_pages').select('title, starts_at, timezone, venue_name, venue_address, is_online').eq('event_id', updated.event_id).single(),
        admin.from('ticket_types').select('name').eq('id', updated.ticket_type_id ?? '').single(),
      ]);
      if (eventPage) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
        const { data: event } = await admin.from('events').select('slug').eq('id', updated.event_id).single();
        sendRegistrationConfirmEmail({
          to: updated.attendee_email,
          attendeeName: updated.attendee_name,
          eventTitle: eventPage.title,
          eventDate: new Date(eventPage.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? 'UTC' }),
          eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
          qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
          eventeraCardUrl: null,
          eventSlug: event?.slug ?? updated.event_id,
          ticketType: ticket?.name ?? 'General Admission',
        }).catch(() => { /* non-blocking */ });
      }

      // Roles write-path: paid registration confirmed → 'attendee' role (best-effort).
      const attendeeAccountId = updated.user_id
        ?? (await resolveAccountIdByEmail(updated.attendee_email));
      if (attendeeAccountId && updated.event_id) {
        await upsertEventRole({ userId: attendeeAccountId, eventId: updated.event_id, role: 'attendee' });
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
