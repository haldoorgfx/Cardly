'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Calendar, MapPin, ArrowRight } from 'lucide-react';
import type { DiscoveryEvent } from './EventCard';

const CATS = ['All', 'Tech', 'Music', 'NGO', 'Sports', 'Corporate', 'Religious', 'Education', 'Arts'] as const;
type Cat = typeof CATS[number];

const CAT_GRADIENT: Record<string, string> = {
  Music:     'linear-gradient(150deg,#241733,#3a2a55 70%,#5a4a7a)',
  Sports:    'linear-gradient(150deg,#2b160c,#5a3320 70%,#9a6038)',
  Corporate: 'linear-gradient(150deg,#0b1a26,#1e3a55 70%,#3a6a90)',
  Religious: 'linear-gradient(150deg,#1F4D3A,#2A6A50 45%,#C9A45E 125%)',
  Arts:      'linear-gradient(150deg,#2b0f1a,#5a2036 70%,#a04a68)',
  _default:  'linear-gradient(150deg,#0D1F17,#1F4D3A 60%,#2A6A50)',
};

function getGradient(cat: string | null | undefined) {
  return CAT_GRADIENT[cat ?? ''] ?? CAT_GRADIENT._default;
}

function resolveSlug(page: DiscoveryEvent) {
  return page.custom_slug ?? (page.events?.slug ?? page.event_id);
}

function fmtDate(iso: string, tz: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { timeZone: tz, month: 'short', day: 'numeric' });
  } catch {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}

function priceLabel(p: number | null | undefined) {
  if (p == null) return null;
  return p === 0 ? 'Free' : `From $${p % 1 === 0 ? p.toFixed(0) : p.toFixed(2)}`;
}

interface DiscoveryFeedProps {
  events: DiscoveryEvent[];
  savedIds: string[];
  greeting: string | null;
  interests: string[];
  followedOrgIds: string[];
  cities: string[];
}

