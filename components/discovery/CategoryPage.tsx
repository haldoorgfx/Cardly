'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { EventCard, type DiscoveryEvent } from './EventCard';

const ALL_CATEGORIES = ['Tech', 'Music', 'Business', 'Culture', 'Food', 'Sports', 'Health', 'Film', 'Education'] as const;

interface CityCount { city: string; count: number }

interface CategoryPageProps {
  category: string;
  events: DiscoveryEvent[];
  savedIds: string[];
  cityCounts: CityCount[];
}

export function CategoryPage({ category, events, savedIds, cityCounts }: CategoryPageProps) {
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
    try {
      if (save) {
        await fetch('/api/account/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_page_id: pageId }),
        });
      } else {
        await fetch(`/api/account/saved?event_page_id=${pageId}`, { method: 'DELETE' });
      }
    } catch { /* optimistic */ }
  }, []);

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
            backgroundImage: 'radial-gradient(circle, #1F4D3A 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <nav className="text-[12px] mb-3" style={{ color: '#6B7A72' }}>
            <Link href="/events" style={{ color: '#6B7A72' }}>Events</Link>
            {' / '}
            <Link href="/events/categories" style={{ color: '#6B7A72' }}>Categories</Link>
            {' / '}
            <span style={{ color: '#0F1F18' }}>{category}</span>
          </nav>
          <h1
            className="font-display font-semibold mb-2"
            style={{ fontSize: 'clamp(24px,4vw,40px)', color: '#1F4D3A', letterSpacing: '-0.025em' }}
          >
            {category} events
          </h1>
          <p className="text-[13px] mb-6" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
            {events.length} upcoming Â· East Africa &amp; beyond
          </p>

          {/* Category chip rail */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {ALL_CATEGORIES.map(cat => (
              <Link
                key={cat}
                href={`/events/category/${cat.toLowerCase()}`}
                className="flex-none h-[30px] px-4 rounded-full text-[12px] font-medium whitespace-nowrap transition"
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
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="h-9 px-3 rounded-full text-[13px] outline-none"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="all">All cities</option>
          {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="h-9 px-3 rounded-full text-[13px] outline-none"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="any">Any date</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>

        <select
          value={priceFilter}
          onChange={e => setPriceFilter(e.target.value)}
          className="h-9 px-3 rounded-full text-[13px] outline-none"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="any">Any price</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select
          value={formatFilter}
          onChange={e => setFormatFilter(e.target.value)}
          className="h-9 px-3 rounded-full text-[13px] outline-none"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          <option value="all">In-person + virtual</option>
          <option value="inperson">In-person</option>
          <option value="online">Virtual</option>
        </select>
      </div>

      {/* Event sections */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl flex items-center justify-center py-20 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
          <div>
            <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events match</div>
            <div className="text-[13px]" style={{ color: '#6B7A72' }}>Try adjusting the filters.</div>
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
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#6B7A72' }}>
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

