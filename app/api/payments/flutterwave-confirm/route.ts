import { NextRequest, NextResponse } from 'next/server';
import { verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';
import { createNotification, notifyOrganizerNewRegistration } from '@/lib/notifications';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';
import { onRegistrationConfirmed } from '@/lib/integrations/dispatch';

// Called by the confirm page on Flutterwave redirect return.
// tx_ref = qr_code_token. Verifies the transaction and marks registration paid.
export async function POST(req: NextRequest) {
  const { transaction_id, tx_ref } = await req.json();
  if (!tx_ref) return NextResponse.json({ error: 'tx_ref required' }, { status: 400 });

  try {
    const verification = await verifyFlutterwaveTransaction(transaction_id ?? tx_ref);
    const { status, amount, currency, tx_ref: verifiedRef } = verification.data ?? {};

    // SECURITY: `transaction_id` is supplied by the (unauthenticated) client.
    // Without binding the VERIFIED transaction back to this registration's
    // reference, anyone could pair ANY successful transaction on the merchant
    // account — including their own cheap one — with someone else's
    // qr_code_token and have it marked paid (the amount check below would be
    // comparing the other transaction's amount). Require an exact tx_ref match.
    if (!verifiedRef || verifiedRef !== tx_ref) {
      console.error('[FW confirm] tx_ref mismatch', { claimed: tx_ref, verified: verifiedRef ?? null });
      return NextResponse.json(
        { error: 'This transaction does not match the registration' },
        { status: 422 },
      );
    }

    const admin = createAdminClient();

    if (status === 'successful') {
      // Verify amount matches what was expected — prevents under-payment attacks.
      // Load the registration + ticket to get the expected price before confirming.
      const { data: reg } = await admin
        .from('registrations')
        .select('id, ticket_type_id, amount_paid')
        .eq('qr_code_token', tx_ref)
        .eq('payment_status', 'pending')
        .maybeSingle();

      // Compare against reg.amount_paid (the discounted amount we expected to charge),
      // not ticket.price (full price) — otherwise valid promo-discounted payments fail.
      // Allow 1-unit tolerance for currency rounding differences.
      if (reg && reg.amount_paid > 0 && amount != null && amount < reg.amount_paid - 1) {
        console.error(`[FW confirm] Amount mismatch: got ${amount}, expected ${reg.amount_paid}`);
        return NextResponse.json({ error: 'Payment amount does not match the expected amount' }, { status: 422 });
      }

      // amount/currency are deliberately NOT overwritten — the registration
      // row already holds the authoritative charged amount (validated above);
      // a missing gateway field must never zero it or flip the currency.
      const { data: updated } = await admin
        .from('registrations')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('qr_code_token', tx_ref)
        .eq('payment_status', 'pending') // idempotent — only flip a genuinely pending payment
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
          const { data: event } = await admin.from('events').select('slug, user_id').eq('id', updated.event_id).single();
          if (event?.user_id) {
            void onRegistrationConfirmed(event.user_id, {
              eventName: eventPage.title,
              eventSlug: event.slug ?? updated.event_id,
              attendeeName: updated.attendee_name,
              attendeeEmail: updated.attendee_email,
              attendeePhone: null,
              ticketType: ticket?.name ?? null,
              amountPaid: amount ?? null,
              currency: currency ?? null,
              registeredAt: new Date().toISOString(),
            });
            // Notify the organizer of the new (paid) registration. Guarded by the
            // pending→paid flip above, so it fires exactly once per ticket.
            void notifyOrganizerNewRegistration({
              organizerId: event.user_id,
              eventId: updated.event_id,
              eventName: eventPage.title,
              attendeeName: updated.attendee_name,
            });
          }
          // Awaited so the ticket email isn't dropped when the serverless
          // function freezes on response (see Stripe webhook).
          await sendRegistrationConfirmEmail({
            to: updated.attendee_email,
            attendeeName: updated.attendee_name,
            eventTitle: eventPage.title,
            eventDate: new Date(eventPage.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? 'UTC' }),
            eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
            qrCodeUrl: `${appUrl}/api/qr/${updated.qr_code_token}`,
            eventeraCardUrl: null, eventId: updated.event_id,
            eventSlug: event?.slug ?? updated.event_id,
            ticketType: ticket?.name ?? 'General Admission',
          }).catch(() => { /* non-blocking */ });
        }

        // In-app notification for the attendee (only if they have an account)
        if (updated.user_id) {
          await createNotification({
            userId: updated.user_id,
            eventId: updated.event_id,
            type: 'ticket_confirmed',
            title: "You're in — ticket confirmed",
            body: `Your ticket for ${eventPage?.title ?? 'the event'} is ready.`,
            actionUrl: '/my-tickets',
          });
        }

        // Roles write-path: paid registration confirmed → 'attendee' role (best-effort).
        const attendeeAccountId = updated.user_id
          ?? (await resolveAccountIdByEmail(updated.attendee_email));
        if (attendeeAccountId && updated.event_id) {
          await upsertEventRole({ userId: attendeeAccountId, eventId: updated.event_id, role: 'attendee' });
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
