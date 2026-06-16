export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CategoryPageClient } from '@/components/discovery/CategoryPageClient';
import type { Metadata } from 'next';

interface Props { params: Promise<{ category: string }> }

const VALID_CATEGORIES = [
  'tech', 'business', 'arts', 'music', 'sports', 'food', 'wellness',
  'education', 'community', 'networking', 'fintech', 'design',
];

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
    .select('id, title, cover_image_url, starts_at, city, venue_name, is_online, price_from, custom_slug, category, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .ilike('category', `%${category}%`)
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(40);

  return (
    <CategoryPageClient
      category={category}
      events={events ?? []}
    />
  );
}
