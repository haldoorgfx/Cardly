'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown, ArrowRight, Map as MapIcon, Ticket } from 'lucide-react';
import { EventCard } from './EventCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props {
  featured: EventPage | null;
  events: EventPage[];
}

const CATEGORIES = ['All', 'Music', 'Tech', 'Sports', 'Culture', 'Food', 'Business', 'Health', 'Arts'];

const WHEN_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

const HOST_BG = ['#1F4D3A', '#6B4D9E', '#C0436B', '#2C5BAA', '#D2853A', '#7C4DC4'];
const NO_EVENTS: EventPage[] = [];

/* ─── Helpers ───────────────────────────────────────────────────── */

function getSlug(ep: EventPage) { return ep.custom_slug ?? ep.events?.slug ?? ep.id; }
function organizerOf(ep: EventPage): string { return ep.organizer_name ?? ep.events?.profiles?.full_name ?? 'Organizer'; }
function avatarOf(ep: EventPage): string | null { return ep.events?.profiles?.avatar_url ?? null; }
function fmtDate(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short' });
}
function initials(name: string) {
  const p = name.split(' ').filter(Boolean);
  if (!p.length) return '?';
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function priceLabel(p?: number | null) {
  return p ? `$${p % 1 === 0 ? p : p.toFixed(2)}` : 'Free';
}

function matchesWhen(iso: string | null | undefined, when: string): boolean {
  if (when === 'any') return true;
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (when === 'today') {
    const end = new Date(start); end.setDate(end.getDate() + 1);
    return d >= start && d < end;
  }
  if (when === 'weekend') {
    // Upcoming Sat 00:00 → Mon 00:00
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const daysToSat = (6 - day + 7) % 7;
    const sat = new Date(start); sat.setDate(sat.getDate() + daysToSat);
    const mon = new Date(sat); mon.setDate(mon.getDate() + 2);
    return d >= sat && d < mon;
  }
  if (when === 'week') {
    const end = new Date(start); end.setDate(end.getDate() + 7);
    return d >= start && d < end;
  }
  if (when === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && d >= start;
  }
  return true;
}

/* ─── Main ──────────────────────────────────────────────────────── */

export function DiscoverHomeClient({ featured: dbFeatured, events: dbEvents }: Props) {
  const router = useRouter();
  const events = dbEvents ?? NO_EVENTS;
  const featured = dbFeatured ?? events[0] ?? null;
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [city, setCity] = useState('');
  const [when, setWhen] = useState('any');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  // Distinct cities from real events (by frequency), padded with popular fallbacks
  const cities = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: EventPage) => { if (e.city) counts[e.city] = (counts[e.city] ?? 0) + 1; });
    const real = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const fallback = ['Lagos', 'Nairobi', 'Accra', 'Dakar', 'Cape Town', 'Cairo', 'Kigali', 'Djibouti'];
    return Array.from(new Set([...real, ...fallback]));
  }, [events]);

  const hasFilter = !!(query || activeCat !== 'All' || city || when !== 'any');

  const filtered = useMemo(() => events.filter((ep: EventPage) => {
    if (activeCat !== 'All' && !(ep.category ?? '').toLowerCase().includes(activeCat.toLowerCase())) return false;
    if (city && (ep.city ?? '') !== city) return false;
    if (!matchesWhen(ep.starts_at, when)) return false;
    if (query) {
      const hay = `${ep.title ?? ''} ${organizerOf(ep)} ${ep.city ?? ''} ${ep.venue_name ?? ''} ${ep.category ?? ''}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [events, activeCat, city, when, query]);

  // Top hosts derived from real events
  const hosts = useMemo(() => {
    const map = new Map<string, { name: string; count: number; avatar: string | null; userId: string | null }>();
    events.forEach((e: EventPage) => {
      const name = organizerOf(e);
      if (!name || name === 'Organizer') return;
      const ex = map.get(name);
      if (ex) ex.count++;
      else map.set(name, { name, count: 1, avatar: avatarOf(e), userId: e.events?.user_id ?? null });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [events]);

  function toggleSave(id: string) {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function goToMap() {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (city) p.set('city', city);
    if (activeCat !== 'All') p.set('category', activeCat.toLowerCase());
    const qs = p.toString();
    router.push(`/events/search${qs ? `?${qs}` : ''}`);
  }

  const SELECT_CLS = 'appearance-none cursor-pointer bg-transparent outline-none w-full text-[14px]';
  const selWrap = 'relative flex items-center gap-2 h-[46px] px-3.5 rounded-xl';
  const selWrapStyle = { border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#3A4A42' } as const;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 45%, #2A6A50 80%, #C9A45E 130%)' }} />
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(40% 60% at 15% 20%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(45% 70% at 90% 80%, rgba(232,197,126,0.28), transparent 60%)',
        }} />
        <div className="relative mx-auto px-5 lg:px-10 pt-14 pb-16 lg:pt-20 lg:pb-20 text-center" style={{ maxWidth: 1100 }}>
          <span className="inline-flex items-center gap-2 px-4 h-[34px] rounded-full text-[13px] font-medium mb-6"
            style={{ background: 'rgba(250,246,238,0.16)', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.25)' }}>
            <span style={{ color: '#E8C57E' }}>✦</span> Events for every moment
          </span>

          <h1 className="font-title font-bold mx-auto"
            style={{ fontSize: 'clamp(36px,6vw,64px)', lineHeight: 1.03, letterSpacing: '-0.035em', color: '#FAF6EE', maxWidth: 760 }}>
            Discover events that move you
          </h1>
          <p className="mt-5 mx-auto" style={{ fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.6, color: 'rgba(250,246,238,0.82)', maxWidth: 520 }}>
            Find conferences, festivals, workshops and experiences worth your time — near you or anywhere in the world.
          </p>

          {/* Search card */}
          <div className="mt-9 mx-auto rounded-[20px] text-left"
            style={{ background: '#FFFFFF', boxShadow: '0 12px 48px rgba(15,31,24,0.24)', padding: 16, maxWidth: 780 }}>
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4" style={{ height: 56, borderBottom: '1px solid #E5E0D4' }}>
              <Search size={20} style={{ color: '#6B7A72', flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') scrollToResults(); }}
                placeholder="Search events, topics, organizers or venues"
                className="flex-1 bg-transparent text-[16px] outline-none" style={{ color: '#0F1F18' }} />
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-2.5 pt-3.5">
              {/* Location */}
              <div className={selWrap} style={selWrapStyle}>
                <MapPin size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
                <select value={city} onChange={e => setCity(e.target.value)} className={SELECT_CLS} style={{ color: city ? '#0F1F18' : '#3A4A42' }}>
                  <option value="">Anywhere</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
              </div>
              {/* Date */}
              <div className={selWrap} style={selWrapStyle}>
                <Calendar size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
                <select value={when} onChange={e => setWhen(e.target.value)} className={SELECT_CLS} style={{ color: when !== 'any' ? '#0F1F18' : '#3A4A42' }}>
                  {WHEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
              </div>
              {/* Category */}
              <div className={selWrap} style={selWrapStyle}>
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="#6B7A72" strokeWidth="1.8">
                  <path d="M20.6 13.4L11 3.8a2 2 0 00-1.4-.6H4a1 1 0 00-1 1v5.6a2 2 0 00.6 1.4l9.6 9.6a2 2 0 002.8 0l4.6-4.6a2 2 0 000-2.8zM7.5 7.5a1 1 0 100-2 1 1 0 000 2z"/>
                </svg>
                <select value={activeCat} onChange={e => setActiveCat(e.target.value)} className={SELECT_CLS} style={{ color: activeCat !== 'All' ? '#0F1F18' : '#3A4A42' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'Any category' : c}</option>)}
                </select>
                <ChevronDown size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
              </div>
              {/* Search button */}
              <button onClick={scrollToResults}
                className="col-span-2 lg:col-span-1 h-[46px] px-6 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}>
                Find events <ArrowRight size={16} />
              </button>
            </div>

            {/* Popular + map */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-3.5 px-1 text-[13px]" style={{ color: '#6B7A72' }}>
              <span className="font-medium" style={{ color: '#3A4A42' }}>Popular:</span>
              {['Tech', 'Music', 'Business', 'Sports'].map(tag => (
                <button key={tag} onClick={() => { setActiveCat(tag); scrollToResults(); }}
                  className="font-medium transition hover:opacity-70" style={{ color: '#1F4D3A' }}>{tag}</button>
              ))}
              <button onClick={goToMap}
                className="ml-auto inline-flex items-center gap-1.5 font-semibold transition hover:opacity-80" style={{ color: '#1F4D3A' }}>
                <MapIcon size={14} /> Explore on map
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto px-5 lg:px-10 py-10 lg:py-12" style={{ maxWidth: 1280 }}>

        {/* ── Category chips ──────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8" style={{ scrollbarWidth: 'none' }}>
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

        {/* ── Featured (only with no active filter) ───────────── */}
        {featured && !hasFilter && (
          <Link href={`/e/${getSlug(featured)}`}
            className="relative block h-72 sm:h-80 rounded-[22px] overflow-hidden mb-10 group"
            style={{ background: 'linear-gradient(140deg, #143024, #1F4D3A 55%, #2A6A50)', textDecoration: 'none' }}>
            {featured.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={featured.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.02]" />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.85) 0%, rgba(10,20,14,0.15) 55%, transparent 100%)' }} />
            <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-8 pb-7 flex items-end justify-between flex-wrap gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-[0.16em] mb-2" style={{ color: '#E8C57E' }}>FEATURED EVENT</div>
                <h2 className="font-title font-bold text-[26px] sm:text-[34px] mb-2" style={{ color: '#FAF6EE', letterSpacing: '-0.025em', lineHeight: 1.05 }}>
                  {featured.title}
                </h2>
                <p className="text-[14px] flex flex-wrap items-center gap-x-2.5" style={{ color: 'rgba(250,246,238,0.82)' }}>
                  <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {fmtDate(featured.starts_at) || 'TBA'}</span>
                  {(featured.city || featured.venue_name) && (
                    <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {featured.city ?? featured.venue_name}</span>
                  )}
                  <span>· {priceLabel(featured.price_from)}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold shrink-0"
                style={{ background: '#E8C57E', color: '#0F1F18' }}>
                View event <ArrowRight size={15} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Results ─────────────────────────────────────────── */}
        <div ref={resultsRef} className="flex items-end justify-between gap-4 mb-5 scroll-mt-24">
          <div>
            <h2 className="font-title font-bold text-[22px] sm:text-[26px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              {hasFilter ? 'Results' : 'Upcoming events'}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
              {city && ` in ${city}`}
              {activeCat !== 'All' && ` · ${activeCat}`}
              {when !== 'any' && ` · ${WHEN_OPTIONS.find(w => w.value === when)?.label}`}
            </p>
          </div>
          {hasFilter && (
            <button onClick={() => { setQuery(''); setActiveCat('All'); setCity(''); setWhen('any'); }}
              className="text-[13px] font-medium shrink-0 transition hover:opacity-70" style={{ color: '#1F4D3A' }}>
              Clear filters
            </button>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((ep: EventPage) => (
              <EventCard key={ep.id} page={ep} saved={saved.has(ep.id)} onSave={toggleSave} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl py-16 px-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <Search size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>No events found</p>
            <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Try a different search or clear your filters.</p>
          </div>
        )}

        {/* ── Browse by city ──────────────────────────────────── */}
        <div className="mt-14">
          <h2 className="font-title font-bold text-[22px] sm:text-[26px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Browse by city
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>Find what&apos;s happening near you.</p>
          <div className="flex flex-wrap gap-2.5">
            {cities.slice(0, 10).map(c => (
              <button key={c} onClick={() => { setCity(c); scrollToResults(); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-[13px] font-medium transition hover:-translate-y-0.5 hover:shadow-sm"
                style={{ background: city === c ? '#1F4D3A' : '#FFFFFF', borderColor: city === c ? '#1F4D3A' : '#E5E0D4', color: city === c ? '#FAF6EE' : '#3A4A42' }}>
                <MapPin size={13} style={{ color: city === c ? '#E8C57E' : '#1F4D3A' }} /> {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Top hosts ───────────────────────────────────────── */}
        {hosts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-end justify-between gap-4 mb-5">
              <h2 className="font-title font-bold text-[22px] sm:text-[26px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                Top event hosts
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {hosts.map((h, i) => (
                <Link key={h.name}
                  href={h.userId ? `/o/${h.userId}` : `/events/search?q=${encodeURIComponent(h.name)}`}
                  className="flex items-center gap-4 p-4 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                  {h.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={h.avatar} alt={h.name} className="w-12 h-12 rounded-[14px] object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-[14px] shrink-0 flex items-center justify-center text-white font-display font-semibold text-[15px]"
                      style={{ background: HOST_BG[i % HOST_BG.length] }}>
                      {initials(h.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-[15px] truncate" style={{ color: '#0F1F18' }}>{h.name}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{h.count} event{h.count !== 1 ? 's' : ''}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium shrink-0" style={{ color: '#1F4D3A' }}>
                    View <ArrowRight size={13} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── CTA band ────────────────────────────────────────── */}
        <div className="mt-16 relative rounded-[22px] overflow-hidden" style={{ background: '#163828' }}>
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(55% 90% at 88% 50%, rgba(232,197,126,0.22), transparent 60%)' }} />
          <div className="relative px-7 py-10 sm:px-12 sm:py-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="font-title font-bold text-white" style={{ fontSize: 'clamp(24px,3vw,32px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                Ready to host your next event?
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.66)' }}>
                Create a beautiful event page, sell tickets, and give every attendee a personalized Karta Card they&apos;ll share.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link href="/events/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] transition hover:opacity-90"
                style={{ background: '#E8C57E', color: '#163828', textDecoration: 'none' }}>
                <Ticket size={16} /> Host an event
              </Link>
              <Link href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[14px] transition hover:bg-white/5"
                style={{ background: 'transparent', border: '1px solid rgba(232,197,126,0.4)', color: '#E8C57E', textDecoration: 'none' }}>
                How it works
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
