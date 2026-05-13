'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = {
  full_name: string | null;
  email: string | null;
  plan: string;
};

type EventResult = {
  id: string;
  name: string;
  status: string;
  slug: string;
};

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, studio: Infinity };

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Events',
    icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    badge: null,
    matchPrefix: true,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: '<path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/>',
    badge: null,
    matchPrefix: false,
  },
  {
    href: '/templates',
    label: 'Templates',
    icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
    badge: 'NEW',
    matchPrefix: false,
  },
  {
    href: '/brand',
    label: 'Brand kit',
    icon: '<circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/><circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/><path d="M12 22a10 10 0 1 1 10-10c0 5-5 5-5 8a2 2 0 0 1-2 2z"/>',
    badge: null,
    matchPrefix: false,
  },
];

const WORKSPACE_ITEMS = [
  {
    href: '/settings',
    label: 'Settings',
    icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  },
  {
    href: '/team',
    label: 'Team',
    icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
];

const STATUS_STYLES: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-600',
  draft: 'bg-cream text-[#0F1F18]/45',
  archived: 'bg-rose-50 text-rose-500',
};

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
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
    { label: 'New event', href: '/events/new', icon: '<path d="M12 5v14M5 12h14"/>' },
    { label: 'Analytics', href: '/analytics', icon: '<path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/>' },
    { label: 'Settings', href: '/settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' },
    { label: 'Pricing', href: '/pricing', icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/>' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F1F18]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-[0_24px_80px_rgba(15,31,24,0.18)] border border-border overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <svg className="text-[#0F1F18]/35 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, or jump to…"
            className="flex-1 text-[14px] placeholder-[#0F1F18]/35 outline-none bg-transparent"
          />
          {loading && (
            <svg className="animate-spin text-primary shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/>
            </svg>
          )}
          <button onClick={onClose} className="text-[11px] font-mono text-[#0F1F18]/35 border border-border px-1.5 py-0.5 rounded-md hover:text-[#0F1F18] transition">
            ESC
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-[13px] text-[#0F1F18]/40">
              No events found for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10.5px] font-mono tracking-widest text-[#0F1F18]/35 uppercase">Events</div>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${i === selected ? 'bg-primary/[0.08]' : 'hover:bg-cream'}`}
                >
                  <div className="h-8 w-8 rounded-xl shrink-0 grid place-items-center text-white bg-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{r.name}</div>
                    <div className="text-[11px] text-[#0F1F18]/40 font-mono">/{r.slug}</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] ?? STATUS_STYLES.draft}`}>
                    {r.status}
                  </span>
                  <svg className="text-[#0F1F18]/25 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-[10.5px] font-mono tracking-widest text-[#0F1F18]/35 uppercase">Quick actions</div>
              {quickActions.map((a, i) => (
                <Link
                  key={a.href}
                  href={a.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${i === selected ? 'bg-primary/[0.08]' : 'hover:bg-cream'}`}
                >
                  <div className="h-8 w-8 rounded-xl border border-border bg-cream grid place-items-center text-[#0F1F18]/50 shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: a.icon }} />
                  </div>
                  <span className="text-[13.5px] font-medium">{a.label}</span>
                  <svg className="ml-auto text-[#0F1F18]/25 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-[11px] text-[#0F1F18]/35 font-mono">
          <span><kbd className="border border-border px-1 rounded bg-cream">↑↓</kbd> navigate</span>
          <span><kbd className="border border-border px-1 rounded bg-cream">↵</kbd> open</span>
          <span><kbd className="border border-border px-1 rounded bg-cream">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const planLimitCtx = usePlanCtx();
  const { profile, eventCount, planPct, planLabel } = planLimitCtx;
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Workspace header */}
      <div className="px-3 h-[60px] flex items-center border-b border-border shrink-0">
        <div className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-xl hover:bg-cream transition cursor-pointer">
          <span
            className="h-8 w-8 rounded-xl grid place-items-center text-white font-display font-bold text-[13px] shrink-0 bg-primary"
          >
            {profile?.full_name?.[0]?.toUpperCase() ?? 'C'}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-display font-semibold text-[13.5px] leading-tight truncate">
              {profile?.full_name ?? 'Cardly workspace'}
            </span>
            <span className="block text-[10.5px] text-[#0F1F18]/45 font-mono">{planLabel} plan</span>
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#0F1F18]/40 shrink-0">
            <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
          </svg>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 text-[13.5px] overflow-y-auto">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = item.matchPrefix
              ? (pathname === item.href || pathname.startsWith('/events'))
              : pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-primary/[0.08] text-primary font-semibold'
                      : 'text-[#0F1F18]/65 hover:bg-cream hover:text-[#0F1F18]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <svg
                    width="15" height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? '2' : '1.8'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9.5px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 mb-2 px-3 text-[10px] font-mono tracking-widest text-[#0F1F18]/35 uppercase">Workspace</div>
        <ul className="space-y-0.5">
          {WORKSPACE_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-primary/[0.08] text-primary font-semibold'
                      : 'text-[#0F1F18]/65 hover:bg-cream hover:text-[#0F1F18]'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <svg
                    width="15" height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={active ? '2' : '1.8'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dangerouslySetInnerHTML={{ __html: item.icon }}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}

          <li>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#0F1F18]/65 hover:bg-cream hover:text-[#0F1F18] transition text-left text-[13.5px]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </li>
        </ul>
      </nav>

      {/* Plan widget */}
      <div className="m-3 mt-0 rounded-2xl p-4 relative overflow-hidden text-white shrink-0 bg-primary">
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[10px] font-mono tracking-widest opacity-80 uppercase">
              {PLAN_LIMITS[profile?.plan ?? 'free'] === Infinity
                ? 'Unlimited events'
                : `${eventCount} / ${PLAN_LIMITS[profile?.plan ?? 'free']} events`}
            </div>
            <div className="text-[11px] font-mono font-semibold opacity-90">
              {PLAN_LIMITS[profile?.plan ?? 'free'] === Infinity
                ? '∞'
                : `${Math.round(planPct)}%`}
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${planPct}%` }}
            />
          </div>
          {profile?.plan !== 'studio' && (
            <Link
              href="/pricing"
              onClick={onNavigate}
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium opacity-90 hover:opacity-100 transition underline underline-offset-2 decoration-white/40 hover:decoration-white"
            >
              Upgrade plan →
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

type PlanCtx = {
  profile: Profile | null;
  eventCount: number;
  initials: string;
  planPct: number;
  planLabel: string;
};

import { createContext, useContext } from 'react';
const PlanContext = createContext<PlanCtx>({ profile: null, eventCount: 0, initials: '?', planPct: 0, planLabel: 'Free' });
function usePlanCtx() { return useContext(PlanContext); }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      Promise.all([
        supabase.from('profiles').select('full_name, email, plan').eq('id', data.user.id).single(),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id).neq('status', 'archived'),
      ]).then(([{ data: p }, { count }]) => {
        setProfile(p);
        setEventCount(count ?? 0);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // CMD+K global shortcut
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

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const planPct = planLimit === Infinity ? 50 : Math.min((eventCount / planLimit) * 100, 100);
  const planLabel = profile?.plan === 'studio' ? 'Studio' : profile?.plan === 'pro' ? 'Pro' : 'Free';

  const ctxValue: PlanCtx = { profile, eventCount, initials, planPct, planLabel };

  return (
    <PlanContext.Provider value={ctxValue}>
      <div className="flex min-h-screen bg-cream">

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[232px] shrink-0 bg-white border-r border-border flex-col sticky top-0 h-screen">
          <NavContent pathname={pathname} />
        </aside>

        {/* Mobile nav drawer overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="absolute inset-0 bg-[#0F1F18]/40 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-[272px] bg-white flex flex-col shadow-[4px_0_40px_rgba(15,31,24,0.12)] animate-[slideInLeft_200ms_ease-out]">
              <NavContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Sticky top bar */}
          <header className="h-[60px] border-b border-border bg-white/80 backdrop-blur-xl px-4 md:px-6 flex items-center gap-3 shrink-0 sticky top-0 z-40">

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-9 w-9 rounded-xl hover:bg-cream grid place-items-center text-[#0F1F18]/60 shrink-0 transition"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Search / CMD+K */}
            <div className="relative flex-1 max-w-[380px]">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0F1F18]/35 pointer-events-none"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search events…"
                readOnly
                onClick={() => setCmdOpen(true)}
                className="w-full pl-8 pr-16 py-1.5 bg-[#F0EDE8] rounded-xl text-[13px] placeholder-[#0F1F18]/35 focus:bg-white focus:ring-2 focus:ring-primary/20 transition border border-transparent focus:border-primary/30 outline-none h-9 cursor-pointer"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#0F1F18]/35 bg-white border border-border px-1.5 py-0.5 rounded-md leading-none hidden sm:block">
                ⌘K
              </span>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              {/* New event shortcut */}
              <Link
                href="/events/new"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12.5px] font-semibold text-white hover:opacity-90 transition bg-primary"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New
              </Link>

              <span className="hidden sm:block h-5 w-px bg-border mx-0.5" />

              {/* Notifications bell */}
              <button className="h-8 w-8 rounded-xl hover:bg-cream grid place-items-center text-[#0F1F18]/55 hover:text-[#0F1F18] transition relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>
              </button>

              {/* Help */}
              <button className="hidden sm:grid h-8 w-8 rounded-xl hover:bg-cream place-items-center text-[#0F1F18]/55 hover:text-[#0F1F18] transition">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              <span className="h-5 w-px bg-border mx-0.5" />

              {/* Avatar */}
              <Link href="/settings" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-cream transition cursor-pointer">
                <span
                  className="h-7 w-7 rounded-full grid place-items-center text-white font-display font-bold text-[11px] shrink-0 bg-primary"
                >
                  {initials}
                </span>
                <span className="text-[13px] font-medium hidden sm:block">{profile?.full_name?.split(' ')[0] ?? ''}</span>
              </Link>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>

        {/* CMD+K palette */}
        {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
      </div>
    </PlanContext.Provider>
  );
}
