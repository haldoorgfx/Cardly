export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import TicketDetailClient from '@/components/tickets/TicketDetailClient';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';
import { resolveCardImageUrl } from '@/lib/registration/cardImage';
import type { CardVariant } from '@/components/tickets/GetCardModal';
import type { Zone } from '@/types/database';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ticket' };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=/my-tickets/${id}`);

  const admin = createAdminClient();

  // Owner-only: registration must match the signed-in user (user_id OR attendee_email).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select(`
      id, attendee_name, attendee_email, status, payment_status, amount_paid, currency,
      qr_code_token, checked_in_at, checked_in_by, eventera_card_url, created_at,
      ticket_types(name, price, currency),
      events(id, name, slug, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, venue_address, city, country, is_online, features, variant_id, timezone))
    `)
    .eq('id', id)
    .or(registrationOwnershipFilter(user.id, user.email))
    .maybeSingle();

  if (!reg) notFound();

  // Resolve who scanned this ticket in (for the checked-in state), best-effort.
  let scannedByName: string | null = null;
  if (reg.checked_in_by) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scanner } = await (admin as any)
      .from('profiles')
      .select('full_name')
      .eq('id', reg.checked_in_by)
      .maybeSingle();
    scannedByName = scanner?.full_name ?? null;
  }

  // Load the event's card variant so the ticket page can offer "Get my Eventera
  // Card" for registrations that don't have one yet (mirrors the same lookup
  // used post-registration in app/(public)/e/[slug]/register/confirm/page.tsx).
  let variant: CardVariant | null = null;
  if (!reg.eventera_card_url) {
    const eventId = reg.events?.id as string | undefined;
    const variantId = reg.events?.event_pages?.[0]?.variant_id as string | null | undefined;
    if (eventId) {
      const { data: rawVariant } = variantId
        ? await admin.from('event_variants').select('id, zones, background_url, background_width, background_height').eq('id', variantId).maybeSingle()
        : await admin.from('event_variants').select('id, zones, background_url, background_width, background_height').eq('event_id', eventId).order('position').limit(1).maybeSingle();

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
  }

  // A registration that already HAS a card needs its image resolved here, or the
  // detail page shows nothing (variant is only loaded when there's no card yet).
  const existingCardImageUrl = reg.eventera_card_url
    ? await resolveCardImageUrl(admin, reg.eventera_card_url)
    : null;

  return (
    <TicketDetailClient
      reg={reg}
      scannedByName={scannedByName}
      variant={variant}
      existingCardImageUrl={existingCardImageUrl}
    />
  );
}
