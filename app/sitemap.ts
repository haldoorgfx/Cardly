import type { MetadataRoute } from 'next';
import { POSTS } from '@/app/(marketing)/blog/posts';
import { createAdminClient } from '@/lib/supabase/server';
import { CATEGORY_SLUGS } from '@/lib/categories';

// Re-generate at most hourly so newly published events show up without a redeploy.
export const revalidate = 3600;

/** Inverse of the /events/city/[city] route's decode (dashes ⇄ spaces). */
function citySlug(city: string): string {
  return city.toLowerCase().trim().replace(/\s+/g, '-');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sitemaps require ABSOLUTE urls — an empty base would emit invalid entries.
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventera.so';
  const now = new Date();

  const entry = (
    path: string,
    priority: number,
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'monthly',
    lastModified: Date = now,
  ): MetadataRoute.Sitemap[number] => ({
    url: path ? `${base}${path}` : base,
    lastModified,
    changeFrequency,
    priority,
  });

  const featureSlugs = [
    'registration', 'check-in', 'analytics', 'qa-polls', 'networking',
    'speakers', 'agenda', 'eventera-card', 'sponsors', 'gamification',
  ];

  const staticEntries: MetadataRoute.Sitemap = [
    // ── Core marketing ──────────────────────────────────────────────
    entry('', 1.0, 'weekly'),
    entry('/pricing', 0.9),
    entry('/how-it-works', 0.8),
    entry('/features', 0.8),
    entry('/use-cases', 0.8),
    entry('/about', 0.7),

    // ── Feature pages ───────────────────────────────────────────────
    ...featureSlugs.map((s) => entry(`/features/${s}`, 0.7)),

    // ── Public event discovery ──────────────────────────────────────
    entry('/events', 0.8, 'daily'),
    entry('/events/cities', 0.5),
    // Category landing pages — prime discovery real estate for an event
    // marketplace; each is a real route with its own generateMetadata.
    ...CATEGORY_SLUGS.map((s) => entry(`/events/category/${s}`, 0.6, 'weekly')),

    // ── Secondary marketing ─────────────────────────────────────────
    entry('/blog', 0.6, 'weekly'),
    ...POSTS.map((p) => entry(`/blog/${p.slug}`, 0.5, 'yearly')),
    entry('/partners', 0.6),
    entry('/careers', 0.6, 'weekly'),
    entry('/app', 0.6),
    entry('/developers', 0.5),
    entry('/contact', 0.5, 'yearly'),
    entry('/faq', 0.5),
    entry('/whats-new', 0.5, 'weekly'),

    // ── Support ─────────────────────────────────────────────────────
    entry('/help', 0.4),
    entry('/status', 0.3, 'daily'),

    // ── Auth ────────────────────────────────────────────────────────
    entry('/signup', 0.5, 'yearly'),
    entry('/login', 0.4, 'yearly'),

    // ── Legal ───────────────────────────────────────────────────────
    entry('/terms', 0.3, 'yearly'),
    entry('/privacy', 0.3, 'yearly'),
    entry('/dmca', 0.2, 'yearly'),
  ];

  // ── Published public event pages + the city pages they imply ────────────
  // (best-effort; never break the sitemap)
  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any;
    const { data } = await db
      .from('event_pages')
      .select('updated_at, city, event_id, events!inner(slug, status, user_id)')
      .eq('is_public', true)
      .eq('events.status', 'published')
      .limit(5000);

    if (Array.isArray(data)) {
      const seen = new Set<string>();
      const cities = new Set<string>();
      // Organizer public profiles and the event ids we can hang speaker
      // profiles off. Both are real indexable routes that the sitemap never
      // mentioned, so Google only ever found them by crawling links.
      const organizers = new Set<string>();
      const slugByEventId = new Map<string, string>();

      for (const row of data) {
        const slug: string | undefined = row?.events?.slug;
        if (slug && !seen.has(slug)) {
          seen.add(slug);
          const last = row?.updated_at ? new Date(row.updated_at) : now;
          eventEntries.push(entry(`/e/${slug}`, 0.6, 'weekly', last));
          if (row?.event_id) slugByEventId.set(row.event_id as string, slug);
        }
        // Only emit a city page we actually have published events for, so the
        // sitemap never advertises an empty landing page.
        const city = (row?.city as string | undefined)?.trim();
        if (city) cities.add(citySlug(city));

        const organizerId = row?.events?.user_id as string | undefined;
        if (organizerId) organizers.add(organizerId);
      }

      for (const c of Array.from(cities)) {
        eventEntries.push(entry(`/events/city/${c}`, 0.6, 'weekly'));
      }
      for (const id of Array.from(organizers)) {
        eventEntries.push(entry(`/o/${id}`, 0.5, 'weekly'));
      }

      // Speaker profiles — high-intent long-tail ("<name> speaking") and one of
      // the few pages on the platform a person searches for by name.
      const eventIds = Array.from(slugByEventId.keys());
      if (eventIds.length) {
        const { data: speakers } = await db
          .from('speakers')
          .select('id, event_id')
          .in('event_id', eventIds.slice(0, 1000))
          .limit(10000);
        for (const sp of Array.isArray(speakers) ? speakers : []) {
          const evSlug = slugByEventId.get(sp?.event_id as string);
          if (evSlug && sp?.id) {
            eventEntries.push(entry(`/s/${evSlug}/${sp.id}`, 0.4, 'monthly'));
          }
        }
      }
    }
  } catch {
    // Supabase unreachable / not configured — ship the static sitemap only.
    eventEntries = [];
  }

  // The sitemap spec caps a single file at 50,000 URLs; going over makes Google
  // reject the WHOLE file, not just the overflow. Static marketing entries are
  // kept first so they can never be the ones dropped.
  const MAX_SITEMAP_URLS = 50_000;
  return [...staticEntries, ...eventEntries].slice(0, MAX_SITEMAP_URLS);
}
