export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { DiscoveryGrid } from '@/components/events/DiscoveryGrid';
import { PublicNav } from '@/components/events/PublicNav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Events',
  description: 'Find events and get your personalized Karta Card.',
};

export default async function EventDiscoveryPage() {
  const admin = createAdminClient();

  const { data: pages } = await admin
    .from('event_pages')
    .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, venue_address, custom_slug, organizer_name, events!event_id(slug)')
    .eq('is_public', true)
    .gte('ends_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(48);

  return (
    <>
    <PublicNav />
    <div className="max-w-[1120px] mx-auto px-5 py-12">
      {/* Hero */}
      <div className="mb-10">
        <h1
          className="font-display font-semibold leading-tight"
          style={{ fontSize: 'clamp(28px, 5vw, 40px)', color: '#0F1F18', letterSpacing: '-0.025em' }}
        >
          Find your next event
        </h1>
        <p className="mt-3 text-[16px]" style={{ color: '#6B7A72' }}>
          Events from organizers around the world — with personalized Karta Cards.
        </p>
      </div>

      <DiscoveryGrid pages={pages ?? []} />
    </div>
    </>
  );
}
