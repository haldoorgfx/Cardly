'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, LayoutGrid, CalendarDays, Mic, Store, Users, MapPin, Sparkles } from 'lucide-react';
import type { Database } from '@/types/database';
import { AddToCalendarButton } from './AddToCalendarButton';
import SpeakerDirectoryClient from './SpeakerDirectoryClient';
import { bannerGradientFor, avatarColorFor, initialsOf, placeholderInitials } from '@/lib/events/placeholder';

/* ─── Types ─────────────────────────────────────────────────────── */

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];
type TicketTypeRow = Database['public']['Tables']['ticket_types']['Row'];
type Tab = 'overview' | 'schedule' | 'speakers' | 'sponsors' | 'network';

interface Session {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  room?: string | null;
  session_type?: string | null;
  description?: string | null;
}

interface Speaker {
  id: string;
  name: string;
  headline?: string | null;
  role?: string | null;
  photo_url?: string | null;
  speaker_type?: string | null;
  is_featured?: boolean | null;
}

interface Sponsor {
  id: string;
  company_name: string;
  tagline?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  tier?: string | null;
  position?: number | null;
}

interface Attendee {
  name: string;
  avatarUrl?: string | null;
}

interface Props {
  page: EventPageRow;
  tickets: TicketTypeRow[];
  dateStr: string;
  timeStr: string;
  endTimeStr: string;
  minPrice: string;
  registrationSlug: string;
  organizerUserId?: string | null;
  seriesSlug?: string | null;
  seriesName?: string | null;
  sessions?: Session[];
  speakers?: Speaker[];
  sponsors?: Sponsor[];
  attendees?: Attendee[];
  attendeeCount?: number;
  organizerAvatarUrl?: string | null;
  venueLat?: number | null;
  venueLng?: number | null;
  initialTab?: string;
  initialSaved?: boolean;
}

const TAB_SECTIONS = [
  { key: 'overview' as Tab, label: 'Overview', icon: LayoutGrid,   feature: null },
  { key: 'schedule' as Tab, label: 'Schedule', icon: CalendarDays, feature: 'schedule' },
  { key: 'speakers' as Tab, label: 'Speakers', icon: Mic,          feature: 'speakers' },
  { key: 'sponsors' as Tab, label: 'Sponsors', icon: Store,        feature: 'sponsors' },
  { key: 'network'  as Tab, label: 'Network',  icon: Users,        feature: 'networking' },
] as const;

const VALID_TABS: Tab[] = ['overview', 'schedule', 'speakers', 'sponsors', 'network'];
const TIER_ORDER = ['platinum', 'gold', 'silver', 'standard', 'partner', 'media'];

/* ─── Helpers ───────────────────────────────────────────────────── */

function fmtTicketPrice(price: number, currency?: string | null): string {
  if (price === 0) return 'Free';
  const cur = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${cur} ${price.toLocaleString()}`;
  }
}

function fmtSessionTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function fmtSessionDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

/* ─── Avatar with broken-image fallback to initials ─────────────── */

function Avatar({
  src, name, size, fontSize, seed, style,
}: { src?: string | null; name: string; size: number; fontSize: number; seed?: string; style?: React.CSSProperties }) {
  const [broken, setBroken] = useState(false);
  const showImg = src && !broken;
  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src!}
        alt={name}
        onError={() => setBroken(true)}
        className="rounded-full object-cover"
        style={{ width: size, height: size, ...style }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, fontSize, background: avatarColorFor(seed ?? name), ...style }}
    >
      {initialsOf(name)}
    </div>
  );
}

/* ─── Google Maps embed ─────────────────────────────────────────── */

function VenueMap({
  lat, lng, geoQuery, venueName,
}: { lat: number | null; lng: number | null; geoQuery: string; venueName: string }) {
  const query = (lat != null && lng != null) ? `${lat},${lng}` : geoQuery;
  if (!query.trim()) return null;
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=15`;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
      <iframe
        title={`Map of ${venueName}`}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full"
        style={{ height: 240, border: 0, display: 'block' }}
        allowFullScreen
      />
    </div>
  );
}

/* ─── Ticket list ───────────────────────────────────────────────── */

