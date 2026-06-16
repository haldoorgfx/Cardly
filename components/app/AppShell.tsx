'use client';

import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { identify } from '@/components/shared/PostHogProvider';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/billing/plans';
import {
  LayoutGrid, TrendingUp, Settings2, Users, LogOut, Menu, Search, Plus, ChevronRight, CreditCard,
  BarChart2, FileText, Eye, X, ArrowLeft, ShieldCheck,
  ScrollText, Sliders,
  Home, Layout, CalendarDays, MessageSquare, Bell,
  Ticket, ScanLine, User, Network, Trophy, Briefcase, Video, Palette, ExternalLink,
  UserCircle, HelpCircle, Zap, ShoppingCart, Handshake, Clock, IdCard,
  Tag, Plug, Globe, Download, Link2, Code2, UserCog, Share2, Images, Monitor,
  RefreshCw, Megaphone, Bot, MessageCircle,
} from 'lucide-react';

type Profile = {
  full_name: string | null;
  email: string | null;
  plan: string;
  role: string;
};

type ImpersonatedUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  eventCount: number;
};

type EventResult = {
  id: string;
  name: string;
  status: string;
  slug: string;
};

// Derived from the canonical billing config (events: null = unlimited) so the
// sidebar limit can never drift from the real plan limits.
const PLAN_LIMITS: Record<string, number> = {
  free:   PLANS.free.events   ?? Infinity,
  pro:    PLANS.pro.events    ?? Infinity,
  studio: PLANS.studio.events ?? Infinity,
};

// ─── UUID detection ───────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NON_EVENT_SEGMENTS = new Set(['new', 'create', 'undefined', 'null']);
function getEventIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/events\/([^/]+)/);
  if (!m || !m[1] || NON_EVENT_SEGMENTS.has(m[1])) return null;
  return m[1];
}

// ─── Event nav ────────────────────────────────────────────────────────────────

type EventInfo = { id: string; name: string; status: string; slug: string } | null;

const EVENT_NAV_SECTIONS = [
  {
    title: 'Manage',
    items: [
      { id: 'overview',        label: 'Overview',        icon: <Home size={15} strokeWidth={1.8} />,           segment: '' },
      { id: 'event-page',      label: 'Event Page',      icon: <Layout size={15} strokeWidth={1.8} />,         segment: 'event-page' },
      { id: 'tickets',         label: 'Tickets',         icon: <Ticket size={15} strokeWidth={1.8} />,         segment: 'tickets' },
      { id: 'registrations',   label: 'Registrations',   icon: <Users size={15} strokeWidth={1.8} />,          segment: 'registrations' },
      { id: 'form',            label: 'Reg. Form',       icon: <FileText size={15} strokeWidth={1.8} />,       segment: 'form'        },
      { id: 'promo-codes',      label: 'Promo Codes',      icon: <Tag size={15} strokeWidth={1.8} />,     segment: 'promo-codes' },
      { id: 'promoter-links',  label: 'Promoter Links',  icon: <Link2 size={15} strokeWidth={1.8} />,   segment: 'promoter-links' },
      { id: 'orders',          label: 'Orders',          icon: <ShoppingCart size={15} strokeWidth={1.8} />,   segment: 'orders' },
      { id: 'waitlist',        label: 'Waitlist',        icon: <Clock size={15} strokeWidth={1.8} />,          segment: 'waitlist' },
      { id: 'approvals',       label: 'Approvals',       icon: <ShieldCheck size={15} strokeWidth={1.8} />,    segment: 'approvals' },
      { id: 'check-in',        label: 'Check-in',        icon: <ScanLine size={15} strokeWidth={1.8} />,       segment: 'check-in' },
      { id: 'communications',  label: 'Communications',  icon: <Bell size={15} strokeWidth={1.8} />,           segment: 'communications' },
    ],
  },
  {
    title: 'Programme',
    items: [
      { id: 'agenda',    label: 'Agenda',    icon: <CalendarDays size={15} strokeWidth={1.8} />, segment: 'agenda' },
      { id: 'speakers',  label: 'Speakers',  icon: <User size={15} strokeWidth={1.8} />,         segment: 'speakers' },
      { id: 'sessions',  label: 'Sessions',  icon: <LayoutGrid size={15} strokeWidth={1.8} />,   segment: 'sessions' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { id: 'engagement',   label: 'Engagement',   icon: <Network size={15} strokeWidth={1.8} />,         segment: 'engagement' },
      { id: 'newsfeed',     label: 'Newsfeed',     icon: <ScrollText size={15} strokeWidth={1.8} />,      segment: 'newsfeed' },
      { id: 'polls',        label: 'Q&A & Polls',  icon: <MessageSquare size={15} strokeWidth={1.8} />,   segment: 'q-and-a' },
      { id: 'community',    label: 'Community',    icon: <MessageCircle size={15} strokeWidth={1.8} />,   segment: 'community' },
      { id: 'photos',       label: 'Photo wall',   icon: <Images size={15} strokeWidth={1.8} />,          segment: 'photos' },
      { id: 'live',         label: 'Live display', icon: <Monitor size={15} strokeWidth={1.8} />,         segment: 'live' },
      { id: 'gamification', label: 'Gamification', icon: <Trophy size={15} strokeWidth={1.8} />,          segment: 'gamification' },
      { id: 'copilot',      label: 'AI Copilot',   icon: <Bot size={15} strokeWidth={1.8} />,             segment: 'copilot' },
    ],
  },
  {
    title: 'On-site',
    items: [
      { id: 'meetings',    label: '1:1 Meetings',   icon: <Handshake size={15} strokeWidth={1.8} />, segment: 'meetings'    },
      { id: 'karta-card',  label: 'Cards & Badges', icon: <IdCard size={15} strokeWidth={1.8} />,    segment: 'karta-card'  },
    ],
  },
  {
    title: 'Partners',
    items: [
      { id: 'sponsors', label: 'Sponsors', icon: <Briefcase size={15} strokeWidth={1.8} />, segment: 'sponsors' },
      { id: 'virtual',  label: 'Virtual',  icon: <Video size={15} strokeWidth={1.8} />,     segment: 'virtual'  },
      { id: 'promote',  label: 'Promote',  icon: <Megaphone size={15} strokeWidth={1.8} />, segment: 'promote'  },
      { id: 'series',   label: 'Series',   icon: <RefreshCw size={15} strokeWidth={1.8} />, segment: 'series'   },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'analytics',         label: 'Analytics',         icon: <BarChart2 size={15} strokeWidth={1.8} />,   segment: 'analytics' },
      { id: 'source-analytics', label: 'Sources',           icon: <Share2 size={15} strokeWidth={1.8} />,     segment: 'source-analytics' },
      { id: 'revenue',           label: 'Revenue',           icon: <TrendingUp size={15} strokeWidth={1.8} />,  segment: 'revenue' },
      { id: 'reports',           label: 'Reports',           icon: <FileText size={15} strokeWidth={1.8} />,   segment: 'reports' },
      { id: 'downloads',         label: 'Downloads',         icon: <Download size={15} strokeWidth={1.8} />,   segment: 'downloads' },
    ],
  },
  {
    title: 'Configure',
    items: [
      { id: 'settings',     label: 'Settings',     icon: <Sliders size={15} strokeWidth={1.8} />,  segment: 'settings'     },
      { id: 'staff',        label: 'Staff roles',  icon: <UserCog size={15} strokeWidth={1.8} />, segment: 'staff'        },
      { id: 'embed',        label: 'Embed widgets', icon: <Code2 size={15} strokeWidth={1.8} />,   segment: 'embed'        },
      { id: 'integrations', label: 'Integrations', icon: <Plug size={15} strokeWidth={1.8} />,    segment: 'integrations' },
      { id: 'webhooks',     label: 'Webhooks',     icon: <Globe size={15} strokeWidth={1.8} />,   segment: 'webhooks'     },
    ],
  },
];

