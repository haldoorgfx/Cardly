export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { getTicketStripe } from '@/lib/payments/stripe';
import { fromStripeMinorUnits } from '@/lib/payments/currency';
import { StripePaymentStep } from '@/components/registration/StripePaymentStep';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string };
}

export const metadata: Metadata = { title: 'Complete your payment' };

// Standalone card-payment page for a pending registration, keyed by its
// qr_code_token. The mobile app opens this in the browser after creating a
// pending registration (it can't render Stripe Elements natively); it also
// rescues anyone who abandoned the web checkout before paying.
export default async function PayPendingPage({ params, searchParams }: Props) {
  const qrToken = searchParams.reg?.trim();
  if (!qrToken) notFound();

  const admin = createAdminClient();
  const { data: registration } = await admin
    .from('registrations')
    .select('id, event_id, ticket_type_id, payment_status, status, stripe_payment_intent_id')
    .eq('qr_code_token', qrToken)
    .maybeSingle();

  if (!registration) notFound();

  const confirmUrl = `/e/${params.slug}/register/confirm?reg=${qrToken}&processor=stripe`;
  if (registration.payment_status === 'paid' || registration.status === 'confirmed') {
    redirect(confirmUrl);
  }

  const [{ data: eventPage }, { data: ticket }] = await Promise.all([
    admin.from('event_pages').select('title').eq('event_id', registration.event_id).single(),
    registration.ticket_type_id
      ? admin.from('ticket_types').select('name').eq('id', registration.ticket_type_id).single()
      : Promise.resolve({ data: null }),
  ]);

  // Recover the PaymentIntent created at registration time. Its amount is the
  // server-computed charge (fees, promo, PWYW included) — the source of truth.
  let clientSecret: string | null = null;
  let amount = 0;
  let currency = 'usd';
  if (registration.stripe_payment_intent_id) {
    try {
      const stripe = getTicketStripe();
      const pi = await stripe.paymentIntents.retrieve(registration.stripe_payment_intent_id);
      if (pi.status === 'succeeded') redirect(confirmUrl);
      if (pi.status !== 'canceled') {
        clientSecret = pi.client_secret;
        // Zero-decimal currencies (DJF, UGX, RWF, XOF, XAF, KMF …) have no
        // subunit — Stripe's `amount` IS the major unit. A blanket ÷100 quoted a
        // DJF 5,000 ticket as "DJF 50" on the page while Stripe charged the real
        // 5,000. Djibouti is a primary market; this was live money.
        amount = fromStripeMinorUnits(pi.amount, pi.currency);
        currency = pi.currency;
      }
    } catch (err) {
      // NEXT_REDIRECT must propagate; anything else falls through to the expired state
      if (err && typeof err === 'object' && 'digest' in err) throw err;
    }
  }

  const eventTitle = eventPage?.title ?? 'Event';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-[440px] rounded-2xl p-5 sm:p-7"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
      >
        {clientSecret ? (
          <StripePaymentStep
            clientSecret={clientSecret}
            returnUrl={`${appUrl}${confirmUrl}`}
            amount={amount}
            currency={currency}
            eventTitle={eventTitle}
            ticketName={ticket?.name ?? 'General Admission'}
          />
        ) : (
          <div className="text-center py-4">
            <h1
              className="font-display font-semibold text-[20px] mb-2"
              style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
            >
              This payment link has expired
            </h1>
            <p className="text-[14px] mb-5" style={{ color: '#3A4A42' }}>
              Your spot for {eventTitle} is no longer reserved. Please register again to get a new payment link.
            </p>
            <Link
              href={`/e/${params.slug}/register`}
              className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-semibold text-white"
              style={{ background: '#1F4D3A' }}
            >
              Register again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
