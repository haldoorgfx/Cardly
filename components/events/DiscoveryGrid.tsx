'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Globe, Search } from 'lucide-react';
import { formatShortDate } from '@/lib/events/format';

type PageWithSlug = {
  id: string;
  event_id: string;
  title: string;
  tagline: string | null;
  cover_image_url: string | null;
  starts_at: string;
  ends_at: string;
  timezone: string;
  is_online: boolean;
  venue_name: string | null;
  venue_address: string | null;
  custom_slug: string | null;
  organizer_name: string | null;
  events: { slug: string } | null;
};

const FILTERS = ['All', 'This week', 'Free', 'Online'] as const;
type Filter = (typeof FILTERS)[number];

const CATEGORIES = ['All', 'Music', 'Tech', 'Sports', 'Culture', 'Food', 'Business', 'Health'] as const;
type Category = (typeof CATEGORIES)[number];

// Deterministic hue from event_id for cover placeholder colors
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export function DiscoveryGrid({ pages }: { pages: PageWithSlug[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filtered = pages.filter(p => {
    const start = new Date(p.starts_at);
    if (activeFilter === 'This week' && !(start >= now && start <= weekEnd)) return false;
    if (activeFilter === 'Online' && !p.is_online) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = p.title.toLowerCase().includes(q);
      const orgMatch = p.organizer_name?.toLowerCase().includes(q) ?? false;
      if (!titleMatch && !orgMatch) return false;
    }
    return true;
  });

  // Featured is first event in unfiltered list; exclude from grid
  const featured = pages.length > 0 ? pages[0] : null;
  const gridEvents = filtered.filter(p => p.id !== featured?.id);

  function resolveSlug(p: PageWithSlug): string {
    return p.custom_slug ?? (p.events?.slug ?? p.event_id);
  }

  function handleSearch() {
    setSearchQuery(searchInput);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div>
      {/* Hero search section */}
      <div className="mb-8">
        <h1
          className="font-display font-normal leading-tight mb-3"
          style={{ fontSize: 36, color: '#0F1F18', letterSpacing: '-0.02em' }}
        >
          Find your next event
        </h1>
        <p className="text-[16px] mb-6" style={{ color: '#6B7A72' }}>
          Discover events happening near you and around the world.
        </p>

        {/* Search input + button */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border: '1px solid #E5E0D4', background: '#FFFFFF', maxWidth: 560 }}
        >
          <div className="flex items-center flex-1 px-4 gap-3">
            <Search size={16} color="#6B7A72" strokeWidth={2} />
            <input
              type="text"
              placeholder="Search events or organizers..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 py-3 text-[14px] outline-none bg-transparent"
              style={{ color: '#0F1F18' }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="h-full px-5 py-3 text-[14px] font-medium transition-colors"
            style={{ background: '#1F4D3A', color: 'white', borderLeft: '1px solid #163828' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#163828')}
            onMouseLeave={e => (e.currentTarget.style.background = '#1F4D3A')}
          >
            Search
          </button>
        </div>
      </div>

      {/* Category chips rail */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="flex-none h-[34px] px-4 rounded-full text-[13px] font-medium transition whitespace-nowrap"
            style={{
              background: activeCategory === cat ? '#1F4D3A' : 'white',
              color: activeCategory === cat ? 'white' : '#3A4A42',
              border: `1px solid ${activeCategory === cat ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Functional filter chips (secondary row) */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="flex-none h-[30px] px-3.5 rounded-full text-[12px] font-medium transition whitespace-nowrap"
            style={{
              background: activeFilter === filter ? '#E8EFEB' : 'transparent',
              color: activeFilter === filter ? '#1F4D3A' : '#6B7A72',
              border: `1px solid ${activeFilter === filter ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Featured event banner */}
      {featured && filtered.some(p => p.id === featured.id) && (
        <div className="mb-10">
          <FeaturedBanner page={featured} slug={resolveSlug(featured)} />
        </div>
      )}

      {/* This month section */}
      <div className="mb-5">
        <h2
          className="font-display font-normal"
          style={{ fontSize: 20, color: '#0F1F18', letterSpacing: '-0.01em' }}
        >
          This month
        </h2>
      </div>

      {gridEvents.length === 0 && filtered.length === 0 ? (
        <div
          className="rounded-2xl flex items-center justify-center py-24 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <div>
            <div className="text-[16px] font-medium mb-2" style={{ color: '#0F1F18' }}>No events found</div>
            <div className="text-[14px]" style={{ color: '#6B7A72' }}>
              Try a different search, or{' '}
              <Link href="/events/new" className="underline" style={{ color: '#1F4D3A' }}>host your own</Link>.
            </div>
          </div>
        </div>
      ) : gridEvents.length === 0 ? (
        <div
          className="rounded-2xl flex items-center justify-center py-16 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <div className="text-[14px]" style={{ color: '#6B7A72' }}>No other events this month.</div>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {gridEvents.map(p => (
            <EventCard key={p.id} page={p} slug={resolveSlug(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedBanner({ page, slug }: { page: PageWithSlug; slug: string }) {
  const hue = hueFromId(page.event_id);

  return (
    <Link
      href={`/e/${slug}`}
      className="block relative rounded-2xl overflow-hidden"
      style={{ height: 340 }}
    >
      {/* Background image or gradient */}
      {page.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={page.cover_image_url}
          alt={page.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              hsl(${hue}, 40%, 16%) 0%,
              hsl(${hue}, 35%, 26%) 60%,
              hsl(${(hue + 40) % 360}, 50%, 38%) 100%)`,
          }}
        />
      )}

      {/* Gradient scrim overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(5,12,8,0.82) 0%, rgba(5,12,8,0.4) 50%, transparent 100%)',
        }}
      />

      {/* HAPPENING THIS WEEK badge */}
      <div className="absolute top-5 left-5">
        <span
          className="text-[11px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full"
          style={{
            background: '#E8C57E',
            color: '#0F1F18',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.08em',
          }}
        >
          Happening this week
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-7 flex items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2
            className="font-display font-normal text-white leading-tight mb-2 line-clamp-2"
            style={{ fontSize: 28, letterSpacing: '-0.02em' }}
          >
            {page.title}
          </h2>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'JetBrains Mono, monospace' }}>
            {formatShortDate(page.starts_at, page.timezone)}
            {page.venue_name ? ` · ${page.venue_name}` : page.is_online ? ' · Online' : ''}
          </p>
        </div>

        {/* View event button */}
        <div
          className="flex-none flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-medium transition-transform hover:scale-[1.03]"
          style={{ background: '#E8C57E', color: '#0F1F18' }}
        >
          View event
          <span style={{ fontSize: 16 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

function EventCard({ page, slug }: { page: PageWithSlug; slug: string }) {
  const hue = hueFromId(page.event_id);
  const locationLine = page.is_online
    ? 'Online'
    : page.venue_name ?? page.venue_address ?? 'Location TBA';

  return (
    <Link
      href={`/e/${slug}`}
      className="group block rounded-2xl overflow-hidden transition"
      style={{
        background: 'white',
        border: '1px solid #E5E0D4',
        boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,31,24,0.04)')}
    >
      {/* Cover image — 4:3 aspect */}
      <div className="relative overflow-hidden" style={{ paddingTop: '75%' }}>
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.03]"
            style={{ transitionDuration: '400ms' }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg,
                hsl(${hue}, 40%, 18%) 0%,
                hsl(${hue}, 35%, 28%) 60%,
                hsl(${(hue + 40) % 360}, 55%, 45%) 100%)`,
            }}
          />
        )}
        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.6) 0%, transparent 50%)' }}
        />
        {/* Date badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-medium"
          style={{
            background: 'rgba(10,20,14,0.6)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,255,255,0.9)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {formatShortDate(page.starts_at, page.timezone)}
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div
          className="font-display font-medium text-[15px] leading-snug mb-1.5 group-hover:text-[#1F4D3A] transition-colors line-clamp-2"
          style={{ color: '#0F1F18' }}
        >
          {page.title}
        </div>
        {page.organizer_name && (
          <div className="text-[12px] mb-2 truncate" style={{ color: '#6B7A72' }}>
            {page.organizer_name}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#6B7A72' }}>
          {page.is_online
            ? <Globe size={12} strokeWidth={2} />
            : <MapPin size={12} strokeWidth={2} />
          }
          <span className="truncate">{locationLine}</span>
        </div>
      </div>
    </Link>
  );
}
