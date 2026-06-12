'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Heart, MapPin, Calendar, Globe } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props {
  featured: EventPage | null;
  events: EventPage[];
}

const CATEGORIES = ['All', 'Music', 'Tech', 'Sports', 'Culture', 'Food', 'Business', 'Health'];

const DEMO_EVENTS: EventPage[] = [
  { id: '1', title: 'Lagos Tech Summit 2026', cover_image_url: null, starts_at: '2026-09-15T08:00:00Z', city: 'Lagos', is_online: false, price_from: 25, category: 'tech', custom_slug: null, events: { slug: 'lagos-tech-2026', profiles: { full_name: 'Karta Studio' } } },
  { id: '2', title: 'Sunset Sounds Festival', cover_image_url: null, starts_at: '2026-09-20T18:00:00Z', city: 'Nairobi', is_online: false, price_from: 0, category: 'music', custom_slug: null, events: { slug: 'sunset-sounds', profiles: { full_name: 'Blue Note DJ' } } },
  { id: '3', title: 'Founders Breakfast', cover_image_url: null, starts_at: '2026-10-01T08:00:00Z', city: 'Accra', is_online: false, price_from: 15, category: 'business', custom_slug: null, events: { slug: 'founders-breakfast', profiles: { full_name: 'Sahel Ventures' } } },
  { id: '4', title: 'Design in the Horn 2026', cover_image_url: null, starts_at: '2026-10-15T10:00:00Z', city: 'Djibouti', is_online: false, price_from: 20, category: 'culture', custom_slug: null, events: { slug: 'design-horn-2026', profiles: { full_name: 'Karta Studio' } } },
  { id: '5', title: 'East Africa Fintech Week', cover_image_url: null, starts_at: '2026-11-05T09:00:00Z', city: 'Nairobi', is_online: false, price_from: 150, category: 'tech', custom_slug: null, events: { slug: 'ea-fintech-week', profiles: { full_name: 'Fintech Africa' } } },
  { id: '6', title: 'Coastal Run 10K', cover_image_url: null, starts_at: '2026-11-20T07:00:00Z', city: 'Mombasa', is_online: false, price_from: 30, category: 'sports', custom_slug: null, events: { slug: 'coastal-run-10k', profiles: { full_name: 'City Council' } } },
  { id: '7', title: 'Red Sea Food Fair', cover_image_url: null, starts_at: '2026-12-01T10:00:00Z', city: 'Djibouti', is_online: false, price_from: 0, category: 'food', custom_slug: null, events: { slug: 'red-sea-food-fair', profiles: { full_name: 'City Council' } } },
  { id: '8', title: 'Virtual AI Summit', cover_image_url: null, starts_at: '2026-12-10T14:00:00Z', city: null, is_online: true, price_from: 0, category: 'tech', custom_slug: null, events: { slug: 'virtual-ai-summit', profiles: { full_name: 'AI Africa' } } },
];

