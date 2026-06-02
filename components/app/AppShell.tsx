'use client';

import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/billing/plans';
import {
  LayoutGrid, TrendingUp, LayoutTemplate, Palette,
  Settings2, Users, LogOut, Menu, Search, Plus, ChevronRight,
  CreditCard, BarChart2, FileText, Eye, X, ArrowLeft, ShieldCheck,
  Flag, Image as ImageIcon, ScrollText, Sliders, Gavel,
  Home, Layout, CalendarDays, Globe, MessageSquare, IdCard,
  Ticket, User, Network, Briefcase, Video, Lock, ScanLine,
  Key, Plug, Puzzle, Sparkles, Bell,
} from 'lucide-react';
import UpgradeSlideOver, { type UpgradeFeature } from './UpgradeSlideOver';

// ─── Types ────────────────────────────────────────────────────────────────────

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

type EventInfo = { id: string; name: string; status: string; slug: string } | null;

// ─── Plan helpers ─────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, number> = {
  free:   PLANS.free.events   ?? Infinity,
  pro:    PLANS.pro.events    ?? Infinity,
  studio: PLANS.studio.events ?? Infinity,
};
const NAV_PLAN_LEVEL: Record<string, number> = { free: 0, pro: 1, studio: 2 };
const NAV_PLAN_LABEL: Record<string, string> = { pro: 'Pro', studio: 'Studio' };

// ─── UUID detection ───────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getEventIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/events\/([^/]+)/);
  return m && UUID_RE.test(m[1]) ? m[1] : null;
}

// ─── Context ─────────────────────────────────────────────────────────────────

type PlanCtx = {
  profile: Profile | null;
  eventCount: number;
  initials: string;
  planPct: number;
  planLabel: string;
  logoUrl: string | null;
  openUpgrade: (feature: UpgradeFeature) => void;
};

const PlanContext = createContext<PlanCtx>({
  profile: null, eventCount: 0, initials: '?', planPct: 0,
  planLabel: 'Free', logoUrl: null, openUpgrade: () => {},
});
function usePlanCtx() { return useContext(PlanContext); }

// ─── NavItem ─────────────────────────────────────────────────────────────────

