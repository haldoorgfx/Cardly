export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import { SearchAndMap } from '@/components/discovery/SearchAndMap';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Events',
};

interface Props {
  searchParams: {
    q?: string;
    city?: string;
    category?: string;
    free?: string;
    date?: string;
    format?: string;
    // map bounds from "Search this area"
    n?: string; s?: string; e?: string; w?: string;
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const admin = createAdminClient();

  const q = searchParams.q?.trim() ?? '';
  const cityParam = searchParams.city ?? '';
  // catParam and freeOnly require pending DB migration (category/price_from columns)
  // const catParam = searchParams.category ?? '';
  // const freeOnly = searchParams.free === 'true';

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('event_pages')
    .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, venue_lat, venue_lng, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id)')
    .eq('is_public', true)
    .or(`ends_at.gte.${now.toISOString()},ends_at.is.null`)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .limit(60);

  const catParam = searchParams.category ?? '';
  const freeOnly = searchParams.free === 'true';

  if (q) query = query.ilike('title', `%${q}%`);
  if (cityParam) query = query.ilike('city', cityParam);
  if (catParam) query = query.ilike('category', catParam);
  if (freeOnly) query = query.eq('price_from', 0);
  if (searchParams.format === 'online') query = query.eq('is_online', true);
  if (searchParams.format === 'inperson') query = query.eq('is_online', false);
  if (searchParams.date === 'week') query = query.lte('starts_at', weekEnd.toISOString());

  // Map bounds from "Search this area"
  const { n, s, e, w } = searchParams;
  if (n && s && e && w) {
    query = query
      .gte('venue_lat', parseFloat(s))
      .lte('venue_lat', parseFloat(n))
      .gte('venue_lng', parseFloat(w))
      .lte('venue_lng', parseFloat(e));
  }

  const { data: pages } = await query;
  const events = (pages ?? []) as Parameters<typeof SearchAndMap>[0]['events'];

  let savedIds: string[] = [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (admin as any).from('saved_events').select('event_page_id').eq('user_id', user.id);
      savedIds = (data ?? []).map((r: { event_page_id: string }) => r.event_page_id);
    }
  } catch { /* non-blocking */ }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <Suspense>
        <SearchAndMap
          events={events}
          savedIds={savedIds}
          query={q}
          totalCount={events.length}
          cityParam={cityParam}
        />
      </Suspense>
    </div>
  );
}

