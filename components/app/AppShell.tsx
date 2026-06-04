'use client';

import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/billing/plans';
import {
  LayoutGrid, TrendingUp, LayoutTemplate, Settings2, Users, LogOut, Menu, Search, Plus, ChevronRight, CreditCard,
  BarChart2, FileText, Eye, X, ArrowLeft, ShieldCheck,
  Flag, Image as ImageIcon, ScrollText, Sliders, Gavel,
  Home, Layout, CalendarDays, MessageSquare, Bell, Plug, Globe,
  Ticket, ScanLine, User, Network, Trophy, Briefcase, Video, Palette, Key, Tag, ExternalLink,
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
function getEventIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/events\/([^/]+)/);
  return m && UUID_RE.test(m[1]) ? m[1] : null;
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
      { id: 'networking',   label: 'Networking',   icon: <Network size={15} strokeWidth={1.8} />,      segment: 'engagement' },
      { id: 'q-and-a',      label: 'Q&A & Polls',  icon: <MessageSquare size={15} strokeWidth={1.8} />, segment: 'q-and-a' },
      { id: 'gamification', label: 'Gamification', icon: <Trophy size={15} strokeWidth={1.8} />,        segment: 'polls' },
    ],
  },
  {
    title: 'Partners',
    items: [
      { id: 'sponsors', label: 'Sponsors', icon: <Briefcase size={15} strokeWidth={1.8} />, segment: 'engagement', activeOn: '__sponsors__' },
      { id: 'virtual',  label: 'Virtual',  icon: <Video size={15} strokeWidth={1.8} />,     segment: 'engagement', activeOn: '__virtual__'  },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} strokeWidth={1.8} />, segment: 'analytics' },
    ],
  },
  {
    title: 'Configure',
    items: [
      { id: 'settings', label: 'Settings', icon: <Sliders size={15} strokeWidth={1.8} />, segment: 'settings' },
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
    title: null,
    items: [
      { href: '/dashboard',  label: 'Events',     icon: <LayoutGrid size={15} strokeWidth={1.8} />,   matchPrefix: true  },
      { href: '/analytics',  label: 'Analytics',  icon: <TrendingUp size={15} strokeWidth={1.8} />,   matchPrefix: false },
      { href: '/templates',  label: 'Templates',  icon: <LayoutTemplate size={15} strokeWidth={1.8} />, matchPrefix: false },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { href: '/brand',             label: 'Brand Kit', icon: <Palette size={15} strokeWidth={1.8} />,  matchPrefix: false },
      { href: '/team',              label: 'Team',      icon: <Users size={15} strokeWidth={1.8} />,    matchPrefix: false },
      { href: '/settings/billing',  label: 'Billing',   icon: <CreditCard size={15} strokeWidth={1.8} />, matchPrefix: false },
      { href: '/settings',          label: 'Settings',  icon: <Settings2 size={15} strokeWidth={1.8} />,  matchPrefix: false },
    ],
  },
  {
    title: 'Developer',
    items: [
      { href: '/settings/api-keys',   label: 'API Keys',    icon: <Key size={15} strokeWidth={1.8} />,       matchPrefix: false },
      { href: '/settings/webhooks',   label: 'Webhooks',    icon: <Plug size={15} strokeWidth={1.8} />,      matchPrefix: false },
      { href: '/settings/integrations', label: 'Integrations', icon: <Globe size={15} strokeWidth={1.8} />, matchPrefix: false },
      { href: '/brand',               label: 'White Label', icon: <Tag size={15} strokeWidth={1.8} />,       matchPrefix: false },
    ],
  },
];


// ─── Admin nav ────────────────────────────────────────────────────────────────

type AdminNavSection = {
  label: string;
  items: { href: string; label: string; icon: React.ReactNode; superAdminOnly?: boolean }[];
};

