'use client';

import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
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
  published: 'bg-emerald-500/10 text-emerald-400',
  draft:     'bg-white/[0.06] text-white/35',
  archived:  'bg-rose-500/10 text-rose-400',
};

// ─── Command palette ──────────────────────────────────────────────────────────

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
    { label: 'New event',  href: '/events/new',  icon: '<path d="M12 5v14M5 12h14"/>' },
    { label: 'Analytics',  href: '/analytics',   icon: '<path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/>' },
    { label: 'Settings',   href: '/settings',    icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' },
    { label: 'Pricing',    href: '/pricing',     icon: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/>' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full max-w-[560px] bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-100 overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          <svg className="text-neutral-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events, or jump to…"
            className="flex-1 text-[13px] placeholder-neutral-400 outline-none bg-transparent text-neutral-900"
          />
          {loading && (
            <svg className="animate-spin text-neutral-400 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round"/>
            </svg>
          )}
          <button
            onClick={onClose}
            className="text-[11px] text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded hover:text-neutral-700 transition leading-none"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {query.trim() && results.length === 0 && !loading && (
            <div className="px-4 py-10 text-center text-[13px] text-neutral-400">
              No events found for &ldquo;{query}&rdquo;
            </div>
          )}

          {results.length > 0 && (
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10.5px] font-medium text-neutral-400 uppercase tracking-wide">Events</div>
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => navigate(r)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors ${
                    i === selected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-neutral-900 truncate">{r.name}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">/{r.slug}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    r.status === 'published'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      : r.status === 'archived'
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                  }`}>
                    {r.status}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10.5px] font-medium text-neutral-400 uppercase tracking-wide">Quick actions</div>
              {quickActions.map((a, i) => (
                <Link
                  key={a.href}
                  href={a.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-2.5 py-2 rounded-md transition-colors ${
                    i === selected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="h-6 w-6 rounded border border-neutral-200 bg-neutral-50 grid place-items-center text-neutral-500 shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: a.icon }} />
                  </div>
                  <span className="text-[13px] text-neutral-700">{a.label}</span>
                  <svg className="ml-auto text-neutral-300 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-neutral-100 px-4 py-2 flex items-center gap-4 text-[11px] text-neutral-400">
          <span><kbd className="border border-neutral-200 px-1 rounded text-[10px]">↑↓</kbd> navigate</span>
          <span><kbd className="border border-neutral-200 px-1 rounded text-[10px]">↵</kbd> open</span>
          <span><kbd className="border border-neutral-200 px-1 rounded text-[10px]">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar nav content ──────────────────────────────────────────────────────

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planLabel } = usePlanCtx();
  const router = useRouter();

  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Workspace header */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="h-7 w-7 rounded-md bg-[#1F4D3A] grid place-items-center shrink-0">
            <span className="text-[11px] font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'C'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-white truncate leading-tight">
              {profile?.full_name ?? 'My workspace'}
            </div>
            <div className="text-[11px] text-white/35">{planLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
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
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                    active
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <svg
                    width="14" height="14"
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
                    <span className="ml-auto text-[9.5px] font-medium text-white/50 bg-white/[0.08] px-1.5 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="h-px bg-white/[0.06] my-2 mx-1" />

        <ul className="space-y-0.5">
          {WORKSPACE_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                    active
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}
                >
                  <svg
                    width="14" height="14"
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
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] text-white/45 hover:text-white/80 hover:bg-white/[0.04] transition text-left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign out
            </button>
          </li>
        </ul>
      </nav>

      {/* Plan footer — minimal text line, no card */}
      <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
        {profile?.plan !== 'studio' ? (
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="flex items-center justify-between text-[12px] text-white/35 hover:text-white/60 transition"
          >
            <span>{eventCount}/{planLimit === Infinity ? '∞' : planLimit} events used</span>
            <span className="text-white/50">Upgrade →</span>
          </Link>
        ) : (
          <div className="text-[12px] text-white/25">Studio plan · unlimited</div>
        )}
      </div>
    </>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

type PlanCtx = {
  profile: Profile | null;
  eventCount: number;
  initials: string;
  planPct: number;
  planLabel: string;
};

const PlanContext = createContext<PlanCtx>({ profile: null, eventCount: 0, initials: '?', planPct: 0, planLabel: 'Free' });
function usePlanCtx() { return useContext(PlanContext); }

// ─── Root layout ──────────────────────────────────────────────────────────────

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
      <div className="flex min-h-screen bg-[#F5F5F5]">

        {/* Desktop sidebar — dark, 232px */}
        <aside className="hidden md:flex w-[232px] shrink-0 bg-[#0F1F18] flex-col sticky top-0 h-screen">
          <NavContent pathname={pathname} />
        </aside>

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[#0F1F18] flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] animate-[slideInLeft_200ms_ease-out]">
              <NavContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <main className="flex-1 min-w-0 flex flex-col">

          {/* Topbar — white, border-bottom only, no blur */}
          <header className="h-14 bg-white border-b border-neutral-100 px-4 md:px-5 flex items-center gap-3 shrink-0 sticky top-0 z-40">

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-8 w-8 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-500 shrink-0 transition"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>

            {/* Search / CMD+K trigger */}
            <div
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 h-8 px-3 bg-neutral-50 border border-neutral-200 rounded-md text-[13px] text-neutral-400 cursor-pointer hover:border-neutral-300 transition min-w-[200px] max-w-[280px]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
              </svg>
              <span className="flex-1 text-[13px] text-neutral-400">Search</span>
              <span className="text-[11px] text-neutral-300 font-mono hidden sm:block">⌘K</span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 ml-auto">
              {/* New event */}
              <Link
                href="/events/new"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 bg-[#0F1F18] text-white text-[13px] font-medium rounded-md hover:bg-[#1a3028] transition"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New event
              </Link>

              {/* Avatar */}
              <Link
                href="/settings"
                className="h-8 w-8 rounded-full bg-[#1F4D3A] grid place-items-center text-white text-[12px] font-semibold shrink-0 hover:opacity-90 transition"
              >
                {initials}
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
