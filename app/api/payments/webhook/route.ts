import { NextRequest, NextResponse } from 'next/server';
import { constructTicketWebhookEvent } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';
import { createNotification, notifyOrganizerNewRegistration } from '@/lib/notifications';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { onRegistrationConfirmed } from '@/lib/integrations/dispatch';
import { fromStripeMinorUnits } from '@/lib/payments/currency';

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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
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
        .select('attendee_name, attendee_email, attendee_phone, qr_code_token, ticket_type_id, user_id, event_id, ticket_types(name), events!inner(slug, user_id, event_pages(title, starts_at, venue_name, is_online))')
        .maybeSingle();
      if (error) {
        // The customer's card HAS been charged at this point. Returning 200 here
        // told Stripe "handled" and it never retried, leaving a paid charge with
        // a registration stuck on 'pending' — no ticket, no email, no alert.
        // A non-2xx puts the event back on Stripe's retry schedule instead.
        console.error('[Stripe webhook] update failed:', error.message);
        return NextResponse.json({ error: 'Registration update failed' }, { status: 500 });
      }
      if (updated) {
        // Only the first pending→paid transition returns a row, so this
        // increment runs exactly once per paid ticket (prevents overselling).
        if (updated.ticket_type_id) {
          await admin.rpc('increment_ticket_quantity_sold', { ticket_id: updated.ticket_type_id, qty: 1 });
        }
        const ep = updated.events?.event_pages?.[0];
        if (updated.events?.user_id) {
          void onRegistrationConfirmed(updated.events.user_id, {
            eventName: ep?.title ?? '',
            eventSlug: updated.events?.slug ?? '',
            attendeeName: updated.attendee_name,
            attendeeEmail: updated.attendee_email,
            attendeePhone: updated.attendee_phone ?? null,
            ticketType: updated.ticket_types?.name ?? null,
            // Zero-decimal currencies (DJF, UGX, RWF, XOF, XAF …) are already in
            // the major unit — a blanket /100 reported a DJF 5,000 sale to the
            // organizer's integrations as DJF 50.
            amountPaid: typeof pi.amount === 'number' ? fromStripeMinorUnits(pi.amount, pi.currency) : null,
            currency: pi.currency ? pi.currency.toUpperCase() : null,
            registeredAt: new Date().toISOString(),
          });
          // Notify the organizer of the new (paid) registration. Guarded by the
          // pending→paid flip above, so it fires exactly once per ticket.
          void notifyOrganizerNewRegistration({
            organizerId: updated.events.user_id,
            eventId: updated.event_id,
            eventName: ep?.title ?? '',
            attendeeName: updated.attendee_name,
          });
        }
        // Awaited: on serverless the function can be frozen the moment the
        // response returns, so a fire-and-forget send is dropped and the
        // attendee never receives their ticket. .catch still keeps a mail
        // failure from breaking the webhook.
        await sendRegistrationConfirmEmail({
          to: updated.attendee_email,
          attendeeName: updated.attendee_name,
          eventTitle: ep?.title ?? '',
          eventDate: ep?.starts_at ? new Date(ep.starts_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '',
          eventVenue: ep?.is_online ? 'Online' : (ep?.venue_name ?? 'Venue TBA'),
          qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
          eventeraCardUrl: null, eventId: updated.event_id,
          eventSlug: updated.events?.slug ?? '',
          ticketType: updated.ticket_types?.name ?? 'Ticket',
        }).catch(() => {});

        // In-app notification for the attendee (only if they have an account)
        if (updated.user_id) {
          await createNotification({
            userId: updated.user_id,
            eventId: updated.event_id,
            type: 'ticket_confirmed',
            title: "You're in — ticket confirmed",
            body: `Your ticket for ${ep?.title ?? 'the event'} is ready.`,
            actionUrl: '/my-tickets',
          });
        }

        // Roles write-path: paid registration confirmed → 'attendee' role.
        // Best-effort; uses the account id when present, else matches by email.
        const attendeeAccountId = updated.user_id
          ?? (await resolveAccountIdByEmail(updated.attendee_email));
        if (attendeeAccountId && updated.event_id) {
          await upsertEventRole({ userId: attendeeAccountId, eventId: updated.event_id, role: 'attendee' });
        }
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

    case 'charge.refunded': {
      // Mark registration as refunded when Stripe processes a refund
      const charge = event.data.object as {
        payment_intent?: string | null;
        refunded?: boolean;
        amount?: number;
        amount_refunded?: number;
      };
      // Stripe fires charge.refunded for PARTIAL refunds too. Voiding the ticket
      // and releasing the seat on a partial refund meant a small goodwill refund
      // silently cancelled an attendee who had paid most of the price and still
      // intended to attend. Only a full refund voids the registration.
      const fullyRefunded = charge.refunded === true
        || (typeof charge.amount === 'number'
            && typeof charge.amount_refunded === 'number'
            && charge.amount_refunded >= charge.amount);
      if (charge.payment_intent && fullyRefunded) {
        // The .in(status) guard doubles as the idempotency key: a replayed
        // refund webhook matches zero rows the second time, so the seat is
        // returned exactly once.
        const refundPatch = { status: 'refunded', payment_status: 'refunded', updated_at: new Date().toISOString() };

        // Split by prior status. quantity_sold is only incremented on the
        // pending→confirmed flip, so a registration refunded while still
        // 'pending' never held a seat — decrementing for it would undercount
        // the ticket type and let the event oversell by one.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: refundedRows } = await (admin as any)
          .from('registrations')
          .update(refundPatch)
          .eq('stripe_payment_intent_id', charge.payment_intent)
          .in('status', ['confirmed', 'checked_in'])
          .select('id, ticket_type_id');

        // Still-pending rows: mark refunded, but hold the counter steady.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any)
          .from('registrations')
          .update(refundPatch)
          .eq('stripe_payment_intent_id', charge.payment_intent)
          .eq('status', 'pending');

        // Give the seat back. Without this a refunded ticket held its slot
        // forever and the event silently under-sold against max capacity.
        for (const r of (refundedRows ?? []) as { ticket_type_id: string | null }[]) {
          if (r.ticket_type_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (admin as any).rpc('decrement_ticket_quantity_sold', {
              ticket_id: r.ticket_type_id,
              qty: 1,
            });
          }
        }
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
