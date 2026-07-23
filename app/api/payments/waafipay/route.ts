import { NextRequest, NextResponse } from 'next/server';
import { chargeWaafiPay, type WaafiPayResult } from '@/lib/payments/waafipay';
import { createAdminClient } from '@/lib/supabase/server';
import { createNotification, notifyOrganizerNewRegistration } from '@/lib/notifications';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

// Called by WaafiPayStep after pending registration is created.
// Synchronous: WaafiPay responds immediately with success/failure.
export async function POST(req: NextRequest) {
  const { registration_id, qr_code_token, phone_number } = await req.json();

  if (!registration_id || !phone_number) {
    return NextResponse.json({ error: 'registration_id and phone_number required' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Load registration
  const { data: reg } = await admin
    .from('registrations')
    .select('id, qr_code_token, amount_paid, chosen_price, currency, event_id, ticket_type_id, payment_status, user_id, attendee_email, attendee_name')
    .eq('id', registration_id)
    .single();

  if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  // Ownership proof. This route was callable with nothing but a guessed
  // registration_id — no session is required anywhere in the checkout flow
  // (guests are first-class here), so there was no auth to check. Requiring
  // the registration's own qr_code_token as a companion value closes that:
  // it's a crypto.randomUUID()-strength secret (~122 bits) that only ever
  // reaches the person who just created THIS registration — WaafiPayStep
  // already holds it from that response and now sends it, so legitimate
  // guest checkout is unaffected. Abdalla's call, 2026-07-22: fix it rather
  // than accept the risk, since it costs nothing a real payer doesn't
  // already have in hand.
  if (reg.qr_code_token !== qr_code_token) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  if (reg.payment_status === 'paid') {
    return NextResponse.json({ status: 'already_paid', qr_code_token: reg.qr_code_token });
  }

  // Guard: amount must be positive (would indicate a free ticket flowing through the paid path)
  if (!reg.amount_paid || reg.amount_paid <= 0) {
    return NextResponse.json({ error: 'Invalid payment amount' }, { status: 422 });
  }

  // Cross-check: amount_paid must not exceed the maximum this registration could
  // legitimately owe. That ceiling is NOT plain ticket_types.price:
  //   • pay-what-you-want tickets carry price 0 and are charged chosen_price, so
  //     comparing against price rejected every PWYW payment outright;
  //   • fee_bearer = 'pass' adds the platform fee ON TOP of face value, so every
  //     pass-fee event had 100% of its WaafiPay (Somalia/Djibouti) sales 422'd.
  // Promo-discounted amounts are still caught, since they only ever go lower.
  if (reg.ticket_type_id) {
    const [{ data: ticketPrice }, { data: feeRow }] = await Promise.all([
      admin.from('ticket_types').select('price').eq('id', reg.ticket_type_id).single(),
      // Read defensively — these columns arrive with migration 040; a null row
      // just means "absorb", which is the pre-migration behaviour anyway.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (admin as any).from('registrations').select('platform_fee, fee_bearer').eq('id', reg.id).maybeSingle(),
    ]);
    if (ticketPrice) {
      const face = reg.chosen_price ?? ticketPrice.price;
      const ceiling = feeRow?.fee_bearer === 'pass'
        ? face + Number(feeRow.platform_fee ?? 0)
        : face;
      // Small tolerance so floating-point cents never reject a valid charge.
      if (reg.amount_paid > ceiling + 0.01) {
        return NextResponse.json({ error: 'Payment amount exceeds ticket price' }, { status: 422 });
      }
    }
  }

  // Load event page for description
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('title')
    .eq('event_id', reg.event_id)
    .single();

  const { data: ticket } = reg.ticket_type_id
    ? await admin.from('ticket_types').select('name, price').eq('id', reg.ticket_type_id).single()
    : { data: null };

  // Claim the registration before charging. WaafiPay debits a real wallet
  // synchronously, and the pending→paid flip only happens AFTER that charge
  // returns — so two concurrent requests for the same still-pending
  // registration (a double-tapped Pay button, a client retry after a
  // dropped response) both used to pass the payment_status==='paid' check
  // above and both call chargeWaafiPay, debiting the attendee twice for one
  // ticket. flutterwave_tx_ref is reused as the claim marker (same column
  // WaafiPay's own transaction id later overwrites it with) since it's
  // otherwise null for the whole pending lifetime of a registration.
  const claimMarker = `claiming:${crypto.randomUUID()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: claimed } = await (admin as any)
    .from('registrations')
    .update({ flutterwave_tx_ref: claimMarker, updated_at: new Date().toISOString() })
    .eq('id', registration_id)
    .eq('payment_status', 'pending')
    .is('flutterwave_tx_ref', null)
    .select('id')
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: 'PAYMENT_IN_PROGRESS', detail: 'A payment for this registration is already being processed.' }, { status: 409 });
  }

  // Charge via WaafiPay — wrap in try/catch so missing credentials return JSON, not a crash
  let result: WaafiPayResult;
  try {
    result = await chargeWaafiPay({
      phoneNumber:  phone_number,
      amount:       reg.amount_paid,
      currency:     reg.currency as 'USD' | 'SOS' | 'DJF',
      referenceId:  reg.qr_code_token,
      description:  `${ticket?.name ?? 'Ticket'} — ${eventPage?.title ?? 'Event'}`,
    });
  } catch (err) {
    // Release the claim so a genuine retry (network blip, expired credentials
    // fixed, etc.) isn't locked out forever by this failed attempt.
    await admin.from('registrations').update({ flutterwave_tx_ref: null }).eq('id', registration_id).eq('flutterwave_tx_ref', claimMarker);
    const detail = err instanceof Error ? err.message : 'WaafiPay service unavailable';
    return NextResponse.json({ error: 'PAYMENT_SERVICE_ERROR', detail }, { status: 503 });
  }

  if (!result.success) {
    // Declined, not paid — release the claim so the attendee can retry (a
    // different number, more balance, etc.) instead of being stuck forever.
    await admin.from('registrations').update({ flutterwave_tx_ref: null }).eq('id', registration_id).eq('flutterwave_tx_ref', claimMarker);
  }

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

    // In-app notification for the attendee — only on the first flip, only if they have an account.
    if (flipped && reg.user_id) {
      await createNotification({
        userId: reg.user_id,
        eventId: reg.event_id,
        type: 'ticket_confirmed',
        title: "You're in — ticket confirmed",
        body: `Your ticket for ${eventPage?.title ?? 'the event'} is ready.`,
        actionUrl: '/my-tickets',
      });
    }

    // Roles write-path: paid registration confirmed → 'attendee' role.
    // Only on the first pending→paid flip (guarded by `flipped`), best-effort.
    if (flipped) {
      const attendeeAccountId = reg.user_id
        ?? (await resolveAccountIdByEmail(reg.attendee_email));
      if (attendeeAccountId && reg.event_id) {
        await upsertEventRole({ userId: attendeeAccountId, eventId: reg.event_id, role: 'attendee' });
      }

      // Notify the organizer of the new (paid) registration. Guarded by the
      // pending→paid flip above, so it fires exactly once per ticket.
      const { data: ev } = await admin.from('events').select('user_id').eq('id', reg.event_id).maybeSingle();
      void notifyOrganizerNewRegistration({
        organizerId: ev?.user_id,
        eventId: reg.event_id,
        eventName: eventPage?.title ?? 'your event',
        attendeeName: reg.attendee_name,
      });
    }

    return NextResponse.json({ status: 'paid', qr_code_token: reg.qr_code_token });
  }

  return NextResponse.json({
    status: 'failed',
    error:  result.errorCode ?? 'PAYMENT_FAILED',
    detail: result.errorMessage ?? 'Payment was declined. Please check your mobile money account.',
  }, { status: 402 });
}