const EVENT_STATUS_BADGE: Record<string, { cls: string; dot: string; label: string }> = {
  published: { cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: '#2D7A4F', label: 'Live' },
  draft:     { cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30',       dot: '#C9A45E', label: 'Draft' },
  archived:  { cls: 'bg-white/10 text-white/40 border-white/15',                dot: '#6B7A72', label: 'Archived' },
};

// ─── User nav ─────────────────────────────────────────────────────────────────

const PLATFORM_SECTIONS = [
  {
    title: 'Platform',
    items: [
      { href: '/dashboard',  label: 'Events',    icon: <LayoutGrid size={15} strokeWidth={1.8} />,    matchPrefix: true  },
      { href: '/analytics',  label: 'Analytics', icon: <TrendingUp size={15} strokeWidth={1.8} />,    matchPrefix: false },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { href: '/brand',      label: 'Brand Kit',  icon: <Palette size={15} strokeWidth={1.8} />,        matchPrefix: false },
      { href: '/team',       label: 'Team',       icon: <Users size={15} strokeWidth={1.8} />,          matchPrefix: false },
      { href: '/settings',   label: 'Settings',   icon: <Settings2 size={15} strokeWidth={1.8} />,      matchPrefix: true  },
    ],
  },
];


// ─── Shared nav item ──────────────────────────────────────────────────────────

function NavItem({ href, icon, label, badge, active, onNavigate }: {
  href: string; icon: React.ReactNode; label: string;
  badge?: string | null; active: boolean; onNavigate?: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onNavigate}
        className={`flex items-center gap-3 py-[7px] rounded-lg text-[13.5px] transition-colors border-l-2 ${
          active
            ? 'border-[#1F4D3A] font-medium pl-[8px] pr-2.5'
            : 'border-transparent px-2.5 hover:bg-[#F5F3EE]'
        }`}
        style={active
          ? { background: '#E8EFEB', color: '#1F4D3A' }
          : { color: '#3A4A42' }}>
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 leading-none">{label}</span>
        {badge && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md tracking-wide"
            style={{ color: '#6B7A72', background: '#F5F3EE' }}>
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Inline admin nav items (merged into user sidebar for admins) ─────────────
// Each section maps to a group title + items shown inside the Admin section.

type InlineAdminSection = {
  label: string;
  items: { href: string; label: string; icon: React.ReactNode; superAdminOnly?: boolean }[];
};

const INLINE_ADMIN_SECTIONS: InlineAdminSection[] = [
  {
    label: '',
    items: [
      { href: '/admin/analytics', label: 'Platform Stats',  icon: <BarChart2 size={14} strokeWidth={1.8} /> },
      { href: '/admin/users',     label: 'Accounts',        icon: <Users size={14} strokeWidth={1.8} /> },
      { href: '/admin/billing',   label: 'Revenue',         icon: <CreditCard size={14} strokeWidth={1.8} />, superAdminOnly: true },
      { href: '/admin/audit',     label: 'Activity Log',    icon: <ScrollText size={14} strokeWidth={1.8} /> },
    ],
  },
];

// ─── User sidebar content ─────────────────────────────────────────────────────

function UserNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planPct, planLabel, logoUrl } = usePlanCtx();
  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';
  const [adminOpen, setAdminOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const ctaLabel = profile?.plan === 'studio'
    ? '✓ Studio plan'
    : profile?.plan === 'pro'
    ? '+ Studio plan'
    : '+ Pro plan';

  return (
    <>
      {/* Logo + user identity header */}
      <div className="px-4 pt-3.5 pb-3 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <div className="flex items-center justify-between mb-2">
          {mounted && logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo" className="max-h-[28px] max-w-[120px] object-contain" />
          ) : (
            <Link href="/dashboard" onClick={onNavigate} className="flex items-center transition-opacity hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eventera-logo.png" alt="Eventera" style={{ height: '26px', objectFit: 'contain' }} />
            </Link>
          )}
          {mounted && planLabel && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ background: '#E8EFEB', color: '#1F4D3A', border: '1px solid #C9DDD3' }}>
              {planLabel}
            </span>
          )}
        </div>
        {mounted && profile?.full_name && (
          <p className="text-[12.5px] font-medium px-0.5" style={{ color: '#6B7A72' }}>
            {profile.full_name}
          </p>
        )}
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {PLATFORM_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="px-2.5 mb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: '#9BA8A1' }}>
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => {
                let active = false;
                if (item.href === '/dashboard') {
                  active = pathname === '/dashboard' || pathname.startsWith('/events');
                } else if (item.matchPrefix) {
                  active = pathname === item.href || pathname.startsWith(item.href + '/');
                } else {
                  active = pathname === item.href;
                }
                return (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                    active={active} onNavigate={onNavigate} />
                );
              })}
            </ul>
          </div>
        ))}

        {/* Admin section — inline for admin users */}
        {mounted && isAdmin && (
          <div>
            <button
              onClick={() => setAdminOpen(o => !o)}
              className="w-full px-2.5 mb-1.5 flex items-center justify-between text-[9.5px] font-semibold uppercase tracking-[0.08em] transition-colors hover:text-[#6B7A72]"
              style={{ color: '#9BA8A1' }}>
              <span className="flex items-center gap-1.5">
                Admin
                <ShieldCheck size={9} strokeWidth={2} />
              </span>
              <ChevronRight size={10} strokeWidth={2.5}
                className="transition-transform duration-200"
                style={{ transform: adminOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
            </button>
            {adminOpen && (
              <ul className="space-y-0.5">
                {INLINE_ADMIN_SECTIONS[0].items
                  .filter(i => isSuperAdmin || !i.superAdminOnly)
                  .map(item => (
                    <NavItem
                      key={item.href + item.label}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      active={pathname.startsWith(item.href)}
                      onNavigate={onNavigate}
                    />
                  ))}
              </ul>
            )}
          </div>
        )}
      </nav>

      {/* Events usage bar */}
      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-xl p-3" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9BA8A1' }}>Events</span>
            <span suppressHydrationWarning className="text-[10px] font-medium tabular-nums" style={{ color: '#6B7A72' }}>
              {eventCount}&nbsp;/&nbsp;{planLimit === Infinity ? '∞' : planLimit}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
            <div suppressHydrationWarning className="h-full rounded-full transition-all duration-500"
              style={{ width: `${planPct}%`, background: planPct >= 90 ? '#C97A2D' : '#1F4D3A' }} />
          </div>
        </div>
      </div>

      {/* Operations + plan CTA */}
      <div className="px-3 pb-3 shrink-0">
        <div className="px-2.5 mb-2 text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9BA8A1' }}>
          Operations
        </div>
        <Link href="/settings/billing" onClick={onNavigate}
          className="flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#1F4D3A' }}>
          <span suppressHydrationWarning>{ctaLabel}</span>
        </Link>
      </div>

      {/* Sign out */}
      <div className="px-3 py-2 shrink-0 border-t" style={{ borderColor: '#E5E0D4' }}>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13.5px] transition-colors text-left hover:bg-[#F5F3EE]"
          style={{ color: '#6B7A72' }}>
          <LogOut size={15} strokeWidth={1.7} className="shrink-0" />
          <span className="leading-none">Sign out</span>
        </button>
      </div>
    </>
  );
}