function NavItem({
  href, icon, label, badge, active, locked, planLabel, onNavigate, onLockClick,
}: {
  href: string; icon: React.ReactNode; label: string;
  badge?: string | null; active: boolean;
  locked?: boolean; planLabel?: string;
  onNavigate?: () => void;
  onLockClick?: () => void;
}) {
  const baseRow = 'w-full flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-lg text-[13.5px] transition-colors text-left';
  if (locked) {
    return (
      <li>
        <button
          onClick={onLockClick}
          className={`${baseRow} opacity-60`}
          style={{ color: '#3A4A42' }}
        >
          <span className="shrink-0" style={{ color: 'rgba(31,77,58,0.45)' }}>{icon}</span>
          <span className="flex-1 leading-none">{label}</span>
          {planLabel && (
            <span
              className="inline-flex items-center gap-0.5 font-mono tracking-[0.12em] uppercase px-1.5 py-0.5 rounded font-semibold shrink-0"
              style={{ fontSize: 8.5, background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}
            >
              <Lock size={8} strokeWidth={2} /> {planLabel}
            </span>
          )}
        </button>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`${baseRow} ${active
          ? 'bg-[#1F4D3A] text-[#FAF6EE] font-medium'
          : 'text-[#3A4A42] hover:bg-[#E8EFEB]/70 hover:text-[#1F4D3A]'}`}
      >
        <span
          className="shrink-0"
          style={{ color: active ? '#FAF6EE' : 'rgba(31,77,58,0.7)' }}
        >
          {icon}
        </span>
        <span className="flex-1 leading-none">{label}</span>
        {badge && (
          <span
            className="font-mono tracking-[0.1em] uppercase px-1.5 py-0.5 rounded font-semibold shrink-0"
            style={{ fontSize: 8.5, background: active ? 'rgba(232,197,126,0.25)' : '#E8EFEB', color: active ? '#E8C57E' : '#1F4D3A' }}
          >
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ children, extra }: { children: string; extra?: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1.5 flex items-center gap-1.5">
      <span
        className="font-mono uppercase flex-1"
        style={{ fontSize: 9.5, letterSpacing: '0.2em', color: 'rgba(107,122,114,0.8)' }}
      >
        {children}
      </span>
      {extra}
    </div>
  );
}

// ─── Sidebar header — platform ────────────────────────────────────────────────

function PlatformHeader() {
  const { profile, logoUrl } = usePlanCtx();
  return (
    <div className="px-3 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
      <div className="flex items-center gap-2.5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[28px] max-w-[100px] object-contain" />
        ) : (
          <>
            <span
              className="inline-block w-7 h-7 rounded-lg shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
            />
            <span className="font-display font-bold text-[16px] text-[#1F4D3A]">Karta</span>
          </>
        )}
      </div>
      {profile && (
        <div className="mt-2.5 flex items-center gap-2 pl-0.5">
          <span className="text-[11px] text-[#3A4A42] truncate flex-1">{profile.full_name ?? profile.email}</span>
          <span
            className="font-mono uppercase px-1.5 py-0.5 rounded shrink-0"
            style={{ fontSize: 8.5, background: '#E8EFEB', color: '#1F4D3A' }}
          >
            {profile.plan}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Event nav ────────────────────────────────────────────────────────────────

type NavItemDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  segment: string;
  minPlan?: 'pro' | 'studio';
};

const EVENT_NAV_SECTIONS: { title: string; items: NavItemDef[] }[] = [
  {
    title: 'Manage',
    items: [
      { id: 'overview',      label: 'Overview',      icon: <Home size={15} strokeWidth={1.8} />,         segment: '' },
      { id: 'event-page',    label: 'Event Page',    icon: <Layout size={15} strokeWidth={1.8} />,       segment: 'event-page' },
      { id: 'tickets',       label: 'Tickets',       icon: <Ticket size={15} strokeWidth={1.8} />,       segment: 'tickets' },
      { id: 'registrations', label: 'Registrations', icon: <Users size={15} strokeWidth={1.8} />,        segment: 'registrations' },
      { id: 'check-in',      label: 'Check-in',      icon: <ScanLine size={15} strokeWidth={1.8} />,     segment: 'check-in' },
    ],
  },
  {
    title: 'Programme',
    items: [
      { id: 'agenda',    label: 'Agenda',    icon: <CalendarDays size={15} strokeWidth={1.8} />, segment: 'agenda' },
      { id: 'speakers',  label: 'Speakers',  icon: <User size={15} strokeWidth={1.8} />,        segment: 'speakers' },
      { id: 'sessions',  label: 'Sessions',  icon: <LayoutGrid size={15} strokeWidth={1.8} />,  segment: 'sessions' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { id: 'networking',   label: 'Networking',   icon: <Network size={15} strokeWidth={1.8} />,       segment: 'networking',   minPlan: 'pro' },
      { id: 'q-and-a',      label: 'Q&A & Polls',  icon: <MessageSquare size={15} strokeWidth={1.8} />, segment: 'q-and-a',      minPlan: 'pro' },
      { id: 'gamification', label: 'Gamification', icon: <Sparkles size={15} strokeWidth={1.8} />,      segment: 'gamification', minPlan: 'pro' },
    ],
  },
  {
    title: 'Partners',
    items: [
      { id: 'sponsors', label: 'Sponsors', icon: <Briefcase size={15} strokeWidth={1.8} />, segment: 'sponsors', minPlan: 'studio' },
      { id: 'virtual',  label: 'Virtual',  icon: <Video size={15} strokeWidth={1.8} />,     segment: 'virtual',  minPlan: 'studio' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'analytics',  label: 'Analytics',  icon: <BarChart2 size={15} strokeWidth={1.8} />, segment: 'analytics' },
      { id: 'karta-card', label: 'Karta Card',  icon: <IdCard size={15} strokeWidth={1.8} />,   segment: 'edit' },
    ],
  },
];

const EVENT_STATUS_CONFIG: Record<string, { tone: string; dot: string; label: string; pulse: boolean }> = {
  published: { tone: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#2D7A4F', label: 'Live',     pulse: true  },
  draft:     { tone: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#C9A45E', label: 'Draft',    pulse: false },
  archived:  { tone: 'bg-[#FAF6EE] text-[#6B7A72] border-[#E5E0D4]',     dot: '#6B7A72', label: 'Archived', pulse: false },
};

function EventNavContent({ pathname, eventId, onNavigate }: {
  pathname: string; eventId: string; onNavigate?: () => void;
}) {
  const { profile, openUpgrade } = usePlanCtx();
  const userPlanLevel = NAV_PLAN_LEVEL[profile?.plan ?? 'free'] ?? 0;
  const [event, setEvent] = useState<EventInfo>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('events')
      .select('id, name, status, slug')
      .eq('id', eventId)
      .single()
      .then(({ data }) => setEvent(data));
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const prefix = `/events/${eventId}`;
  const rest = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : '';
  const activeSegment = rest === '' || rest === '/' ? '' : rest.split('/').filter(Boolean)[0] ?? '';

  const stCfg = event?.status ? (EVENT_STATUS_CONFIG[event.status] ?? EVENT_STATUS_CONFIG.archived) : null;

  return (
    <>
      <div className="px-3 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7A72] hover:text-[#1F4D3A] mb-3 transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          All events
        </Link>
        <div className="font-display font-semibold text-[#1F4D3A] leading-tight line-clamp-2 px-0.5" style={{ fontSize: 15 }}>
          {event ? event.name : <span className="text-[#6B7A72]/50 text-[13px]">Loading…</span>}
        </div>
        {stCfg && (
          <span className={`mt-2 inline-flex items-center gap-1.5 font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${stCfg.tone}`} style={{ fontSize: 10 }}>
            <span className={`w-1.5 h-1.5 rounded-full ${stCfg.pulse ? 'animate-pulse' : ''}`} style={{ background: stCfg.dot }} />
            {stCfg.label}
          </span>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {EVENT_NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
            <ul className="space-y-0.5 mb-1">
              {section.items.map(item => {
                const locked = item.minPlan
                  ? userPlanLevel < (NAV_PLAN_LEVEL[item.minPlan] ?? 0)
                  : false;
                const href = item.segment === ''
                  ? `/events/${eventId}`
                  : `/events/${eventId}/${item.segment}`;
                const active = !locked && activeSegment === item.segment;
                return (
                  <NavItem
                    key={item.id}
                    href={href}
                    icon={item.icon}
                    label={item.label}
                    active={active}
                    locked={locked}
                    planLabel={item.minPlan ? NAV_PLAN_LABEL[item.minPlan] : undefined}
                    onNavigate={onNavigate}
                    onLockClick={item.minPlan ? () => openUpgrade({
                      id: item.id,
                      label: item.label,
                      minPlan: item.minPlan!,
                    }) : undefined}
                  />
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {event?.status === 'published' && event?.slug && (
        <div className="px-3 py-3 border-t" style={{ borderColor: '#E5E0D4' }}>
          <a
            href={`/c/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[12.5px] text-[#6B7A72] hover:text-[#1F4D3A] hover:bg-[#E8EFEB]/60 transition-colors"
          >
            <span>View public page</span>
            <Globe size={13} strokeWidth={1.8} className="shrink-0" />
          </a>
        </div>
      )}
    </>
  );
}

// ─── Platform nav content ─────────────────────────────────────────────────────

type PlatformNavSection = {
  title: string;
  requirePlan?: 'pro' | 'studio';
  requireRole?: 'admin';
  special?: 'developer' | 'admin';
  items: { label: string; href: string; icon: React.ReactNode; badge?: string | null; matchPrefix?: boolean }[];
};

const PLATFORM_NAV: PlatformNavSection[] = [
  {
    title: 'Platform',
    items: [
      { label: 'Events',    href: '/dashboard',  icon: <LayoutGrid size={15} strokeWidth={1.8} />, matchPrefix: true },
      { label: 'Analytics', href: '/analytics',  icon: <TrendingUp size={15} strokeWidth={1.8} /> },
      { label: 'Templates', href: '/templates',  icon: <LayoutTemplate size={15} strokeWidth={1.8} /> },
    ],
  },
  {
    title: 'Workspace',
    items: [
      { label: 'Brand Kit', href: '/brand',              icon: <Palette size={15} strokeWidth={1.8} /> },
      { label: 'Team',      href: '/team',               icon: <Users size={15} strokeWidth={1.8} /> },
      { label: 'Billing',   href: '/settings/billing',   icon: <CreditCard size={15} strokeWidth={1.8} /> },
      { label: 'Settings',  href: '/settings',           icon: <Settings2 size={15} strokeWidth={1.8} /> },
    ],
  },
  {
    title: 'Developer',
    requirePlan: 'studio',
    special: 'developer',
    items: [
      { label: 'API Keys',     href: '/api-keys',     icon: <Key size={15} strokeWidth={1.8} /> },
      { label: 'Webhooks',     href: '/webhooks',     icon: <Plug size={15} strokeWidth={1.8} /> },
      { label: 'Integrations', href: '/integrations', icon: <Puzzle size={15} strokeWidth={1.8} /> },
      { label: 'White Label',  href: '/white-label',  icon: <Palette size={15} strokeWidth={1.8} /> },
    ],
  },
];

const ADMIN_NAV = [
  { label: 'Users',              href: '/admin/users',      icon: <Users size={15} strokeWidth={1.8} /> },
  { label: 'All Events',         href: '/admin/events',     icon: <LayoutGrid size={15} strokeWidth={1.8} /> },
  { label: 'Platform Analytics', href: '/admin/analytics',  icon: <BarChart2 size={15} strokeWidth={1.8} /> },
  { label: 'Changelog',          href: '/admin/changelog',  icon: <ScrollText size={15} strokeWidth={1.8} /> },
  { label: 'Audit Log',          href: '/admin/audit',      icon: <FileText size={15} strokeWidth={1.8} /> },
];

function UserNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planPct, openUpgrade } = usePlanCtx();
  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const userPlanLevel = NAV_PLAN_LEVEL[profile?.plan ?? 'free'] ?? 0;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <PlatformHeader />

      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {PLATFORM_NAV.map((section) => {
          if (section.requirePlan && userPlanLevel < NAV_PLAN_LEVEL[section.requirePlan]) return null;
          if (section.requireRole === 'admin' && !isAdmin) return null;
          return (
            <div key={section.title}>
              <SectionHeader extra={section.special === 'developer' ? <Sparkles size={10} color="#C9A45E" /> : undefined}>
                {section.title}
              </SectionHeader>
              <ul className="space-y-0.5 mb-1">
                {section.items.map(item => {
                  const active = item.matchPrefix
                    ? (pathname === item.href || pathname.startsWith('/events'))
                    : pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      active={active}
                      onNavigate={onNavigate}
                    />
                  );
                })}
              </ul>
            </div>
          );
        })}

        {isAdmin && (
          <div>
            <SectionHeader extra={<ShieldCheck size={10} color="#C9A45E" />}>Admin</SectionHeader>
            <ul className="space-y-0.5 mb-1">
              {ADMIN_NAV.map(item => (
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
        )}
      </nav>

      <div className="px-3 pb-2 pt-2 border-t space-y-2" style={{ borderColor: '#E5E0D4' }}>
        {profile?.plan !== 'studio' ? (
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(232,197,126,0.06)', border: '1px solid rgba(232,197,126,0.18)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono uppercase" style={{ fontSize: 9.5, color: '#6B7A72', letterSpacing: '0.14em' }}>Events</span>
              <span className="font-mono" style={{ fontSize: 10, color: '#3A4A42' }}>
                {eventCount} / {planLimit === Infinity ? '∞' : planLimit}
              </span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${planPct}%`, background: planPct >= 90 ? '#B8423C' : '#E8C57E' }}
              />
            </div>
            <button
              onClick={() => openUpgrade({ id: 'plan', label: 'More events & features', minPlan: 'pro' })}
              className="mt-2.5 w-full py-2 rounded-lg font-semibold text-[12.5px] transition-colors"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}
            >
              Upgrade plan
            </button>
          </div>
        ) : (
          <div
            className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: '#E8EFEB' }}
          >
            <Sparkles size={12} strokeWidth={1.8} color="#1F4D3A" />
            <span className="font-mono text-[11px] text-[#1F4D3A] font-semibold">Studio plan</span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-[#6B7A72] hover:text-[#0F1F18] hover:bg-[#E8EFEB]/60 transition-colors text-left"
        >
          <LogOut size={14} strokeWidth={1.7} className="shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );
}

// ─── Admin sidebar content ────────────────────────────────────────────────────

const ADMIN_SIDEBAR_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/analytics', label: 'Platform Stats', icon: <BarChart2 size={14} strokeWidth={1.8} />, superAdminOnly: false },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/admin/users', label: 'Accounts',     icon: <Users size={14} strokeWidth={1.8} />,       superAdminOnly: false },
      { href: '/admin/audit', label: 'Activity Log', icon: <ScrollText size={14} strokeWidth={1.8} />,   superAdminOnly: false },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/content',   label: 'Pages',     icon: <FileText size={14} strokeWidth={1.8} />,     superAdminOnly: false },
      { href: '/admin/media',     label: 'Media',     icon: <ImageIcon size={14} strokeWidth={1.8} />,    superAdminOnly: false },
      { href: '/admin/changelog', label: 'Changelog', icon: <ScrollText size={14} strokeWidth={1.8} />,   superAdminOnly: false },
    ],
  },
  {
    label: 'Product',
    items: [
      { href: '/admin/theme',     label: 'Appearance',    icon: <Sliders size={14} strokeWidth={1.8} />,       superAdminOnly: false },
      { href: '/admin/templates', label: 'Templates',     icon: <LayoutTemplate size={14} strokeWidth={1.8} />, superAdminOnly: true },
      { href: '/admin/flags',     label: 'Feature Flags', icon: <Flag size={14} strokeWidth={1.8} />,           superAdminOnly: true },
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

function AdminNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile } = usePlanCtx();
  const isSuperAdmin = profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <div className="px-3 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <div className="flex items-center gap-2">
          <span
            className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(232,197,126,0.15)' }}
          >
            <ShieldCheck size={14} strokeWidth={1.8} color="#C9A45E" />
          </span>
          <span className="font-display font-bold text-[14px]" style={{ color: 'rgba(201,164,94,0.9)' }}>Admin Panel</span>
        </div>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] text-[#6B7A72] hover:text-[#1F4D3A] transition-colors"
        >
          <ArrowLeft size={12} strokeWidth={2} />
          Back to workspace
        </Link>
      </div>

      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {ADMIN_SIDEBAR_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => isSuperAdmin || !i.superAdminOnly);
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <SectionHeader>{section.label}</SectionHeader>
              <ul className="space-y-0.5 mb-1">
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

      <div className="px-3 pb-2 pt-2 border-t" style={{ borderColor: '#E5E0D4' }}>
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2.5 mb-2"
          style={{ background: 'rgba(232,197,126,0.06)', border: '1px solid rgba(232,197,126,0.15)' }}
        >
          <div
            className="h-7 w-7 rounded-full grid place-items-center shrink-0 font-bold text-[11px]"
            style={{ background: 'rgba(232,197,126,0.15)', color: '#C9A45E' }}
          >
            {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[#3A4A42] truncate">{profile?.full_name ?? 'Admin'}</div>
            <div className="font-mono" style={{ fontSize: 10, color: '#C9A45E' }}>{isSuperAdmin ? 'Super admin' : 'Admin'}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] text-[#6B7A72] hover:text-[#0F1F18] hover:bg-[#E8EFEB]/60 transition-colors text-left"
        >
          <LogOut size={14} strokeWidth={1.7} className="shrink-0" />
          Sign out
        </button>
      </div>
    </>
  );
}

// ─── Command Palette ──────────────────────────────────────────────────────────

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
      <div
        className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border overflow-hidden"
        style={{ borderColor: '#E5E0D4' }}
      >
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
  const [upgradeFeature, setUpgradeFeature] = useState<UpgradeFeature | null>(null);

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

  const ctxValue: PlanCtx = {
    profile, eventCount, initials, planPct, planLabel, logoUrl,
    openUpgrade: setUpgradeFeature,
  };

  const isFullScreen = /\/events\/[^/]+\/(edit|publish)/.test(pathname);
  if (isFullScreen) return <>{children}</>;

  const eventId = getEventIdFromPath(pathname);
  const isEventRoute = !!eventId && !isAdminRoute;

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    if (isAdminRoute) return <AdminNavContent pathname={pathname} onNavigate={onNavigate} />;
    if (isEventRoute && eventId) return <EventNavContent pathname={pathname} eventId={eventId} onNavigate={onNavigate} />;
    return <UserNavContent pathname={pathname} onNavigate={onNavigate} />;
  }

  return (
    <PlanContext.Provider value={ctxValue}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#FAF6EE' }}>

        {/* Desktop sidebar */}
        <aside
          className="hidden md:flex w-[256px] shrink-0 flex-col h-screen sticky top-0"
          style={{ background: '#FAF6EE', borderRight: '1px solid #E5E0D4' }}
        >
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
            <aside
              className="absolute left-0 top-0 bottom-0 w-[272px] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.12)] animate-[slideInLeft_200ms_ease-out]"
              style={{ background: '#FAF6EE', borderRight: '1px solid #E5E0D4' }}
            >
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {impersonating && (
            <div
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 shrink-0 z-50"
              style={{ background: '#C97A2D', color: 'white' }}
            >
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

          {/* Topbar */}
          <header
            className="h-14 px-4 md:px-5 flex items-center gap-3 shrink-0 sticky top-0 z-40 border-b"
            style={{ background: 'rgba(250,246,238,0.85)', backdropFilter: 'blur(8px)', borderColor: '#E5E0D4' }}
          >
            <button
              className="md:hidden h-8 w-8 rounded-lg hover:bg-[#E8EFEB] grid place-items-center text-[#6B7A72] shrink-0 transition"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={16} strokeWidth={2} />
            </button>

            <div
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] text-[#6B7A72] cursor-pointer transition flex-1 sm:flex-none sm:min-w-[200px] sm:max-w-[280px] max-w-[180px] border"
              style={{ background: 'white', borderColor: '#E5E0D4' }}
            >
              <Search size={13} strokeWidth={2} className="shrink-0" />
              <span className="flex-1 text-[13px] text-[#6B7A72]/70">Search</span>
              <span className="text-[11px] text-[#6B7A72]/50 font-mono hidden sm:block">⌘K</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {!isAdminRoute && (
                <Link
                  href="/events/new"
                  className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-white text-[13px] font-medium rounded-lg transition hover:bg-[#163828]"
                  style={{ background: '#1F4D3A' }}
                >
                  <Plus size={11} strokeWidth={2.8} />New event
                </Link>
              )}
              <button
                className="h-8 w-8 rounded-lg grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition"
                aria-label="Notifications"
              >
                <Bell size={15} strokeWidth={1.8} />
              </button>
              <Link
                href="/settings"
                className="h-8 w-8 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition"
                style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
              >
                {initials}
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      <UpgradeSlideOver feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
    </PlanContext.Provider>
  );
}
