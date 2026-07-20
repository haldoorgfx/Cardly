'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventCard, type DiscoveryEvent } from './EventCard';
import { toggleSavedEvent } from '@/components/shared/saveEvent';
import { EVENT_CATEGORIES, categorySlug } from '@/lib/categories';

const ALL_CATEGORIES = EVENT_CATEGORIES;

interface CityCount { city: string; count: number }

interface CategoryPageProps {
  category: string;
  events: DiscoveryEvent[];
  savedIds: string[];
  cityCounts: CityCount[];
}

export function CategoryPage({ category, events, savedIds, cityCounts }: CategoryPageProps) {
  const router = useRouter();
  const [savedSet, setSavedSet] = useState(new Set(savedIds));
  const [cityFilter, setCityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('any');
  const [priceFilter, setPriceFilter] = useState('any');
  const [formatFilter, setFormatFilter] = useState('all');

  const handleSave = useCallback(async (pageId: string, save: boolean) => {
    setSavedSet(prev => {
      const next = new Set(prev);
      if (save) { next.add(pageId); } else { next.delete(pageId); }
      return next;
    });
    const { unauthorized } = await toggleSavedEvent(pageId, save);
    if (unauthorized) {
      setSavedSet(prev => {
        const next = new Set(prev);
        if (save) { next.delete(pageId); } else { next.add(pageId); }
        return next;
      });
      router.push(`/account/login?next=${encodeURIComponent(`/events/category/${categorySlug(category)}`)}`);
    }
  }, [router, category]);

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filtered = events.filter(ev => {
    const start = new Date(ev.starts_at);
    if (cityFilter !== 'all' && (ev.city ?? '') !== cityFilter) return false;
    if (dateFilter === 'week' && start > weekEnd) return false;
    if (dateFilter === 'month' && start > monthEnd) return false;
    if (priceFilter === 'free' && (ev.price_from ?? -1) !== 0) return false;
    if (priceFilter === 'paid' && ev.price_from === 0) return false;
    if (formatFilter === 'online' && !ev.is_online) return false;
    if (formatFilter === 'inperson' && ev.is_online) return false;
    return true;
  });

  const happening = filtered.filter(ev => new Date(ev.starts_at) <= weekEnd);
  const popular = filtered.filter(ev => new Date(ev.starts_at) > weekEnd).slice(0, 8);

  const uniqueCities = Array.from(new Set(events.map(e => e.city).filter(Boolean) as string[]));

  return (
    <div className="pb-24">
      {/* Hero */}
      <div
        className="rounded-2xl px-6 py-10 mb-8 relative overflow-hidden"
        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
      >
        <div
          className="absolute inset-0 opacity-5 pointer-events-none rounded-2xl"
          style={{
          }}
        />
        <div className="relative">
          <nav className="text-[12px] mb-3" style={{ color: '#65736B' }}>
            <Link href="/events" style={{ color: '#65736B' }}>Events</Link>
            {' / '}
            <span>Categories</span>
            {' / '}
            <span style={{ color: '#0F1F18' }}>{category}</span>
          </nav>
          <h1
            className="font-display font-semibold mb-2"
            style={{ fontSize: 'clamp(24px,4vw,40px)', color: '#0F1F18', letterSpacing: '-0.025em' }}
          >
            {category} events
          </h1>
          <p className="text-[13px] mb-6" style={{ color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {events.length} upcoming &middot; East Africa &amp; beyond
          </p>

          {/* Category chip rail */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ALL_CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/events/category/${categorySlug(cat)}`}
                className="inline-flex items-center justify-center flex-none h-8 px-4 rounded-full text-[12px] font-medium whitespace-nowrap transition"
                style={{
                  background: cat === category ? '#1F4D3A' : '#FFFFFF',
                  color: cat === category ? '#FFFFFF' : '#3A4A42',
                  border: `1px solid ${cat === category ? '#1F4D3A' : '#E5E0D4'}`,
                }}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-2 mb-8">
        <div className="relative">
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="h-9 pl-4 pr-8 rounded-full text-[13px] outline-none appearance-none cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <option value="all">All cities</option>
            {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#65736B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <div className="relative">
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="h-9 pl-4 pr-8 rounded-full text-[13px] outline-none appearance-none cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <option value="any">Any date</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#65736B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <div className="relative">
          <select
            value={priceFilter}
            onChange={e => setPriceFilter(e.target.value)}
            className="h-9 pl-4 pr-8 rounded-full text-[13px] outline-none appearance-none cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <option value="any">Any price</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#65736B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <div className="relative">
          <select
            value={formatFilter}
            onChange={e => setFormatFilter(e.target.value)}
            className="h-9 pl-4 pr-8 rounded-full text-[13px] outline-none appearance-none cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            <option value="all">In-person + virtual</option>
            <option value="inperson">In-person</option>
            <option value="online">Virtual</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#65736B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* Event sections */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl flex items-center justify-center py-20 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
          <div>
            <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events match</div>
            <div className="text-[13px]" style={{ color: '#65736B' }}>Try adjusting the filters.</div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {happening.length > 0 && (
            <Section label="Happening soon" events={happening.slice(0, 8)} savedSet={savedSet} onSave={handleSave} tagMode="city" />
          )}
          {popular.length > 0 && (
            <Section label="Popular this month" events={popular} savedSet={savedSet} onSave={handleSave} tagMode="city" />
          )}
        </div>
      )}

      {/* City links */}
      {cityCounts.length > 0 && (
        <div className="mt-12 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h3 className="font-display font-semibold text-[16px] mb-4" style={{ color: '#0F1F18' }}>
            {category} events by city
          </h3>
          <div className="flex flex-wrap gap-x-8 gap-y-2.5">
            {cityCounts.map(({ city, count }) => (
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
  );
}

function Section({
  label,
  events,
  savedSet,
  onSave,
  tagMode,
}: {
  label: string;
  events: DiscoveryEvent[];
  savedSet: Set<string>;
  onSave: (id: string, save: boolean) => void;
  tagMode: 'category' | 'city';
}) {
  return (
    <div>
      <h2 className="font-display font-semibold text-[20px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
        {label}
      </h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        {events.map(ev => (
          <EventCard
            key={ev.id}
            page={ev}
            saved={savedSet.has(ev.id)}
            onSave={onSave}
            tagMode={tagMode}
          />
        ))}
      </div>
    </div>
  );
}

