export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import AttendeeFlow from './AttendeeFlow';
import VariantPickerClient from './VariantPickerClient';
import { ViewTracker } from './components/ViewTracker';
import type { Zone, Variant } from '@/types/database';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('name')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) return {};

  const title = `${event.name} — Get your personalized card`;
  const description = `You're invited to ${event.name}. Add your name and photo, then download your personalized card in seconds.`;

  return {
    title: event.name,
    description,
    openGraph: {
      title,
      description,
      url: `https://karta.cre8so.com/c/${slug}`,
      type: 'website',
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: event.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function AttendeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status, view_count')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!event) notFound();

  // View count is incremented client-side via ViewTracker (sessionStorage dedup)
  // so a single user refreshing the page only counts once per session.

  const { data: variantsData } = await admin
    .from('event_variants')
    .select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position')
    .eq('event_id', event.id)
    .order('position', { ascending: true });

  const variants = (variantsData ?? []) as unknown as Variant[];

  if (variants.length === 0) notFound();

  // Single variant — skip the picker and go straight to the form
  if (variants.length === 1) {
    const v = variants[0];
    return (
      <>
        <ViewTracker eventId={event.id} />
        <AttendeeFlow
          variantId={v.id}
          eventId={event.id}
          eventName={event.name}
          backgroundUrl={v.background_url ?? ''}
          backgroundWidth={v.background_width ?? 1080}
          backgroundHeight={v.background_height ?? 1350}
          zones={(v.zones as unknown as Zone[]) ?? []}
        />
      </>
    );
  }

  // Multiple variants — show the picker
  return (
    <>
      <ViewTracker eventId={event.id} />
      <VariantPickerClient
        eventName={event.name}
        eventSlug={event.slug}
        variants={variants}
      />
    </>
  );
}
