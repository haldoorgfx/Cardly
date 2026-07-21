'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState } from 'react';

export type DiscoveryEvent = {
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
  city?: string | null;
  category?: string | null;
  price_from?: number | null;
  organizer_name: string | null;
  custom_slug: string | null;
  series_name: string | null;
  events: { slug: string; user_id: string } | null;
};

interface EventCardProps {
  page: DiscoveryEvent;
  saved?: boolean;
  onSave?: (id: string, saved: boolean) => void;
  /** show city tag instead of category tag (used on category pages) */
  tagMode?: 'category' | 'city';
  /** show trend badge e.g. "+12 this week" */
  trendBadge?: string | null;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
}

const CAT_COLORS: Record<string, string> = {
  tech: '#1F4D3A', music: '#C0436B', business: '#2C5BAA', sports: '#D2853A',
  arts: '#7C4DC4', culture: '#7C4DC4', food: '#2D7A4F', health: '#C0436B', education: '#1F4D3A',
};

function fmtEventDate(iso: string, tz: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

function resolveSlug(page: DiscoveryEvent): string {
  return page.custom_slug ?? (page.events?.slug ?? page.event_id);
}

// The feed keeps ongoing/multi-day events visible (sorted by starts_at) until
// ends_at passes, so an event that started yesterday can still rank above
// events starting next week. Without a cue, that reads as a stale date.
function isLiveNow(page: DiscoveryEvent): boolean {
  const now = Date.now();
  const starts = new Date(page.starts_at).getTime();
  if (!(starts < now)) return false;
  const ends = new Date(page.ends_at).getTime();
  return !(ends < now);
}

export function EventCard({
  page,
  saved: initialSaved = false,
  onSave,
  tagMode = 'category',
  trendBadge,
  isHovered,
  onHover,
}: EventCardProps) {
  const [saved, setSaved] = useState(initialSaved);
  const slug = resolveSlug(page);

  const tagLabel = tagMode === 'city' ? page.city : page.category;

  const priceLabel =
    page.price_from == null
      ? null
      : page.price_from === 0
      ? 'Free'
      : `$${page.price_from % 1 === 0 ? page.price_from.toFixed(0) : page.price_from.toFixed(2)}`;

  const priceColor = page.price_from === 0 ? '#E8C57E' : '#1F4D3A';

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    onSave?.(page.id, next);
  }

  return (
    <Link
      href={`/e/${slug}`}
      className="group block rounded-2xl overflow-hidden transition"
      style={{
        background: '#FFFFFF',
        border: `1px solid ${isHovered ? '#1F4D3A' : '#E5E0D4'}`,
        boxShadow: isHovered
          ? '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)'
          : '0 1px 2px rgba(15,31,24,0.04)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={() => onHover?.(page.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Cover — 4:3 */}
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
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: '#1F4D3A' }}
          >
            <span
              aria-hidden
              style={{
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontSize: 'clamp(48px, 9vw, 88px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'rgba(232,197,126,0.20)',
                lineHeight: 1,
              }}
            >
              {(page.title?.trim()?.[0] ?? 'E').toUpperCase()}
            </span>
          </div>
        )}

        {/* Bottom scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.55) 0%, transparent 50%)' }}
        />

        {/* Category/city tag — top left */}
        {tagLabel && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold capitalize"
            style={
              tagMode === 'category'
                ? { background: CAT_COLORS[tagLabel.toLowerCase()] ?? '#1F4D3A', color: '#FFFFFF' }
                : { background: 'rgba(10,20,14,0.6)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.92)' }
            }
          >
            {tagLabel}
          </div>
        )}

        {/* Heart — top right */}
        {onSave && (
          <button
            onClick={handleSave}
            className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full transition"
            style={{
              background: 'rgba(10,20,14,0.5)',
              backdropFilter: 'blur(8px)',
            }}
            aria-label={saved ? 'Unsave event' : 'Save event'}
          >
            <Heart
              size={14}
              strokeWidth={2}
              style={{ color: saved ? '#E8C57E' : 'rgba(255,255,255,0.85)', fill: saved ? '#E8C57E' : 'none' }}
            />
          </button>
        )}

        {/* Happening now / trend badge — bottom left */}
        {isLiveNow(page) ? (
          <div
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
            style={{
              background: 'rgba(10,20,14,0.6)',
              backdropFilter: 'blur(8px)',
              color: '#EC6A5E',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EC6A5E' }} aria-hidden />
            Happening now
          </div>
        ) : trendBadge ? (
          <div
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{
              background: 'rgba(10,20,14,0.6)',
              backdropFilter: 'blur(8px)',
              color: '#E8C57E',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {trendBadge}
          </div>
        ) : null}
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Date */}
        <div
          className="text-[11px] font-medium mb-1"
          style={{ color: '#C9A45E', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {fmtEventDate(page.starts_at, page.timezone)}
        </div>

        {/* Title */}
        {/* dir="auto" so an Arabic title reads in its own direction inside the
            English feed. No-op for Latin titles. See PublicEventPageClient. */}
        <div
          dir="auto"
          className="font-display font-medium text-[15px] leading-snug mb-1.5 group-hover:text-[#1F4D3A] transition-colors line-clamp-2"
          style={{ color: '#0F1F18' }}
        >
          {page.title}
        </div>

        {/* Organizer */}
        {page.organizer_name && (
          <div className="text-[12px] truncate" style={{ color: '#65736B' }}>
            {page.organizer_name}
          </div>
        )}

        {/* Series pill */}
        {page.series_name && (
          <div className="mt-1 mb-1">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A', fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Series
            </span>
          </div>
        )}

        {/* Location + price row */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] truncate" style={{ color: '#65736B' }}>
            {page.is_online ? 'Online' : (page.city ?? page.venue_name ?? 'Location TBA')}
          </div>
          {priceLabel && (
            <div
              className="text-[12px] font-semibold shrink-0"
              style={{ color: priceColor, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {priceLabel}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
