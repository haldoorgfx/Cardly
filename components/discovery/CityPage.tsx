'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Map } from 'lucide-react';
import { EventCard, type DiscoveryEvent } from './EventCard';

const DATE_CHIPS = ['All dates', 'Today', 'This weekend', 'This week'] as const;
const CAT_CHIPS = ['Music', 'Tech', 'Food', 'Business', 'Culture', 'Free'] as const;
type DateChip = typeof DATE_CHIPS[number];
type CatChip = typeof CAT_CHIPS[number];

interface CityPageProps {
  city: string;
  events: DiscoveryEvent[];
  savedIds: string[];
  eventCount: number;
}

export function CityPage({ city, events, savedIds, eventCount }: CityPageProps) {
  const [dateChip, setDateChip] = useState<DateChip>('All dates');
  const [catChip, setCatChip] = useState<CatChip | null>(null);
  const [savedSet, setSavedSet] = useState(new Set(savedIds));

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
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  const weekendStart = (() => {
    const d = new Date(now);
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const weekendEnd = new Date(weekendStart); weekendEnd.setDate(weekendStart.getDate() + 1); weekendEnd.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filtered = events.filter(ev => {
    const start = new Date(ev.starts_at);
    if (dateChip === 'Today' && (start < now || start > todayEnd)) return false;
    if (dateChip === 'This weekend' && (start < weekendStart || start > weekendEnd)) return false;
    if (dateChip === 'This week' && (start < now || start > weekEnd)) return false;
    if (catChip === 'Free' && (ev.price_from ?? -1) !== 0) return false;
    if (catChip && catChip !== 'Free' && ev.category?.toLowerCase() !== catChip.toLowerCase()) return false;
    return true;
  });

  // Group into "This weekend" + "Next week" sections
  const soonEvents = filtered.filter(ev => new Date(ev.starts_at) <= weekEnd);
  const laterEvents = filtered.filter(ev => new Date(ev.starts_at) > weekEnd);

  const coverUrl = events[0]?.cover_image_url ?? null;

  return (
    <div>
      {/* Hero banner */}
      <div
        className="relative overflow-hidden mb-0"
        style={{ height: 220 }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={city} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.7) 0%, rgba(10,20,14,0.2) 100%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          <nav className="text-[12px] mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <Link href="/events" style={{ color: 'rgba(255,255,255,0.65)' }}>Events</Link>
            {' / '}
            <span style={{ color: '#fff' }}>{city}</span>
          </nav>
          <h1
            className="font-display font-semibold text-white"
            style={{ fontSize: 'clamp(24px,4vw,32px)', letterSpacing: '-0.025em' }}
          >
            Events in {city}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: '"JetBrains Mono", monospace' }}>
            {eventCount} upcoming event{eventCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Sticky filter bar */}
      <div
        className="sticky z-30 px-5 py-3 -mx-5 flex items-center gap-2 overflow-x-auto"
        style={{
          top: 64,
          background: 'rgba(250,246,238,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E5E0D4',
          scrollbarWidth: 'none',
        }}
      >
        {DATE_CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => setDateChip(chip)}
            className="inline-flex items-center justify-center flex-none h-[30px] px-3.5 rounded-full text-[12px] font-medium transition whitespace-nowrap"
            style={{
              background: dateChip === chip ? '#1F4D3A' : '#FFFFFF',
              color: dateChip === chip ? '#FFFFFF' : '#3A4A42',
              border: `1px solid ${dateChip === chip ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            {chip}
          </button>
        ))}
        <div className="w-px h-5 shrink-0" style={{ background: '#E5E0D4' }} />
        {CAT_CHIPS.map(chip => (
          <button
            key={chip}
            onClick={() => setCatChip(catChip === chip ? null : chip)}
            className="inline-flex items-center justify-center flex-none h-[30px] px-3.5 rounded-full text-[12px] font-medium transition whitespace-nowrap"
            style={{
              background: catChip === chip ? '#1F4D3A' : '#FFFFFF',
              color: catChip === chip ? '#FFFFFF' : '#3A4A42',
              border: `1px solid ${catChip === chip ? '#1F4D3A' : '#E5E0D4'}`,
            }}
          >
            {chip}
          </button>
        ))}
        <div className="ml-auto shrink-0">
          <Link
            href={`/events/search?city=${encodeURIComponent(city)}`}
            className="flex items-center gap-1.5 h-[30px] px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{ background: '#FFFFFF', color: '#1F4D3A', border: '1px solid #1F4D3A' }}
          >
            <Map size={12} /> Map view
          </Link>
        </div>
      </div>

      {/* Event sections */}
      <div className="pt-8 pb-24 flex flex-col gap-12">
        {filtered.length === 0 ? (
          <div className="rounded-2xl flex items-center justify-center py-20 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
            <div>
              <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events match</div>
              <div className="text-[13px]" style={{ color: '#6B7A72' }}>Try adjusting the filters above.</div>
            </div>
          </div>
        ) : (
          <>
            {soonEvents.length > 0 && (
              <EventSection
                label="Happening soon"
                dateRange="Next 7 days"
                events={soonEvents}
                savedSet={savedSet}
                onSave={handleSave}
              />
            )}
            {laterEvents.length > 0 && (
              <EventSection
                label="Coming up"
                dateRange="Later this month and beyond"
                events={laterEvents}
                savedSet={savedSet}
                onSave={handleSave}
              />
            )}
          </>
        )}

        {/* Subscribe CTA */}
        <div
          className="rounded-2xl px-8 py-10 relative overflow-hidden"
          style={{ background: '#163828' }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative max-w-lg">
            <h3 className="font-display font-semibold text-[22px] text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              Never miss an event in {city}
            </h3>
            <p className="text-[14px] mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Get notified when new events are added to Karta.
            </p>
            <Link
              href="/account/login?next=/account/notifications"
              className="inline-flex items-center h-10 px-5 rounded-xl text-[14px] font-medium transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#0F1F18' }}
            >
              Get notified
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventSection({
  label,
  dateRange,
  events,
  savedSet,
  onSave,
}: {
  label: string;
  dateRange: string;
  events: DiscoveryEvent[];
  savedSet: Set<string>;
  onSave: (id: string, save: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-[20px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {label}
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
            {dateRange}
          </p>
        </div>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        {events.map(ev => (
          <EventCard
            key={ev.id}
            page={ev}
            saved={savedSet.has(ev.id)}
            onSave={onSave}
          />
        ))}
      </div>
    </div>
  );
}

