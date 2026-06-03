'use client';

import React, {
  useEffect, useState, useRef, useCallback,
  createContext, useContext,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PLANS } from '@/lib/billing/plans';
import {
  LayoutGrid, TrendingUp, LayoutTemplate, Palette,
  Settings2, Users, LogOut, Menu, Search, Plus, ChevronRight,
  CreditCard, BarChart2, FileText, Eye, X, ArrowLeft, ShieldCheck,
  Flag, Image as ImageIcon, ScrollText, Sliders, Gavel,
  Home, Layout, CalendarDays, Globe, MessageSquare,
  Ticket, ScanLine, Network, Lock, Sparkles,
} from 'lucide-react';
import { UpgradeSlideOver, type UpgradeFeature } from '@/components/app/UpgradeSlideOver';
import { UpgradeContext, planMeets } from '@/components/app/PlanGate';

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

// ─── Constants ────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getEventIdFromPath(pathname: string): string | null {
  const m = pathname.match(/\/events\/([^/]+)/);
  return m && UUID_RE.test(m[1]) ? m[1] : null;
}

const PLAN_LIMITS: Record<string, number> = {
  free:   PLANS.free.events   ?? Infinity,
  pro:    PLANS.pro.events    ?? Infinity,
  studio: PLANS.studio.events ?? Infinity,
};

const PLAN_LABEL: Record<string, string> = { free: 'Free', pro: 'Pro', studio: 'Studio' };

// ─── Platform-level nav ───────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Events',    icon: <LayoutGrid size={15} strokeWidth={1.8} />,     badge: null, matchPrefix: true },
  { href: '/analytics', label: 'Analytics', icon: <TrendingUp size={15} strokeWidth={1.8} />,     badge: null, matchPrefix: false },
  { href: '/templates', label: 'Templates', icon: <LayoutTemplate size={15} strokeWidth={1.8} />, badge: 'NEW', matchPrefix: false },
  { href: '/brand',     label: 'Brand Kit', icon: <Palette size={15} strokeWidth={1.8} />,        badge: null, matchPrefix: false },
];

const WORKSPACE_ITEMS = [
  { href: '/team',              label: 'Team',     icon: <Users size={15} strokeWidth={1.8} />,    minPlan: 'pro' as const },
  { href: '/settings/billing',  label: 'Billing',  icon: <CreditCard size={15} strokeWidth={1.8} /> },
  { href: '/settings',          label: 'Settings', icon: <Settings2 size={15} strokeWidth={1.8} /> },
];

// ─── Event-level nav (matches design-reference/dashboard/data.jsx) ────────────

type EventNavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  segment: string;
  minPlan?: 'pro' | 'studio';
};

type EventNavSection = {
  title: string;
  items: EventNavItem[];
};

const EVENT_NAV_SECTIONS: EventNavSection[] = [
  {
    title: 'Manage',
    items: [
      { id: 'overview',      label: 'Overview',       icon: <Home size={15} strokeWidth={1.8} />,        segment: '' },
      { id: 'event-page',    label: 'Event Page',     icon: <Layout size={15} strokeWidth={1.8} />,      segment: 'event-page' },
      { id: 'tickets',       label: 'Tickets',        icon: <Ticket size={15} strokeWidth={1.8} />,      segment: 'tickets' },
      { id: 'registrations', label: 'Registrations',  icon: <Users size={15} strokeWidth={1.8} />,       segment: 'registrations' },
      { id: 'check-in',      label: 'Check-in',       icon: <ScanLine size={15} strokeWidth={1.8} />,    segment: 'check-in' },
    ],
  },
  {
    title: 'Programme',
    items: [
      { id: 'agenda',    label: 'Agenda',    icon: <LayoutGrid size={15} strokeWidth={1.8} />,    segment: 'agenda' },
      { id: 'speakers',  label: 'Speakers',  icon: <Users size={15} strokeWidth={1.8} />,         segment: 'speakers' },
      { id: 'sessions',  label: 'Sessions',  icon: <CalendarDays size={15} strokeWidth={1.8} />,  segment: 'sessions' },
    ],
  },
  {
    title: 'Engagement',
    items: [
      { id: 'networking', label: 'Networking',  icon: <Network size={15} strokeWidth={1.8} />,      segment: 'engagement', minPlan: 'pro' },
      { id: 'q-and-a',    label: 'Q&A & Polls', icon: <MessageSquare size={15} strokeWidth={1.8} />, segment: 'q-and-a',    minPlan: 'pro' },
    ],
  },
  {
    title: 'Insights',
    items: [
      { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={15} strokeWidth={1.8} />, segment: 'analytics' },
    ],
  },
];

