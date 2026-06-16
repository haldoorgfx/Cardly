'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { DiscoveryEvent } from './EventCard';

/* ─── Types ─────────────────────────────────────────────────────── */

interface DiscoveryFeedProps {
  events: DiscoveryEvent[];
  savedIds: string[];
  greeting: string | null;
  interests: string[];
  followedOrgIds: string[];
  cities: string[];
}

/* ─── Helpers ───────────────────────────────────────────────────── */

const CAT_GRADIENT: Record<string, string> = {
  Music:     'linear-gradient(150deg,#241733,#3a2a55 70%,#5a4a7a)',
  Sports:    'linear-gradient(150deg,#2b160c,#5a3320 70%,#9a6038)',
  Corporate: 'linear-gradient(150deg,#0b1a26,#1e3a55 70%,#3a6a90)',
  Religious: 'linear-gradient(150deg,#1F4D3A,#2A6A50 45%,#C9A45E 125%)',
  Arts:      'linear-gradient(150deg,#2b0f1a,#5a2036 70%,#a04a68)',
  _default:  'linear-gradient(150deg,#0D1F17,#1F4D3A 60%,#2A6A50)',
};

function getGradient(cat?: string | null) {
  return CAT_GRADIENT[cat ?? ''] ?? CAT_GRADIENT._default;
}

function resolveSlug(page: DiscoveryEvent) {
  return page.custom_slug ?? (page.events?.slug ?? page.event_id);
}

function fmtDate(iso: string, tz?: string) {
  try {
    return new Date(iso).toLocaleDateString('en', { timeZone: tz, month: 'short', day: 'numeric' });
  } catch {
    return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }
}

function fmtMonthDay(iso: string) {
  const d = new Date(iso);
  return {
    mo: d.toLocaleDateString('en', { month: 'short' }).toUpperCase(),
    dy: d.toLocaleDateString('en', { day: 'numeric' }),
  };
}

function priceLabel(p?: number | null) {
  if (p == null) return null;
  return p === 0 ? 'Free' : `From $${p % 1 === 0 ? p.toFixed(0) : p.toFixed(2)}`;
}

/* ─── Category tiles data ───────────────────────────────────────── */

