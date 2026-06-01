export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatEventDateRange, formatMinPrice } from '@/lib/events/format';
import { PublicEventPageClient } from '@/components/events/PublicEventPageClient';
import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

async function resolveEventPage(slug: string) {
  const admin = createAdminClient();

  // 1. Try custom_slug first
  const { data: byCustomSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('custom_slug', slug)
    .eq('is_public', true)
    .single();
  if (byCustomSlug) return byCustomSlug;

  // 2. Fallback: look up events.slug → event_pages
  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!event) return null;

  const { data: byEventSlug } = await admin
    .from('event_pages')
    .select('*')
    .eq('event_id', event.id)
    .eq('is_public', true)
    .single();
  return byEventSlug ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolveEventPage(params.slug);
  if (!page) return { title: 'Event — Karta' };
  return {
    title: page.seo_title ?? `${page.title} — Karta`,
    description: page.seo_description ?? page.tagline ?? undefined,
    openGraph: {
      title: page.seo_title ?? page.title,
      description: page.seo_description ?? page.tagline ?? undefined,
      images: page.cover_image_url ? [{ url: page.cover_image_url }] : [],
    },
  };
}

export default async function PublicEventPage({ params }: Props) {
  const page = await resolveEventPage(params.slug);
  if (!page) notFound();

  const admin = createAdminClient();
  const { data: tickets } = await admin
    .from('ticket_types')
    .select('*')
    .eq('event_id', page.event_id)
    .eq('is_visible', true)
    .order('position');

  const allTickets = tickets ?? [];
  const { date, time, endTime } = formatEventDateRange(page.starts_at, page.ends_at, page.timezone);
  const minPrice = formatMinPrice(allTickets);
  const registrationSlug = params.slug;

  return (
    <PublicEventPageClient
      page={page}
      tickets={allTickets}
      dateStr={date}
      timeStr={time}
      endTimeStr={endTime}
      minPrice={minPrice}
      registrationSlug={registrationSlug}
    />
  );
}
