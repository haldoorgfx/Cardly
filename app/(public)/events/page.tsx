export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { DiscoverHomeClient } from '@/components/discovery/DiscoverHomeClient';
import { PublicNav } from '@/components/events/PublicNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Events — Karta',
  description: 'Find events near you — music, tech, culture, food and more. Register and get your Karta Card.',
};

export default async function EventDiscoveryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const now = new Date().toISOString();

  const SELECT =
    'id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id, status, profiles(full_name, avatar_url))';

  const [{ data: featured }, { data: events }] = await Promise.all([
    db.from('event_pages')
      .select(SELECT)
      .eq('is_public', true)
      .or(`ends_at.gte.${now},ends_at.is.null`)
      .order('starts_at', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    db.from('event_pages')
      .select(SELECT)
      .eq('is_public', true)
      .or(`ends_at.gte.${now},ends_at.is.null`)
      .order('starts_at', { ascending: true, nullsFirst: false })
      .limit(48),
  ]);

  return (
    <>
      <PublicNav />
      <DiscoverHomeClient featured={featured ?? null} events={events ?? []} />
    </>
  );
}
