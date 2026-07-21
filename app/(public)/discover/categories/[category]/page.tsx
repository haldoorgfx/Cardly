export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CategoryPageClient } from '@/components/discovery/CategoryPageClient';
import { CATEGORY_SLUGS } from '@/lib/categories';
import { escapeLikePattern } from '@/lib/search/filter';
import type { Metadata } from 'next';

interface Props { params: Promise<{ category: string }> }

// Canonical category slugs, plus this surface's own curated aliases.
const VALID_CATEGORIES = Array.from(new Set([...CATEGORY_SLUGS, 'fintech']));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  return { title: `${label} Events — Eventera`, description: `Discover ${label.toLowerCase()} events near you` };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!VALID_CATEGORIES.includes(category.toLowerCase())) notFound();

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const now = new Date().toISOString();
  const { data: events } = await adminAny
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, ends_at, timezone, city, venue_name, is_online, price_from, custom_slug, category, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    // Escaped even though the slug is allow-listed above — the allow-list and
    // the query should not have to be reasoned about together to stay safe.
    .ilike('category', `%${escapeLikePattern(category)}%`)
    // Visible until the event ENDS, matching /events/category — see the city
    // route for why starts_at hid in-progress events.
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order('starts_at', { ascending: true })
    .limit(40);

  return (
    <CategoryPageClient
      category={category}
      events={events ?? []}
    />
  );
}
