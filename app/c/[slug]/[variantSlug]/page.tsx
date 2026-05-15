export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeClient from '../AttendeeClient';
import type { Zone } from '@/types/database';

export default async function VariantAttendeePage({
  params,
}: {
  params: Promise<{ slug: string; variantSlug: string }>;
}) {
  const { slug, variantSlug } = await params;
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

  return (
    <AttendeeClient
      variantId={variant.id}
      eventName={event.name}
      backgroundUrl={variant.background_url ?? ''}
      backgroundWidth={variant.background_width ?? 1080}
      backgroundHeight={variant.background_height ?? 1350}
      zones={(variant.zones as unknown as Zone[]) ?? []}
    />
  );
}
