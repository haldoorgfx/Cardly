'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown, ArrowRight, Map as MapIcon, Ticket, Check, Tag, Globe, Users } from 'lucide-react';
import { EventCard } from './EventCard';
import { AppStoreBadges } from '@/components/marketing/AppStoreBadges';
import { toggleSavedEvent } from '@/components/shared/saveEvent';
import { EVENT_CATEGORIES } from '@/lib/categories';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

/** An admin-controlled promo banner row from the `promo_banners` table. */
export interface PromoBanner {
  title: string;
  subtitle: string;
  image_url: string;
  cta_label: string;
  cta_type: string; // 'none' | 'event' | 'url'
  cta_target: string;
  bg_start: string;
  bg_end: string;
  text_color: string;
}

interface Props {
  featured: EventPage | null;
  events: EventPage[];
  banners?: PromoBanner[];
  savedIds?: string[];
}

/** Parse `#RGB` / `#RRGGBB` hex → CSS color, else fallback. */
function hexColor(hex: string | undefined, fallback: string): string {
  const h = (hex ?? '').trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return h;
  return fallback;
}

const CATEGORIES = ['All', ...EVENT_CATEGORIES];

const WHEN_OPTIONS = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
];

// Format filter — mirrors the mobile app (All | In person | Online).
const FORMAT_OPTIONS = [
  { value: 'all', label: 'Any format' },
  { value: 'inperson', label: 'In person' },
  { value: 'online', label: 'Online' },
] as const;
type FormatValue = (typeof FORMAT_OPTIONS)[number]['value'];

const HOST_BG = ['#1F4D3A', '#163828', '#2A6A50', '#3E7E5E', '#C9A45E', '#245C44'];
const NO_EVENTS: EventPage[] = [];

