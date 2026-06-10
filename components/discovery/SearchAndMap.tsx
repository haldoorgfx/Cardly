'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Minus, RefreshCw } from 'lucide-react';
import type { DiscoveryEvent } from './EventCard';

interface SearchAndMapProps {
  events: DiscoveryEvent[];
  savedIds: string[];
  query: string;
  totalCount: number;
  cityParam: string;
}

// Pin component — positioned on the CSS-drawn map
function MapPin({
  event,
  pct,
  hovered,
  onHover,
}: {
  event: DiscoveryEvent;
  pct: { x: number; y: number };
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const priceLabel =
    event.price_from === 0
      ? 'Free'
      : event.price_from != null
      ? `$${event.price_from % 1 === 0 ? event.price_from.toFixed(0) : event.price_from.toFixed(2)}`
      : '···';

  return (
    <Link
      href={`/e/${event.custom_slug ?? event.events?.slug ?? event.event_id}`}
      className="absolute flex flex-col items-center"
      style={{
        left: `${pct.x}%`,
        top: `${pct.y}%`,
        transform: 'translate(-50%, -100%)',
        zIndex: hovered ? 3 : 1,
        transition: 'z-index 0s',
      }}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Bubble */}
      <div
        className="px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all"
        style={{
          background: hovered ? '#1F4D3A' : '#FFFFFF',
          color: hovered ? '#E8C57E' : '#0F1F18',
          border: `1.5px solid ${hovered ? '#1F4D3A' : '#E5E0D4'}`,
          boxShadow: hovered ? '0 4px 12px rgba(15,31,24,0.2)' : '0 1px 3px rgba(15,31,24,0.1)',
          transform: hovered ? 'scale(1.12)' : 'scale(1)',
          fontFamily: '"JetBrains Mono", monospace',
        }}
      >
        {priceLabel}
      </div>
      {/* Tail */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: `6px solid ${hovered ? '#1F4D3A' : '#FFFFFF'}`,
          marginTop: -1,
          filter: hovered ? 'none' : 'drop-shadow(0 1px 0px rgba(0,0,0,0.1))',
        }}
      />
    </Link>
  );
}