const ADMIN_SECTIONS: AdminNavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/analytics', label: 'Platform Stats', icon: <BarChart2 size={14} strokeWidth={1.8} /> },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', label: 'Accounts',     icon: <Users size={14} strokeWidth={1.8} /> },
      { href: '/admin/audit', label: 'Activity Log', icon: <ScrollText size={14} strokeWidth={1.8} /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/content',   label: 'Pages',     icon: <FileText size={14} strokeWidth={1.8} /> },
      { href: '/admin/media',     label: 'Media',     icon: <ImageIcon size={14} strokeWidth={1.8} /> },
      { href: '/admin/changelog', label: 'Changelog', icon: <ScrollText size={14} strokeWidth={1.8} /> },
    ],
  },
  {
    label: 'Product',
    items: [
      { href: '/admin/theme',     label: 'Appearance',    icon: <Sliders size={14} strokeWidth={1.8} /> },
      { href: '/admin/templates', label: 'Templates',     icon: <LayoutTemplate size={14} strokeWidth={1.8} />, superAdminOnly: true },
      { href: '/admin/flags',     label: 'Feature Flags', icon: <Flag size={14} strokeWidth={1.8} />,          superAdminOnly: true },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/admin/billing', label: 'Revenue',    icon: <CreditCard size={14} strokeWidth={1.8} />, superAdminOnly: true },
      { href: '/admin/events',  label: 'Moderation', icon: <Gavel size={14} strokeWidth={1.8} />,      superAdminOnly: true },
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
          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-md tracking-wide"
            style={{ color: '#6B7A72', background: '#F5F3EE' }}>
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── User sidebar content ─────────────────────────────────────────────────────

function UserNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planPct, logoUrl } = usePlanCtx();
  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Logo */}
      <Link href="/" onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-70"
        style={{ borderBottom: '1px solid #E5E0D4' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
        ) : (
          <>
            <span className="inline-block w-6 h-6 rounded-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #E8C57E 100%)' }} />
            <span className="font-display text-[19px] font-bold tracking-tight" style={{ color: '#0F1F18' }}>Karta</span>
          </>
        )}
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {PLATFORM_SECTIONS.map((section, si) => (
          <div key={si}>
            {section.title && (
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#9BA8A1' }}>
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const active = item.matchPrefix
                  ? (pathname === item.href || pathname.startsWith('/events'))
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                    active={active} onNavigate={onNavigate} />
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usage mini-card */}
      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-xl p-3" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#9BA8A1' }}>Events</span>
            <span className="text-[10px] font-mono" style={{ color: '#6B7A72' }}>
              {eventCount}&nbsp;/&nbsp;{planLimit === Infinity ? '∞' : planLimit}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${planPct}%`, background: planPct >= 90 ? '#C97A2D' : '#1F4D3A' }} />
          </div>
          {profile?.plan !== 'studio' && (
            <Link href="/settings/billing" onClick={onNavigate}
              className="block mt-2 text-[10px] font-mono transition-colors hover:text-[#1F4D3A]"
              style={{ color: '#9BA8A1' }}>
              Upgrade for more →
            </Link>
          )}
        </div>
      </div>

      {/* Admin panel entry — only for admins */}
      {isAdmin && (
        <div className="px-3 pb-2 shrink-0">
          <Link
            href="/admin/analytics"
            onClick={onNavigate}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors group"
            style={{ background: '#E8EFEB', border: '1px solid #C9DDD3' }}
          >
            <div className="h-6 w-6 rounded-md grid place-items-center shrink-0"
              style={{ background: '#D0E5D9' }}>
              <ShieldCheck size={12} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
            </div>
            <span className="flex-1 leading-none" style={{ color: '#1F4D3A' }}>Admin panel</span>
            <ArrowLeft size={12} strokeWidth={2} className="rotate-180 shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ color: '#3A6B50' }} />
          </Link>
        </div>
      )}

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

// ─── Admin sidebar content ────────────────────────────────────────────────────

function AdminNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, logoUrl } = usePlanCtx();
  const isSuperAdmin = profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Header */}
      <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[28px] max-w-[100px] object-contain" />
        ) : (
          <div className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: '#E8EFEB' }}>
            <ShieldCheck size={14} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
          </div>
        )}
        <span className="font-display text-[14px] font-bold tracking-tight" style={{ color: '#1F4D3A' }}>
          Admin Panel
        </span>
      </div>

      {/* Back to app */}
      <div className="px-3 pt-3 shrink-0">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors hover:bg-[#F5F3EE]"
          style={{ color: '#6B7A72' }}
        >
          <ArrowLeft size={13} strokeWidth={2} className="shrink-0" />
          Back to workspace
        </Link>
      </div>

      <div className="mx-3 mt-2 h-px" style={{ background: '#E5E0D4' }} />

      {/* Admin nav — flat sections */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {ADMIN_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => isSuperAdmin || !i.superAdminOnly);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest"
                style={{ color: '#9BA8A1' }}>
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {visibleItems.map(item => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={pathname.startsWith(item.href)}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Admin identity */}
      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{ background: '#E8EFEB', border: '1px solid #C9DDD3' }}>
          <div className="h-7 w-7 rounded-full grid place-items-center shrink-0 text-[11px] font-bold"
            style={{ background: '#D0E5D9', color: '#1F4D3A' }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium truncate" style={{ color: '#0F1F18' }}>{profile?.full_name ?? 'Admin'}</div>
            <div className="text-[10px] font-mono" style={{ color: '#6B7A72' }}>
              {isSuperAdmin ? 'Super admin' : 'Admin'}
            </div>
          </div>
        </div>
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

    // Background refresh
    supabase
      .from('events')
      .select('id, name, status, slug')
      .eq('id', eventId)
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

  const badge = event?.status ? (EVENT_STATUS_BADGE[event.status] ?? EVENT_STATUS_BADGE.archived) : null;

  return (
    <>
      {/* Logo */}
      <Link href="/" onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-70"
        style={{ borderBottom: '1px solid #E5E0D4' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
        ) : (
          <>
            <span className="inline-block w-6 h-6 rounded-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #E8C57E 100%)' }} />
            <span className="font-display text-[19px] font-bold tracking-tight" style={{ color: '#0F1F18' }}>Karta</span>
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
          {event ? event.name : <span style={{ color: '#C9C3B1' }}>Loading…</span>}
        </div>
        {badge && (
          <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border"
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

      {/* Event nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {EVENT_NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-4">
            {section.title && (
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest" style={{ color: '#9BA8A1' }}>
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const href = item.segment === ''
                  ? `/events/${eventId}`
                  : `/events/${eventId}/${item.segment}`;
                const matchKey = 'activeOn' in item ? item.activeOn : item.segment;
                const active = activeSegment === matchKey;
                return (
                  <NavItem key={item.id} href={href} icon={item.icon} label={item.label}
                    active={active} onNavigate={onNavigate} />
                );
              })}
            </ul>
          </div>
        ))}
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
    router.push(`/events/${result.id}`);
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
    { label: 'New event',  href: '/events/new',  icon: <Plus size={13} strokeWidth={1.8} /> },
    { label: 'Analytics',  href: '/analytics',   icon: <TrendingUp size={13} strokeWidth={1.8} /> },
    { label: 'Settings',   href: '/settings',    icon: <Settings2 size={13} strokeWidth={1.8} /> },
    { label: 'Pricing',    href: '/pricing',     icon: <ChevronRight size={13} strokeWidth={1.8} /> },
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
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-[#6B7A72]/70 uppercase tracking-widest">Events</div>
              {results.map((r, i) => (
                <button key={r.id} onClick={() => navigate(r)} onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${i === selected ? 'bg-[#F5F5F4]' : 'hover:bg-[#F5F5F4]/60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#0F1F18] truncate">{r.name}</div>
                    <div className="text-[11px] text-[#6B7A72] font-mono">/{r.slug}</div>
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
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-[#6B7A72]/70 uppercase tracking-widest">Quick actions</div>
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
  'event-page':     'Event page',
  'agenda':         'Agenda',
  'engagement':     'Engagement',
  'analytics':      'Analytics',
  'edit':           'Karta Card',
  'check-in':       'Check-in',
  'tickets':        'Tickets',
  'speakers':       'Speakers',
  'sessions':       'Sessions',
  'polls':          'Polls',
  'q-and-a':        'Q&A',
  'abstracts':      'Abstracts',
  'form':           'Registration form',
  'promo-codes':    'Promo codes',
  'publish':        'Publish',
};

function getPageBreadcrumbs(pathname: string, eventName: string | null): { label: string; href?: string }[] {
  if (pathname === '/dashboard')                         return [{ label: 'My Events' }];
  if (pathname === '/analytics')                         return [{ label: 'Portfolio' }];
  if (pathname === '/team')                              return [{ label: 'Team' }];
  if (pathname === '/templates')                         return [{ label: 'Templates' }];
  if (pathname === '/brand')                             return [{ label: 'Brand Kit' }];
  if (pathname.startsWith('/settings/billing'))          return [{ label: 'Settings', href: '/settings' }, { label: 'Billing' }];
  if (pathname.startsWith('/settings/reset-password'))   return [{ label: 'Settings', href: '/settings' }, { label: 'Reset Password' }];
  if (pathname.startsWith('/settings'))                  return [{ label: 'Settings' }];
  if (pathname.startsWith('/admin'))                     return [{ label: 'Admin' }];

  const m = pathname.match(/^\/events\/([^/]+)(?:\/(.+))?$/);
  if (m) {
    const eventBase = m[1];
    const seg = m[2] ?? '';
    const pageName = PAGE_LABELS[seg] ?? seg.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const name = eventName ?? 'Event';
    return [{ label: name, href: `/events/${eventBase}` }, { label: pageName }];
  }

  return [];
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [impersonating, setImpersonating] = useState<ImpersonatedUser | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [contextEventName, setContextEventName] = useState<string | null>(null);

  const isAdminRoute = pathname.startsWith('/admin');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      Promise.all([
        supabase.from('profiles').select('full_name, email, plan, role').eq('id', data.user.id).single(),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id).neq('status', 'archived'),
        supabase.from('site_settings').select('logo_light_url').eq('id', 1).single(),
      ]).then(([{ data: p }, { count }, { data: s }]) => {
        setProfile(p);
        setEventCount(count ?? 0);
        setLogoUrl((s as { logo_light_url?: string | null } | null)?.logo_light_url ?? null);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const isFullScreen = /\/events\/[^/]+\/(edit|publish)/.test(pathname) || pathname === '/onboarding';
  if (isFullScreen) return <>{children}</>;

  const eventId = getEventIdFromPath(pathname);
  const isEventRoute = !!eventId && !isAdminRoute;

  function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
    if (isAdminRoute) return <AdminNavContent pathname={pathname} onNavigate={onNavigate} />;
    if (isEventRoute && eventId) return <EventNavContent pathname={pathname} eventId={eventId} onNavigate={onNavigate} />;
    return <UserNavContent pathname={pathname} onNavigate={onNavigate} />;
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
            {/* Mobile hamburger */}
            <button className="md:hidden h-8 w-8 rounded-lg hover:bg-[#F5F3EE] grid place-items-center shrink-0 transition"
              style={{ color: '#6B7A72' }}
              onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <Menu size={16} strokeWidth={2} />
            </button>

            {/* Breadcrumb */}
            {(() => {
              const crumbs = getPageBreadcrumbs(pathname, contextEventName);
              return (
                <nav className="flex items-center gap-1.5 flex-1 min-w-0 text-[13px]" aria-label="Breadcrumb">
                  <Link href="/" className="font-display font-bold tracking-tight shrink-0 hover:opacity-70 transition-opacity"
                    style={{ color: '#0F1F18' }}>
                    Karta
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

            {/* Right side: search trigger + avatar */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button onClick={() => setCmdOpen(true)}
                className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]"
                style={{ color: '#6B7A72' }}
                aria-label="Search (⌘K)">
                <Search size={15} strokeWidth={2} />
              </button>
              <Link href="/settings"
                className="h-8 w-8 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}>
                {initials}
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>

        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </div>
    </PlanContext.Provider>
  );
}
