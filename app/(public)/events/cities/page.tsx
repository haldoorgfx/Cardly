export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events by City',
  description: 'Browse upcoming events by city across East Africa and beyond.',
};

export default async function CitiesIndexPage() {
  const admin = createAdminClient();

  // city column added by migration 011_discovery_columns — shows empty state until applied
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pages } = await (admin as any)
    .from('event_pages')
    .select('city, events!inner(status)')
    .eq('is_public', true)
    .eq('events.status', 'published')
    .gte('ends_at', new Date().toISOString())
    .not('city', 'is', null);

  const countMap = new Map<string, number>();
  for (const row of pages ?? []) {
    if (!row.city) continue;
    countMap.set(row.city, (countMap.get(row.city) ?? 0) + 1);
  }

  const cities = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, count }));

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1120px] mx-auto px-5 py-12 pb-24">
        <nav className="text-[12px] mb-4" style={{ color: '#65736B' }}>
          <Link href="/events" style={{ color: '#65736B' }}>Events</Link>
          {' / '}
          <span style={{ color: '#0F1F18' }}>Cities</span>
        </nav>

        <h1
          className="font-display font-semibold mb-2"
          style={{ fontSize: 'clamp(24px,4vw,36px)', color: '#0F1F18', letterSpacing: '-0.025em' }}
        >
          Events by city
        </h1>
        <p className="text-[15px] mb-10" style={{ color: '#65736B' }}>
          {cities.length} cities with upcoming events
        </p>

        {cities.length === 0 ? (
          <p style={{ color: '#65736B' }}>No city data yet — events are coming soon.</p>
        ) : (
          <div
            className="rounded-2xl p-8"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {cities.map(({ city, count }) => (
                <Link
                  key={city}
                  href={`/events/city/${encodeURIComponent(city.toLowerCase().replace(/ /g, '-'))}`}
                  className="text-[14px] hover:text-[#1F4D3A] transition-colors"
                  style={{ color: '#0F1F18' }}
                >
                  {city}{' '}
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#65736B' }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
