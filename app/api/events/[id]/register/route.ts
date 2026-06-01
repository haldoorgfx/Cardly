import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail } from '@/lib/registration/email';
import { createTicketPaymentIntent } from '@/lib/payments/stripe';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient();

  let body: {
    attendee_name: string;
    attendee_email: string;
    attendee_phone?: string;
    ticket_type_id: string;
    custom_fields?: Record<string, string>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { attendee_name, attendee_email, ticket_type_id, attendee_phone, custom_fields } = body;

  if (!attendee_name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!attendee_email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  if (!ticket_type_id) return NextResponse.json({ error: 'Ticket type is required' }, { status: 400 });

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
  if (!ticket.is_visible) return NextResponse.json({ error: 'Ticket type not available' }, { status: 400 });

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
  const isFree = ticket.price === 0;
  const { data: registration, error: regError } = await admin
    .from('registrations')
    .insert({
      event_id: params.id,
      ticket_type_id,
      attendee_name: attendee_name.trim(),
      attendee_email: attendee_email.trim().toLowerCase(),
      attendee_phone: attendee_phone?.trim() || null,
      custom_fields: custom_fields ?? {},
      status: isFree ? 'confirmed' : 'pending',
      payment_status: isFree ? 'free' : 'pending',
      amount_paid: isFree ? 0 : ticket.price,
      currency: ticket.currency,
      source: 'web',
    })
    .select()
    .single();

  if (regError) {
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

  // 8a. For paid tickets: create Stripe PaymentIntent
  if (!isFree) {
    let clientSecret: string | null = null;
    try {
      const amountInCents = Math.round(ticket.price * 100);
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
      amount: ticket.price,
      currency: ticket.currency,
      ticket_name: ticket.name,
    }, { status: 201 });
  }

  // 8b. Free ticket: send confirmation email (best-effort, non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com';
  const eventSlug = req.headers.get('x-event-slug') ?? params.id;
  sendRegistrationConfirmEmail({
    to: registration.attendee_email,
    attendeeName: registration.attendee_name,
    eventTitle: eventPage.title,
    eventDate: new Date(eventPage.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone }),
    eventVenue: eventPage.is_online ? 'Online' : (eventPage.venue_name ?? eventPage.venue_address ?? 'See event page'),
    qrCodeUrl: `${appUrl}/api/qr/${registration.qr_code_token}`,
    kartaCardUrl: null,
    eventSlug,
    ticketType: ticket.name,
  }).catch(() => { /* non-blocking */ });

  return NextResponse.json({
    registration_id: registration.id,
    qr_code_token: registration.qr_code_token,
    variant_id: variantId,
    event_id: params.id,
    payment_status: 'free',
    payment_required: false,
  }, { status: 201 });
}
