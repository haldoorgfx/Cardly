export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation'; // still needed for invalid categories
import { PublicNav } from '@/components/events/PublicNav';
import { CategoryPage } from '@/components/discovery/CategoryPage';
import type { Metadata } from 'next';

interface Props { params: { category: string } }

const VALID_CATEGORIES = ['tech', 'music', 'business', 'culture', 'food', 'sports', 'health', 'film', 'education'];

function decodeCategory(slug: string): string {
  const decoded = decodeURIComponent(slug).toLowerCase();
  return decoded.charAt(0).toUpperCase() + decoded.slice(1);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = decodeCategory(params.category);
  return {
    title: `${cat} Events — Karta`,
    description: `Discover upcoming ${cat.toLowerCase()} events across East Africa and beyond.`,
  };
}

export default async function CategoryEventPage({ params }: Props) {
  const slug = params.category.toLowerCase();
  if (!VALID_CATEGORIES.includes(slug)) notFound();

  const category = decodeCategory(params.category);
  const admin = createAdminClient();

  const now = new Date().toISOString();
  const { data: pages } = await admin
    .from('event_pages')
    .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, series_name, events!inner(slug, user_id)')
    .eq('is_public', true)
    .ilike('category', category)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .limit(80);

  const safePages = pages ?? [];

  // Compute city counts for this category
  const cityCountMap = new Map<string, number>();
  for (const p of safePages) {
    if (p.city) cityCountMap.set(p.city, (cityCountMap.get(p.city) ?? 0) + 1);
  }
  const cityCounts = Array.from(cityCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, count }));

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
      <div className="max-w-[1120px] mx-auto px-5 pt-10">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <CategoryPage category={category} events={safePages as any} savedIds={savedIds} cityCounts={cityCounts} />
      </div>
    </div>
  );
}
