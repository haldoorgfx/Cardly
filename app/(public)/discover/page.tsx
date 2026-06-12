export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { DiscoverHomeClient } from '@/components/discovery/DiscoverHomeClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Discover Events — Karta' };

export default async function DiscoverPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const now = new Date().toISOString();

  const [{ data: featured }, { data: events }] = await Promise.all([
    db.from('event_pages')
      .select('id, title, cover_image_url, starts_at, ends_at, city, is_online, price_from, category, custom_slug, events!inner(slug, status)')
      .eq('is_public', true).eq('events.status', 'published').gte('starts_at', now)
      .order('starts_at', { ascending: true }).limit(1).single(),
    db.from('event_pages')
      .select('id, title, cover_image_url, starts_at, city, is_online, price_from, category, custom_slug, events!inner(slug, status, profiles(full_name))')
      .eq('is_public', true).eq('events.status', 'published').gte('starts_at', now)
      .order('starts_at', { ascending: true }).limit(24),
  ]);

  return <DiscoverHomeClient featured={featured} events={events ?? []} />;
}
