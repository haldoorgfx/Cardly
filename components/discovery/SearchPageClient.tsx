'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Calendar, Globe, X, Filter } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props {
  initialQuery: string;
  initialCity: string;
  events: EventPage[];
}

const POPULAR_SEARCHES = ['Fintech', 'Design Week', 'Tech Summit', 'Networking', 'Music Festival', 'Workshop'];
const CITIES = ['Lagos', 'Nairobi', 'Accra', 'Dakar', 'Cape Town', 'Kigali', 'Abidjan', 'Cairo'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtPrice(p: number | null) { return !p || p === 0 ? 'Free' : `From $${p}`; }
function getSlug(ep: EventPage) { return ep.custom_slug ?? ep.events?.slug ?? ep.id; }

export function SearchPageClient({ initialQuery, initialCity, events: serverEvents }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const events = serverEvents;

  const doSearch = useCallback((q: string, city: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set('q', q); else params.delete('q');
    if (city) params.set('city', city); else params.delete('city');
    router.push(`/search?${params.toString()}`);
  }, [router, searchParams]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') doSearch(query, cityFilter);
  }

  function clear() {
    setQuery('');
    setCityFilter('');
    router.push('/search');
  }

  const hasFilters = query || cityFilter;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />

      {/* Search bar */}
      <div className="sticky top-0 z-10 border-b" style={{ background: 'rgba(250,246,238,0.97)', backdropFilter: 'blur(8px)', borderColor: '#E5E0D4' }}>
        <div className="max-w-5xl mx-auto px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Search input */}
            <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <Search size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search events, organizers, topics…"
                aria-label="Search events, organizers, topics"
                className="flex-1 bg-transparent text-[14px] outline-none"
                style={{ color: '#0F1F18' }}
              />
              {query && (
                <button onClick={() => { setQuery(''); doSearch('', cityFilter); }}
                  aria-label="Clear search"
                  style={{ color: '#C9C3B1' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* City filter */}
            <div className="relative">
              <button
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: cityFilter ? '#E8EFEB' : '#FFFFFF', color: cityFilter ? '#1F4D3A' : '#6B7A72', border: `1px solid ${cityFilter ? '#1F4D3A' : '#E5E0D4'}` }}>
                <MapPin size={14} />
                {cityFilter || 'Any city'}
              </button>
              {showCityDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl shadow-lg z-20 overflow-hidden"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                  <button className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition"
                    style={{ color: '#6B7A72' }}
                    onClick={() => { setCityFilter(''); doSearch(query, ''); setShowCityDropdown(false); }}>
                    Any city
                  </button>
                  {CITIES.map(city => (
                    <button key={city}
                      className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition"
                      style={{ color: '#0F1F18' }}
                      onClick={() => { setCityFilter(city); doSearch(query, city); setShowCityDropdown(false); }}>
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => doSearch(query, cityFilter)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              <Search size={14} /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {/* Popular searches (when no query) */}
        {!hasFilters && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={13} style={{ color: '#6B7A72' }} />
              <span className="text-[12px] font-semibold" style={{ color: '#6B7A72' }}>Popular searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(s => (
                <button key={s} onClick={() => { setQuery(s); doSearch(s, cityFilter); }}
                  className="px-4 py-2 rounded-full text-[13px] font-medium border transition hover:opacity-80"
                  style={{ background: '#FFFFFF', borderColor: '#E5E0D4', color: '#3A4A42' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results header */}
        {hasFilters && (
          <div className="flex items-center justify-between mb-5">
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              {events.length} result{events.length !== 1 ? 's' : ''}
              {query && <> for <strong style={{ color: '#0F1F18' }}>&ldquo;{query}&rdquo;</strong></>}
              {cityFilter && <> in <strong style={{ color: '#0F1F18' }}>{cityFilter}</strong></>}
            </p>
            <button onClick={clear} className="flex items-center gap-1 text-[13px] transition hover:opacity-70" style={{ color: '#6B7A72' }}>
              <X size={13} /> Clear filters
            </button>
          </div>
        )}

        {/* Events grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ep: EventPage) => (
            <Link key={ep.id} href={`/e/${getSlug(ep)}`} className="block rounded-2xl overflow-hidden transition hover:shadow-lg"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
              <div className="h-36 relative" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
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
              <div className="p-4">
                <h3 className="font-semibold text-[14px] mb-1.5 line-clamp-2" style={{ color: '#0F1F18' }}>{ep.title}</h3>
                <div className="flex items-center gap-1.5 text-[12px] mb-1" style={{ color: '#6B7A72' }}>
                  <Calendar size={11} /> {ep.starts_at ? fmtDate(ep.starts_at) : 'Date TBA'}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[12px]" style={{ color: '#6B7A72' }}>
                    {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
                    <span className="truncate">{ep.is_online ? 'Online' : ep.city ?? 'TBA'}</span>
                  </div>
                  <span className="font-semibold text-[12px]" style={{ color: '#1F4D3A' }}>{fmtPrice(ep.price_from)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {events.length === 0 && hasFilters && (
          <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <Search size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No results found</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Try different keywords or clear the filters</p>
          </div>
        )}

        {/* Cities quick links */}
        {!hasFilters && (
          <div className="mt-10">
            <h2 className="font-display font-semibold text-[18px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Browse by city
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CITIES.map(city => (
                <Link key={city} href={`/discover/cities/${city.toLowerCase().replace(/ /g, '-')}`}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border transition hover:opacity-80"
                  style={{ background: '#FFFFFF', borderColor: '#E5E0D4', textDecoration: 'none' }}>
                  <MapPin size={14} style={{ color: '#1F4D3A' }} />
                  <span className="font-medium text-[13px]" style={{ color: '#0F1F18' }}>{city}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
