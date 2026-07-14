export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { DiscoverHomeClient, type PromoBanner } from '@/components/discovery/DiscoverHomeClient';
import { PublicNav } from '@/components/events/PublicNav';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Events',
  description: 'Find events near you — music, tech, culture, food and more. Register and get your Eventera Card.',
};

export default async function EventDiscoveryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const now = new Date().toISOString();

  const SELECT =
    'id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id, status, profiles(full_name, avatar_url))';

  const [{ data: featured }, { data: events }, banners] = await Promise.all([
    db.from('event_pages')
      .select(SELECT)
      .eq('is_public', true)
      .eq('events.status', 'published')
      .or(`ends_at.gte.${now},ends_at.is.null`)
      .order('starts_at', { ascending: true, nullsFirst: false })
      .limit(1)
      .maybeSingle(),
    db.from('event_pages')
      .select(SELECT)
      .eq('is_public', true)
      .eq('events.status', 'published')
      .or(`ends_at.gte.${now},ends_at.is.null`)
      .order('starts_at', { ascending: true, nullsFirst: false })
      .limit(48),
    fetchPromoBanners(db, now),
  ]);

  // Saved events for the signed-in visitor, so hearts render pre-filled.
  let savedIds: string[] = [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await db.from('saved_events').select('event_page_id').eq('user_id', user.id);
      savedIds = (data ?? []).map((r: { event_page_id: string }) => r.event_page_id);
    }
  } catch { /* non-blocking */ }

  return (
    <>
      <PublicNav />
      <DiscoverHomeClient featured={featured ?? null} events={events ?? []} banners={banners} savedIds={savedIds} />
      <MarketingFooter />
    </>
  );
}

/**
 * Admin-controlled promo banners (from the `promo_banners` table). Time-gated by
 * starts_at / ends_at and limited to active rows. Mirrors the mobile Discover
 * carousel read. Fails silently (empty list) if the table is missing or errors —
 * the web hero then falls back to the default featured/editorial hero.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchPromoBanners(db: any, now: string): Promise<PromoBanner[]> {
  try {
    const { data, error } = await db
      .from('promo_banners')
      .select(
        'title, subtitle, image_url, cta_label, cta_type, cta_target, bg_start, bg_end, text_color, sort_order',
      )
      .eq('active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('sort_order', { ascending: true })
      .limit(6);
    if (error || !Array.isArray(data)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((r) => ({
      title: String(r.title ?? 'The new era of events'),
      subtitle: String(r.subtitle ?? '').trim(),
      image_url: String(r.image_url ?? '').trim(),
      cta_label: String(r.cta_label ?? '').trim(),
      cta_type: String(r.cta_type ?? 'none').trim(),
      cta_target: String(r.cta_target ?? '').trim(),
      bg_start: String(r.bg_start ?? '#163828').trim(),
      bg_end: String(r.bg_end ?? '#2A6A50').trim(),
      text_color: String(r.text_color ?? '#FFFFFF').trim(),
    }));
  } catch {
    return [];
  }
}