const EVENT_STATUS_BADGE: Record<string, { cls: string; dot: string; label: string }> = {
  published: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#2D7A4F',  label: 'Live' },
  draft:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#C9A45E',  label: 'Draft' },
  archived:  { cls: 'bg-ink/5 text-ink-soft border-border',              dot: '#6B7A72',  label: 'Archived' },
};

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

// ─── Context ──────────────────────────────────────────────────────────────────

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
export function usePlanCtx() { return useContext(PlanContext); }

// ─── NavItem (light sidebar) ──────────────────────────────────────────────────

function NavItem({ href, icon, label, badge, active, locked, minPlanLabel, onNavigate, onUpgrade }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | null;
  active: boolean;
  locked?: boolean;
  minPlanLabel?: string;
  onNavigate?: () => void;
  onUpgrade?: () => void;
}) {
  if (locked) {
    return (
      <li>
        <button
          onClick={onUpgrade}
          className="group w-full flex items-center gap-2.5 pl-3 pr-2.5 py-[7px] rounded-lg text-[13.5px] transition-colors border-l-2 border-transparent text-muted hover:bg-primary-soft/50"
        >
          <span className="shrink-0 text-muted/70">{icon}</span>
          <span className="flex-1 text-left leading-none truncate">{label}</span>
          <span className="inline-flex items-center gap-1 font-mono text-[8.5px] tracking-[0.12em] uppercase bg-accent/20 text-accent-dark px-1.5 py-0.5 rounded font-semibold shrink-0">
            <Lock size={9} strokeWidth={2.5} />
            {minPlanLabel}
          </span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 py-[7px] rounded-lg text-[13.5px] transition-colors border-l-2 ${
          active
            ? 'border-primary bg-primary text-cream font-medium pl-[9px] pr-2.5'
            : 'border-transparent pl-3 pr-2.5 text-ink-soft hover:text-primary hover:bg-primary-soft/70'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 leading-none truncate">{label}</span>
        {badge && (
          <span className="text-[9px] font-mono font-medium text-primary bg-primary-soft px-1.5 py-0.5 rounded-md tracking-wide shrink-0">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Admin NavItem (dark sidebar) ─────────────────────────────────────────────

function AdminNavItem({ href, icon, label, active, onNavigate }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className={`flex items-center gap-3 py-[7px] rounded-lg text-[13.5px] transition-colors border-l-2 ${
          active
            ? 'border-[#E8C57E] bg-white/[0.1] text-white font-medium pl-[8px] pr-2.5'
            : 'border-transparent px-2.5 text-white/50 hover:text-white/85 hover:bg-white/[0.06]'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 leading-none">{label}</span>
      </Link>
    </li>
  );
}

// ─── Sidebar section label ────────────────────────────────────────────────────

function SectionLabel({ children, light = true }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`px-2.5 mb-1.5 pt-2 text-[9.5px] font-mono tracking-[0.2em] uppercase ${light ? 'text-muted' : 'text-white/25'}`}>
      {children}
    </div>
  );
}

// ─── User sidebar content (LIGHT — cream bg) ─────────────────────────────────

function UserNavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planPct, planLabel, logoUrl, openUpgrade } = usePlanCtx();
  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleUpgradeCta = () => {
    const targetPlan = profile?.plan === 'free' ? 'pro' : 'studio';
    openUpgrade({ id: 'events', label: 'More events & features', minPlan: targetPlan as 'pro' | 'studio' });
  };

  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-80"
        style={{ borderBottom: '1px solid #E5E0D4' }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
        ) : (
          <>
            <span className="inline-block w-6 h-6 rounded-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
            <span className="font-display text-[19px] font-semibold tracking-tight text-primary">Karta</span>
          </>
        )}
      </Link>

      {/* Workspace header */}
      <div className="h-12 flex items-center px-4 border-b shrink-0" style={{ borderColor: '#E5E0D4' }}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
          >
            <span className="text-[11px] font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'K'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13.5px] font-semibold text-ink truncate leading-snug">
              {profile?.full_name ?? 'My workspace'}
            </div>
            <span className="font-mono text-[8.5px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded bg-primary-soft text-primary font-semibold">
              {planLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {/* Platform section */}
        <div className="mb-2">
          <SectionLabel>Platform</SectionLabel>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(item => {
              const active = item.matchPrefix
                ? (pathname === item.href || pathname.startsWith('/events'))
                : pathname === item.href;
              return (
                <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                  badge={item.badge} active={active} onNavigate={onNavigate} />
              );
            })}
          </ul>
        </div>

        <div className="mx-2.5 my-2 h-px bg-border" />

        {/* Workspace section */}
        <div className="mb-2">
          <SectionLabel>Workspace</SectionLabel>
          <ul className="space-y-0.5">
            {WORKSPACE_ITEMS.map(item => {
              const locked = !!item.minPlan && !planMeets(profile?.plan ?? 'free', item.minPlan);
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                  locked={locked}
                  minPlanLabel={item.minPlan ? PLAN_LABEL[item.minPlan] : undefined}
                  onNavigate={onNavigate}
                  onUpgrade={locked ? () => openUpgrade({ id: item.href.split('/').pop() ?? item.label.toLowerCase(), label: item.label, minPlan: item.minPlan! }) : undefined}
                />
              );
            })}
          </ul>
        </div>

        {/* Admin entry point */}
        {isAdmin && (
          <>
            <div className="mx-2.5 my-2 h-px bg-border" />
            <div className="px-2.5">
              <Link
                href="/admin/analytics"
                onClick={onNavigate}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12.5px] transition-colors group"
                style={{ background: 'rgba(232,197,126,0.08)', border: '1px solid rgba(232,197,126,0.2)' }}
              >
                <div className="h-6 w-6 rounded-md grid place-items-center shrink-0"
                  style={{ background: 'rgba(232,197,126,0.15)' }}>
                  <ShieldCheck size={12} strokeWidth={1.8} style={{ color: '#C9A45E' }} />
                </div>
                <span className="flex-1 leading-none" style={{ color: 'rgba(201,164,94,0.8)' }}>Admin panel</span>
                <ArrowLeft size={12} strokeWidth={2} className="rotate-180 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: 'rgba(201,164,94,0.4)' }} />
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* Footer — usage + upgrade CTA */}
      <div className="px-3 pb-3 shrink-0 border-t pt-3" style={{ borderColor: '#E5E0D4' }}>
        {profile?.plan !== 'studio' && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-muted mb-1.5">
              <span>{eventCount} / {planLimit === Infinity ? '∞' : planLimit} events</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-primary-soft">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${planPct}%`, background: planPct >= 90 ? '#C97A2D' : '#1F4D3A' }}
              />
            </div>
          </div>
        )}
        {profile?.plan !== 'studio' ? (
          <button
            onClick={handleUpgradeCta}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12.5px] font-medium bg-primary text-cream hover:bg-primary-dark transition-colors"
          >
            <Sparkles size={13} strokeWidth={2} style={{ color: '#E8C57E' }} />
            Upgrade plan
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[12px] font-mono text-primary" style={{ background: '#E8EFEB' }}>
            <Sparkles size={12} strokeWidth={2} style={{ color: '#C9A45E' }} />
            Studio plan
          </div>
        )}
        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="mt-2 w-full flex items-center gap-2.5 px-2.5 py-[6px] rounded-lg text-[12.5px] text-muted hover:text-ink hover:bg-primary-soft/60 transition-colors text-left"
        >
          <LogOut size={14} strokeWidth={1.7} className="shrink-0" />
          <span className="leading-none">Sign out</span>
        </button>
      </div>
    </>
  );
}

// ─── Admin sidebar content (DARK — stays dark; admin is a distinct surface) ───

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
      <div className="h-14 px-4 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[28px] max-w-[100px] object-contain" />
        ) : (
          <div className="h-7 w-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(232,197,126,0.15)' }}>
            <ShieldCheck size={14} strokeWidth={1.8} style={{ color: '#E8C57E' }} />
          </div>
        )}
        <span className="font-display text-[14px] font-bold tracking-tight" style={{ color: 'rgba(232,197,126,0.7)' }}>
          Admin Panel
        </span>
      </div>

      <div className="px-3 pt-3 shrink-0">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] text-white/35 hover:text-white/65 hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft size={13} strokeWidth={2} className="shrink-0" />
          Back to workspace
        </Link>
      </div>

      <div className="mx-3 mt-2 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {ADMIN_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => isSuperAdmin || !i.superAdminOnly);
          if (!visibleItems.length) return null;
          return (
            <div key={section.label}>
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-widest"
                style={{ color: 'rgba(232,197,126,0.4)' }}>
                {section.label}
              </div>
              <ul className="space-y-0.5">
                {visibleItems.map(item => (
                  <AdminNavItem
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

      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          style={{ background: 'rgba(232,197,126,0.06)', border: '1px solid rgba(232,197,126,0.12)' }}>
          <div className="h-7 w-7 rounded-full grid place-items-center shrink-0 text-[11px] font-bold"
            style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E' }}>
            {profile?.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-white/70 truncate">{profile?.full_name ?? 'Admin'}</div>
            <div className="text-[10px] font-mono" style={{ color: 'rgba(232,197,126,0.5)' }}>
              {isSuperAdmin ? 'Super admin' : 'Admin'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13.5px] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors text-left">
          <LogOut size={15} strokeWidth={1.7} className="shrink-0" />
          <span className="leading-none">Sign out</span>
        </button>
      </div>
    </>
  );
}

// ─── Event sidebar content (LIGHT — cream bg) ────────────────────────────────

function EventNavContent({ pathname, eventId, onNavigate }: {
  pathname: string; eventId: string; onNavigate?: () => void;
}) {
  const { logoUrl, profile, openUpgrade } = usePlanCtx();
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

  const badge = event?.status ? (EVENT_STATUS_BADGE[event.status] ?? EVENT_STATUS_BADGE.archived) : null;

  return (
    <>
      {/* Logo */}
      <Link
        href="/"
        onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-80"
        style={{ borderBottom: '1px solid #E5E0D4' }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
        ) : (
          <>
            <span className="inline-block w-6 h-6 rounded-md shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
            <span className="font-display text-[19px] font-semibold tracking-tight text-primary">Karta</span>
          </>
        )}
      </Link>

      {/* Event context header */}
      <div className="px-3 pt-3 pb-3 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft size={13} strokeWidth={2} />
          All events
        </Link>
        <div className="font-display text-[14px] font-semibold text-ink leading-snug tracking-tight line-clamp-2 px-0.5">
          {event ? event.name : <span className="text-muted">Loading…</span>}
        </div>
        {badge && (
          <span className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${badge.cls}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: badge.dot }} />
            {badge.label}
          </span>
        )}
      </div>

      {/* Event nav — sectioned */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {EVENT_NAV_SECTIONS.map((section, si) => (
          <div key={si} className="mb-2">
            <SectionLabel>{section.title}</SectionLabel>
            <ul className="space-y-0.5">
              {section.items.map(item => {
                const href = item.segment === ''
                  ? `/events/${eventId}`
                  : `/events/${eventId}/${item.segment}`;
                const active = activeSegment === item.segment;
                const locked = !!item.minPlan && !planMeets(profile?.plan ?? 'free', item.minPlan);
                return (
                  <NavItem
                    key={item.id}
                    href={href}
                    icon={item.icon}
                    label={item.label}
                    active={active}
                    locked={locked}
                    minPlanLabel={item.minPlan ? PLAN_LABEL[item.minPlan] : undefined}
                    onNavigate={onNavigate}
                    onUpgrade={locked ? () => openUpgrade({ id: item.id, label: item.label, minPlan: item.minPlan! }) : undefined}
                  />
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 shrink-0 border-t" style={{ borderColor: '#E5E0D4' }}>
        {event?.status === 'published' && event?.slug && (
          <a
            href={`/e/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-border text-[12.5px] text-ink-soft hover:border-primary/40 hover:text-primary transition-colors"
          >
            View public page <Globe size={13} strokeWidth={1.8} className="shrink-0" />
          </a>
        )}
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
      <div className="relative w-full max-w-[560px] bg-surface rounded-2xl shadow-lift border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="text-muted shrink-0" size={15} strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, or jump to…"
            className="flex-1 text-[13px] placeholder-muted outline-none bg-transparent text-ink"
          />
          {loading && (
            <svg className="animate-spin text-muted shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
            </svg>
          )}
          <button onClick={onClose} className="text-[11px] text-muted border border-border px-1.5 py-0.5 rounded-md hover:text-ink transition leading-none">
            ESC
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-[13px] text-muted">
              No events found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.length > 0 && (
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-muted/70 uppercase tracking-widest">Events</div>
              {results.map((r, i) => (
                <button key={r.id} onClick={() => navigate(r)} onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors ${i === selected ? 'bg-primary-soft' : 'hover:bg-primary-soft/60'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-ink truncate">{r.name}</div>
                    <div className="text-[11px] text-muted font-mono">/{r.slug}</div>
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
              <div className="px-2.5 py-1.5 text-[10px] font-mono text-muted/70 uppercase tracking-widest">Quick actions</div>
              {quickActions.map((a, i) => (
                <Link key={a.href} href={a.href} onClick={onClose}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors ${i === selected ? 'bg-primary-soft' : 'hover:bg-primary-soft/60'}`}>
                  <div className="h-7 w-7 rounded-lg border border-border grid place-items-center text-ink-soft shrink-0" style={{ background: '#FAF6EE' }}>
                    {a.icon}
                  </div>
                  <span className="text-[13px] text-ink-soft">{a.label}</span>
                  <ChevronRight className="ml-auto text-border shrink-0" size={12} strokeWidth={2.2} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-[11px] text-muted">
          <span><kbd className="border border-border px-1 rounded text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="border border-border px-1 rounded text-[10px]">↵</kbd> open</span>
          <span><kbd className="border border-border px-1 rounded text-[10px]">ESC</kbd> close</span>
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

  const openUpgrade = useCallback((feature: UpgradeFeature) => setUpgradeFeature(feature), []);
  const closeUpgrade = useCallback(() => setUpgradeFeature(null), []);

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

  async function exitImpersonation() {
    await fetch('/api/admin/impersonate', { method: 'DELETE' });
    setImpersonating(null);
    router.push('/admin/users');
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const planPct = planLimit === Infinity ? 50 : Math.min((eventCount / planLimit) * 100, 100);
  const planLabel = PLAN_LABEL[profile?.plan ?? 'free'] ?? 'Free';

  const ctxValue: PlanCtx = { profile, eventCount, initials, planPct, planLabel, logoUrl, openUpgrade };

  const isFullScreen = /\/events\/[^/]+\/(edit|publish)/.test(pathname);
  if (isFullScreen) return <>{children}</>;

  const eventId = getEventIdFromPath(pathname);
  const isEventRoute = !!eventId && !isAdminRoute;

  function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
    if (isAdminRoute) return <AdminNavContent pathname={pathname} onNavigate={onNavigate} />;
    if (isEventRoute && eventId) return <EventNavContent pathname={pathname} eventId={eventId} onNavigate={onNavigate} />;
    return <UserNavContent pathname={pathname} onNavigate={onNavigate} />;
  }

  const sidebarBg = isAdminRoute ? '#0F1F18' : '#FAF6EE';
  const sidebarBorder = isAdminRoute ? 'rgba(255,255,255,0.07)' : '#E5E0D4';

  return (
    <PlanContext.Provider value={ctxValue}>
      <UpgradeContext.Provider value={{ plan: profile?.plan ?? 'free', openUpgrade }}>
        <div className="flex min-h-screen" style={{ background: '#FAF6EE' }}>

          {/* Desktop sidebar */}
          <aside
            className="hidden lg:flex w-[252px] shrink-0 flex-col sticky top-0 h-screen"
            style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
          >
            <SidebarInner />
          </aside>

          {/* Mobile drawer */}
          {mobileNavOpen && (
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
              <aside
                className="absolute left-0 top-0 bottom-0 w-[272px] flex flex-col shadow-lift animate-[slideInLeft_200ms_ease-out]"
                style={{ background: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
              >
                <SidebarInner onNavigate={() => setMobileNavOpen(false)} />
              </aside>
            </div>
          )}

          {/* Main column */}
          <main className="flex-1 min-w-0 flex flex-col">
            {/* Impersonation banner */}
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

            {/* Topbar — cream/blur */}
            <header
              className="h-14 px-4 md:px-5 flex items-center gap-3 shrink-0 sticky top-0 z-40 border-b"
              style={{ background: 'rgba(250,246,238,0.85)', backdropFilter: 'blur(12px)', borderColor: '#E5E0D4' }}
            >
              <button
                className="lg:hidden h-8 w-8 rounded-lg hover:bg-primary-soft grid place-items-center text-muted shrink-0 transition"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={16} strokeWidth={2} />
              </button>

              {/* ⌘K trigger */}
              <div
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] text-muted cursor-pointer transition flex-1 sm:flex-none sm:min-w-[200px] sm:max-w-[280px] max-w-[180px] border border-border hover:border-primary/30 hover:bg-primary-soft/40"
                style={{ background: '#FAF6EE' }}
              >
                <Search size={13} strokeWidth={2} className="shrink-0" />
                <span className="flex-1 text-[13px] text-muted/70">Search</span>
                <span className="text-[11px] text-muted/50 font-mono hidden sm:block">⌘K</span>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 ml-auto">
                {!isAdminRoute && (
                  <Link
                    href="/events/new"
                    className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-cream text-[13px] font-medium rounded-lg transition hover:bg-primary-dark bg-primary"
                  >
                    <Plus size={11} strokeWidth={2.8} />New event
                  </Link>
                )}
                <Link
                  href="/settings"
                  className="h-8 w-8 rounded-full grid place-items-center text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
                  title={profile?.full_name ?? 'Settings'}
                >
                  {initials}
                </Link>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">{children}</div>
          </main>
        </div>

        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
        <UpgradeSlideOver feature={upgradeFeature} onClose={closeUpgrade} />
      </UpgradeContext.Provider>
    </PlanContext.Provider>
  );
}
