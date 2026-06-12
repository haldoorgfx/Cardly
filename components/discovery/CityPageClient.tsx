'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, Globe, Filter, CalendarDays } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props { city: string; events: EventPage[] }

const DEMO_EVENTS: EventPage[] = [
  { id: '1', title: 'Nairobi Tech Summit 2026', cover_image_url: null, starts_at: '2026-09-12T08:00:00Z', city: 'Nairobi', is_online: false, price_from: 25, category: 'tech', custom_slug: null, events: { slug: 'nairobi-tech-summit' } },
  { id: '2', title: 'Nairobi Startup Weekend', cover_image_url: null, starts_at: '2026-10-03T09:00:00Z', city: 'Nairobi', is_online: false, price_from: 0, category: 'business', custom_slug: null, events: { slug: 'startup-weekend-nairobi' } },
  { id: '3', title: 'Design Systems Africa', cover_image_url: null, starts_at: '2026-10-20T10:00:00Z', city: 'Nairobi', is_online: false, price_from: 0, category: 'design', custom_slug: null, events: { slug: 'design-systems-africa' } },
  { id: '4', title: 'Nairobi Music Festival', cover_image_url: null, starts_at: '2026-11-08T18:00:00Z', city: 'Nairobi', is_online: false, price_from: 40, category: 'music', custom_slug: null, events: { slug: 'nairobi-music-fest' } },
  { id: '5', title: 'Africa Climate Forum', cover_image_url: null, starts_at: '2026-11-25T09:00:00Z', city: 'Nairobi', is_online: false, price_from: 0, category: 'community', custom_slug: null, events: { slug: 'climate-forum-nairobi' } },
  { id: '6', title: 'East Africa Fintech Week', cover_image_url: null, starts_at: '2026-12-05T08:00:00Z', city: 'Nairobi', is_online: false, price_from: 150, category: 'fintech', custom_slug: null, events: { slug: 'ea-fintech-week' } },
];

const CATEGORIES = ['All', 'Tech', 'Business', 'Design', 'Music', 'Arts', 'Food', 'Community', 'Fintech'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtDay(iso: string) { return new Date(iso).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' }); }
function fmtPrice(p: number | null) { return !p || p === 0 ? 'Free' : `From $${p}`; }
function getSlug(ep: EventPage) { return ep.custom_slug ?? ep.events?.slug ?? ep.id; }

export function CityPageClient({ city, events: dbEvents }: Props) {
  const events = dbEvents.length > 0 ? dbEvents : DEMO_EVENTS;
  const [catFilter, setCatFilter] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');

  const filtered = useMemo(() => events.filter((ep: EventPage) => {
    if (catFilter !== 'All' && !ep.category?.toLowerCase().includes(catFilter.toLowerCase())) return false;
    if (priceFilter === 'free' && ep.price_from > 0) return false;
    if (priceFilter === 'paid' && (!ep.price_from || ep.price_from === 0)) return false;
    return true;
  }), [events, catFilter, priceFilter]);

  // Group by day
  const byDay: Record<string, EventPage[]> = {};
  for (const ep of filtered) {
    if (!ep.starts_at) continue;
    const key = fmtDay(ep.starts_at);
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push(ep);
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />

      {/* Hero */}
      <div className="px-5 pt-10 pb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-[13px] mb-3" style={{ color: '#6B7A72' }}>
          <Link href="/events" style={{ color: '#1F4D3A' }}>Discover</Link>
          <span>›</span>
          <span>Cities</span>
          <span>›</span>
          <span style={{ color: '#0F1F18' }}>{city}</span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <MapPin size={22} style={{ color: '#1F4D3A' }} />
          <h1 className="font-title font-bold text-[32px]" style={{ color: '#0F1F18' }}>
            Events in {city}
          </h1>
        </div>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          {filtered.length} upcoming event{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-10 border-b px-5 py-3" style={{ background: 'rgba(250,246,238,0.97)', backdropFilter: 'blur(8px)', borderColor: '#E5E0D4' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Filter size={14} style={{ color: '#6B7A72' }} />
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition shrink-0"
                style={{
                  background: catFilter === cat ? '#1F4D3A' : '#FFFFFF',
                  color: catFilter === cat ? '#FAF6EE' : '#3A4A42',
                  border: `1px solid ${catFilter === cat ? '#1F4D3A' : '#E5E0D4'}`,
                }}>
                {cat}
              </button>
            ))}
            <div className="w-px shrink-0 mx-1" style={{ background: '#E5E0D4' }} />
            {[
              { key: 'all', label: 'Any price' },
              { key: 'free', label: 'Free' },
              { key: 'paid', label: 'Paid' },
            ].map(f => (
              <button key={f.key} onClick={() => setPriceFilter(f.key as 'all' | 'free' | 'paid')}
                className="px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition shrink-0"
                style={{
                  background: priceFilter === f.key ? '#E8EFEB' : '#FFFFFF',
                  color: priceFilter === f.key ? '#1F4D3A' : '#3A4A42',
                  border: `1px solid ${priceFilter === f.key ? '#1F4D3A' : '#E5E0D4'}`,
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events by day */}
      <div className="max-w-6xl mx-auto px-5 py-8">
        {Object.entries(byDay).map(([day, dayEvents]) => (
          <div key={day} className="mb-8">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase mb-3"
              style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
              {day}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(dayEvents as EventPage[]).map((ep: EventPage) => (
                <Link key={ep.id} href={`/e/${getSlug(ep)}`} className="block rounded-2xl overflow-hidden transition hover:shadow-lg"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                  <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                    {ep.cover_image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    {ep.category && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{ background: 'rgba(15,31,24,0.6)', color: '#FAF6EE', backdropFilter: 'blur(4px)' }}>
                        {ep.category}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-[13px] mb-1.5 line-clamp-2" style={{ color: '#0F1F18' }}>{ep.title}</h3>
                    <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: '#6B7A72' }}>
                      <Calendar size={10} /> {fmtDate(ep.starts_at)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px]" style={{ color: '#6B7A72' }}>
                        {ep.is_online ? <Globe size={10} /> : <MapPin size={10} />}
                        <span className="truncate">{ep.is_online ? 'Online' : ep.venue_name ?? ep.city}</span>
                      </div>
                      <span className="font-semibold text-[11px]" style={{ color: '#1F4D3A' }}>{fmtPrice(ep.price_from)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <MapPin size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>No events found in {city}</p>
            <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Try clearing the filters or check back soon</p>
          </div>
        )}

        {/* Subscribe CTA */}
        <div className="mt-6 rounded-2xl px-6 py-5 flex items-center gap-4"
          style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
          <CalendarDays size={24} style={{ color: '#1F4D3A' }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>
              Never miss events in {city}
            </p>
            <p className="text-[12px]" style={{ color: '#3A4A42' }}>
              Subscribe to get a weekly digest of upcoming events
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90 shrink-0"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
