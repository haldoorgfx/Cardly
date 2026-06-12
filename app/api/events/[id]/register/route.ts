import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail, sendPendingApprovalEmail } from '@/lib/registration/email';
import { createTicketPaymentIntent } from '@/lib/payments/stripe';
import { initFlutterwavePayment, isFlutterwaveCurrency, type FlutterwaveCurrency } from '@/lib/payments/flutterwave';
import { isWaafiPayCurrency } from '@/lib/payments/waafipay';
import { z } from 'zod';

// ── Input validation ──────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  attendee_name:   z.string().min(1, 'Name is required').max(200, 'Name must be 200 characters or less').trim(),
  attendee_email:  z.string().min(1, 'Email is required').max(254, 'Email is too long').email('Please enter a valid email address').transform(v => v.toLowerCase()),
  attendee_phone:  z.string().max(30, 'Phone number is too long').trim().optional().nullable(),
  ticket_type_id:  z.string().uuid('Invalid ticket type'),
  custom_fields:   z.record(z.string().max(100), z.string().max(2000)).optional().default({}),
  // PWYW — attendee's chosen price (used when ticket has min_price set)
  chosen_price:    z.number().min(0).optional(),
  // Access code — unlocks hidden tickets
  access_code:     z.string().max(100).optional(),
  // Attribution
  referral_code:   z.string().max(64).optional().nullable(),
  utm_source:      z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();

  // Capture attendee user_id if they're logged in (optional — guests register without an account)
  let attendeeUserId: string | null = null;
  try {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) attendeeUserId = user.id;
  } catch { /* not authenticated — fine */ }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { attendee_name, attendee_email, ticket_type_id, attendee_phone, custom_fields, chosen_price, access_code, referral_code, utm_source } = parsed.data;

  // 1. Verify event has a public event_page
  const { data: eventPage } = await admin
    .from('event_pages')
    .select('id, event_id, title, starts_at, ends_at, timezone, venue_name, venue_address, is_online, variant_id, organizer_name, registration_deadline, max_capacity')
    .eq('event_id', params.id)
    .eq('is_public', true)
    .single();

  if (!eventPage) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // 2. Check registration deadline
  if (eventPage.registration_deadline && new Date(eventPage.registration_deadline) < new Date()) {
    return NextResponse.json({ error: 'Registration has closed' }, { status: 400 });
  }

  // 3. Verify ticket type
  const { data: ticket } = await admin
    .from('ticket_types')
    .select('*')
    .eq('id', ticket_type_id)
    .eq('event_id', params.id)
    .single();

  if (!ticket) return NextResponse.json({ error: 'Ticket type not found' }, { status: 404 });

  // Access code check: hidden tickets require a matching code
  if (!ticket.is_visible) {
    if (!ticket.access_code) return NextResponse.json({ error: 'Ticket type not available' }, { status: 400 });
    if (access_code !== ticket.access_code) return NextResponse.json({ error: 'Invalid access code' }, { status: 403 });
  }

  // PWYW validation
  const isPayWhatYouWant = ticket.min_price !== null && ticket.min_price > 0;
  if (isPayWhatYouWant) {
    if (chosen_price === undefined || chosen_price === null) {
      return NextResponse.json({ error: 'Please enter an amount' }, { status: 400 });
    }
    if (chosen_price < ticket.min_price!) {
      return NextResponse.json({ error: `Minimum amount is ${ticket.currency} ${ticket.min_price}` }, { status: 400 });
    }
  }
  const effectivePrice = isPayWhatYouWant ? (chosen_price ?? ticket.price) : ticket.price;

  const now = new Date();
  if (ticket.sales_start && new Date(ticket.sales_start) > now) {
    return NextResponse.json({ error: 'Ticket sales have not started yet' }, { status: 400 });
  }
  if (ticket.sales_end && new Date(ticket.sales_end) < now) {
    return NextResponse.json({ error: 'Ticket sales have ended' }, { status: 400 });
  }
  if (ticket.quantity !== null && ticket.quantity_sold >= ticket.quantity) {
    return NextResponse.json({ error: 'TICKET_SOLD_OUT', detail: 'This ticket is sold out' }, { status: 409 });
  }

  // 4. Check overall event capacity
  if (eventPage.max_capacity) {
    const { count } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', params.id)
      .in('status', ['confirmed', 'checked_in']);

    if ((count ?? 0) >= eventPage.max_capacity) {
      return NextResponse.json({ error: 'EVENT_FULL', detail: 'This event is at capacity' }, { status: 409 });
    }
  }

  // 5. Create registration
  const isFree = effectivePrice === 0;
  const { data: eventRow } = await admin.from('events').select('checkout_require_approval').eq('id', params.id).single();
  const requiresApproval = !!eventRow?.checkout_require_approval && isFree;
  const initialStatus = requiresApproval ? 'pending_approval' : isFree ? 'confirmed' : 'pending';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: registration, error: regError } = await (admin as any)
    .from('registrations')
    .insert({
      event_id: params.id,
      ticket_type_id,
      attendee_name: attendee_name.trim(),
      attendee_email: attendee_email.trim().toLowerCase(),
      attendee_phone: attendee_phone?.trim() || null,
      custom_fields: custom_fields ?? {},
      referral_code: referral_code ? referral_code.toUpperCase() : null,
      utm_source: utm_source ?? null,
      chosen_price: isPayWhatYouWant ? (chosen_price ?? null) : null,
      user_id: attendeeUserId,
      status: initialStatus,
      payment_status: isFree ? 'free' : 'pending',
      amount_paid: isFree ? 0 : effectivePrice,
      currency: ticket.currency,
      source: 'web',
    })
    .select()
    .single();

  if (regError) {
    if (regError.code === '23505') {
      return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 409 });
    }
    return NextResponse.json({ error: regError.message }, { status: 500 });
  }

  // 6. Atomically increment ticket quantity sold (free tickets only — paid increment after payment)
  if (ticket.quantity !== null && isFree) {
    const { error: incrError } = await admin.rpc('increment_ticket_quantity_sold', {
      ticket_id: ticket_type_id,
      qty: 1,
    });
    if (incrError) {
      await admin.from('registrations').delete().eq('id', registration.id);
      return NextResponse.json({ error: 'TICKET_SOLD_OUT', detail: 'This ticket just sold out' }, { status: 409 });
    }
  }

  // 7. Determine variant for card personalization
  let variantId = eventPage.variant_id;
  if (!variantId) {
    const { data: firstVariant } = await admin
      .from('event_variants')
      .select('id')
      .eq('event_id', params.id)
      .order('position')
      .limit(1)
      .single();
    variantId = firstVariant?.id ?? null;
  }

  // 8a. For paid tickets: route to correct payment processor
  const processor = (eventPage as { payment_processor?: string }).payment_processor ?? 'stripe';

  // Determine processor by event setting AND currency compatibility
  const effectiveProcessor = (() => {
    if (isFree) return 'free';
    if (processor === 'flutterwave' || isFlutterwaveCurrency(ticket.currency)) return 'flutterwave';
    if (processor === 'waafipay' || isWaafiPayCurrency(ticket.currency)) return 'waafipay';
    return 'stripe';
  })();

  if (!isFree && effectiveProcessor === 'flutterwave') {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
      const eventSlugHdr = req.headers.get('x-event-slug') ?? params.id;
      const fwResult = await initFlutterwavePayment({
        amount:        effectivePrice,
        currency:      ticket.currency as FlutterwaveCurrency,
        txRef:         registration.qr_code_token,
        customerEmail: registration.attendee_email,
        customerName:  registration.attendee_name,
        customerPhone: registration.attendee_phone ?? undefined,
        redirectUrl:   `${appUrl}/e/${eventSlugHdr}/register/confirm?reg=${registration.qr_code_token}&processor=flutterwave`,
        meta: { registration_id: registration.id, event_id: params.id },
      });
      return NextResponse.json({
        registration_id:   registration.id,
        qr_code_token:     registration.qr_code_token,
        variant_id:        variantId,
        event_id:          params.id,
        payment_status:    'pending',
        payment_required:  true,
        payment_processor: 'flutterwave',
        redirect_url:      fwResult.link,
      }, { status: 201 });
    } catch (err) {
      await admin.from('registrations').delete().eq('id', registration.id);
      return NextResponse.json({ error: 'Flutterwave setup failed', detail: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
    }
  }

  if (!isFree && effectiveProcessor === 'waafipay') {
    // WaafiPay: registration created; client collects phone number and charges inline
    return NextResponse.json({
      registration_id:   registration.id,
      qr_code_token:     registration.qr_code_token,
      variant_id:        variantId,
      event_id:          params.id,
      payment_status:    'pending',
      payment_required:  true,
      payment_processor: 'waafipay',
      amount:            effectivePrice,
      currency:          ticket.currency,
      ticket_name:       ticket.name,
    }, { status: 201 });
  }

  if (!isFree) {
    let clientSecret: string | null = null;
    try {
      const amountInCents = Math.round(effectivePrice * 100);
      const pi = await createTicketPaymentIntent({
        amount: amountInCents,
        currency: ticket.currency,
        registrationId: registration.id,
        eventId: params.id,
        attendeeEmail: registration.attendee_email,
      });
      clientSecret = pi.client_secret;
      // Save PI id to registration
      await admin
        .from('registrations')
        .update({ stripe_payment_intent_id: pi.id })
        .eq('id', registration.id);
    } catch (err) {
      // Clean up pending registration if PI creation fails
      await admin.from('registrations').delete().eq('id', registration.id);
      return NextResponse.json({ error: 'Payment setup failed', detail: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }

    return NextResponse.json({
      registration_id: registration.id,
      qr_code_token: registration.qr_code_token,
      variant_id: variantId,
      event_id: params.id,
      payment_status: 'pending',
      payment_required: true,
      client_secret: clientSecret,
      amount: effectivePrice,
      currency: ticket.currency,
      ticket_name: ticket.name,
    }, { status: 201 });
  }

  // 8b. Free ticket: send appropriate email (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
  const eventSlug = req.headers.get('x-event-slug') ?? params.id;
  const eventDateStr = eventPage.starts_at
    ? new Date(eventPage.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? undefined })
    : '';

  if (requiresApproval) {
    sendPendingApprovalEmail({
      to: registration.attendee_email,
      name: registration.attendee_name,
      eventTitle: eventPage.title,
      eventSlug,
      eventDate: eventDateStr,
    }).catch(() => {});
  } else {
    sendRegistrationConfirmEmail({
      to: registration.attendee_email,
      attendeeName: registration.attendee_name,
      eventTitle: eventPage.title,
      eventDate: eventDateStr,
      eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
      qrCodeUrl: `${appUrl}/api/qr/${registration.qr_code_token}`,
      kartaCardUrl: null,
      eventSlug,
      ticketType: ticket.name,
    }).catch(() => {});
  }

  return NextResponse.json({
    registration_id: registration.id,
    qr_code_token: registration.qr_code_token,
    variant_id: variantId,
    event_id: params.id,
    payment_status: 'free',
    payment_required: false,
  }, { status: 201 });
}