const CATS_TILES = [
  { n: 'Tech',      bg: '#E8EFEB', fg: '#1F4D3A', path: 'M8 9l-3 3 3 3M16 9l3 3-3 3M13 6l-2 12' },
  { n: 'Music',     bg: '#FBE9EC', fg: '#C0436B', path: 'M9 18V4l12-2v14M6 18a3 3 0 100-6 3 3 0 000 6zM18 16a3 3 0 100-6 3 3 0 000 6z' },
  { n: 'Business',  bg: '#E7EEF8', fg: '#2C5BAA', path: 'M2 7h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V7zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2' },
  { n: 'Sports',    bg: '#FBEEDD', fg: '#D2853A', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 3a14 14 0 000 18M3 12h18M5 6c3 2 11 2 14 0M5 18c3-2 11-2 14 0' },
  { n: 'Arts',      bg: '#F0E9FA', fg: '#7C4DC4', path: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 011.7-1.7H16c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z' },
  { n: 'Education', bg: '#E8EFEB', fg: '#1F4D3A', path: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1 3 3 6 3s6-2 6-3v-5' },
  { n: 'Health',    bg: '#FBE9EC', fg: '#C0436B', path: 'M20.8 8.6a5 5 0 00-8.8-3 5 5 0 00-8.8 3c0 5 8.8 11 8.8 11s8.8-6 8.8-11z' },
  { n: 'More',      bg: '#F0EDE8', fg: '#6B7A72', path: 'M5 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM12 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM19 12a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
];

/* ─── Stats band data ───────────────────────────────────────────── */

const STATS = [
  { v: '12,500+', l: 'Events',    s: 'Across all categories',  path: 'M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zM1 9h22M8 2v4M16 2v4' },
  { v: '58,000+', l: 'Attendees', s: 'Joining experiences',    path: 'M16 11l2 2 4-4M3 20c0-3 2.7-5 6-5s6 2 6 5M9 12a4 4 0 100-8 4 4 0 000 8z' },
  { v: '1,200+',  l: 'Hosts',     s: 'Creating amazing events', path: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4zM9 12l2 2 4-4' },
  { v: '45+',     l: 'Cities',    s: 'Worldwide',               path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z' },
];

/* ─── Trust items ───────────────────────────────────────────────── */

const TRUST = [
  { t: 'Secure & trusted', s: 'Your data is safe with us.', path: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4zM9 12l2 2 4-4' },
  { t: 'Easy ticketing',   s: 'Simple, fast and reliable.', path: 'M3 9a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2H3v-2a2 2 0 000-4V9z' },
  { t: '24/7 Support',     s: "We're here to help.",         path: 'M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
  { t: 'Global community', s: 'Events that bring us together.', path: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18 14 14 0 010-18z' },
];

/* ─── Hero stacked card ─────────────────────────────────────────── */

function HeroCard({ ep, label, style }: {
  ep: DiscoveryEvent;
  label?: string;
  style: React.CSSProperties;
}) {
  const slug = resolveSlug(ep);
  const { mo, dy } = ep.starts_at ? fmtMonthDay(ep.starts_at) : { mo: '', dy: '' };

  return (
    <Link href={`/e/${slug}`}
      className="absolute block rounded-[18px] overflow-hidden"
      style={{ ...style, textDecoration: 'none', boxShadow: '0 4px 24px rgba(15,31,24,0.14)' }}>
      {ep.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ep.cover_image_url} alt={ep.title} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: getGradient(ep.category) }} />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.90) 0%, rgba(10,20,14,0.15) 55%, transparent 100%)' }} />
      {label && (
        <span className="absolute top-[18px] left-[18px] z-10 px-3 py-[5px] rounded-full text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ background: 'rgba(250,246,238,0.95)', color: '#1F4D3A' }}>
          {label}
        </span>
      )}
      {ep.starts_at && (
        <div className="absolute top-4 right-4 z-10 w-[54px] rounded-[12px] text-center py-[7px]"
          style={{ background: 'rgba(250,246,238,0.96)', boxShadow: '0 1px 4px rgba(15,31,24,0.12)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#C9A45E' }}>{mo}</div>
          <div className="font-display font-semibold text-[20px] leading-none mt-0.5" style={{ color: '#0F1F18' }}>{dy}</div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-5">
        <div className="font-display font-semibold text-white text-[22px] leading-tight" style={{ letterSpacing: '-0.01em' }}>
          {ep.title}
        </div>
        {(ep.city || ep.venue_name) && (
          <div className="flex items-center gap-1.5 mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
            <svg viewBox="0 0 24 24" className="w-[13px] h-[13px] shrink-0" fill="none" stroke="#E8C57E" strokeWidth="1.8">
              <path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z"/>
              <circle cx="12" cy="11" r="2.2"/>
            </svg>
            {ep.city ?? ep.venue_name}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Trending card ─────────────────────────────────────────────── */

const CAT_COLORS: Record<string, string> = {
  Tech: '#1F4D3A', Music: '#C0436B', Business: '#2C5BAA', Sports: '#D2853A',
  Arts: '#7C4DC4', Education: '#1F4D3A', Health: '#C0436B', NGO: '#2D7A4F', Corporate: '#2C5BAA',
};

function TrendCard({ ep }: { ep: DiscoveryEvent }) {
  const slug = resolveSlug(ep);
  const price = priceLabel(ep.price_from);
  const [saved, setSaved] = useState(false);
  const catColor = CAT_COLORS[ep.category ?? ''] ?? '#1F4D3A';

  return (
    <div className="rounded-[16px] overflow-hidden transition hover:-translate-y-[3px]"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 4px rgba(15,31,24,0.04)' }}>
      <div className="relative" style={{ aspectRatio: '16/10' }}>
        {ep.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt={ep.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: getGradient(ep.category) }} />
        )}
        {ep.category && (
          <span className="absolute bottom-3 left-3 z-10 px-3 py-[5px] rounded-full text-[11px] font-semibold text-white"
            style={{ background: catColor }}>
            {ep.category}
          </span>
        )}
        <button onClick={e => { e.preventDefault(); setSaved(v => !v); }}
          className="absolute top-3 right-3 z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.92)' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill={saved ? '#B8423C' : 'none'} stroke={saved ? '#B8423C' : '#3A4A42'} strokeWidth="1.8">
            <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/>
          </svg>
        </button>
      </div>
      <Link href={`/e/${slug}`} style={{ textDecoration: 'none' }}>
        <div className="px-[18px] pt-4 pb-[18px]">
          <div className="font-display font-semibold text-[16px] leading-snug line-clamp-2" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            {ep.title}
          </div>
          {ep.starts_at && (
            <div className="flex items-center gap-1.5 mt-2.5 text-[13px]" style={{ color: '#6B7A72' }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
              </svg>
              {fmtDate(ep.starts_at, ep.timezone)}
            </div>
          )}
          {(ep.city || ep.venue_name) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>
              </svg>
              {ep.city ?? ep.venue_name}
            </div>
          )}
          <div className="flex items-center justify-between mt-3.5 pt-3.5" style={{ borderTop: '1px solid #E5E0D4' }}>
            <span className="text-[13px] font-medium" style={{ color: '#1F4D3A' }}>{price ?? 'Register'}</span>
            <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ border: '1px solid #E5E0D4' }}>
              <svg viewBox="0 0 24 24" className="w-[15px] h-[15px]" fill="none" stroke="#6B7A72" strokeWidth="1.8">
                <path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/>
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

/* ─── Section header ────────────────────────────────────────────── */

function SH({ title, href, linkText = 'View all →' }: { title: string; href: string; linkText?: string }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
      <h2 className="font-title font-bold" style={{ fontSize: 'clamp(23px,3vw,30px)', lineHeight: 1.18, letterSpacing: '-0.025em', color: '#0F1F18' }}>
        {title}
      </h2>
      <Link href={href} className="font-display font-medium text-[14px] inline-flex items-center gap-1.5 transition hover:opacity-80"
        style={{ color: '#1F4D3A', textDecoration: 'none' }}>
        {linkText}
      </Link>
    </div>
  );
}

/* ─── Main feed ─────────────────────────────────────────────────── */

export function DiscoveryFeed({ events }: DiscoveryFeedProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const now = new Date();
  const upcoming = events.filter(e => !e.ends_at || new Date(e.ends_at) >= now);
  const heroCards = upcoming.slice(0, 3);
  const trendingEvents = upcoming.slice(0, 8);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/events/search?q=${encodeURIComponent(query.trim())}`);
  }

  // Build host chips from real event organizers
  const hostMap = new Map<string, { name: string; count: number }>();
  upcoming.forEach(e => {
    if (e.organizer_name) {
      const ex = hostMap.get(e.organizer_name);
      if (ex) ex.count++;
      else hostMap.set(e.organizer_name, { name: e.organizer_name, count: 1 });
    }
  });
  const hosts = Array.from(hostMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);
  const HOST_BG = ['#1F4D3A', '#6B4D9E', '#16161A', '#D14B8F', '#3D7BC4'];

  const PW = 'mx-auto px-6 lg:px-10' as const;
  const MAX = { maxWidth: 1320 } as const;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section>
        <div className={`${PW} pt-10 lg:pt-16 pb-14 lg:pb-20`} style={MAX}>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 lg:items-start">

            {/* Left: text + search */}
            <div>
              <span className="inline-flex items-center gap-2 px-4 h-[34px] rounded-full text-[13px] font-medium"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <span style={{ color: '#C9A45E' }}>✦</span> Events for every moment
              </span>

              <h1 className="font-title font-bold mt-5"
                style={{ fontSize: 'clamp(44px,8vw,74px)', lineHeight: 1.02, letterSpacing: '-0.035em', color: '#0F1F18' }}>
                Discover events that{' '}
                <span className="relative inline-block" style={{ color: '#1F4D3A' }}>
                  move
                  <svg viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden
                    className="absolute w-[104%] pointer-events-none"
                    style={{ left: '-2%', bottom: '-0.18em', height: '0.36em' }}>
                    <path d="M4 16 C 50 6, 150 6, 196 14" stroke="#E8C57E" strokeWidth="5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>{' '}
                you.
              </h1>

              <p className="mt-5" style={{ fontSize: 'clamp(16px,2.2vw,19px)', lineHeight: 1.6, color: '#6B7A72', maxWidth: 480 }}>
                Find conferences, festivals, workshops and experiences worth your time.
              </p>

              {/* Search card */}
              <form onSubmit={handleSearch}
                className="mt-8 rounded-[18px]"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 4px 24px rgba(15,31,24,0.08)', padding: 14, maxWidth: 560 }}>
                <div className="flex items-center gap-3 px-4" style={{ height: 52, borderBottom: '1px solid #E5E0D4' }}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="#6B7A72" strokeWidth="2">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
                  </svg>
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="Search events, topics or organizers"
                    className="flex-1 text-[15px] outline-none bg-transparent" style={{ color: '#0F1F18' }} />
                </div>
                <div className="flex gap-2.5 pt-3.5 flex-wrap">
                  {[
                    { label: 'Location', path: 'M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10zM12 11a2.2 2.2 0 100-4.4A2.2 2.2 0 0012 11z' },
                    { label: 'Date',     path: 'M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zM1 9h22M8 2v4M16 2v4' },
                    { label: 'Category', path: 'M20.6 13.4L11 3.8a2 2 0 00-1.4-.6H4a1 1 0 00-1 1v5.6a2 2 0 00.6 1.4l9.6 9.6a2 2 0 002.8 0l4.6-4.6a2 2 0 000-2.8zM7.5 7.5a1 1 0 100-2 1 1 0 000 2z' },
                  ].map(d => (
                    <div key={d.label} className="flex-1 min-w-[120px] h-[46px] px-3.5 rounded-xl flex items-center gap-2.5 text-[14px] cursor-pointer select-none"
                      style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#3A4A42' }}>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="#6B7A72" strokeWidth="1.8">
                        <path d={d.path}/>
                      </svg>
                      {d.label}
                      <svg viewBox="0 0 24 24" className="w-4 h-4 ml-auto shrink-0" fill="none" stroke="#6B7A72" strokeWidth="1.8">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  ))}
                  <button type="submit"
                    className="h-[46px] px-5 rounded-xl font-medium text-[14px] flex items-center gap-2 shrink-0 transition hover:opacity-90"
                    style={{ background: '#1F4D3A', color: '#FFFFFF', border: 'none', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}>
                    Find events
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-3.5 px-1 text-[13px]" style={{ color: '#6B7A72' }}>
                  <span className="font-medium" style={{ color: '#3A4A42' }}>Popular:</span>
                  {['Tech', 'Startup', 'Music', 'Education', 'Sports'].map((tag, i, arr) => (
                    <span key={tag} className="flex items-center gap-2">
                      <Link href={`/events/search?q=${tag}`} className="font-medium transition hover:opacity-80"
                        style={{ color: '#1F4D3A', textDecoration: 'none' }}>{tag}</Link>
                      {i < arr.length - 1 && <span style={{ color: '#E5E0D4' }}>·</span>}
                    </span>
                  ))}
                </div>
              </form>
            </div>

            {/* Right: stacked hero cards (desktop only) */}
            {heroCards.length > 0 && (
              <div className="hidden lg:block relative" style={{ minHeight: 465 }}>
                {heroCards[0] && (
                  <HeroCard ep={heroCards[0]} label="Featured" style={{ top: 0, right: 0, width: '90%', height: 240 }} />
                )}
                {heroCards[1] && (
                  <HeroCard ep={heroCards[1]} style={{ top: 175, right: 0, width: '80%', height: 175 }} />
                )}
                {heroCards[2] && (
                  <HeroCard ep={heroCards[2]} style={{ top: 300, left: 0, width: '82%', height: 165 }} />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── LIVE STRIP + STATS ──────────────────────────────── */}
      <div className={`${PW} pb-10`} style={MAX}>
        {/* Live strip */}
        <div className="flex flex-wrap items-center gap-6 p-5 px-6 rounded-2xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 4px rgba(15,31,24,0.04)' }}>
          <div className="flex items-center gap-2.5 font-display font-semibold text-[13px] tracking-[0.04em]" style={{ color: '#B8423C' }}>
            <span className="w-[9px] h-[9px] rounded-full" style={{ background: '#B8423C', animation: 'pulse 1.6s ease-in-out infinite' }} />
            LIVE NOW
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: '#E8EFEB' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                <path d="M16 11l2 2 4-4M3 20c0-3 2.7-5 6-5s6 2 6 5M9 12a4 4 0 100-8 4 4 0 000 8z"/>
              </svg>
            </div>
            <div>
              <div className=" font-medium text-[17px]" style={{ color: '#0F1F18' }}>{upcoming.length || 120}</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>people registered today</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: '#E8EFEB' }}>
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#1F4D3A" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
              </svg>
            </div>
            <div>
              <div className=" font-medium text-[17px]" style={{ color: '#0F1F18' }}>{upcoming.length || 32}</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>events listed</div>
            </div>
          </div>
          <Link href="/events/search" className="ml-auto font-display font-medium text-[13px] inline-flex items-center gap-1.5 transition hover:opacity-80 whitespace-nowrap"
            style={{ color: '#1F4D3A', textDecoration: 'none' }}>
            Explore all events <ArrowRight size={14} />
          </Link>
        </div>

        {/* Stats band */}
        <div className="grid grid-cols-2 lg:grid-cols-4 mt-4 overflow-hidden rounded-2xl" style={{ border: '1px solid #E5E0D4', gap: 1, background: '#E5E0D4' }}>
          {STATS.map(s => (
            <div key={s.l} className="flex items-center gap-4 px-6 py-6" style={{ background: '#FFFFFF' }}>
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0" style={{ background: '#1F4D3A' }}>
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#E8C57E" strokeWidth="1.7">
                  <path d={s.path}/>
                </svg>
              </div>
              <div>
                <div className="font-display font-semibold text-[22px] leading-none" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>{s.v}</div>
                <div className="font-display font-medium text-[13px] mt-1" style={{ color: '#0F1F18' }}>{s.l}</div>
                <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIES ──────────────────────────────────────── */}
      <div className={`${PW} pb-16`} style={MAX}>
        <SH title="Explore by category" href="/events/search" linkText="View all categories →" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATS_TILES.map(c => (
            <Link key={c.n} href={`/events/search?q=${c.n}`}
              className="rounded-2xl py-5 px-4 text-center border transition hover:-translate-y-[3px] hover:shadow-md block"
              style={{ background: `${c.bg}30`, border: '1px solid #E5E0D4', textDecoration: 'none' }}>
              <div className="w-11 h-11 rounded-[12px] mx-auto mb-3 flex items-center justify-center" style={{ background: c.bg }}>
                <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" fill="none" stroke={c.fg} strokeWidth="1.9">
                  <path d={c.path}/>
                </svg>
              </div>
              <div className="font-display font-medium text-[14px]" style={{ color: '#0F1F18' }}>{c.n}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── TRENDING EVENTS ─────────────────────────────────── */}
      {trendingEvents.length > 0 && (
        <div className={`${PW} pb-16`} style={MAX}>
          <SH title="Trending events" href="/events/search" linkText="View all events →" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingEvents.slice(0, 4).map(e => <TrendCard key={e.id} ep={e} />)}
          </div>
        </div>
      )}

      {/* ── HOST CHIPS ──────────────────────────────────────── */}
      {hosts.length > 0 && (
        <div className={`${PW} pb-16`} style={MAX}>
          <SH title="Top event hosts" href="/discover" linkText="View all hosts →" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {hosts.map(([name, info], i) => (
              <div key={name} className="flex flex-wrap items-center gap-3 p-4 rounded-[14px]"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <div className="w-11 h-11 rounded-[12px] shrink-0 flex items-center justify-center text-white font-display font-semibold text-[14px]"
                  style={{ background: HOST_BG[i % HOST_BG.length] }}>
                  {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-[14px] leading-snug truncate" style={{ color: '#0F1F18' }}>{name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{info.count} event{info.count !== 1 ? 's' : ''}</div>
                </div>
                <Link href={`/events/search?q=${encodeURIComponent(name)}`}
                  className="ml-auto font-display font-medium text-[12px] px-3.5 py-1.5 rounded-full border transition hover:bg-[#1F4D3A] hover:text-white hover:border-[#1F4D3A]"
                  style={{ color: '#1F4D3A', borderColor: '#1F4D3A', textDecoration: 'none' }}>
                  Follow
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA BAND ────────────────────────────────────────── */}
      <div className={`${PW} pb-16`} style={MAX}>
        <div className="relative rounded-[22px] overflow-hidden" style={{ background: '#163828' }}>
          {/* Gold glow */}
          <div aria-hidden className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(50% 80% at 85% 50%, rgba(232,197,126,0.22), transparent 60%)' }} />
          <div className="relative grid lg:grid-cols-[1fr_1px_1fr] gap-8 lg:gap-12 p-10 lg:p-14 lg:items-center">
            <div>
              <p className="font-title font-medium text-white" style={{ fontSize: 'clamp(19px,2.4vw,23px)', lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                &ldquo;Eventera helps me discover events I care about and connect with people who inspire me.&rdquo;
              </p>
              <div className="flex items-center gap-3.5 mt-5">
                <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px] text-white"
                  style={{ background: '#1F4D3A' }}>
                  C
                </div>
                <div>
                  <div className="font-display font-medium text-[13px] text-white">Chiamaka A.</div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Product Designer</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block self-stretch" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <div>
              <h3 className="font-title font-bold text-white" style={{ fontSize: 'clamp(24px,3vw,30px)', letterSpacing: '-0.025em' }}>
                Ready to host your next event?
              </h3>
              <p className="mt-3 text-[14px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.62)', maxWidth: 380 }}>
                Create beautiful event pages, manage registrations, and give every attendee a card they&apos;ll share.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] transition hover:opacity-90 whitespace-nowrap"
                  style={{ background: '#E8C57E', color: '#163828', textDecoration: 'none' }}>
                  Host an event
                </Link>
                <Link href="/how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[14px] transition whitespace-nowrap"
                  style={{ background: 'transparent', border: '1px solid rgba(232,197,126,0.4)', color: '#E8C57E', textDecoration: 'none' }}>
                  How it works
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Trust footer */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-14 pb-6">
          {TRUST.map(t => (
            <div key={t.t} className="flex items-start gap-3.5">
              <div className="w-[42px] h-[42px] rounded-[11px] shrink-0 flex items-center justify-center"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <svg viewBox="0 0 24 24" className="w-[19px] h-[19px]" fill="none" stroke="#1F4D3A" strokeWidth="1.7">
                  <path d={t.path}/>
                </svg>
              </div>
              <div>
                <div className="font-display font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{t.t}</div>
                <div className="text-[12px] mt-1 leading-[1.5]" style={{ color: '#6B7A72' }}>{t.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
