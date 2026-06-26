import { NextRequest, NextResponse } from 'next/server';
import { getTicketStripe } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';

// Called by the confirm page after Stripe redirect to verify payment and mark registration as paid.
// Idempotent — safe to call multiple times (webhook may have already done the update).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const { payment_intent_id, qr_code_token } = body;
  if (!payment_intent_id || !qr_code_token) {
    return NextResponse.json({ error: 'payment_intent_id and qr_code_token required' }, { status: 400 });
  }

  // Verify with Stripe
  const stripe = getTicketStripe();
  const pi = await stripe.paymentIntents.retrieve(payment_intent_id);

  const admin = createAdminClient();

  if (pi.status === 'succeeded') {
    const { data: updated } = await admin
      .from('registrations')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('qr_code_token', qr_code_token)
      .eq('stripe_payment_intent_id', payment_intent_id) // ensure PI belongs to this registration
      .in('payment_status', ['pending']) // only update pending rows (idempotent)
      .select('id, attendee_name, attendee_email, event_id, ticket_type_id, qr_code_token')
      .single();

    // Send confirmation email if we just transitioned (not already confirmed)
    if (updated) {
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
    }

    return NextResponse.json({ status: 'succeeded' });
  }

  if (pi.status === 'processing') {
    return NextResponse.json({ status: 'processing' });
  }

  return NextResponse.json({ status: pi.status });
}
