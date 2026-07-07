export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events by Category',
  description: 'Browse upcoming events by category across East Africa and beyond.',
};

// Mirrors VALID_CATEGORIES in /events/category/[category] so every tile resolves.
const ALL_CATEGORIES = [
  'Tech', 'Music', 'Business', 'Culture', 'Food', 'Sports', 'Health', 'Film', 'Education',
] as const;

function catSlug(cat: string) {
  return cat.toLowerCase();
}

export default async function CategoriesIndexPage() {
  const admin = createAdminClient();

  const { data: pages } = await admin
    .from('event_pages')
    .select('category')
    .eq('is_public', true)
    .or(`ends_at.gte.${new Date().toISOString()},ends_at.is.null`)
    .not('category', 'is', null);

  const countMap = new Map<string, number>();
  for (const row of pages ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (row as any).category as string | null;
    if (!c) continue;
    const key = c.toLowerCase();
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1120px] mx-auto px-5 py-12 pb-24">
        <nav className="text-[12px] mb-4" style={{ color: '#3A4A42' }}>
          <Link href="/events" className="hover:text-[#1F4D3A] transition-colors" style={{ color: '#3A4A42' }}>Events</Link>
          {' / '}
          <span style={{ color: '#0F1F18' }}>Categories</span>
        </nav>

        <h1
          className="font-display font-semibold mb-2"
          style={{ fontSize: 'clamp(24px,4vw,36px)', color: '#1F4D3A', letterSpacing: '-0.025em' }}
        >
          Browse by category
        </h1>
        <p className="text-[15px] mb-10" style={{ color: '#3A4A42' }}>
          Find the kind of event you&apos;re looking for.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_CATEGORIES.map((cat) => {
            const count = countMap.get(cat.toLowerCase()) ?? 0;
            return (
              <Link
                key={cat}
                href={`/events/category/${catSlug(cat)}`}
                className="group flex items-center justify-between rounded-2xl px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}
              >
                <div>
                  <div
                    className="font-display font-semibold text-[17px] group-hover:text-[#1F4D3A] transition-colors"
                    style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}
                  >
                    {cat}
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: '#3A4A42' }}>
                    {count > 0
                      ? `${count} upcoming event${count !== 1 ? 's' : ''}`
                      : 'Explore this category'}
                  </div>
                </div>
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition group-hover:bg-[#1F4D3A] group-hover:text-white"
                  style={{ border: '1px solid #E5E0D4', color: '#1F4D3A' }}
                  aria-hidden
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