// Normalize lat/lng to % position within the map's bounding box
function toMapPct(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): { x: number; y: number } {
  const pad = 0.1; // 10% padding
  const latRange = (bounds.maxLat - bounds.minLat) || 1;
  const lngRange = (bounds.maxLng - bounds.minLng) || 1;
  const x = pad * 100 + ((lng - bounds.minLng) / lngRange) * (100 - 2 * pad * 100);
  const y = pad * 100 + ((bounds.maxLat - lat) / latRange) * (100 - 2 * pad * 100);
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

export function SearchAndMap({ events, savedIds, query: initialQuery, totalCount, cityParam }: SearchAndMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [savedSet, setSavedSet] = useState(new Set(savedIds));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Events with coordinates for map
  const mappable = events.filter(e => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = e as any;
    return typeof p.venue_lat === 'number' && typeof p.venue_lng === 'number';
  });

  // Compute bounding box
  const bounds = mappable.reduce(
    (acc, e) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = e as any;
      return {
        minLat: Math.min(acc.minLat, p.venue_lat),
        maxLat: Math.max(acc.maxLat, p.venue_lat),
        minLng: Math.min(acc.minLng, p.venue_lng),
        maxLng: Math.max(acc.maxLng, p.venue_lng),
      };
    },
    { minLat: Infinity, maxLat: -Infinity, minLng: Infinity, maxLng: -Infinity }
  );

  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: 'calc(100vh - 64px)' }}>

      {/* ── Left list pane ──────────────────────────────────── */}
      <div
        className={`${mobileView === 'map' ? 'hidden' : 'flex'} md:flex flex-col`}
        style={{ width: '100%', maxWidth: 480, borderRight: '1px solid #E5E0D4', flexShrink: 0 }}
      >
        {/* Search input */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
            <input
              type="text"
              value={q}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search events, artists, topics…"
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[14px] outline-none"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
            {['All', 'Free', 'This week', 'Online', 'Music', 'Tech'].map(chip => (
              <Link
                key={chip}
                href={buildChipHref(chip, searchParams)}
                className="flex-none h-[28px] px-3 rounded-full text-[12px] font-medium whitespace-nowrap"
                style={{ background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }}
              >
                {chip}
              </Link>
            ))}
          </div>
        </div>

        {/* Result count */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <p className="text-[12px]" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
            {totalCount} event{totalCount !== 1 ? 's' : ''} match{totalCount === 1 ? 'es' : ''}{cityParam ? ` in ${cityParam}` : ''}
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-3 px-3" style={{ scrollbarWidth: 'thin' }}>
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events found</p>
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>Try a different search or adjust the filters.</p>
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

      {/* ── Right map pane ──────────────────────────────────── */}
      <div
        className={`${mobileView === 'list' ? 'hidden' : 'flex'} md:flex flex-1 relative overflow-hidden`}
        style={{ minHeight: 400, background: '#E8EFEB' }}
      >
        {/* Street grid CSS map */}
        <div className="absolute inset-0" style={{
          background: '#E8EFEB',
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            'linear-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.25) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '80px 80px, 80px 80px, 20px 20px, 20px 20px',
        }} />

        {/* Water region */}
        <div
          className="absolute"
          style={{
            right: 0,
            top: 0,
            width: '35%',
            height: '60%',
            background: 'linear-gradient(135deg, #B8D4E8 0%, #9DC0D8 100%)',
            borderRadius: '0 0 0 60%',
            opacity: 0.7,
          }}
        />

        {/* Park region */}
        <div
          className="absolute"
          style={{
            left: '15%',
            top: '45%',
            width: '20%',
            height: '15%',
            background: '#C8DFC0',
            borderRadius: '50% 40% 45% 55%',
            opacity: 0.8,
          }}
        />

        {/* Search area button */}
        <button
          className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 h-9 rounded-full text-[13px] font-medium z-10"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 2px 8px rgba(15,31,24,0.1)', color: '#0F1F18' }}
          onClick={() => { /* cosmetic in M2 */ }}
        >
          <RefreshCw size={13} style={{ color: '#6B7A72' }} />
          Search this area
        </button>

        {/* Map controls */}
        <div
          className="absolute top-4 right-4 flex flex-col gap-1 z-10"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(15,31,24,0.1)' }}
        >
          <button className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
            <Plus size={14} />
          </button>
          <div style={{ height: 1, background: '#E5E0D4' }} />
          <button className="w-9 h-9 flex items-center justify-center hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
            <Minus size={14} />
          </button>
        </div>

        {/* Map pins */}
        {mappable.length > 0 && bounds.minLat !== Infinity && mappable.map(ev => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = ev as any;
          const pct = toMapPct(p.venue_lat, p.venue_lng, bounds);
          return (
            <MapPin
              key={ev.id}
              event={ev}
              pct={pct}
              hovered={hoveredId === ev.id}
              onHover={setHoveredId}
            />
          );
        })}

        {/* No mappable events message */}
        {mappable.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-xl px-5 py-4 text-center"
              style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid #E5E0D4' }}
            >
              <p className="text-[13px] font-medium mb-1" style={{ color: '#0F1F18' }}>No map data</p>
              <p className="text-[12px]" style={{ color: '#6B7A72' }}>Events don&apos;t have location coordinates yet.</p>
            </div>
          </div>
        )}
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
              background: mobileView === view ? '#E8C57E' : '#FFFFFF',
              color: mobileView === view ? '#0F1F18' : '#3A4A42',
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
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {event.category && (
            <div className="text-[11px] font-medium mb-0.5" style={{ color: '#E8C57E', fontFamily: '"JetBrains Mono", monospace' }}>
              {event.category}
            </div>
          )}
          <div className="font-medium text-[14px] leading-snug line-clamp-2" style={{ color: '#0F1F18' }}>
            {event.title}
          </div>
          <div className="text-[12px] mt-1" style={{ color: '#6B7A72' }}>
            {new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {(event.city || event.venue_name) && ` · ${event.city ?? event.venue_name}`}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          {priceLabel && (
            <span
              className="text-[12px] font-semibold"
              style={{
                color: event.price_from === 0 ? '#C9A45E' : '#1F4D3A',
                fontFamily: '"JetBrains Mono", monospace',
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
            <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? '#E8C57E' : 'none'} stroke={saved ? '#E8C57E' : '#6B7A72'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

function buildChipHref(chip: string, searchParams: ReturnType<typeof useSearchParams>): string {
  const params = new URLSearchParams(searchParams.toString());
  if (chip === 'All') {
    params.delete('category');
    params.delete('free');
    params.delete('date');
  } else if (chip === 'Free') {
    params.set('free', 'true');
    params.delete('category');
  } else if (chip === 'This week') {
    params.set('date', 'week');
  } else if (chip === 'Online') {
    params.set('format', 'online');
  } else {
    params.set('category', chip.toLowerCase());
    params.delete('free');
  }
  return `/events/search?${params.toString()}`;
}