function getSlug(ep: EventPage) { return ep.custom_slug ?? ep.events?.slug ?? ep.id; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' }); }

export function DiscoverHomeClient({ featured: dbFeatured, events: dbEvents }: Props) {
  const events = dbEvents.length > 0 ? dbEvents : DEMO_EVENTS;
  const featured = dbFeatured ?? events[0];
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => events.filter((ep: EventPage) => {
    if (activeCat !== 'All' && !ep.category?.toLowerCase().includes(activeCat.toLowerCase())) return false;
    if (query && !ep.title?.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [events, activeCat, query]);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-5 py-4 border-b" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <Link href="/" className="font-display font-bold text-[20px]" style={{ color: '#1F4D3A', textDecoration: 'none' }}>Karta</Link>
        <div className="hidden md:flex items-center gap-6 text-[13px] font-medium" style={{ color: '#3A4A42' }}>
          <Link href="/discover" style={{ color: '#1F4D3A', textDecoration: 'none' }}>Discover</Link>
          <Link href="/my-tickets" style={{ color: 'inherit', textDecoration: 'none' }}>My tickets</Link>
          <Link href="/saved" style={{ color: 'inherit', textDecoration: 'none' }}>Saved</Link>
        </div>
        <Link href="/login" className="px-4 py-1.5 rounded-xl text-[13px] font-semibold border transition hover:opacity-80"
          style={{ color: '#1F4D3A', borderColor: '#1F4D3A', textDecoration: 'none' }}>
          Host an event
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative px-5 py-14 text-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}>
        <h1 className="font-title font-bold text-[36px] sm:text-[44px] mb-3 mx-auto max-w-xl"
          style={{ color: '#FAF6EE', lineHeight: 1.1 }}>
          Find your next event
        </h1>
        <p className="text-[16px] mb-8 mx-auto max-w-md" style={{ color: 'rgba(250,246,238,0.8)' }}>
          Music, tech, food and culture worldwide. Register and get your Karta Card.
        </p>
        {/* Search */}
        <div className="flex items-center gap-2 max-w-lg mx-auto px-4 py-3 rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 4px 24px rgba(15,31,24,0.18)' }}>
          <Search size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search events, organizers, venues…"
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: '#0F1F18' }} />
          <Link href={`/search${query ? `?q=${query}` : ''}`}
            className="px-4 py-1.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 shrink-0"
            style={{ background: '#1F4D3A', color: '#FAF6EE', textDecoration: 'none' }}>
            Search
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)}
              className="px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 transition"
              style={{
                background: activeCat === cat ? '#1F4D3A' : '#FFFFFF',
                color: activeCat === cat ? '#FAF6EE' : '#3A4A42',
                border: `1px solid ${activeCat === cat ? '#1F4D3A' : '#E5E0D4'}`,
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Featured */}
        {featured && activeCat === 'All' && !query && (
          <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden mb-8"
            style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
            {featured.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,31,24,0.75) 0%, transparent 60%)' }} />

            <button onClick={() => toggleSave(featured.id)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
              style={{ background: 'rgba(15,31,24,0.5)', backdropFilter: 'blur(4px)' }}>
              <Heart size={16} style={{ color: saved.has(featured.id) ? '#E8C57E' : '#FFFFFF', fill: saved.has(featured.id) ? '#E8C57E' : 'none' }} />
            </button>

            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 flex items-end justify-between flex-wrap gap-3">
              <div>
                <div className="text-[11px] font-bold tracking-widest mb-2" style={{ color: '#E8C57E' }}>HAPPENING THIS MONTH</div>
                <h2 className="font-display font-bold text-[28px] mb-1" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
                  {featured.title}
                </h2>
                <p className="text-[13px]" style={{ color: 'rgba(250,246,238,0.75)' }}>
                  {featured.starts_at ? fmtDate(featured.starts_at) : ''}
                  {featured.city && ` · ${featured.city}`}
                  {featured.price_from ? ` · from $${featured.price_from}` : ' · Free'}
                </p>
              </div>
              <Link href={`/e/${getSlug(featured)}`}
                className="px-5 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 shrink-0"
                style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
                View event →
              </Link>
            </div>
          </div>
        )}

        {/* Events grid */}
        <div className="mb-3">
          <h2 className="font-display font-semibold text-[20px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {activeCat === 'All' ? 'This month' : activeCat}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((ep: EventPage) => (
            <div key={ep.id} className="rounded-2xl overflow-hidden transition hover:-translate-y-0.5"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <div className="relative aspect-[4/3]" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                {ep.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {ep.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                    style={{ background: 'rgba(15,31,24,0.6)', color: '#FAF6EE', backdropFilter: 'blur(4px)' }}>
                    {ep.category}
                  </span>
                )}
                <button onClick={() => toggleSave(ep.id)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: 'rgba(15,31,24,0.5)', backdropFilter: 'blur(4px)' }}>
                  <Heart size={14} style={{ color: saved.has(ep.id) ? '#E8C57E' : '#FFFFFF', fill: saved.has(ep.id) ? '#E8C57E' : 'none' }} />
                </button>
              </div>
              <Link href={`/e/${getSlug(ep)}`} style={{ textDecoration: 'none' }}>
                <div className="p-4">
                  <h3 className="font-semibold text-[14px] mb-0.5 line-clamp-1" style={{ color: '#1F4D3A' }}>{ep.title}</h3>
                  <p className="text-[12px] mb-2" style={{ color: '#6B7A72' }}>
                    {ep.events?.profiles?.full_name ?? 'Organizer'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: '#6B7A72' }}>
                      {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
                      {ep.starts_at && <><Calendar size={11} className="ml-1" /> {fmtDate(ep.starts_at)}</>}
                    </div>
                    <span className="font-semibold text-[13px]" style={{ color: ep.price_from ? '#1F4D3A' : '#C9A45E' }}>
                      {ep.price_from ? `$${ep.price_from}` : 'Free'}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl py-16 text-center mt-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <Search size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>No events found</p>
          </div>
        )}

        {/* Browse by city */}
        <div className="mt-10">
          <h2 className="font-display font-semibold text-[18px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Browse by city
          </h2>
          <div className="flex flex-wrap gap-2">
            {['Lagos', 'Nairobi', 'Accra', 'Dakar', 'Cape Town', 'Cairo', 'Kigali', 'Djibouti'].map(city => (
              <Link key={city} href={`/discover/cities/${city.toLowerCase()}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#FFFFFF', borderColor: '#E5E0D4', color: '#3A4A42', textDecoration: 'none' }}>
                <MapPin size={12} style={{ color: '#1F4D3A' }} /> {city}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
