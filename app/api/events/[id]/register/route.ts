import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmEmail, sendPendingApprovalEmail } from '@/lib/registration/email';
import { createTicketPaymentIntent } from '@/lib/payments/stripe';
import { initFlutterwavePayment, isFlutterwaveCurrency, type FlutterwaveCurrency } from '@/lib/payments/flutterwave';
import { isWaafiPayCurrency } from '@/lib/payments/waafipay';
import { splitTicketAmount, type FeeBearer } from '@/lib/billing/fees';
import type { Plan } from '@/lib/billing/plans';
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
  // Promo / discount code
  promo_code:      z.string().max(64).optional().nullable(),
  // Attribution
  referral_code:      z.string().max(64).optional().nullable(),
  utm_source:         z.string().max(100).optional().nullable(),
  // Attendee's chosen payment method (when organizer enables multiple)
  preferred_processor: z.enum(['stripe', 'flutterwave', 'waafipay']).optional().nullable(),
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

  const { attendee_name, attendee_email, ticket_type_id, attendee_phone, custom_fields, chosen_price, access_code, referral_code, utm_source, promo_code, preferred_processor } = parsed.data;

  // 1. Verify event exists and is publicly accessible.
  //    Accept if events.status = 'published' OR event_pages.is_public = true —
  //    these two fields can drift out of sync (e.g. published via the page route
  //    without updating events.status, or vice-versa).
  const [evResult, epResult] = await Promise.all([
    admin
      .from('events')
      .select('id, status, checkout_require_approval, user_id')
      .eq('id', params.id)
      .single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('event_pages')
      .select('id, event_id, title, starts_at, ends_at, timezone, venue_name, venue_address, is_online, variant_id, organizer_name, registration_deadline, max_capacity, payment_processor, payment_processors, is_public')
      .eq('event_id', params.id)
      .maybeSingle(),
  ]);

  const evRow = evResult.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventPage = epResult.data as any;

  const isPublished = evRow?.status === 'published';
  const isPagePublic = !!eventPage?.is_public;

  if (!evRow || (!isPublished && !isPagePublic)) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

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

  // 3b. Validate promo code (server-authoritative) and compute discount
  let promoDiscount = 0;
  let appliedPromo: { id: string; uses_count: number; max_uses: number | null } | null = null;
  if (promo_code && promo_code.trim() && effectivePrice > 0) {
    const { data: promo } = await admin
      .from('promo_codes')
      .select('id, discount_type, discount_value, max_uses, uses_count, valid_from, valid_until')
      .eq('event_id', params.id)
      .eq('code', promo_code.trim().toUpperCase())
      .single();
    if (!promo) return NextResponse.json({ error: 'That promo code isn’t valid for this event.' }, { status: 400 });
    const nowD = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > nowD)
      return NextResponse.json({ error: 'This promo code isn’t active yet.' }, { status: 400 });
    if (promo.valid_until && new Date(promo.valid_until) < nowD)
      return NextResponse.json({ error: 'This promo code has expired.' }, { status: 400 });
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses)
      return NextResponse.json({ error: 'This promo code has reached its usage limit.' }, { status: 400 });
    promoDiscount = promo.discount_type === 'percent'
      ? Math.min(effectivePrice, (effectivePrice * Number(promo.discount_value)) / 100)
      : Math.min(effectivePrice, Number(promo.discount_value));
    promoDiscount = Math.round(promoDiscount * 100) / 100;
    appliedPromo = { id: promo.id, uses_count: promo.uses_count, max_uses: promo.max_uses };
  }
  const chargedPrice = Math.max(0, Math.round((effectivePrice - promoDiscount) * 100) / 100);

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

  // 5. Guard against duplicate registrations:
  //    - confirmed / checked_in / pending_approval → already registered, reject
  //    - pending + pending payment → stale abandoned attempt; delete and allow retry
  type ExistingReg = { id: string; status: string; payment_status: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingReg } = await (admin as any)
    .from('registrations')
    .select('id, status, payment_status')
    .eq('event_id', params.id)
    .eq('attendee_email', attendee_email)
    .maybeSingle() as { data: ExistingReg | null };

  if (existingReg) {
    const { status: exStatus, payment_status: exPayStatus, id: exId } = existingReg;
    if (['confirmed', 'checked_in'].includes(exStatus)) {
      // Truly completed — block re-registration
      return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 409 });
    }
    // Any other status (pending payment, pending_approval, cancelled, etc.)
    // is considered a stale or incomplete attempt — delete it and allow a fresh start
    if (['pending', 'pending_approval', 'cancelled'].includes(exStatus) ||
        (exPayStatus !== 'paid' && exPayStatus !== 'free')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('registrations').delete().eq('id', exId);
    }
  }

  // Create registration (isFree reflects the amount actually charged — a
  // 100%-off promo makes the ticket free and skips payment entirely)
  const isFree = chargedPrice === 0;
  // requiresApproval applies to ALL tickets — not just free ones. For paid tickets
  // this means the registration is created as pending_approval and no payment is
  // initiated. The organizer approves; the attendee is notified separately.
  const requiresApproval = !!evRow.checkout_require_approval;
  const initialStatus = requiresApproval ? 'pending_approval' : isFree ? 'confirmed' : 'pending';

  // Platform fee (paid tickets only). The split depends on the organizer's plan
  // (Studio = 0%) and who bears the fee. organizer_net = charged − platform_fee.
  // fee_bearer is read defensively so this works before migration 040 is applied.
  let feeBearer: FeeBearer = 'absorb';
  let organizerPlan: Plan = 'free';
  if (!isFree) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fb } = await (admin as any).from('events').select('fee_bearer').eq('id', params.id).single();
    if (fb?.fee_bearer === 'pass') feeBearer = 'pass';
    if (evRow.user_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: orgProfile } = await (admin as any).from('profiles').select('plan').eq('id', evRow.user_id).single();
      organizerPlan = (orgProfile?.plan as Plan) ?? 'free';
    }
  }
  const split = isFree
    ? { charged: 0, platformFee: 0, organizerNet: 0 }
    : splitTicketAmount(chargedPrice, organizerPlan, feeBearer);

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
      amount_paid: isFree ? 0 : split.charged,
      currency: ticket.currency,
      source: 'web',
    })
    .select()
    .single();

  if (regError) {
    if (regError.code === '23505') {
      // Race condition: another request confirmed between our check and insert
      return NextResponse.json({ error: 'You are already registered for this event.' }, { status: 409 });
    }
    return NextResponse.json({ error: regError.message }, { status: 500 });
  }

  // Count the promo redemption (guarded against the usage cap so it can't exceed max_uses)
  if (appliedPromo) {
    let upd = admin.from('promo_codes')
      .update({ uses_count: appliedPromo.uses_count + 1 })
      .eq('id', appliedPromo.id);
    if (appliedPromo.max_uses !== null) upd = upd.lt('uses_count', appliedPromo.max_uses);
    await upd;
  }

  // Record the platform-fee split (best-effort — the columns exist after
  // migration 040; before that this no-ops and registration still succeeds).
  if (!isFree) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any)
      .from('registrations')
      .update({ platform_fee: split.platformFee, organizer_net: split.organizerNet, fee_bearer: feeBearer })
      .eq('id', registration.id);
  }

  // 5b. Post-insert capacity recheck (free tickets only — paid tickets land as 'pending'
  //     and are counted toward capacity when the payment webhook confirms them).
  //     This closes the race window between the pre-insert count check and the insert.
  if (isFree && initialStatus === 'confirmed' && eventPage.max_capacity) {
    const { count: postCount } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', params.id)
      .in('status', ['confirmed', 'checked_in']);

    if ((postCount ?? 0) > eventPage.max_capacity) {
      await admin.from('registrations').delete().eq('id', registration.id);
      return NextResponse.json({ error: 'EVENT_FULL', detail: 'This event just reached capacity' }, { status: 409 });
    }
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

  // 8a. Paid tickets that require approval: skip payment setup and return early.
  //     The attendee is notified via email; no payment intent is created until approved.
  if (requiresApproval && !isFree) {
    const eventSlug = req.headers.get('x-event-slug') ?? params.id;
    const eventDateStr = eventPage.starts_at
      ? new Date(eventPage.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: eventPage.timezone ?? undefined })
      : '';
    sendPendingApprovalEmail({
      to: registration.attendee_email,
      name: registration.attendee_name,
      eventTitle: eventPage.title,
      eventSlug,
      eventDate: eventDateStr,
    }).catch(() => {});
    return NextResponse.json({
      registration_id: registration.id,
      qr_code_token:   registration.qr_code_token,
      variant_id:      variantId,
      event_id:        params.id,
      payment_status:  'pending_approval',
      payment_required: false,
      awaiting_approval: true,
    }, { status: 201 });
  }

  // 8b. For paid tickets: route to correct payment processor
  const enabledProcessors: string[] = (eventPage.payment_processors as string[] | null)?.length
    ? (eventPage.payment_processors as string[])
    : [(eventPage.payment_processor as string | null) ?? 'stripe'];

  const effectiveProcessor = (() => {
    if (isFree) return 'free';
    // Honor attendee's explicit choice if organizer has that method enabled
    if (preferred_processor && enabledProcessors.includes(preferred_processor)) return preferred_processor;
    // Auto-route by currency when no explicit choice
    if (enabledProcessors.includes('flutterwave') && isFlutterwaveCurrency(ticket.currency)) return 'flutterwave';
    if (enabledProcessors.includes('waafipay') && isWaafiPayCurrency(ticket.currency)) return 'waafipay';
    if (enabledProcessors.includes('stripe')) return 'stripe';
    return enabledProcessors[0] ?? 'stripe';
  })();

  if (!isFree && effectiveProcessor === 'flutterwave') {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
      const eventSlugHdr = req.headers.get('x-event-slug') ?? params.id;
      const fwResult = await initFlutterwavePayment({
        amount:        split.charged,
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
      amount:            split.charged,
      currency:          ticket.currency,
      ticket_name:       ticket.name,
    }, { status: 201 });
  }

  if (!isFree) {
    let clientSecret: string | null = null;
    try {
      const amountInCents = Math.round(split.charged * 100);
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
      amount: split.charged,
      currency: ticket.currency,
      ticket_name: ticket.name,
    }, { status: 201 });
  }

  // 8b. Free ticket: send appropriate email (non-blocking)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
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
      eventeraCardUrl: null,
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
