export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { SearchPageClient } from '@/components/discovery/SearchPageClient';
import { orIlikeAcross, escapeLikePattern, rankByRelevance } from '@/lib/search/filter';

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
    .select('id, title, description, cover_image_url, starts_at, city, venue_name, is_online, price_from, category, custom_slug, events!inner(slug, status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .gte('starts_at', now)
    .order('starts_at', { ascending: true })
    .limit(100);

  // Search matched `title` and nothing else, so an event described as "a
  // conference for technology leaders" was unfindable by anyone searching
  // "technology", and searching a venue or a city name returned nothing at
  // all. On a discovery marketplace that is the difference between the event
  // being found and not.
  //
  // Values go through orIlikeAcross rather than template strings: `.or()` is a
  // single filter string where `,` separates conditions, and `%`/`_` are LIKE
  // wildcards, so an unescaped query could both mean the wrong thing and add
  // clauses the query never intended.
  if (q) {
    const filter = orIlikeAcross(['title', 'description', 'venue_name', 'city', 'category'], q);
    if (filter) query = query.or(filter);
  }
  if (city) query = query.ilike('city', `%${escapeLikePattern(city)}%`);
  if (category) query = query.ilike('category', `%${escapeLikePattern(category)}%`);

  const { data: rows } = await query;

  // Relevance, then date — a browse list is chronological, but a SEARCH result
  // that puts a weak description match tomorrow above an exact title match next
  // week is answering the wrong question. Ranked here rather than in SQL
  // because PostgREST cannot express it without a database function.
  const events = rankByRelevance(rows ?? [], q ?? '').slice(0, 50);

  return (
    <SearchPageClient
      initialQuery={q ?? ''}
      initialCity={city ?? ''}
      events={events ?? []}
    />
  );
}
