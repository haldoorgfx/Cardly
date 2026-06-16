export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { SearchPageClient } from '@/components/discovery/SearchPageClient';

interface Props { searchParams: { q?: string; city?: string; category?: string } }

export async function generateMetadata({ searchParams }: Props) {
  return { title: searchParams.q ? `"${searchParams.q}" — Search` : 'Search Events — Eventera' };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, city, category } = searchParams;
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const now = new Date().toISOString();
  let query = adminAny
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, city, venue_name, is_online, price_from, category, custom_slug, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(50);

  if (q) query = query.ilike('title', `%${q}%`);
  if (city) query = query.ilike('city', `%${city}%`);
  if (category) query = query.ilike('category', `%${category}%`);

  const { data: events } = await query;

  return (
    <SearchPageClient
      initialQuery={q ?? ''}
      initialCity={city ?? ''}
      events={events ?? []}
    />
  );
}