// ─── Event sidebar content ────────────────────────────────────────────────────

function readEventCache(eventId: string): EventInfo {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(`karta_ev_${eventId}`) || 'null'); }
  catch { return null; }
}

function writeEventCache(eventId: string, data: EventInfo) {
  try { sessionStorage.setItem(`karta_ev_${eventId}`, JSON.stringify(data)); }
  catch {}
}

function EventNavContent({ pathname, eventId, onNavigate }: {
  pathname: string; eventId: string; onNavigate?: () => void;
}) {
  const { logoUrl } = usePlanCtx();
  // null on server; cache applied in useEffect (client-only) to avoid hydration mismatch
  const [event, setEvent] = useState<EventInfo>(null);
  const supabase = createClient();

  const { setContextEventName } = usePlanCtx();
  useEffect(() => {
    // Apply cache immediately after hydration — no "Loading…" flash on repeat visits
    const cached = readEventCache(eventId);
    if (cached) {
      setEvent(cached);
      if (cached.name) setContextEventName(cached.name);
    }

    // Background refresh — eventId may be a UUID (legacy links) or slug (new links)
    const col = UUID_RE.test(eventId) ? 'id' : 'slug';
    supabase
      .from('events')
      .select('id, name, status, slug')
      .eq(col, eventId)
      .single()
      .then(({ data }) => {
        if (data) {
          setEvent(data);
          writeEventCache(eventId, data);
          if (data.name) setContextEventName(data.name);
        }
      });
    return () => setContextEventName(null);
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const prefix = `/events/${eventId}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  const activeSegment = rest === '' || rest === '/' ? '' : rest.split('/').filter(Boolean)[0] ?? '';

  // Which section holds the current page — kept open so you never lose your place.
  const activeSectionIndex = EVENT_NAV_SECTIONS.findIndex(s =>
    s.items.some(it => it.segment === activeSegment),
  );

  // Collapsible section groups — first section ("Manage") open by default.
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true });
  const toggleSection = (si: number) => setOpenSections(p => ({ ...p, [si]: !(p[si] ?? false) }));

  const badge = event?.status ? (EVENT_STATUS_BADGE[event.status] ?? EVENT_STATUS_BADGE.archived) : null;

  return (
    <>
      {/* Logo */}
      <Link href="/dashboard" onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-70"
        style={{ borderBottom: '1px solid #E5E0D4' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eventera-logo.png" alt="Eventera" style={{ height: '26px', objectFit: 'contain' }} />
          </>
        )}
      </Link>

      {/* Event context header */}
      <div className="px-3 pt-3 pb-3 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <Link href="/dashboard" onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[12px] transition-colors mb-3 hover:text-[#0F1F18]"
          style={{ color: '#6B7A72' }}>
          <ArrowLeft size={13} strokeWidth={2} />
          All events
        </Link>
        <div className="font-display text-[14px] font-semibold leading-snug tracking-tight line-clamp-2 px-0.5"
          style={{ color: '#0F1F18' }}>
          {event ? event.name : (
            <span className="inline-block w-36 h-4 rounded animate-pulse" style={{ background: '#E5E0D4' }} />
          )}
        </div>
        {badge && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full border"
            style={event?.status === 'published'
              ? { background: '#E8EFEB', color: '#2D7A4F', borderColor: '#C9DDD3' }
              : event?.status === 'draft'
              ? { background: '#FEF9EE', color: '#C97A2D', borderColor: '#F0D99A' }
              : { background: '#F5F3EE', color: '#6B7A72', borderColor: '#E5E0D4' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }} />
            {badge.label}
          </span>
        )}
      </div>

      {/* Event nav — collapsible section groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {EVENT_NAV_SECTIONS.map((section, si) => {
          const open = (openSections[si] ?? false) || si === activeSectionIndex;
          return (
            <div key={si} className="mb-1.5">
              <button
                type="button"
                onClick={() => toggleSection(si)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors hover:bg-[#F5F3EE]"
              >
                <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9BA8A1' }}>
                  {section.title}
                </span>
                <ChevronRight
                  size={13}
                  strokeWidth={2.2}
                  style={{ color: '#9BA8A1', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}
                />
              </button>
              {open && (
                <ul className="space-y-0.5 mt-0.5 mb-2">
                  {section.items.map(item => {
                    const href = item.segment === ''
                      ? `/events/${eventId}`
                      : `/events/${eventId}/${item.segment}`;
                    const active = activeSegment === item.segment;
                    return (
                      <NavItem key={item.id} href={href} icon={item.icon} label={item.label}
                        active={active} onNavigate={onNavigate} />
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2 shrink-0" style={{ borderTop: '1px solid #E5E0D4' }}>
        {event?.slug ? (
          <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors border hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
            style={{ color: '#6B7A72', borderColor: '#E5E0D4' }}>
            <span>View public page</span>
            <ExternalLink size={12} strokeWidth={2} className="shrink-0" />
          </a>
        ) : null}
      </div>
    </>
  );
}

// ─── Command palette ──────────────────────────────────────────────────────────

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('events')
        .select('id, name, status, slug')
        .ilike('name', `%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(8);
      setResults(data ?? []);
      setSelected(0);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const navigate = useCallback((result: EventResult) => {
    router.push(`/events/${result.slug}`);
    onClose();
  }, [router, onClose]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) { navigate(results[selected]); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [results, selected, navigate, onClose]);

  const quickActions = [
    { label: 'New event',       href: '/events/new',       icon: <Plus size={13} strokeWidth={1.8} /> },
    { label: 'My Events',       href: '/dashboard',        icon: <LayoutGrid size={13} strokeWidth={1.8} /> },
    { label: 'Analytics',       href: '/analytics',        icon: <TrendingUp size={13} strokeWidth={1.8} /> },
    { label: 'Team',            href: '/team',             icon: <Users size={13} strokeWidth={1.8} /> },
    { label: 'Brand Kit',       href: '/brand',            icon: <Palette size={13} strokeWidth={1.8} /> },
    { label: 'Settings',        href: '/settings',         icon: <Settings2 size={13} strokeWidth={1.8} /> },
    { label: 'Billing & Plans', href: '/settings/billing', icon: <CreditCard size={13} strokeWidth={1.8} /> },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: '#E5E0D4' }}>
          <Search className="text-[#6B7A72] shrink-0" size={15} strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, or jump to…"
            className="flex-1 text-[13px] placeholder-[#6B7A72] outline-none bg-transparent text-[#0F1F18]"
          />
          {loading && (
            <svg className="animate-spin text-[#6B7A72] shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
          )}
          <button onClick={onClose} className="text-[11px] text-[#6B7A72] border px-1.5 py-0.5 rounded-md hover:text-[#0F1F18] transition leading-none" style={{ borderColor: '#E5E0D4' }}>
            ESC
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-[13px] text-[#6B7A72]">
              No events found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.length > 0 && (
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] text-[#6B7A72]/70 uppercase tracking-widest">Events</div>
              {results.map((r, i) => (
                <button key={r.id} onClick={() => navigate(r)} onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${i === selected ? 'bg-[#F5F5F4]' : 'hover:bg-[#F5F5F4]/60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0F1F18] truncate">{r.name}</div>
                    <div className="text-[11px] text-[#6B7A72]">/{r.slug}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${r.status === 'published' ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : r.status === 'archived' ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-amber-200 bg-amber-50 text-amber-600'}`}>
                    {r.status}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!query.trim() && (
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] text-[#6B7A72]/70 uppercase tracking-widest">Quick actions</div>
              {quickActions.map((a, i) => (
                <Link key={a.href} href={a.href} onClick={onClose}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors ${i === selected ? 'bg-[#F5F5F4]' : 'hover:bg-[#F5F5F4]/60'}`}>
                  <div className="h-7 w-7 rounded-lg border grid place-items-center text-[#3A4A42] shrink-0" style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}>
                    {a.icon}
                  </div>
                  <span className="text-[13px] text-[#3A4A42]">{a.label}</span>
                  <ChevronRight className="ml-auto text-[#E5E0D4] shrink-0" size={12} strokeWidth={2.2} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2.5 flex items-center gap-4 text-[11px] text-[#6B7A72]" style={{ borderColor: '#E5E0D4' }}>
          <span><kbd className="border px-1 rounded text-[10px]" style={{ borderColor: '#E5E0D4' }}>↑↓</kbd> navigate</span>
          <span><kbd className="border px-1 rounded text-[10px]" style={{ borderColor: '#E5E0D4' }}>↵</kbd> open</span>
          <span><kbd className="border px-1 rounded text-[10px]" style={{ borderColor: '#E5E0D4' }}>ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

type PlanCtx = {
  profile: Profile | null;
  eventCount: number;
  initials: string;
  planPct: number;
  planLabel: string;
  logoUrl: string | null;
  contextEventName: string | null;
  setContextEventName: (n: string | null) => void;
};

const PlanContext = createContext<PlanCtx>({
  profile: null, eventCount: 0, initials: '?', planPct: 0, planLabel: 'Free', logoUrl: null,
  contextEventName: null, setContextEventName: () => {},
});
function usePlanCtx() { return useContext(PlanContext); }

// ─── Breadcrumb helper ────────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '':               'Overview',
  'registrations':  'Registrations',
  'orders':         'Orders',
  'waitlist':       'Waitlist',
  'event-page':     'Event page',
  'agenda':         'Agenda',
  'engagement':     'Engagement',
  'sponsors':       'Sponsors',
  'virtual':        'Virtual',
  'analytics':      'Analytics',
  'reports':        'Reports',
  'downloads':      'Downloads',
  'edit':           'Card Editor',
  'karta-card':     'Cards & Badges',
  'check-in':       'Check-in',
  'tickets':        'Tickets',
  'speakers':       'Speakers',
  'sessions':       'Sessions',
  'polls':          'Polls',
  'q-and-a':        'Q&A',
  'abstracts':      'Abstracts',
  'form':           'Registration form',
  'promo-codes':      'Promo codes',
  'promoter-links':   'Promoter links',
  'promote':          'Promote listing',
  'series':           'Event series',
  'community':        'Community',
  'copilot':          'AI Copilot',
  'revenue':          'Revenue',
  'publish':        'Publish',
  'meetings':       '1:1 Meetings',
  'badges':         'Cards & Badges',
  'gamification':      'Gamification',
  'integrations':      'Integrations',
  'webhooks':          'Webhooks',
  'newsfeed':          'Newsfeed',
  'staff':             'Staff roles',
  'embed':             'Embed widgets',
  'live':              'Live display',
  'photos':            'Photo wall',
  'source-analytics':  'Sources',
  'approvals':         'Approvals',
  'communications':    'Communications',
};

function getPageBreadcrumbs(pathname: string, eventName: string | null): { label: string; href?: string }[] {
  if (pathname === '/dashboard')                         return [{ label: 'My Events' }];
  if (pathname === '/analytics')                         return [{ label: 'Analytics' }];
  if (pathname === '/team')                              return [{ label: 'Team' }];
  if (pathname === '/brand')                             return [{ label: 'Brand Kit' }];
  if (pathname.startsWith('/settings/billing'))          return [{ label: 'Settings', href: '/settings' }, { label: 'Billing' }];
  if (pathname.startsWith('/settings/reset-password'))   return [{ label: 'Settings', href: '/settings' }, { label: 'Reset Password' }];
  if (pathname.startsWith('/settings/api-keys'))         return [{ label: 'Settings', href: '/settings' }, { label: 'API Keys' }];
  if (pathname.startsWith('/settings/webhooks'))         return [{ label: 'Settings', href: '/settings' }, { label: 'Webhooks' }];
  if (pathname.startsWith('/settings/integrations'))     return [{ label: 'Settings', href: '/settings' }, { label: 'Integrations' }];
  if (pathname.startsWith('/settings/developer'))        return [{ label: 'Settings', href: '/settings' }, { label: 'Developer' }];
  if (pathname.startsWith('/settings/white-label'))      return [{ label: 'Settings', href: '/settings' }, { label: 'White Label' }];
  if (pathname === '/white-label')                       return [{ label: 'Settings', href: '/settings' }, { label: 'White Label' }];
  if (pathname.startsWith('/settings'))                  return [{ label: 'Settings' }];
  if (pathname.startsWith('/admin'))                     return [{ label: 'Admin' }];
  if (pathname === '/events/new')                        return [{ label: 'New Event' }];

  const m = pathname.match(/^\/events\/([^/]+)(?:\/(.+))?$/);
  if (m) {
    const eventBase = m[1];
    const seg = m[2] ?? '';
    const pageName = PAGE_LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const name = eventName ?? '…';
    return [{ label: name, href: `/events/${eventBase}` }, { label: pageName }];
  }

  return [];
}

// ─── Notification item ────────────────────────────────────────────────────────

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  users:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  card:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  dollar:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  briefcase: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  clock:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

function formatNotifTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d`;
}

function NotifItem({ notif, onRead }: { notif: Notification; onRead: (id: string, url: string | null) => void }) {
  return (
    <button
      onClick={() => onRead(notif.id, notif.action_url)}
      className="w-full text-left flex items-start gap-3 px-5 py-3 hover:bg-[#FAF6EE] transition-colors">
      <div className="h-8 w-8 rounded-lg grid place-items-center shrink-0 mt-0.5"
        style={{ background: '#F0EDE8', color: '#1F4D3A' }}>
        {NOTIF_ICONS[notif.icon] ?? NOTIF_ICONS.clock}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug" style={{ color: '#0F1F18' }}>{notif.title}</p>
        {notif.body && <p className="text-[11.5px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>{notif.body}</p>}
        <p className="text-[11px] mt-0.5 " style={{ color: '#9BA8A1' }}>{formatNotifTime(notif.created_at)}</p>
      </div>
      {!notif.read_at && (
        <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: '#E8C57E' }} />
      )}
    </button>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

function readProfileCache(): Profile | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem('karta_profile') || 'null'); }
  catch { return null; }
}
function writeProfileCache(p: Profile) {
  try { sessionStorage.setItem('karta_profile', JSON.stringify(p)); } catch {}
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(() => readProfileCache());
  const [eventCount, setEventCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [impersonating, setImpersonating] = useState<ImpersonatedUser | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [contextEventName, setContextEventName] = useState<string | null>(null);

  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      const userId = data.user.id;
      Promise.all([
        supabase.from('profiles').select('full_name, email, plan, role').eq('id', userId).single(),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('user_id', userId).neq('status', 'archived'),
        supabase.from('site_settings').select('logo_light_url').eq('id', 1).single(),
      ]).then(([{ data: p }, { count }, { data: s }]) => {
        if (p) {
          setProfile(p);
          writeProfileCache(p);
          // Tell PostHog who this user is — connects all events to this person
          identify(userId, { email: p.email, plan: p.plan, role: p.role, name: p.full_name });
        }
        setEventCount(count ?? 0);
        setLogoUrl((s as { logo_light_url?: string | null } | null)?.logo_light_url ?? null);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function fetchNotifications() {
    setNotifLoading(true);
    fetch('/api/notifications?limit=20')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .finally(() => setNotifLoading(false));
  }

  function handleMarkAllRead() {
    fetch('/api/notifications', { method: 'PATCH' }).then(() =>
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    );
  }

  function handleNotifRead(id: string, url: string | null) {
    if (!notifications.find(n => n.id === id)?.read_at) {
      fetch(`/api/notifications/${id}`, { method: 'PATCH' }).then(() =>
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    }
    setNotifOpen(false);
    if (url) router.push(url);
  }

  useEffect(() => {
    const cookieVal = document.cookie.split('; ').find(r => r.startsWith('karta_impersonating='))?.split('=')[1];
    if (!cookieVal) { setImpersonating(null); return; }
    fetch('/api/admin/impersonate')
      .then(r => r.json())
      .then(d => setImpersonating(d.impersonating ?? null));
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  async function exitImpersonation() {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    setImpersonating(null);
    router.push('/admin/users');
  }

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const planPct = planLimit === Infinity ? 50 : Math.min((eventCount / planLimit) * 100, 100);
  const planLabel = profile?.plan === 'studio' ? 'Studio' : profile?.plan === 'pro' ? 'Pro' : 'Free';

  const ctxValue: PlanCtx = { profile, eventCount, initials, planPct, planLabel, logoUrl, contextEventName, setContextEventName };

  const isFullScreen = /\/events\/[^/]+\/edit/.test(pathname) || pathname === '/onboarding' || /\/events\/[^/]+\/(agenda|roster|revenue)\/print/.test(pathname);
  if (isFullScreen) return <>{children}</>;

  const eventId = getEventIdFromPath(pathname);
  const isEventRoute = !!eventId && !isAdminRoute;

  function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
    if (isEventRoute && eventId) return <EventNavContent pathname={pathname} eventId={eventId} onNavigate={onNavigate} />;
    return <UserNavContent pathname={pathname} onNavigate={onNavigate} />;
  }

  if (pathname === '/studio') {
    return <PlanContext.Provider value={ctxValue}>{children}</PlanContext.Provider>;
  }

  return (
    <PlanContext.Provider value={ctxValue}>
      <div className="flex min-h-screen" style={{ background: '#FAF6EE' }}>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[240px] shrink-0 flex-col sticky top-0 h-screen"
          style={{ background: '#FFFFFF', borderRight: '1px solid #E5E0D4' }}>
          <SidebarInner />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[272px] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.12)] animate-[slideInLeft_200ms_ease-out]"
              style={{ background: '#FFFFFF', borderRight: '1px solid #E5E0D4' }}>
              <SidebarInner onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <main className="flex-1 min-w-0 flex flex-col">
          {impersonating && (
            <div className="w-full flex items-center justify-between gap-3 px-4 py-2.5 shrink-0 z-50"
              style={{ background: '#C97A2D', color: 'white' }}>
              <div className="flex items-center gap-2 text-[13px] font-medium">
                <Eye size={14} strokeWidth={2} />
                Viewing as <strong>{impersonating.full_name ?? impersonating.email}</strong>
                <span className="opacity-70 text-[11px]">({impersonating.email})</span>
              </div>
              <button
                onClick={exitImpersonation}
                className="inline-flex items-center gap-1.5 h-7 px-3 text-[12px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 transition"
              >
                <X size={11} strokeWidth={2.5} /> Exit
              </button>
            </div>
          )}

          <header className="h-14 bg-white px-4 md:px-6 flex items-center gap-3 shrink-0 sticky top-0 z-40 border-b"
            style={{ borderColor: '#E5E0D4' }}>

            {/* Left: hamburger + breadcrumb */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button className="md:hidden h-10 w-10 rounded-lg hover:bg-[#F5F3EE] grid place-items-center shrink-0 transition"
                style={{ color: '#6B7A72' }}
                onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
                <Menu size={16} strokeWidth={2} />
              </button>
              {(() => {
                const crumbs = getPageBreadcrumbs(pathname, contextEventName);
                return (
                  <nav className="hidden sm:flex items-center gap-1.5 min-w-0 text-[13px]" aria-label="Breadcrumb">
                    <Link href="/dashboard" className="font-display font-bold tracking-tight shrink-0 hover:opacity-70 transition-opacity text-sm" style={{ color: '#0F1F18' }}>
                      Eventera
                    </Link>
                    {crumbs.map((crumb, i) => (
                      <span key={i} className="flex items-center gap-1.5 min-w-0">
                        <span style={{ color: '#C9C3B1' }}>/</span>
                        {crumb.href ? (
                          <Link href={crumb.href} className="truncate hover:text-[#1F4D3A] transition-colors"
                            style={{ color: '#6B7A72' }}>
                            {crumb.label}
                          </Link>
                        ) : (
                          <span className="truncate font-medium" style={{ color: '#0F1F18' }}>
                            {crumb.label}
                          </span>
                        )}
                      </span>
                    ))}
                  </nav>
                );
              })()}
            </div>

            {/* Right: search + bell + avatar */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Search bar */}
              <button onClick={() => setCmdOpen(true)}
                className="hidden sm:flex h-8 items-center gap-2 px-3 rounded-xl transition hover:shadow-[0_0_0_2px_#1F4D3A20]"
                style={{ color: '#6B7A72', border: '1px solid #E5E0D4', background: '#FAF6EE', width: '200px' }}
                aria-label="Search (⌘K)">
                <Search size={13} strokeWidth={2} className="shrink-0" style={{ color: '#9BA8A1' }} />
                <span className="flex-1 text-left text-[12.5px]" style={{ color: '#9BA8A1' }}>Search…</span>
                <kbd className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ background: '#F0EDE8', color: '#9BA8A1', border: '1px solid #E5E0D4' }}>⌘K</kbd>
              </button>
              {/* Mobile search icon only */}
              <button onClick={() => setCmdOpen(true)}
                className="sm:hidden h-10 w-10 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]"
                style={{ color: '#6B7A72' }} aria-label="Search">
                <Search size={15} strokeWidth={2} />
              </button>


              {/* Bell + Notifications panel */}
              <div className="relative">
                <button
                  onClick={() => {
                    const next = !notifOpen;
                    setNotifOpen(next);
                    setAccountMenuOpen(false);
                    if (next) fetchNotifications();
                  }}
                  className="relative h-10 w-10 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]"
                  style={{ color: '#6B7A72' }}
                  aria-label="Notifications">
                  <Bell size={15} strokeWidth={2} />
                  {notifications.some(n => !n.read_at) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white" style={{ background: '#E8C57E' }} />
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 top-[44px] z-50 w-[min(340px,calc(100vw-16px))] bg-white border border-[#E5E0D4] rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.14)] overflow-hidden animate-dropIn">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
                        <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Notifications</span>
                        {notifications.some(n => !n.read_at) && (
                          <button onClick={handleMarkAllRead}
                            className="text-[10px] font-medium uppercase tracking-widest transition hover:text-[#1F4D3A]"
                            style={{ color: '#9BA8A1' }}>
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-[380px] overflow-y-auto">
                        {notifLoading ? (
                          <div className="px-5 py-8 text-center text-[13px]" style={{ color: '#9BA8A1' }}>Loading…</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-5 py-8 text-center">
                            <Bell size={22} strokeWidth={1.5} className="mx-auto mb-2" style={{ color: '#C9C3B1' }} />
                            <p className="text-[13px]" style={{ color: '#9BA8A1' }}>No notifications yet</p>
                          </div>
                        ) : (() => {
                          const todayStart = new Date(); todayStart.setHours(0,0,0,0);
                          const today = notifications.filter(n => new Date(n.created_at) >= todayStart);
                          const earlier = notifications.filter(n => new Date(n.created_at) < todayStart);
                          return (
                            <>
                              {today.length > 0 && (
                                <div>
                                  <div className="px-5 pt-3 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9BA8A1' }}>Today</div>
                                  {today.map(n => <NotifItem key={n.id} notif={n} onRead={handleNotifRead} />)}
                                </div>
                              )}
                              {earlier.length > 0 && (
                                <div>
                                  <div className="px-5 pt-3 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: '#9BA8A1' }}>Earlier</div>
                                  {earlier.map(n => <NotifItem key={n.id} notif={n} onRead={handleNotifRead} />)}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3.5 border-t text-center" style={{ borderColor: '#E5E0D4' }}>
                        <button
                          onClick={() => { setNotifOpen(false); router.push('/notifications'); }}
                          className="text-[13px] font-medium transition hover:text-[#163828]"
                          style={{ color: '#1F4D3A' }}>
                          View all notifications
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Avatar → AccountMenu */}
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(o => !o)}
                  className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0 ring-2 ring-transparent hover:ring-[#1F4D3A]/30 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
                  aria-label="Account menu">
                  <span suppressHydrationWarning>{initials}</span>
                </button>

                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                    <div className="absolute right-0 top-[44px] z-50 w-[min(260px,calc(100vw-16px))] bg-[#FAF6EE] border border-[#E5E0D4] rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.15)] overflow-hidden animate-dropIn">
                      {/* Identity */}
                      <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: '1px solid #E5E0D4' }}>
                        <div className="h-10 w-10 rounded-full grid place-items-center text-white text-[13px] font-bold shrink-0"
                          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}>
                          <span suppressHydrationWarning>{initials}</span>
                        </div>
                        <div className="min-w-0">
                          <div suppressHydrationWarning className="text-[13.5px] font-semibold text-[#0F1F18] leading-tight truncate">
                            {profile?.full_name ?? '—'}
                          </div>
                          <div suppressHydrationWarning className=" text-[11px] text-[#6B7A72] truncate">{profile?.email ?? ''}</div>
                        </div>
                      </div>

                      {/* Nav items */}
                      <div className="py-1.5">
                        {[
                          { href: '/settings',          icon: <UserCircle size={14} strokeWidth={1.8} />, label: 'Your profile' },
                          { href: '/settings/billing',  icon: <CreditCard size={14} strokeWidth={1.8} />, label: 'Billing & plan' },
                          { href: '/settings',          icon: <Settings2 size={14} strokeWidth={1.8} />,  label: 'Account settings' },
                        ].map(item => (
                          <Link key={item.label} href={item.href} onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:text-[#1F4D3A]"
                            style={{ color: '#3A4A42' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,246,238,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {item.icon} {item.label}
                          </Link>
                        ))}

                        <div className="mx-3 my-1.5 h-px" style={{ background: '#E5E0D4' }} />

                        {[
                          { href: 'https://help.karta.app', icon: <HelpCircle size={14} strokeWidth={1.8} />, label: 'Help center' },
                        ].map(item => (
                          <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer"
                            onClick={() => setAccountMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-[13px] transition-colors hover:text-[#1F4D3A]"
                            style={{ color: '#3A4A42' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,246,238,0.7)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            {item.icon} {item.label}
                          </a>
                        ))}
                      </div>

                      {/* Plan badge */}
                      <div className="px-3 pb-3 pt-0">
                        <div className="rounded-xl p-3 mb-2"
                          style={{ background: 'linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))' }}>
                          <div suppressHydrationWarning className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#C9A45E' }}>
                            <Zap size={12} strokeWidth={2} /> {planLabel} plan
                          </div>
                          <div suppressHydrationWarning className="text-[11.5px] text-[#6B7A72] mt-0.5">
                            {planLabel === 'Studio' ? "You're on the full platform." : 'Upgrade for more features.'}
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            setAccountMenuOpen(false);
                            const supabase = createClient();
                            await supabase.auth.signOut();
                            window.location.href = '/login';
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 rounded-lg text-[13px] transition-colors text-left text-red-600 hover:bg-red-50">
                          <LogOut size={14} strokeWidth={1.8} /> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>

        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </div>
    </PlanContext.Provider>
  );
}
