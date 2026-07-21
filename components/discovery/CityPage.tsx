'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Map } from 'lucide-react';
import { EventCard, type DiscoveryEvent } from './EventCard';
import { toggleSavedEvent } from '@/components/shared/saveEvent';
import {
  matchesDiscoveryDateWindow,
  isWithinDaysZoned,
  type DiscoveryDateWindow,
} from '@/lib/events/format';

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
  const router = useRouter();
  const [dateChip, setDateChip] = useState<DateChip>('All dates');
  const [catChip, setCatChip] = useState<CatChip | null>(null);
  const [savedSet, setSavedSet] = useState(new Set(savedIds));

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
      router.push(`/account/login?next=${encodeURIComponent(`/events/city/${city.toLowerCase().replace(/ /g, '-')}`)}`);
    }
  }, [router, city]);

  // Date chips resolve in each EVENT's own time zone. Comparing the raw
  // instant against the browser's clock (the previous approach) meant a
  // visitor abroad — or simply one zone over — saw a different "Today" than
  // the city they are browsing.
  const CHIP_WINDOW: Record<DateChip, DiscoveryDateWindow> = {
    'All dates': 'any',
    'Today': 'today',
    'This weekend': 'weekend',
    'This week': 'week',
  };

  const filtered = events.filter(ev => {
    if (!matchesDiscoveryDateWindow(ev.starts_at, ev.timezone, CHIP_WINDOW[dateChip])) return false;
    if (catChip === 'Free' && (ev.price_from ?? -1) !== 0) return false;
    if (catChip && catChip !== 'Free' && ev.category?.toLowerCase() !== catChip.toLowerCase()) return false;
    return true;
  });

  // Group into "Happening soon" (next 7 days) + "Coming up", also zoned.
  const soonEvents = filtered.filter(ev => isWithinDaysZoned(ev.starts_at, ev.timezone, 7));
  const laterEvents = filtered.filter(ev => !isWithinDaysZoned(ev.starts_at, ev.timezone, 7));

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
          <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
            className="inline-flex items-center justify-center flex-none h-8 px-3.5 rounded-full text-[12px] font-medium transition whitespace-nowrap"
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
            className="inline-flex items-center justify-center flex-none h-8 px-3.5 rounded-full text-[12px] font-medium transition whitespace-nowrap"
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
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12px] font-medium whitespace-nowrap"
            style={{ background: '#FFFFFF', color: '#1F4D3A', border: '1px solid #1F4D3A' }}
          >
            <Map size={12} /> Map view
          </Link>
        </div>
      </div>

      {/* Event sections */}
      <div className="pt-8 pb-24 flex flex-col gap-12">
        {filtered.length === 0 ? (
          /* Two genuinely different situations. "Try adjusting the filters"
             is useless advice when the city simply has nothing listed yet —
             the common case in a launch market — so that case gets its own
             copy and a route out (browse everything / list an event). */
          <div className="rounded-2xl flex items-center justify-center py-20 px-5 text-center" style={{ background: '#fff', border: '1px solid #E5E0D4' }}>
            {events.length === 0 ? (
              <div className="max-w-sm">
                <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>
                  No events in {city} yet
                </div>
                <div className="text-[13px] mb-5" style={{ color: '#65736B' }}>
                  Nothing is listed here right now. Browse everything happening elsewhere, or be the first to put {city} on the map.
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link
                    href="/events"
                    className="inline-flex items-center h-10 px-4 rounded-xl text-[13px] font-semibold"
                    style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                  >
                    Browse all events
                  </Link>
                  <Link
                    href="/events/new"
                    className="inline-flex items-center h-10 px-4 rounded-xl text-[13px] font-semibold"
                    style={{ background: '#FFFFFF', color: '#1F4D3A', border: '1px solid #1F4D3A' }}
                  >
                    Create an event
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No events match</div>
                <div className="text-[13px]" style={{ color: '#65736B' }}>Try adjusting the filters above.</div>
              </div>
            )}
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
            }}
          />
          <div className="relative max-w-lg">
            <h3 className="font-display font-semibold text-[22px] text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
              Never miss an event in {city}
            </h3>
            <p className="text-[14px] mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Get notified when new events are added to Eventera.
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
          <p className="text-[12px] mt-0.5" style={{ color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>
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