// Category tiles — on-brand only: forest-soft + gold-soft tints, neutral for "More".
const CATS_TILES = [
  { n: 'Tech',      cat: 'Tech',      bg: '#E8EFEB', fg: '#1F4D3A', path: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13 6l-2 12' },
  { n: 'Music',     cat: 'Music',     bg: '#F3EAD7', fg: '#C9A45E', path: 'M9 18V4l12-2v14M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z' },
  { n: 'Business',  cat: 'Business',  bg: '#E8EFEB', fg: '#1F4D3A', path: 'M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2' },
  { n: 'Sports',    cat: 'Sports',    bg: '#F3EAD7', fg: '#C9A45E', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3a14 14 0 000 18M3 12h18M5 6c3 2 11 2 14 0M5 18c3-2 11-2 14 0' },
  { n: 'Arts',      cat: 'Arts',      bg: '#E8EFEB', fg: '#1F4D3A', path: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 011.7-1.7H16c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z' },
  { n: 'Education', cat: 'Education', bg: '#F3EAD7', fg: '#C9A45E', path: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1 3 3 6 3s6-2 6-3v-5' },
  { n: 'Health',    cat: 'Health',    bg: '#E8EFEB', fg: '#1F4D3A', path: 'M20.8 8.6a5 5 0 00-8.8-3 5 5 0 00-8.8 3c0 5 8.8 11 8.8 11s8.8-6 8.8-11z' },
  { n: 'More',      cat: null,        bg: '#F0EDE8', fg: '#6B7A72', path: 'M5 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
];

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

function citySlug(c: string) { return c.toLowerCase().replace(/\s+/g, '-'); }

/* ─── Custom dropdown (brand-styled menu, replaces native <select>) ─ */

interface Opt { value: string; label: string }

function Dropdown({
  icon, label, value, placeholder, options, onChange,
}: { icon: React.ReactNode; label: string; value: string; placeholder: string; options: Opt[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc); };
  }, [open]);

  const selected = options.find(o => o.value === value);
  const isPlaceholder = !selected || selected.value === '' || selected.value === 'All' || selected.value === 'any';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label={`${label}: ${selected ? selected.label : placeholder}`}
        className="w-full flex items-center gap-2 h-[46px] px-3.5 rounded-xl text-[14px] transition"
        style={{ border: `1px solid ${open ? '#1F4D3A' : '#E5E0D4'}`, background: '#FAF6EE', color: isPlaceholder ? '#3A4A42' : '#0F1F18' }}>
        {icon}
        <span className="flex-1 text-left truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} style={{ color: '#6B7A72', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div role="listbox" aria-label={label} className="absolute z-40 mt-2 left-0 right-0 rounded-2xl p-1.5 overflow-y-auto"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 14px 40px rgba(15,31,24,0.18)', maxHeight: 288 }}>
          {options.map(o => {
            const sel = o.value === value;
            return (
              <button key={o.value || '_'} type="button" role="option" aria-selected={sel}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[14px] text-left transition ${sel ? '' : 'hover:bg-[#F5F2EA]'}`}
                style={{ ...(sel ? { background: '#E8EFEB' } : {}), color: sel ? '#1F4D3A' : '#3A4A42', fontWeight: sel ? 600 : 500 }}>
                <span className="truncate">{o.label}</span>
                {sel && <Check size={15} style={{ color: '#1F4D3A', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Full-width section band (alternating backgrounds) ─────────── */

function Band({ bg, divider = true, children }: { bg: string; divider?: boolean; children: React.ReactNode }) {
  return (
    <div className="w-full" style={{ background: bg, borderTop: divider ? '1px solid #E5E0D4' : undefined }}>
      <div className="mx-auto px-5 lg:px-10 py-12 lg:py-16" style={{ maxWidth: 1280 }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Admin promo banner (hero) ─────────────────────────────────── */

function AdminPromoBanner({ banner, onCta }: { banner: PromoBanner; onCta: () => void }) {
  const hasImage = banner.image_url.length > 0;
  const fg = hexColor(banner.text_color, '#FFFFFF');
  const bgStart = hexColor(banner.bg_start, '#163828');
  const bgEnd = hexColor(banner.bg_end, '#2A6A50');

  return (
    <button
      type="button"
      onClick={onCta}
      className="relative block w-full text-left overflow-hidden rounded-3xl group"
      style={{
        minHeight: 200,
        background: hasImage ? '#163828' : `linear-gradient(135deg, ${bgStart} 0%, ${bgEnd} 100%)`,
        boxShadow: '0 12px 40px rgba(15,31,24,0.14)',
      }}
    >
      {hasImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.02]"
          />
          {/* Left → right scrim so text stays legible over any image */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, rgba(13,31,23,0.90) 0%, rgba(13,31,23,0.25) 70%, transparent 100%)' }}
          />
        </>
      )}
      <div className="relative px-6 sm:px-9 py-8 sm:py-10 max-w-2xl">
        <h2
          className="font-title font-bold"
          style={{ fontSize: 'clamp(24px,3.4vw,34px)', lineHeight: 1.1, letterSpacing: '-0.02em', color: fg }}
        >
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="mt-2.5 text-[14px] sm:text-[15px]" style={{ color: fg, opacity: 0.85, lineHeight: 1.55, maxWidth: 520 }}>
            {banner.subtitle}
          </p>
        )}
        {banner.cta_label && (
          <span
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full font-semibold text-[14px] transition group-hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18' }}
          >
            {banner.cta_label} <ArrowRight size={15} />
          </span>
        )}
      </div>
    </button>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */

export function DiscoverHomeClient({ featured: dbFeatured, events: dbEvents, banners, savedIds }: Props) {
  const router = useRouter();
  const events = dbEvents ?? NO_EVENTS;
  const featured = dbFeatured ?? events[0] ?? null;
  const promoBanner = banners && banners.length > 0 ? banners[0] : null;
  const resultsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState('All');
  const [city, setCity] = useState('');
  const [when, setWhen] = useState('any');
  const [format, setFormat] = useState<FormatValue>('all');
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedIds ?? []));

  // Distinct cities from real events (by frequency), padded with popular fallbacks
  const cities = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((e: EventPage) => { if (e.city) counts[e.city] = (counts[e.city] ?? 0) + 1; });
    const real = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const fallback = [
      'Lagos', 'Nairobi', 'Accra', 'Dakar', 'Cape Town', 'Cairo', 'Kigali', 'Djibouti',
      'Johannesburg', 'Addis Ababa', 'Kampala', 'Dar es Salaam', 'Abidjan', 'Casablanca', 'Mombasa', 'Tunis',
    ];
    return Array.from(new Set([...real, ...fallback]));
  }, [events]);

  const hasFilter = !!(query || activeCat !== 'All' || city || when !== 'any' || format !== 'all');

  const filtered = useMemo(() => events.filter((ep: EventPage) => {
    if (activeCat !== 'All' && !(ep.category ?? '').toLowerCase().includes(activeCat.toLowerCase())) return false;
    if (city && (ep.city ?? '') !== city) return false;
    if (format === 'online' && !ep.is_online) return false;
    if (format === 'inperson' && ep.is_online) return false;
    if (!matchesWhen(ep.starts_at, when)) return false;
    if (query) {
      const hay = `${ep.title ?? ''} ${organizerOf(ep)} ${ep.city ?? ''} ${ep.venue_name ?? ''} ${ep.category ?? ''}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [events, activeCat, city, when, format, query]);

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

  async function toggleSave(id: string) {
    const willSave = !saved.has(id);
    setSaved(prev => {
      const next = new Set(prev);
      if (willSave) next.add(id); else next.delete(id);
      return next;
    });
    const { unauthorized } = await toggleSavedEvent(id, willSave);
    if (unauthorized) {
      // Roll back and send the visitor to sign in, returning here after.
      setSaved(prev => {
        const next = new Set(prev);
        if (willSave) next.delete(id); else next.add(id);
        return next;
      });
      router.push('/account/login?next=/events');
    }
  }

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function onBannerCta(b: PromoBanner) {
    const target = b.cta_target.trim();
    if (b.cta_type === 'event' && target) {
      router.push(`/e/${target}`);
    } else if (b.cta_type === 'url' && target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    } else {
      scrollToResults();
    }
  }

  function goToMap() {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (city) p.set('city', city);
    if (activeCat !== 'All') p.set('category', activeCat.toLowerCase());
    if (format !== 'all') p.set('format', format); // 'inperson' | 'online' — matches /events/search
    const qs = p.toString();
    router.push(`/events/search${qs ? `?${qs}` : ''}`);
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── HERO (light) ──────────────────────────────────────── */}
      <section className="relative" style={{ background: '#FAF6EE' }}>
        <div aria-hidden className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(31,77,58,0.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(120% 80% at 50% 0%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(120% 80% at 50% 0%, #000 40%, transparent 100%)',
        }} />
        <div className="relative mx-auto px-5 lg:px-10 pt-12 pb-14 lg:pt-16 lg:pb-16 text-center" style={{ maxWidth: 1280 }}>
          <span className="inline-flex items-center gap-2 px-4 h-[34px] rounded-full text-[13px] font-medium mb-6"
            style={{ background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <span style={{ color: '#C9A45E' }}>✦</span> Events for every moment
          </span>

          <h1 className="font-title font-bold mx-auto"
            style={{ fontSize: 'clamp(38px,6.5vw,68px)', lineHeight: 1.02, letterSpacing: '-0.04em', color: '#0F1F18', maxWidth: 820 }}>
            Discover events that{' '}
            <span className="relative inline-block" style={{ color: '#1F4D3A' }}>
              move
              <svg viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden
                className="absolute w-[104%] pointer-events-none"
                style={{ left: '-2%', bottom: '-0.16em', height: '0.34em' }}>
                <path d="M4 16 C 50 6, 150 6, 196 14" stroke="#E8C57E" strokeWidth="5" fill="none" strokeLinecap="round" />
              </svg>
            </span>{' '}
            you.
          </h1>
          <p className="mt-5 mx-auto" style={{ fontSize: 'clamp(15px,2vw,18px)', lineHeight: 1.6, color: '#6B7A72', maxWidth: 520 }}>
            Find conferences, festivals, workshops and experiences worth your time — near you or anywhere in the world.
          </p>

          {/* Search card */}
          <div className="mt-9 mx-auto rounded-3xl text-left"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 12px 40px rgba(15,31,24,0.10)', padding: 16, maxWidth: 920 }}>
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4" style={{ height: 56, borderBottom: '1px solid #E5E0D4' }}>
              <Search size={20} style={{ color: '#6B7A72', flexShrink: 0 }} />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') scrollToResults(); }}
                placeholder="Search events, topics, organizers or venues"
                aria-label="Search events, topics, organizers or venues"
                className="flex-1 bg-transparent text-[16px] outline-none" style={{ color: '#0F1F18' }} />
            </div>

            {/* Filter controls — city, date, category, format + search */}
            <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2.5 pt-3.5">
              <Dropdown
                icon={<MapPin size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />}
                label="City" value={city} placeholder="Anywhere" onChange={setCity}
                options={[{ value: '', label: 'Anywhere' }, ...cities.map(c => ({ value: c, label: c }))]}
              />
              <Dropdown
                icon={<Calendar size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />}
                label="When" value={when} placeholder="Any time" onChange={setWhen}
                options={WHEN_OPTIONS}
              />
              <Dropdown
                icon={<Tag size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />}
                label="Category" value={activeCat} placeholder="Any category" onChange={setActiveCat}
                options={CATEGORIES.map(c => ({ value: c, label: c === 'All' ? 'Any category' : c }))}
              />
              <Dropdown
                icon={format === 'online'
                  ? <Globe size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />
                  : <Users size={16} style={{ color: '#6B7A72', flexShrink: 0 }} />}
                label="Format" value={format} placeholder="Any format" onChange={v => setFormat(v as FormatValue)}
                options={FORMAT_OPTIONS.map(f => ({ value: f.value, label: f.label }))}
              />
              {/* Search button */}
              <button onClick={scrollToResults}
                className="col-span-2 lg:col-span-1 h-[46px] px-6 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}>
                Find events <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Admin promo banner (hero) — from `promo_banners` ──── */}
      {promoBanner && (
        <Band bg="#FAF6EE" divider={false}>
          <AdminPromoBanner banner={promoBanner} onCta={() => onBannerCta(promoBanner)} />
        </Band>
      )}

      {/* ── Explore by category ─────────────────────────────── */}
      <Band bg="#FAF6EE">
        <h2 className="font-title font-bold text-[22px] sm:text-[26px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Explore by category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATS_TILES.map(c => (
            <button key={c.n}
              onClick={() => { if (c.cat) { setActiveCat(c.cat); scrollToResults(); } else { router.push('/events/search'); } }}
              className="rounded-2xl py-5 px-4 text-center border transition hover:-translate-y-[3px] hover:shadow-md block"
              style={{ background: `${c.bg}55`, borderColor: '#E5E0D4' }}>
              <div className="w-11 h-11 rounded-[12px] mx-auto mb-3 flex items-center justify-center" style={{ background: c.bg }}>
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke={c.fg} strokeWidth="1.9">
                  <path d={c.path} />
                </svg>
              </div>
              <div className="font-display font-medium text-[14px]" style={{ color: '#0F1F18' }}>{c.n}</div>
            </button>
          ))}
        </div>
      </Band>

      {/* ── Featured + Results ──────────────────────────────── */}
      <Band bg="#FAF6EE">
        {/* Featured (only with no active filter, and no admin promo banner hero) */}
        {featured && !hasFilter && !promoBanner && (
          <Link href={`/e/${getSlug(featured)}`}
            className="relative block h-72 sm:h-80 rounded-3xl overflow-hidden mb-10 group"
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

        {/* Get the app band */}
        <div
          className="rounded-2xl border px-5 py-5 sm:px-7 sm:py-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{ background: '#163828', borderColor: 'rgba(232,197,126,0.28)' }}
        >
          <div>
            <div className="font-title font-bold text-[18px] sm:text-[20px]" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
              Get the app to save &amp; register faster.
            </div>
            <div className="text-[13.5px] mt-1" style={{ color: 'rgba(250,246,238,0.72)' }}>
              Your tickets, cards and check-in — in your pocket, even offline.
            </div>
          </div>
          <AppStoreBadges onDark size="sm" />
        </div>

        {/* Results */}
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
              {format !== 'all' && ` · ${FORMAT_OPTIONS.find(f => f.value === format)?.label}`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {hasFilter && (
              <button onClick={() => { setQuery(''); setActiveCat('All'); setCity(''); setWhen('any'); setFormat('all'); }}
                className="text-[13px] font-medium transition hover:opacity-70" style={{ color: '#6B7A72' }}>
                Clear filters
              </button>
            )}
            <button onClick={goToMap}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-semibold transition hover:bg-[#E8EFEB]"
              style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', background: '#FFFFFF' }}>
              <MapIcon size={14} /> View on map
            </button>
          </div>
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
      </Band>

      {/* ── Browse by city ──────────────────────────────────── */}
      <Band bg="#FAF6EE">
        <h2 className="font-title font-bold text-[22px] sm:text-[26px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Browse by city
        </h2>
        <p className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>Jump straight to what&apos;s happening in your city.</p>
        <div className="flex flex-wrap gap-2.5">
          {cities.slice(0, 16).map(c => (
            <Link key={c} href={`/events/city/${citySlug(c)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-[13px] font-medium transition hover:-translate-y-0.5 hover:shadow-sm hover:border-[#1F4D3A]"
              style={{ background: '#FFFFFF', borderColor: '#E5E0D4', color: '#3A4A42', textDecoration: 'none' }}>
              <MapPin size={13} style={{ color: '#1F4D3A' }} /> {c}
            </Link>
          ))}
        </div>
      </Band>

      {/* ── Top hosts ───────────────────────────────────────── */}
      {hosts.length > 0 && (
        <Band bg="#FAF6EE">
          <h2 className="font-title font-bold text-[22px] sm:text-[26px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Top event hosts
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>Organizers creating events worth showing up for.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hosts.map((h, i) => (
              <Link key={h.name}
                href={h.userId ? `/o/${h.userId}` : `/events/search?q=${encodeURIComponent(h.name)}`}
                className="group flex items-center gap-4 p-4 rounded-2xl transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                {h.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={h.avatar} alt={h.name} className="w-12 h-12 rounded-2xl object-cover shrink-0" style={{ border: '2px solid #E8EFEB' }} />
                ) : (
                  <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white font-display font-semibold text-[15px]"
                    style={{ background: HOST_BG[i % HOST_BG.length] }}>
                    {initials(h.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-[15px] truncate group-hover:text-[#1F4D3A] transition-colors" style={{ color: '#0F1F18' }}>{h.name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                    {h.count} event{h.count !== 1 ? 's' : ''} · Tap to view
                  </div>
                </div>
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-[#E5E0D4] text-[#1F4D3A] transition-colors group-hover:bg-[#1F4D3A] group-hover:border-[#1F4D3A] group-hover:text-white">
                  <ArrowRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </Band>
      )}

      {/* ── CTA — full-width forest band ──────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ background: '#163828' }}>
        <div className="relative mx-auto px-5 lg:px-10 py-14 lg:py-20 flex flex-col lg:flex-row lg:items-center justify-between gap-8" style={{ maxWidth: 1280 }}>
          <div className="max-w-xl">
            <h3 className="font-title font-bold text-white" style={{ fontSize: 'clamp(24px,3vw,34px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Ready to host your next event?
            </h3>
            <p className="mt-3 text-[15px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.66)' }}>
              Create a beautiful event page, sell tickets, and give every attendee a personalized Eventera Card they&apos;ll share.
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
  );
}