function TicketList({
  tickets, selectedTicket, setSelectedTicket,
  registerHref, page, minPrice, registrationSlug,
}: {
  tickets: TicketTypeRow[];
  selectedTicket: string;
  setSelectedTicket: (id: string) => void;
  registerHref: string;
  page: EventPageRow;
  minPrice: string;
  registrationSlug: string;
}) {
  const isSoldOut = (t: TicketTypeRow) => t.quantity !== null && t.quantity_sold >= t.quantity;
  const hasTickets = tickets.length > 0;
  const allSoldOut = hasTickets && tickets.every(isSoldOut);
  const registrationClosed = !!(page.registration_deadline && new Date(page.registration_deadline) < new Date());
  const selectedObj = tickets.find(t => t.id === selectedTicket);
  const total = selectedObj ? fmtTicketPrice(selectedObj.price, selectedObj.currency) : minPrice;

  return (
    <div className="rounded-[20px] overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 4px 24px rgba(15,31,24,0.08)' }}>
      <div className="flex items-baseline justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <div>
          <div className="text-[12px]" style={{ color: '#6B7A72' }}>From</div>
          <div className="font-title font-extrabold text-[30px] leading-none mt-0.5" style={{ color: '#1F4D3A', letterSpacing: '-0.03em' }}>
            {selectedObj ? fmtTicketPrice(selectedObj.price, selectedObj.currency) : minPrice}
            <span className="font-sans font-normal text-[13px] ml-1" style={{ color: '#6B7A72' }}>/ ticket</span>
          </div>
        </div>
        {hasTickets && !allSoldOut && (
          <span className="text-[12px] font-medium px-3 py-1 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            ● Selling now
          </span>
        )}
      </div>

      <div className="px-6 pt-4 pb-2">
        {tickets.map(ticket => {
          const soldOut = isSoldOut(ticket);
          const selected = selectedTicket === ticket.id;
          const remaining = ticket.quantity !== null ? ticket.quantity - ticket.quantity_sold : null;
          return (
            <button
              key={ticket.id}
              disabled={soldOut}
              onClick={() => !soldOut && setSelectedTicket(ticket.id)}
              className="w-full text-left mb-3 rounded-[14px] transition"
              style={{
                border: selected ? '1.5px solid #1F4D3A' : '1px solid #E5E0D4',
                background: selected ? '#E8EFEB' : 'transparent',
                padding: '15px 16px',
                opacity: soldOut ? 0.55 : 1,
                cursor: soldOut ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-title font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{ticket.name}</div>
                  {ticket.description && (
                    <div className="text-[12px] mt-0.5 leading-snug" style={{ color: '#6B7A72' }}>{ticket.description}</div>
                  )}
                </div>
                <div className="font-medium text-[15px] shrink-0" style={{ color: soldOut ? '#6B7A72' : '#0F1F18', textDecoration: soldOut ? 'line-through' : 'none' }}>
                  {soldOut ? 'Sold out' : fmtTicketPrice(ticket.price, ticket.currency)}
                </div>
              </div>
              {remaining !== null && !soldOut && remaining <= 20 && (
                <div className="text-[11px] mt-2 font-medium" style={{ color: '#C9A45E' }}>
                  {remaining} left at this price
                </div>
              )}
            </button>
          );
        })}

        {tickets.length === 0 && (
          <div className="text-[14px] py-2 mb-3" style={{ color: '#3A4A42' }}>Registration · Free</div>
        )}

        {hasTickets && (
          <div className="flex items-center justify-between pt-4 mt-2 mb-4" style={{ borderTop: '1px solid #E5E0D4' }}>
            <span className="font-title font-semibold text-[15px]" style={{ color: '#0F1F18' }}>Total</span>
            <span className="font-title font-extrabold text-[24px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>{total}</span>
          </div>
        )}

        {registrationClosed ? (
          <div className="flex items-center justify-center h-12 rounded-xl text-[15px] font-semibold" style={{ background: '#F5F0E8', color: '#6B7A72', border: '1px solid #E5E0D4' }}>
            Registration closed
          </div>
        ) : allSoldOut ? (
          <Link href={`/e/${registrationSlug}/waitlist`}
            className="flex items-center justify-center h-12 rounded-xl font-semibold text-[15px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
            Join waitlist
          </Link>
        ) : (
          <Link href={registerHref}
            className="flex items-center justify-center h-12 rounded-xl text-white font-semibold text-[15px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
            Get tickets
          </Link>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px]" style={{ color: '#6B7A72' }}>
          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="#1F4D3A" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
          </svg>
          Secure checkout · QR ticket + Eventera Card to your phone
        </div>

        {page.registration_deadline && !registrationClosed && (
          <div className="mt-2 text-center text-[12px]" style={{ color: '#6B7A72' }}>
            Registration closes {new Date(page.registration_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── ERA Q&A widget ────────────────────────────────────────────── */

function ERAQandA({ page, dateStr }: { page: EventPageRow; dateStr: string }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAsk() {
    const q = question.trim();
    if (!q) return;
    setLoading(true);
    setAnswer('');
    setError('');
    try {
      const res = await fetch('/api/era/answer-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          event: {
            name: page.title,
            description: page.description ?? '',
            date: dateStr,
            venue: page.is_online ? 'Online' : (page.venue_name ?? page.venue_address ?? 'TBD'),
            agenda: undefined,
          },
        }),
      });
      const data = await res.json() as { result?: string; error?: string };
      if (!res.ok || !data.result) {
        setError('ERA could not answer this right now. Please contact the organizer.');
      } else {
        setAnswer(data.result);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-9">
      <h2 className="font-title font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
        Have a question?
      </h2>
      <p className="text-[14px] mb-4" style={{ color: '#6B7A72' }}>
        Ask about this event and get an instant answer.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAsk()}
          placeholder="e.g. Is parking available? What time does it start?"
          className="flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50 shrink-0"
          style={{ background: '#1F4D3A' }}
        >
          {loading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
          ) : (
            <Sparkles size={14} strokeWidth={2} />
          )}
          <span className="hidden sm:inline">Ask ERA</span>
        </button>
      </div>
      {answer && (
        <div className="mt-3 p-4 rounded-xl" style={{ background: '#F5F9F6', border: '1px solid rgba(31,77,58,0.15)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#2D7A4F' }}>{'✶'} ERA</span>
          </div>
          <p className="text-[14px]" style={{ color: '#0F1F18', lineHeight: 1.7 }}>{answer}</p>
        </div>
      )}
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: '#B8423C' }}>{error}</p>
      )}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */

export function PublicEventPageClient({
  page, tickets, dateStr, timeStr, endTimeStr, minPrice,
  registrationSlug, organizerUserId, seriesSlug, seriesName,
  sessions = [], speakers = [], sponsors = [],
  attendees = [], attendeeCount = 0, organizerAvatarUrl = null,
  venueLat = null, venueLng = null,
  initialTab, initialSaved = false,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    VALID_TABS.includes(initialTab as Tab) ? (initialTab as Tab) : 'overview'
  );
  const [savedHeart, setSavedHeart] = useState(initialSaved);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string>(tickets[0]?.id ?? '');

  const features = (page as unknown as { features?: Record<string, boolean> }).features ?? {};
  const featureOn = (key: string) => features[key] !== false;
  const customMenu = ((page as unknown as { custom_menu?: { id: string; label: string; type: string; url?: string; content?: string }[] }).custom_menu ?? [])
    .filter(m => m && m.label);

  const selectedTicketObj = tickets.find(t => t.id === selectedTicket);
  const registerHref = selectedTicket
    ? `/e/${registrationSlug}/register?ticket=${selectedTicket}`
    : `/e/${registrationSlug}/register`;
  const registrationClosed = !!(page.registration_deadline && new Date(page.registration_deadline) < new Date());
  const allSoldOut = tickets.length > 0 && tickets.every(t => t.quantity !== null && t.quantity_sold >= t.quantity);
  const totalPrice = selectedTicketObj ? fmtTicketPrice(selectedTicketObj.price, selectedTicketObj.currency) : minPrice;

  const hasRealAttendees = attendees.length > 0;
  const shownAttendees = attendees.slice(0, 5);
  const placeholderInits = placeholderInitials(page.id, 4);

  const locationLine = page.is_online
    ? 'Online event'
    : [page.venue_name, page.venue_address].filter(Boolean).join(' · ') || 'Venue TBA';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags: string[] = (page as any).tags ?? [];

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: page.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  async function handleToggleSave() {
    if (saveBusy) return;
    setSaveBusy(true);
    const next = !savedHeart;
    try {
      const res = await fetch('/api/account/saved' + (next ? '' : `?event_page_id=${page.id}`), {
        method: next ? 'POST' : 'DELETE',
        headers: next ? { 'Content-Type': 'application/json' } : undefined,
        body: next ? JSON.stringify({ event_page_id: page.id }) : undefined,
      });
      if (res.status === 401) {
        setSaveToast('Sign in to save events');
        setTimeout(() => setSaveToast(null), 2500);
        return;
      }
      if (res.ok) {
        setSavedHeart(next);
        setSaveToast(next ? 'Saved!' : 'Removed from saved');
        setTimeout(() => setSaveToast(null), 2000);
      }
    } finally {
      setSaveBusy(false);
    }
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    const url = tab === 'overview'
      ? `/e/${registrationSlug}`
      : `/e/${registrationSlug}?tab=${tab}`;
    router.replace(url, { scroll: false });
  }

  const visibleTabs = TAB_SECTIONS.filter(t => !t.feature || featureOn(t.feature));

  // Group sessions by day for schedule tab
  const sessionsByDay = sessions.reduce<{ day: string; sessions: Session[] }[]>((acc, s) => {
    const day = fmtSessionDay(s.starts_at);
    const existing = acc.find(g => g.day === day);
    if (existing) existing.sessions.push(s);
    else acc.push({ day, sessions: [s] });
    return acc;
  }, []);

  // Group sponsors by tier
  const sponsorsByTier = sponsors.reduce<Record<string, Sponsor[]>>((acc, s) => {
    const tier = (s.tier ?? 'standard').toLowerCase();
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {});
  const sponsorTiers = TIER_ORDER.filter(t => sponsorsByTier[t]?.length);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── Breadcrumb + Hero ─────────────────────────────── */}
      <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: 1240 }}>

        <nav className="flex items-center flex-wrap gap-2 pt-6 pb-3.5 text-[13px]" style={{ color: '#6B7A72' }}>
          <Link href="/events" style={{ color: '#6B7A72', textDecoration: 'none' }}
            className="hover:text-[#1F4D3A] transition-colors">Discover</Link>
          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="#E5E0D4" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          {page.category && (
            <>
              <Link href={`/events/category/${page.category.toLowerCase()}`}
                style={{ color: '#6B7A72', textDecoration: 'none' }}
                className="hover:text-[#1F4D3A] transition-colors capitalize">
                {page.category}
              </Link>
              <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="#E5E0D4" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </>
          )}
          <span className="font-medium truncate max-w-[260px]" style={{ color: '#1F4D3A' }}>{page.title}</span>
        </nav>

        {/* Hero banner */}
        <div className="relative overflow-hidden mt-4 h-[280px] sm:h-[340px] lg:h-[380px]" style={{ borderRadius: 22 }}>
          {page.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.cover_image_url} alt={page.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: bannerGradientFor(page.id) }}>
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.10), transparent 38%), radial-gradient(circle at 82% 78%, rgba(255,255,255,0.06), transparent 42%)',
              }} />
            </div>
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.92) 0%, rgba(10,20,14,0.4) 45%, transparent 75%)' }} />

          {(page.category || seriesSlug) && (
            <span className="absolute top-5 left-5 z-10 px-3 py-[6px] rounded-full text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: '#E8C57E', color: '#0F1F18' }}>
              {seriesSlug && seriesName ? `Series: ${seriesName}` : page.category}
            </span>
          )}

          <div className="absolute top-[18px] right-[18px] z-10 flex gap-2.5">
            {saveToast && (
              <div className="absolute top-0 right-[92px] whitespace-nowrap px-3 py-1.5 rounded-lg text-[12px] font-medium pointer-events-none"
                style={{ background: 'rgba(15,31,24,0.85)', color: '#FAF6EE', backdropFilter: 'blur(8px)' }}>
                {saveToast}
              </div>
            )}
            <button onClick={handleToggleSave} disabled={saveBusy}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition hover:scale-110 active:scale-95 disabled:opacity-60"
              style={{ background: 'rgba(250,246,238,0.92)' }}
              aria-label={savedHeart ? 'Unsave event' : 'Save event'}>
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill={savedHeart ? '#B8423C' : 'none'} stroke={savedHeart ? '#B8423C' : '#3A4A42'} strokeWidth="1.9">
                <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z"/>
              </svg>
            </button>
            <button onClick={handleShare}
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center transition hover:scale-110 active:scale-95"
              style={{ background: 'rgba(250,246,238,0.92)' }}
              aria-label="Share event">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="#3A4A42" strokeWidth="1.9">
                <path d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M16 6l-4-4-4 4M12 2v14"/>
              </svg>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 px-9 pb-8">
            <h1 className="font-title font-extrabold leading-[1.02] text-white"
              style={{ fontSize: 'clamp(30px,5vw,52px)', letterSpacing: '-0.035em', maxWidth: 760 }}>
              {page.title}
            </h1>
            <div className="flex flex-wrap items-center gap-5 mt-4">
              {dateStr && (
                <span className="flex items-center gap-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="#E8C57E" strokeWidth="1.9">
                    <rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>
                  </svg>
                  {dateStr}{timeStr ? ` · ${timeStr}` : ''}{endTimeStr ? ` – ${endTimeStr}` : ''}
                </span>
              )}
              {locationLine && (
                <span className="flex items-center gap-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="#E8C57E" strokeWidth="1.9">
                    {page.is_online
                      ? <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18a14 14 0 010-18z"/></>
                      : <><path d="M12 21s-6-5.2-6-10a6 6 0 0112 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></>
                    }
                  </svg>
                  {locationLine}
                </span>
              )}
            </div>
          </div>

          {page.starts_at && (
            <div className="hidden sm:block absolute bottom-6 right-6 z-10">
              <AddToCalendarButton
                variant="solid"
                title={page.title}
                description={page.description ?? null}
                startsAt={page.starts_at}
                endsAt={page.ends_at ?? null}
                timezone={page.timezone ?? null}
                location={locationLine}
                eventUrl={`https://karta.cre8so.com/e/${registrationSlug}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Tab Bar ────────────────────────────────── */}
      {visibleTabs.length > 1 && (
        <div
          className="sticky z-30"
          style={{ top: 65, background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E5E0D4' }}
        >
          <div
            className="mx-auto px-6 lg:px-10 flex items-center gap-1 overflow-x-auto"
            style={{ maxWidth: 1240, height: 52, scrollbarWidth: 'none' }}
          >
            {visibleTabs.map(t => {
              const active = activeTab === t.key;
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => switchTab(t.key)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3.5 h-full text-[14px] font-medium border-b-2 transition-colors"
                  style={active
                    ? { color: '#1F4D3A', borderColor: '#1F4D3A', background: 'none', cursor: 'pointer' }
                    : { color: '#6B7A72', borderColor: 'transparent', background: 'none', cursor: 'pointer' }}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="mx-auto px-6 lg:px-10" style={{ maxWidth: 1240 }}>
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-11 pt-9 pb-24" style={{ alignItems: 'start' }}>

            {/* LEFT */}
            <div className="min-w-0">

              {/* Attending bar */}
              <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <div className="flex">
                  {hasRealAttendees
                    ? shownAttendees.map((a, i) => (
                        <div key={i} style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 6 - i, borderRadius: '50%', border: '2px solid #FFFFFF' }}>
                          <Avatar src={a.avatarUrl} name={a.name} size={38} fontSize={12} seed={a.name + i} />
                        </div>
                      ))
                    : placeholderInits.map((init, i) => (
                        <div key={i} className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                          style={{ border: '2px solid #FFFFFF', marginLeft: i > 0 ? -12 : 0, zIndex: 4 - i, background: avatarColorFor(init + i), opacity: 0.6 }}>
                          {init}
                        </div>
                      ))}
                </div>
                <div className="text-[14px]" style={{ color: '#3A4A42' }}>
                  {hasRealAttendees ? (
                    <button onClick={() => switchTab('network')} className="hover:opacity-70 transition text-left" style={{ color: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                      <span className="font-semibold" style={{ color: '#0F1F18' }}>{attendeeCount.toLocaleString()}</span> {attendeeCount === 1 ? 'person is' : 'people are'} attending <span style={{ color: '#1F4D3A', fontWeight: 600 }}>→</span>
                    </button>
                  ) : (
                    'Be the first to attend'
                  )}
                </div>
                {(page.organizer_name || organizerUserId) && (
                  <div className="ml-auto flex items-center gap-3">
                    <Avatar src={organizerAvatarUrl} name={page.organizer_name ?? 'Eventera'} size={40} fontSize={13} seed={page.organizer_name ?? 'Eventera'} style={{ borderRadius: 11 }} />
                    <div>
                      <div className="text-[12px]" style={{ color: '#6B7A72' }}>Hosted by</div>
                      {organizerUserId ? (
                        <Link href={`/o/${organizerUserId}`} className="font-title font-semibold text-[14px] hover:opacity-80 transition-opacity" style={{ color: '#0F1F18', textDecoration: 'none' }}>
                          {page.organizer_name}
                        </Link>
                      ) : (
                        <div className="font-title font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{page.organizer_name}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add to calendar — mobile */}
              {page.starts_at && (
                <div className="sm:hidden mt-3">
                  <AddToCalendarButton
                    variant="solid"
                    className="w-full justify-center border"
                    style={{ borderColor: '#1F4D3A' }}
                    title={page.title}
                    description={page.description ?? null}
                    startsAt={page.starts_at}
                    endsAt={page.ends_at ?? null}
                    timezone={page.timezone ?? null}
                    location={locationLine}
                    eventUrl={`https://karta.cre8so.com/e/${registrationSlug}`}
                  />
                </div>
              )}

              {/* About */}
              {page.description && (
                <div className="mt-9">
                  <h2 className="font-title font-bold text-[22px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                    About this event
                  </h2>
                  <div className="text-[15px] leading-[1.7] whitespace-pre-line" style={{ color: '#3A4A42' }}>
                    {page.description}
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {tags.map(tag => (
                        <span key={tag} className="h-8 px-3.5 rounded-full flex items-center text-[13px]"
                          style={{ background: '#F0EDE8', border: '1px solid #E5E0D4', color: '#3A4A42' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Schedule preview */}
              {featureOn('schedule') && sessions.length > 0 && (
                <div className="mt-9">
                  <div className="flex items-end justify-between mb-4">
                    <h2 className="font-title font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                      Schedule
                    </h2>
                    <button onClick={() => switchTab('schedule')} className="text-[13px] font-semibold shrink-0 hover:opacity-70 transition" style={{ color: '#1F4D3A', background: 'none', border: 'none', cursor: 'pointer' }}>
                      See full schedule →
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #E5E0D4' }}>
                    {sessions.slice(0, 8).map((s, i, arr) => (
                      <div key={s.id}
                        className="grid gap-4 px-6 py-4"
                        style={{
                          gridTemplateColumns: '84px 1fr',
                          borderBottom: i < arr.length - 1 ? '1px solid #E5E0D4' : 'none',
                        }}>
                        <span className="font-medium text-[13px]" style={{ color: '#C9A45E' }}>
                          {fmtSessionTime(s.starts_at)}
                        </span>
                        <div>
                          <div className="font-title font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{s.title}</div>
                          {s.room && (
                            <div className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{s.room}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {sessions.length > 8 && (
                    <button onClick={() => switchTab('schedule')} className="mt-3 w-full py-3 rounded-2xl text-[14px] font-medium transition hover:opacity-80" style={{ background: '#F0EDE8', color: '#1F4D3A', border: 'none', cursor: 'pointer' }}>
                      View all {sessions.length} sessions →
                    </button>
                  )}
                </div>
              )}

              {/* Speakers preview */}
              {featureOn('speakers') && speakers.length > 0 && (
                <div className="mt-9">
                  <div className="flex items-end justify-between mb-4">
                    <h2 className="font-title font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                      Speakers
                    </h2>
                    {speakers.length > 6 && (
                      <button onClick={() => switchTab('speakers')} className="text-[13px] font-semibold shrink-0 hover:opacity-70 transition" style={{ color: '#1F4D3A', background: 'none', border: 'none', cursor: 'pointer' }}>
                        See all speakers →
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {speakers.slice(0, 6).map((s) => (
                      <div key={s.id} className="text-center">
                        <div className="mx-auto mb-3 w-[84px] h-[84px]">
                          <Avatar src={s.photo_url} name={s.name} size={84} fontSize={22} seed={s.id} />
                        </div>
                        <div className="font-title font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{s.name}</div>
                        {(s.headline ?? s.role) && (
                          <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{s.headline ?? s.role}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  {speakers.length > 6 && (
                    <button onClick={() => switchTab('speakers')} className="mt-4 w-full py-3 rounded-2xl text-[14px] font-medium transition hover:opacity-80" style={{ background: '#F0EDE8', color: '#1F4D3A', border: 'none', cursor: 'pointer' }}>
                      View all {speakers.length} speakers →
                    </button>
                  )}
                </div>
              )}

              {/* Sponsors preview */}
              {featureOn('sponsors') && sponsors.length > 0 && (
                <div className="mt-9">
                  <div className="flex items-end justify-between mb-4">
                    <h2 className="font-title font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                      Sponsors
                    </h2>
                    {sponsors.length > 8 && (
                      <button onClick={() => switchTab('sponsors')} className="text-[13px] font-semibold shrink-0 hover:opacity-70 transition" style={{ color: '#1F4D3A', background: 'none', border: 'none', cursor: 'pointer' }}>
                        See all →
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sponsors.slice(0, 8).map(s => (
                      s.website_url ? (
                        <a key={s.id} href={s.website_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center px-4 py-3 rounded-xl transition hover:opacity-80"
                          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', minWidth: 100 }}>
                          {s.logo_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={s.logo_url} alt={s.company_name} style={{ maxHeight: 32, maxWidth: 100, objectFit: 'contain' }} />
                            : <span className="font-title font-semibold text-[13px]" style={{ color: '#0F1F18' }}>{s.company_name}</span>
                          }
                        </a>
                      ) : (
                        <div key={s.id} className="flex items-center justify-center px-4 py-3 rounded-xl"
                          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', minWidth: 100 }}>
                          {s.logo_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={s.logo_url} alt={s.company_name} style={{ maxHeight: 32, maxWidth: 100, objectFit: 'contain' }} />
                            : <span className="font-title font-semibold text-[13px]" style={{ color: '#0F1F18' }}>{s.company_name}</span>
                          }
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Custom menu */}
              {customMenu.length > 0 && (
                <div className="mt-9">
                  <h2 className="font-title font-bold text-[22px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                    More info
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {customMenu.map((m) => (
                      m.type === 'link' && m.url ? (
                        <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl transition hover:border-[#1F4D3A]/40"
                          style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
                          <span className="font-title font-semibold text-[14.5px]" style={{ color: '#0F1F18' }}>{m.label}</span>
                          <span className="text-[13px]" style={{ color: '#C9A45E' }}>↗</span>
                        </a>
                      ) : m.type === 'page' && m.content ? (
                        <details key={m.id} className="px-4 py-3.5 rounded-2xl sm:col-span-2"
                          style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
                          <summary className="font-title font-semibold text-[14.5px] cursor-pointer" style={{ color: '#0F1F18' }}>{m.label}</summary>
                          <div className="text-[14px] leading-[1.7] whitespace-pre-line mt-2" style={{ color: '#3A4A42' }}>{m.content}</div>
                        </details>
                      ) : null
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              {(page.venue_name || page.is_online) && (
                <div className="mt-9">
                  <h2 className="font-title font-bold text-[22px] mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                    Location
                  </h2>
                  {page.is_online ? (
                    <div className="text-[15px]" style={{ color: '#3A4A42' }}>
                      {page.online_url
                        ? 'Join link will be shared with registered attendees.'
                        : 'Details will be sent after registration.'}
                    </div>
                  ) : (
                    <>
                      <VenueMap
                        lat={venueLat}
                        lng={venueLng}
                        geoQuery={page.venue_address?.trim() || [page.venue_name, page.city, page.country].filter(Boolean).join(', ')}
                        venueName={page.venue_name ?? page.title}
                      />
                      <div className="mt-3.5 text-[14px]" style={{ color: '#3A4A42' }}>
                        {page.venue_name && (
                          <span className="font-title font-semibold text-[15px] block mb-1" style={{ color: '#0F1F18' }}>{page.venue_name}</span>
                        )}
                        {page.venue_address}
                      </div>
                      {(page.venue_address || (venueLat != null && venueLng != null)) && (
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.venue_address || `${venueLat},${venueLng}`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity"
                          style={{ color: '#1F4D3A' }}>
                          <ExternalLink size={12} strokeWidth={2} />
                          Open in Google Maps
                        </a>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ERA Q&A */}
              <ERAQandA page={page} dateStr={dateStr} />

              {/* Mobile ticket panel */}
              <div className="lg:hidden mt-9">
                <TicketList
                  tickets={tickets}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  registerHref={registerHref}
                  page={page}
                  minPrice={minPrice}
                  registrationSlug={registrationSlug}
                />
              </div>

            </div>

            {/* RIGHT: sticky ticket panel (desktop) */}
            <aside className="hidden lg:block" style={{ position: 'sticky', top: 120 }}>
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                setSelectedTicket={setSelectedTicket}
                registerHref={registerHref}
                page={page}
                minPrice={minPrice}
                registrationSlug={registrationSlug}
              />
            </aside>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SCHEDULE TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div className="mx-auto px-6 lg:px-10 pt-9 pb-24" style={{ maxWidth: 1240 }}>
          {sessions.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={40} strokeWidth={1.4} style={{ color: '#C9C3B1', margin: '0 auto 16px' }} />
              <p className="text-[15px]" style={{ color: '#6B7A72' }}>Schedule not yet published</p>
            </div>
          ) : (
            <div className="space-y-10">
              {sessionsByDay.map(({ day, sessions: daySessions }) => (
                <div key={day}>
                  <div className="font-title font-bold text-[18px] mb-4 pb-3" style={{ color: '#1F4D3A', borderBottom: '2px solid #E8C57E', letterSpacing: '-0.01em' }}>
                    {day}
                  </div>
                  <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid #E5E0D4' }}>
                    {daySessions.map((s, i) => (
                      <div key={s.id}
                        className="grid gap-4 px-6 py-5"
                        style={{
                          gridTemplateColumns: '90px 1fr',
                          borderBottom: i < daySessions.length - 1 ? '1px solid #E5E0D4' : 'none',
                          background: '#FFFFFF',
                        }}>
                        <div>
                          <div className="font-medium text-[13px]" style={{ color: '#C9A45E' }}>{fmtSessionTime(s.starts_at)}</div>
                          {s.ends_at && (
                            <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{fmtSessionTime(s.ends_at)}</div>
                          )}
                        </div>
                        <div>
                          <div className="font-title font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{s.title}</div>
                          {s.session_type && (
                            <span className="inline-block mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                              style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                              {s.session_type}
                            </span>
                          )}
                          {s.room && (
                            <div className="flex items-center gap-1 text-[13px] mt-1" style={{ color: '#6B7A72' }}><MapPin size={12} />{s.room}</div>
                          )}
                          {s.description && (
                            <div className="text-[13px] mt-1.5 leading-relaxed" style={{ color: '#3A4A42' }}>{s.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SPEAKERS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'speakers' && (
        <div className="mx-auto px-6 lg:px-10 pt-8 pb-24" style={{ maxWidth: 1240 }}>
          {speakers.length === 0 ? (
            <div className="py-16 text-center">
              <Mic size={40} strokeWidth={1.4} style={{ color: '#C9C3B1', margin: '0 auto 16px' }} />
              <p className="text-[15px]" style={{ color: '#6B7A72' }}>Speaker lineup coming soon</p>
            </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <SpeakerDirectoryClient speakers={speakers as any} eventSlug={registrationSlug} />
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SPONSORS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'sponsors' && (
        <div className="mx-auto px-6 lg:px-10 pt-9 pb-24" style={{ maxWidth: 1240 }}>
          {sponsors.length === 0 ? (
            <div className="py-16 text-center">
              <Store size={40} strokeWidth={1.4} style={{ color: '#C9C3B1', margin: '0 auto 16px' }} />
              <p className="text-[15px]" style={{ color: '#6B7A72' }}>Sponsors will be announced soon</p>
            </div>
          ) : (
            <div className="space-y-12">
              {sponsorTiers.map(tier => {
                const tierMeta: Record<string, { label: string; cols: string; logoH: number; showTagline: boolean; accent: string }> = {
                  platinum: { label: 'Platinum', cols: 'grid-cols-1 sm:grid-cols-2',              logoH: 80,  showTagline: true,  accent: '#6B7A72' },
                  gold:     { label: 'Gold',     cols: 'grid-cols-2 sm:grid-cols-3',              logoH: 60,  showTagline: true,  accent: '#6B7A72' },
                  silver:   { label: 'Silver',   cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4', logoH: 48, showTagline: false, accent: '#6B7A72' },
                  standard: { label: 'Standard', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5', logoH: 36, showTagline: false, accent: '#6B7A72' },
                  partner:  { label: 'Partners', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5', logoH: 36, showTagline: false, accent: '#6B7A72' },
                  media:    { label: 'Media Partners', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5', logoH: 36, showTagline: false, accent: '#6B7A72' },
                };
                const meta = tierMeta[tier] ?? { label: tier, cols: 'grid-cols-3 sm:grid-cols-4', logoH: 36, showTagline: false, accent: '#6B7A72' };
                return (
                  <div key={tier}>
                    {/* Tier label — plain text, no emoji */}
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: '#6B7A72' }}>{meta.label}</span>
                      <div className="flex-1 h-px" style={{ background: '#E5E0D4' }} />
                    </div>
                    <div className={`grid gap-4 ${meta.cols}`}>
                      {sponsorsByTier[tier].map(s => {
                        const inner = (
                          <div
                            className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl h-full transition-all"
                            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', minHeight: tier === 'platinum' ? 140 : tier === 'gold' ? 110 : 90 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#C9C3B1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(15,31,24,0.06)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E0D4'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                          >
                            {s.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.logo_url} alt={s.company_name} style={{ maxHeight: meta.logoH, maxWidth: '100%', objectFit: 'contain', display: 'block' }} />
                            ) : (
                              <div className="font-title font-semibold text-center" style={{ fontSize: tier === 'platinum' ? 16 : 13, color: '#0F1F18' }}>{s.company_name}</div>
                            )}
                            {meta.showTagline && s.tagline && (
                              <div className="text-[12px] text-center leading-relaxed" style={{ color: '#6B7A72' }}>{s.tagline}</div>
                            )}
                            {s.logo_url && tier !== 'standard' && tier !== 'partner' && tier !== 'media' && (
                              <div className="text-[11px] font-medium" style={{ color: '#6B7A72' }}>{s.company_name}</div>
                            )}
                          </div>
                        );
                        return s.website_url ? (
                          <a key={s.id} href={s.website_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
                            {inner}
                          </a>
                        ) : (
                          <div key={s.id}>{inner}</div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          NETWORK TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'network' && (
        <div className="mx-auto px-6 lg:px-10 pt-9 pb-24" style={{ maxWidth: 1240 }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-title font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              {attendeeCount > 0 ? `${attendeeCount.toLocaleString()} attending` : 'Attendees'}
            </h2>
          </div>
          {attendees.length === 0 ? (
            <div className="py-16 text-center">
              <Users size={40} strokeWidth={1.4} style={{ color: '#C9C3B1', margin: '0 auto 16px' }} />
              <p className="text-[15px] mb-4" style={{ color: '#6B7A72' }}>No attendees yet — be the first!</p>
              <Link href={registerHref}
                className="inline-flex items-center h-11 px-6 rounded-xl font-semibold text-[14px] transition hover:opacity-90"
                style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
                Register now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {attendees.map((a, i) => (
                <div key={i} className="flex flex-col items-center gap-2 py-4">
                  <Avatar src={a.avatarUrl} name={a.name} size={64} fontSize={18} seed={a.name + i} />
                  <div className="text-[13px] font-medium text-center truncate w-full px-2" style={{ color: '#0F1F18' }}>{a.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mobile sticky CTA (all tabs) ────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center gap-3 px-5 py-3 z-50"
        style={{ background: '#FFFFFF', borderTop: '1px solid #E5E0D4', boxShadow: '0 -4px 20px rgba(15,31,24,0.08)' }}>
        <div className="flex-1 min-w-0">
          <div className="font-title font-extrabold text-[20px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            {totalPrice}
            <small className="font-sans font-normal text-[12px] ml-1" style={{ color: '#6B7A72' }}>· per ticket</small>
          </div>
        </div>
        {registrationClosed ? (
          <div className="inline-flex items-center h-11 px-6 rounded-xl font-semibold text-[14px]"
            style={{ background: '#F5F0E8', color: '#6B7A72', border: '1px solid #E5E0D4' }}>
            Closed
          </div>
        ) : allSoldOut ? (
          <Link href={`/e/${registrationSlug}/waitlist`}
            className="inline-flex items-center h-11 px-6 rounded-xl font-semibold text-[14px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
            Join waitlist
          </Link>
        ) : (
          <Link href={registerHref}
            className="inline-flex items-center h-11 px-6 rounded-xl font-semibold text-[14px] transition hover:opacity-90"
            style={{ background: '#E8C57E', color: '#0F1F18', textDecoration: 'none' }}>
            Get tickets
          </Link>
        )}
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}
