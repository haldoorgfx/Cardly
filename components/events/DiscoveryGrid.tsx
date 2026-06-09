'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Globe } from 'lucide-react';
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

// Deterministic hue from event_id for cover placeholder colors
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

export function DiscoveryGrid({ pages }: { pages: PageWithSlug[] }) {
  const [activeFilter, setActiveFilter] = useState<Filter>('All');

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filtered = pages.filter(p => {
    const start = new Date(p.starts_at);
    if (activeFilter === 'This week') return start >= now && start <= weekEnd;
    if (activeFilter === 'Online') return p.is_online;
    return true;
  });

  function resolveSlug(p: PageWithSlug): string {
    return p.custom_slug ?? (p.events?.slug ?? p.event_id);
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="flex-none h-[34px] px-4 rounded-full text-[13px] font-medium transition whitespace-nowrap"
            style={{
              background: activeFilter === filter ? '#1F4D3A' : 'white',
              color: activeFilter === filter ? 'white' : '#3A4A42',
              border: `1px solid ${activeFilter === filter ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl flex items-center justify-center py-24 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <div>
            <div className="text-[16px] font-medium mb-2" style={{ color: '#0F1F18' }}>No events yet</div>
            <div className="text-[14px]" style={{ color: '#6B7A72' }}>
              Check back soon, or{' '}
              <Link href="/events/new" className="underline" style={{ color: '#1F4D3A' }}>host your own</Link>.
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map(p => (
            <EventCard key={p.id} page={p} slug={resolveSlug(p)} />
          ))}
        </div>
      )}
    </div>
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
            fontFamily: 'Inter, system-ui, sans-serif',
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
