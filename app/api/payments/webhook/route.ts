import { NextRequest, NextResponse } from 'next/server';
import { constructTicketWebhookEvent } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';

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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error } = await (admin as any)
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_payment_intent_id', pi.id)
        .eq('payment_status', 'pending') // idempotent guard
        .select('attendee_name, attendee_email, qr_code_token, ticket_types(name), events!inner(slug, event_pages(title, starts_at, venue_name, is_online))')
        .maybeSingle();
      if (error) console.error('[Stripe webhook] update failed:', error.message);
      if (updated) {
        const ep = updated.events?.event_pages?.[0];
        sendRegistrationConfirmEmail({
          to: updated.attendee_email,
          attendeeName: updated.attendee_name,
          eventTitle: ep?.title ?? '',
          eventDate: ep?.starts_at ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
          eventVenue: ep?.is_online ? 'Online' : (ep?.venue_name ?? 'Venue TBA'),
          qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
          kartaCardUrl: null,
          eventSlug: updated.events?.slug ?? '',
          ticketType: updated.ticket_types?.name ?? 'Ticket',
        }).catch(() => {});
      }
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
