export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeFlow from '../AttendeeFlow';
import { AttendeeBrandProvider } from '@/components/white-label/attendee-brand';
import { getWhiteLabelByEvent } from '@/lib/white-label/server';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';
import type { Zone } from '@/types/database';

export default async function VariantAttendeePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; variantSlug: string }>;
  searchParams: Promise<{ reg?: string }>;
}) {
  const { slug, variantSlug } = await params;
  const { reg } = await searchParams;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, status')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  const { data: variant } = await admin
    .from('event_variants')
    .select('*')
    .eq('event_id', event.id)
    .eq('variant_slug', variantSlug)
    .single();

  if (!variant) notFound();

  // Attendee-facing white-label branding (Studio plan) — must match app/c/[slug]/page.tsx
  // so organizers who set a brand name or hid "Powered by Eventera" still get that
  // treatment on the actual personalization flow, not just the variant picker.
  const wl = await getWhiteLabelByEvent(event.id);
  const brand = {
    brandName: wl?.brandName ?? null,
    primaryColor: wl?.primaryColor ?? '#1F4D3A',
    hidePoweredBy: wl?.hidePoweredBy ?? false,
  };

  // Same registration resolution as app/c/[slug]/page.tsx — /api/render 403s
  // without a registration id that belongs to this event.
  const registrationId = await resolveViewerRegistrationId(event.id, reg);

  return (
    <AttendeeBrandProvider value={brand}>
      <AttendeeFlow
        variantId={variant.id}
        eventId={event.id}
        eventName={event.name}
        backgroundUrl={variant.background_url ?? ''}
        backgroundWidth={variant.background_width ?? 1080}
        backgroundHeight={variant.background_height ?? 1350}
        zones={(variant.zones as unknown as Zone[]) ?? []}
        registrationId={registrationId}
      />
    </AttendeeBrandProvider>
  );
}
