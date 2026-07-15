'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import type { DiscoveryEvent } from './EventCard';
import { GoogleMapView } from './GoogleMapView';
import { toggleSavedEvent } from '@/components/shared/saveEvent';

interface SearchAndMapProps {
  events: DiscoveryEvent[];
  savedIds: string[];
  query: string;
  totalCount: number;
  cityParam: string;
}


export function SearchAndMap({ events, savedIds, query: initialQuery, totalCount, cityParam }: SearchAndMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [savedSet, setSavedSet] = useState(new Set(savedIds));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBoundsChange(bounds: { n: number; s: number; e: number; w: number }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('n', bounds.n.toFixed(5));
    params.set('s', bounds.s.toFixed(5));
    params.set('e', bounds.e.toFixed(5));
    params.set('w', bounds.w.toFixed(5));
    router.push(`/events/search?${params.toString()}`);
  }

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
      router.push(`/account/login?next=${encodeURIComponent(`/events/search?${searchParams.toString()}`)}`);
    }
  }, [router, searchParams]);

  function pushSearch(newQ: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newQ) params.set('q', newQ);
    else params.delete('q');
    router.push(`/events/search?${params.toString()}`);
  }

  function handleSearchChange(val: string) {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushSearch(val), 400);
  }

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return (
    <div className="flex flex-col md:flex-row md:min-h-[calc(100vh-64px)]">

      {/* ── Left list pane ──────────────────────────────────── */}
      <div
        className={`${mobileView === 'map' ? 'hidden' : 'flex'} md:flex flex-col`}
        style={{ width: '100%', maxWidth: 480, borderRight: '1px solid #E5E0D4', flexShrink: 0 }}
      >
        {/* Search input */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#65736B' }} />
            <input
              type="text"
              value={q}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search events, artists, topics…"
              aria-label="Search events, artists, topics"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[14px] outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            />
          </div>

          {/* Filter chips — text centered, wraps responsively */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['All', 'Free', 'This week', 'Online', 'Music', 'Tech', 'Sports', 'Culture', 'Food', 'Business', 'Health', 'Arts'].map(chip => {
              const active = isChipActive(chip, searchParams);
              return (
                <Link
                  key={chip}
                  href={buildChipHref(chip, searchParams)}
                  className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[12px] leading-none font-medium whitespace-nowrap transition-colors"
                  style={active
                    ? { background: '#1F4D3A', color: '#FFFFFF', border: '1px solid #1F4D3A' }
                    : { background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }
                  }
                >
                  {chip}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Result count */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <p className="text-[12px]" style={{ color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {totalCount} event{totalCount !== 1 ? 's' : ''} match{totalCount === 1 ? 'es' : ''}{cityParam ? ` in ${cityParam}` : ''}
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-3 px-3" style={{ scrollbarWidth: 'thin' }}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events found</p>
              <p className="text-[13px]" style={{ color: '#65736B' }}>Try a different search or adjust the filters.</p>
            </div>
          ) : (
            events.map(ev => (
              <ResultCard
                key={ev.id}
                event={ev}
                saved={savedSet.has(ev.id)}
                onSave={handleSave}
                hovered={hoveredId === ev.id}
                onHover={setHoveredId}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right map pane — real Google Maps ───────────────── */}
      <div
        className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 relative overflow-hidden`}
        style={{ minHeight: 400 }}
      >
        <GoogleMapView
          events={events}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onBoundsChange={handleBoundsChange}
        />
      </div>

      {/* ── Mobile view toggle ──────────────────────────────── */}
      <div
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex rounded-full overflow-hidden"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 4px 16px rgba(15,31,24,0.15)' }}
      >
        {(['list', 'map'] as const).map(view => (
          <button
            key={view}
            onClick={() => setMobileView(view)}
            className="h-11 px-6 text-[14px] font-medium capitalize transition-colors"
            style={{
              background: mobileView === view ? '#1F4D3A' : '#FFFFFF',
              color: mobileView === view ? '#FFFFFF' : '#3A4A42',
            }}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultCard({
  event,
  saved,
  onSave,
  hovered,
  onHover,
}: {
  event: DiscoveryEvent;
  saved: boolean;
  onSave: (id: string, save: boolean) => void;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const priceLabel =
    event.price_from === 0 ? 'Free' :
    event.price_from != null ? `$${event.price_from % 1 === 0 ? event.price_from.toFixed(0) : event.price_from.toFixed(2)}` :
    null;

  const slug = event.custom_slug ?? event.events?.slug ?? event.event_id;

  function handleSaveClick(e: React.MouseEvent) {
    e.preventDefault();
    onSave(event.id, !saved);
  }

  return (
    <Link
      href={`/e/${slug}`}
      className="flex gap-3 rounded-xl p-3 mb-1 transition"
      style={{
        background: hovered ? '#F0F5F2' : 'transparent',
        border: `1px solid ${hovered ? '#1F4D3A' : 'transparent'}`,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Thumbnail */}
      <div className="relative rounded-lg overflow-hidden shrink-0" style={{ width: 132, height: 88 }}>
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: '#E8EFEB' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {event.category && (
            <div className="text-[11px] font-medium mb-0.5" style={{ color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {event.category}
            </div>
          )}
          <div className="font-medium text-[14px] leading-snug line-clamp-2" style={{ color: '#0F1F18' }}>
            {event.title}
          </div>
          <div className="text-[12px] mt-1" style={{ color: '#65736B' }}>
            {new Date(event.starts_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            {(event.city || event.venue_name) && ` · ${event.city ?? event.venue_name}`}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          {priceLabel && (
            <span
              className="text-[12px] font-semibold"
              style={{
                color: event.price_from === 0 ? '#C9A45E' : '#1F4D3A',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {priceLabel}
            </span>
          )}
          <button
            onClick={handleSaveClick}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-full transition hover:bg-[#E8EFEB]"
            aria-label={saved ? 'Unsave' : 'Save'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? '#E8C57E' : 'none'} stroke={saved ? '#E8C57E' : '#65736B'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

function isChipActive(chip: string, searchParams: ReturnType<typeof useSearchParams>): boolean {
  const cat = searchParams.get('category');
  const free = searchParams.get('free');
  const date = searchParams.get('date');
  const format = searchParams.get('format');
  if (chip === 'All') return !cat && !free && !date && !format;
  if (chip === 'Free') return free === 'true';
  if (chip === 'This week') return date === 'week';
  if (chip === 'Online') return format === 'online';
  return cat?.toLowerCase() === chip.toLowerCase();
}

function buildChipHref(chip: string, searchParams: ReturnType<typeof useSearchParams>): string {
  const params = new URLSearchParams(searchParams.toString());
  const active = isChipActive(chip, searchParams);
  if (chip === 'All') {
    params.delete('category');
    params.delete('free');
    params.delete('date');
    params.delete('format');
  } else if (chip === 'Free') {
    if (active) params.delete('free');
    else { params.set('free', 'true'); params.delete('category'); }
  } else if (chip === 'This week') {
    if (active) params.delete('date');
    else params.set('date', 'week');
  } else if (chip === 'Online') {
    if (active) params.delete('format');
    else params.set('format', 'online');
  } else {
    // Category chip — toggle off if it's the active one, else select it.
    if (active) params.delete('category');
    else { params.set('category', chip.toLowerCase()); params.delete('free'); }
  }
  return `/events/search?${params.toString()}`;
}
