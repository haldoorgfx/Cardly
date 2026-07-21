export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { CityPageClient } from '@/components/discovery/CityPageClient';
import { escapeLikePattern } from '@/lib/search/filter';
import type { Metadata } from 'next';

interface Props { params: Promise<{ city: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city } = await params;
  const label = decodeURIComponent(city).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { title: `Events in ${label} — Eventera` };
}

export default async function CityPage({ params }: Props) {
  const { city } = await params;
  const cityName = decodeURIComponent(city).replace(/-/g, ' ');

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const now = new Date().toISOString();

  const { data: events } = await adminAny
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, ends_at, timezone, city, venue_name, is_online, price_from, category, custom_slug, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    // The slug is visitor-controlled and `%`/`_` are ILIKE wildcards, so an
    // unescaped pattern let `/discover/cities/%25` match every city on the
    // platform and render it under a bogus heading.
    .ilike('city', `%${escapeLikePattern(cityName)}%`)
    // Keep an event visible until it ENDS, matching /events/city. Filtering on
    // starts_at dropped multi-day festivals the moment day one began — exactly
    // when a visitor is most likely to be looking for them.
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order('starts_at', { ascending: true })
    .limit(40);

  return (
    <CityPageClient city={cityName} events={events ?? []} />
  );
}
