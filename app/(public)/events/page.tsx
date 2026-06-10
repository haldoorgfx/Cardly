export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { DiscoveryFeed } from '@/components/discovery/DiscoveryFeed';
import { PublicNav } from '@/components/events/PublicNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Events â€” Karta',
  description: 'Find events across East Africa and beyond. Music, tech, culture, food and more.',
};

export default async function EventDiscoveryPage() {
  const admin = createAdminClient();

  // Fetch upcoming public events
  const { data: pages } = await admin
    .from('event_pages')
    .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id)')
    .eq('is_public', true)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(60);

  // Personalization: load profile if logged in
  let greeting: string | null = null;
  let interests: string[] = [];
  let followedOrgIds: string[] = [];
  let savedIds: string[] = [];

  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      const [profileRes, followsRes, savedRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('profiles').select('full_name, interests').eq('id', user.id).single(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('organizer_follows').select('organizer_id').eq('follower_id', user.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('saved_events').select('event_page_id').eq('user_id', user.id),
      ]);

      const firstName = profileRes.data?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? null;
      greeting = firstName ? `Good ${timeOfDay}, ${firstName}` : null;
      interests = profileRes.data?.interests ?? [];
      followedOrgIds = (followsRes.data ?? []).map((r: { organizer_id: string }) => r.organizer_id);
      savedIds = (savedRes.data ?? []).map((r: { event_page_id: string }) => r.event_page_id);
    }
  } catch { /* non-blocking */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (pages ?? []) as any[];

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1120px] mx-auto px-5 py-10 pb-24">
        <DiscoveryFeed
          events={events}
          savedIds={savedIds}
          greeting={greeting}
          interests={interests}
          followedOrgIds={followedOrgIds}
        />
      </div>
    </div>
  );
}

