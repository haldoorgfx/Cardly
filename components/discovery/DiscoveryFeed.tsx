'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { EventCard, type DiscoveryEvent } from './EventCard';

const CATEGORIES = ['Music', 'Tech', 'Business', 'Culture', 'Food', 'Sports', 'Health', 'Free'] as const;

const CITIES = [
  'Djibouti City', 'Nairobi', 'Addis Ababa', 'Mogadishu', 'Kampala',
  'Dar es Salaam', 'Kigali', 'Lagos', 'Accra', 'Cairo',
];

interface Section {
  label: string;
  subtitle: string;
  events: DiscoveryEvent[];
  seeAllHref: string;
}

interface DiscoveryFeedProps {
  events: DiscoveryEvent[];
  savedIds: string[];
  greeting: string | null;
  interests: string[];
  followedOrgIds: string[];
}

export function DiscoveryFeed({ events, savedIds, greeting, interests, followedOrgIds }: DiscoveryFeedProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cityOpen, setCityOpen] = useState(false);
  const [savedSet, setSavedSet] = useState(new Set(savedIds));

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

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
    } catch { /* optimistic — ignore network errors */ }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/events/search?q=${encodeURIComponent(query.trim())}`);
  }

  // Section builders
  const upcoming = events.filter(e => new Date(e.starts_at) >= now);
  const thisWeek = upcoming.filter(e => new Date(e.starts_at) <= weekEnd);

  const sections: Section[] = [];

  if (interests.length > 0) {
    const byInterest = upcoming.filter(e => e.category && interests.map(i => i.toLowerCase()).includes(e.category!.toLowerCase()));
    if (byInterest.length > 0) {
      sections.push({
        label: 'Based on your interests',
        subtitle: interests.slice(0, 3).join(', '),
        events: byInterest.slice(0, 4),
        seeAllHref: `/events/search?category=${encodeURIComponent(interests[0])}`,
      });
    }
  }

  if (followedOrgIds.length > 0) {
    const followed = upcoming.filter(e => e.events?.user_id && followedOrgIds.includes(e.events.user_id));
    if (followed.length > 0) {
      sections.push({
        label: 'From organizers you follow',
        subtitle: 'New events from your follows',
        events: followed.slice(0, 4),
        seeAllHref: '/account/following',
      });
    }
  }

  if (thisWeek.length > 0) {
    sections.push({
      label: 'Happening this week',
      subtitle: 'Starting in the next 7 days',
      events: thisWeek.slice(0, 4),
      seeAllHref: '/events/search?date=week',
    });
  }

  const freeEvents = upcoming.filter(e => e.price_from === 0).slice(0, 4);
  if (freeEvents.length > 0) {
    sections.push({
      label: 'Free to attend',
      subtitle: 'No ticket cost',
      events: freeEvents,
      seeAllHref: '/events/search?free=true',
    });
  }

  // Fallback: no personalized sections → single ranked grid
  const showSingleGrid = sections.length === 0;
  const singleGridEvents = upcoming.slice(0, 20);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-10 mb-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
        }}
      >
        {/* Mesh dots */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative">
          {greeting && (
            <p className="text-[14px] font-medium mb-1" style={{ color: 'rgba(232,197,126,0.9)' }}>
              {greeting}
            </p>
          )}
          <h1
            className="font-display font-semibold leading-tight mb-6"
            style={{ fontSize: 'clamp(24px,4vw,36px)', color: '#FFFFFF', letterSpacing: '-0.025em' }}
          >
            Find your next event
          </h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
              <input
                type="text"
                placeholder="Search events, artists, topics…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-11 pl-9 pr-4 rounded-xl text-[14px] outline-none"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#0F1F18' }}
              />
            </div>

            {/* City selector */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setCityOpen(v => !v)}
                className="h-11 px-4 rounded-xl text-[14px] font-medium flex items-center gap-1.5 whitespace-nowrap"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
              >
                All cities <ChevronDown size={13} />
              </button>
              {cityOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCityOpen(false)} />
                  <div
                    className="absolute right-0 top-12 z-20 rounded-xl overflow-hidden w-52"
                    style={{ background: '#fff', border: '1px solid #E5E0D4', boxShadow: '0 8px 24px rgba(15,31,24,0.12)' }}
                  >
                    {CITIES.map(city => (
                      <Link
                        key={city}
                        href={`/events/city/${encodeURIComponent(city.toLowerCase().replace(/ /g, '-'))}`}
                        onClick={() => setCityOpen(false)}
                        className="block px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors"
                        style={{ color: '#0F1F18' }}
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="h-11 px-5 rounded-xl text-[14px] font-medium transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#0F1F18' }}
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Category chip rail ───────────────────────────────── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map(cat => (
          <Link
            key={cat}
            href={cat === 'Free' ? '/events/search?free=true' : `/events/category/${cat.toLowerCase()}`}
            className="flex-none h-[34px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap transition"
            style={{ background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#E8EFEB';
              (e.currentTarget as HTMLElement).style.borderColor = '#1F4D3A';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#FFFFFF';
              (e.currentTarget as HTMLElement).style.borderColor = '#E5E0D4';
            }}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {showSingleGrid ? (
        <div>
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display font-semibold text-[20px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
              Upcoming events
            </h2>
          </div>
          {singleGridEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
              {singleGridEvents.map(ev => (
                <EventCard
                  key={ev.id}
                  page={ev}
                  saved={savedSet.has(ev.id)}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {sections.map(section => (
            <FeedSection
              key={section.label}
              section={section}
              savedSet={savedSet}
              onSave={handleSave}
            />
          ))}

          {/* Catch-all "More events" if sections don't show everything */}
          {upcoming.length > 8 && (
            <FeedSection
              section={{
                label: 'More upcoming events',
                subtitle: 'All upcoming events on Karta',
                events: upcoming.slice(0, 4),
                seeAllHref: '/events/search',
              }}
              savedSet={savedSet}
              onSave={handleSave}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FeedSection({
  section,
  savedSet,
  onSave,
}: {
  section: Section;
  savedSet: Set<string>;
  onSave: (id: string, save: boolean) => void;
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-[20px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {section.label}
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{section.subtitle}</p>
        </div>
        <Link
          href={section.seeAllHref}
          className="text-[13px] font-medium shrink-0 mt-1"
          style={{ color: '#1F4D3A' }}
        >
          See all →
        </Link>
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px, 100%), 1fr))' }}>
        {section.events.map(ev => (
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

function EmptyState() {
  return (
    <div
      className="rounded-2xl flex items-center justify-center py-24 text-center"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
    >
      <div>
        <div className="text-[16px] font-medium mb-2" style={{ color: '#0F1F18' }}>No events yet</div>
        <div className="text-[14px]" style={{ color: '#6B7A72' }}>
          Check back soon, or{' '}
          <Link href="/events/new" className="underline" style={{ color: '#1F4D3A' }}>host your own</Link>.
        </div>
      </div>
    </div>
  );
}