export function DiscoveryFeed({ events }: DiscoveryFeedProps) {
  const router = useRouter();
  const [cat, setCat] = useState<Cat>('All');
  const [query, setQuery] = useState('');

  const now = new Date();
  const upcoming = events.filter(e => !e.ends_at || new Date(e.ends_at) >= now);

  const featured = cat === 'All' ? (upcoming[0] ?? null) : null;
  const filtered = cat === 'All'
    ? upcoming.slice(1)
    : upcoming.filter(e => e.category?.toLowerCase() === cat.toLowerCase());

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/events/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div style={{
      background: '#FAF6EE',
      backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.045) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
      minHeight: '100vh',
    }}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1100px] px-5 lg:px-8 pt-14 lg:pt-20 pb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-6 rounded-full px-3.5 py-1.5 shadow-sm"
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(31,77,58,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8C57E' }} />
            <span className="text-[12.5px] font-medium" style={{ color: '#3A4A42' }}>Events on Karta</span>
          </div>

          <h1 className="font-display font-bold leading-[1.02] mb-5"
            style={{ fontSize: 'clamp(34px,5.5vw,58px)', color: '#1F4D3A', letterSpacing: '-0.035em' }}>
            Discover events worth showing up for.
          </h1>
          <p className="text-[16px] lg:text-[18px] leading-[1.55] mx-auto mb-8 max-w-[560px]"
            style={{ color: '#3A4A42' }}>
            From tech summits to festivals, find your next experience — and get a card worth sharing the moment you register.
          </p>

          <form onSubmit={handleSearch} className="mx-auto max-w-[560px]">
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-sm"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', height: 52 }}>
              <Search size={18} strokeWidth={1.8} style={{ color: '#6B7A72', flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search events, cities, topics…"
                className="flex-1 text-[15px] outline-none bg-transparent"
                style={{ color: '#0F1F18' }}
              />
              <button type="submit"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FAF6EE', flexShrink: 0 }}>
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Category chips */}
        <div className="mx-auto max-w-[1100px] px-5 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className="shrink-0 px-4 py-2 rounded-full text-[13px] font-medium border transition-colors"
                style={{
                  background: cat === c ? '#1F4D3A' : '#FFFFFF',
                  color: cat === c ? '#FAF6EE' : '#3A4A42',
                  borderColor: cat === c ? '#1F4D3A' : '#E5E0D4',
                }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────── */}
      {featured && (
        <section className="mx-auto max-w-[1100px] px-5 lg:px-8 pt-6">
          <div className="mb-3 text-[10px] tracking-[0.2em] uppercase"
            style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
            Featured this week
          </div>
          <Link href={`/e/${resolveSlug(featured)}`}
            className="block rounded-3xl overflow-hidden group transition hover:-translate-y-0.5"
            style={{ border: '1px solid #E5E0D4' }}>
            <div className="relative overflow-hidden" style={{ height: 'clamp(180px,28vw,260px)' }}>
              {featured.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured.cover_image_url} alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.02]"
                  style={{ transitionDuration: '400ms' }} />
              ) : (
                <div className="absolute inset-0" style={{ background: getGradient(featured.category) }} />
              )}
              {/* Wave lines */}
              <svg aria-hidden viewBox="0 0 400 260" preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
                {[0,1,2,3].map(i => (
                  <path key={i} d={`M-40 ${60+i*55} Q110 ${-4+i*55} 220 ${100+i*55} T460 ${70+i*55}`}
                    fill="none" stroke="#E8C57E" strokeWidth="1.5" />
                ))}
              </svg>
              <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.72) 0%, rgba(10,20,14,0.08) 55%)' }} />
              <div className="absolute inset-0 p-6 lg:p-8 flex flex-col justify-between">
                {featured.category && (
                  <span className="self-start text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: 'rgba(250,246,238,0.95)', color: '#163828', fontFamily: '"JetBrains Mono", monospace' }}>
                    {featured.category}
                  </span>
                )}
                <div>
                  <div className="font-display font-bold leading-[1.02] max-w-[600px]"
                    style={{ fontSize: 'clamp(22px,3vw,36px)', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                    {featured.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-[13px]"
                    style={{ color: 'rgba(255,255,255,0.85)', fontFamily: '"JetBrains Mono", monospace' }}>
                    {featured.starts_at && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={14} style={{ color: '#E8C57E' }} />
                        {fmtDate(featured.starts_at, featured.timezone)}
                      </span>
                    )}
                    {(featured.city || featured.venue_name) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} style={{ color: '#E8C57E' }} />
                        {featured.city ?? featured.venue_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Grid ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] w-full px-5 lg:px-8 py-8">
        <div className="mb-4 text-[10px] tracking-[0.2em] uppercase"
          style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
          {cat === 'All' ? 'Upcoming events' : `${cat} events`} · {filtered.length}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl flex items-center justify-center py-24 text-center"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div>
              <div className="text-[16px] font-medium mb-2" style={{ color: '#0F1F18' }}>
                No {cat === 'All' ? '' : cat + ' '}events yet
              </div>
              <div className="text-[14px]" style={{ color: '#6B7A72' }}>Check back soon</div>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(e => <DirCard key={e.id} page={e} />)}
          </div>
        )}
      </section>

      {/* ── Host CTA ─────────────────────────────────────── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)' }}>
        <div aria-hidden className="absolute inset-0"
          style={{ background: 'radial-gradient(40% 80% at 80% 50%, rgba(232,197,126,0.22), transparent 60%)' }} />
        <div className="relative mx-auto max-w-[1100px] px-5 lg:px-8 py-16 text-center">
          <h2 className="font-display font-bold leading-[1.05]"
            style={{ fontSize: 'clamp(24px,3.5vw,38px)', color: '#FFFFFF', letterSpacing: '-0.025em' }}>
            Hosting something? List it on Karta.
          </h2>
          <p className="mt-4 text-[15px] lg:text-[16px] leading-[1.55] mx-auto max-w-[480px]"
            style={{ color: 'rgba(255,255,255,0.75)' }}>
            Free to start. Sell tickets, run the day, and give every attendee a card they&apos;ll actually share.
          </p>
          <Link href="/account/login"
            className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-[15px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#163828' }}>
            Create your event <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function DirCard({ page }: { page: DiscoveryEvent }) {
  const slug = resolveSlug(page);
  const price = priceLabel(page.price_from);

  return (
    <Link href={`/e/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
      {/* Cover */}
      <div className="relative overflow-hidden" style={{ height: 140 }}>
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.cover_image_url} alt={page.title}
            className="absolute inset-0 w-full h-full object-cover transition group-hover:scale-[1.03]"
            style={{ transitionDuration: '400ms' }} />
        ) : (
          <>
            <div className="absolute inset-0" style={{ background: getGradient(page.category) }} />
            <svg aria-hidden viewBox="0 0 400 140" preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
              {[0,1,2,3].map(i => (
                <path key={i} d={`M-40 ${36+i*32} Q110 ${-2+i*32} 220 ${60+i*32} T460 ${40+i*32}`}
                  fill="none" stroke="#E8C57E" strokeWidth="1.2" />
              ))}
            </svg>
          </>
        )}
        <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
          {page.category && (
            <span className="self-start text-[9px] tracking-[0.12em] uppercase px-2 py-1 rounded-full font-semibold"
              style={{ background: 'rgba(250,246,238,0.95)', color: '#163828', fontFamily: '"JetBrains Mono", monospace' }}>
              {page.category}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-display font-semibold text-[16px] leading-snug tracking-tight line-clamp-2 mb-2"
          style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
          {page.title}
        </div>
        <div className="flex items-center gap-2 text-[12px]"
          style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
          {page.starts_at && (
            <>
              <Calendar size={12} />
              <span>{fmtDate(page.starts_at, page.timezone)}</span>
            </>
          )}
          {(page.city || page.venue_name) && (
            <>
              <span style={{ color: '#E5E0D4' }}>·</span>
              <MapPin size={12} />
              <span className="truncate">{page.city ?? page.venue_name}</span>
            </>
          )}
        </div>
        <div className="mt-auto pt-3.5 flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: '#1F4D3A' }}>{price ?? ''}</span>
          <span className="inline-flex items-center gap-1 text-[12.5px] transition-colors group-hover:text-[#1F4D3A]"
            style={{ color: '#3A4A42' }}>
            View <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}
