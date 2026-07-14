import type { MetadataRoute } from 'next';
import { POSTS } from '@/app/(marketing)/blog/posts';
import { createAdminClient } from '@/lib/supabase/server';

// Re-generate at most hourly so newly published events show up without a redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
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

  // ── Published public event pages (best-effort; never break the sitemap) ──
  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any;
    const { data } = await db
      .from('event_pages')
      .select('updated_at, events!inner(slug, status)')
      .eq('is_public', true)
      .eq('events.status', 'published')
      .limit(5000);

    if (Array.isArray(data)) {
      const seen = new Set<string>();
      for (const row of data) {
        const slug: string | undefined = row?.events?.slug;
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        const last = row?.updated_at ? new Date(row.updated_at) : now;
        eventEntries.push(entry(`/e/${slug}`, 0.6, 'weekly', last));
      }
    }
  } catch {
    // Supabase unreachable / not configured — ship the static sitemap only.
    eventEntries = [];
  }

  return [...staticEntries, ...eventEntries];
}
