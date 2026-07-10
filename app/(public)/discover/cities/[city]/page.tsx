export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { CityPageClient } from '@/components/discovery/CityPageClient';
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
    .select('id, title, cover_image_url, starts_at, ends_at, city, venue_name, is_online, price_from, category, custom_slug, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .ilike('city', `%${cityName}%`)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(40);

  return (
    <CityPageClient city={cityName} events={events ?? []} />
  );
}
