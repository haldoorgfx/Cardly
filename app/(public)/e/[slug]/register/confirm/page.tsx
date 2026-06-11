export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { ConfirmPage } from '@/components/registration/ConfirmPage';
import type { Zone } from '@/types/database';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
  searchParams: { reg?: string; payment_intent?: string; redirect_status?: string; processor?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const qrToken = searchParams.reg;
  if (!qrToken) return { title: 'Registration Confirmed' };
  const admin = createAdminClient();
  const { data: registration } = await admin.from('registrations').select('event_id').eq('qr_code_token', qrToken).single();
  if (!registration) return { title: 'Registration Confirmed' };
  const { data: eventPage } = await admin.from('event_pages').select('title').eq('event_id', registration.event_id).single();
  return { title: `Registration Confirmed — ${eventPage?.title ?? 'Event'}` };
}

export default async function RegisterConfirmPage({ params, searchParams }: Props) {
  const qrToken = searchParams.reg;
  if (!qrToken) notFound();

  const admin = createAdminClient();

  const { data: registration } = await admin
    .from('registrations')
    .select('*')
    .eq('qr_code_token', qrToken)
    .single();

  if (!registration) notFound();

  const [{ data: eventPage }, { data: ticket }] = await Promise.all([
    admin.from('event_pages').select('title, event_id, variant_id, events!inner(slug)').eq('event_id', registration.event_id).single(),
    registration.ticket_type_id
      ? admin.from('ticket_types').select('name, price, currency').eq('id', registration.ticket_type_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const eventTitle = eventPage?.title ?? 'Event';
  const eventSlug = (eventPage?.events as { slug: string } | null)?.slug ?? params.slug;

  // Load variant for post-payment card personalisation
  let variant: { id: string; zones: Zone[]; background_url: string | null; background_width: number | null; background_height: number | null } | null = null;
  if (!registration.karta_card_url) {
    const variantId = eventPage?.variant_id;
    const { data: rawVariant } = variantId
      ? await admin.from('event_variants').select('id, zones, background_url, background_width, background_height').eq('id', variantId).single()
      : await admin.from('event_variants').select('id, zones, background_url, background_width, background_height').eq('event_id', registration.event_id).order('position').limit(1).single();

    if (rawVariant) {
      variant = {
        id: rawVariant.id,
        zones: (rawVariant.zones as unknown as Zone[]) ?? [],
        background_url: rawVariant.background_url,
        background_width: rawVariant.background_width,
        background_height: rawVariant.background_height,
      };
    }
  }

  const isStripeReturn = !!searchParams.payment_intent;
  const isFlutterwaveReturn = searchParams.processor === 'flutterwave';
  const isPaidReturn = isStripeReturn || isFlutterwaveReturn;

  return (
    <ConfirmPage
      registration={registration}
      eventTitle={eventTitle}
      eventSlug={eventSlug}
      ticketName={ticket?.name ?? null}
      variant={variant}
      isPaidReturn={isPaidReturn}
      paymentIntentId={searchParams.payment_intent ?? null}
      redirectStatus={searchParams.redirect_status ?? null}
      txRef={searchParams.reg ?? null}
      isFlutterwaveReturn={isFlutterwaveReturn}
    />
  );
}
