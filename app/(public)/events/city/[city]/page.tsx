export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import { CityPage } from '@/components/discovery/CityPage';
import type { Metadata } from 'next';

interface Props { params: { city: string } }

function decodeCity(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = decodeCity(params.city);
  return {
    title: `Events in ${city}`,
    description: `Discover upcoming events in ${city}. Music, tech, culture, food and more.`,
  };
}

export default async function CityEventPage({ params }: Props) {
  const city = decodeCity(params.city);
  const admin = createAdminClient();

  const now = new Date().toISOString();
  const { data: pages } = await admin
    .from('event_pages')
    .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .ilike('city', city)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .limit(80);

  // Saved IDs for logged-in users
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
      <div className="max-w-[1120px] mx-auto px-5">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <CityPage city={city} events={(pages ?? []) as any} savedIds={savedIds} eventCount={pages?.length ?? 0} />
      </div>
    </div>
  );
}
