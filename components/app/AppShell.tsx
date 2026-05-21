'use client';

import React, { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutGrid, TrendingUp, LayoutTemplate, Palette,
  Settings2, Users, LogOut, Menu, Search, Plus, ChevronRight, CreditCard,
  BookOpen, ScrollText, ShieldCheck,
} from 'lucide-react';

type Profile = {
  full_name: string | null;
  email: string | null;
  plan: string;
  role: string;
};

type EventResult = {
  id: string;
  name: string;
  status: string;
  slug: string;
};

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: Infinity, studio: Infinity };

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Events',
    icon: <LayoutGrid size={15} strokeWidth={1.8} />,
    badge: null,
    matchPrefix: true,
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: <TrendingUp size={15} strokeWidth={1.8} />,
    badge: null,
    matchPrefix: false,
  },
  {
    href: '/templates',
    label: 'Templates',
    icon: <LayoutTemplate size={15} strokeWidth={1.8} />,
    badge: 'NEW',
    matchPrefix: false,
  },
  {
    href: '/brand',
    label: 'Brand kit',
    icon: <Palette size={15} strokeWidth={1.8} />,
    badge: null,
    matchPrefix: false,
  },
];

const WORKSPACE_ITEMS = [
  {
    href: '/settings',
    label: 'Settings',
    icon: <Settings2 size={15} strokeWidth={1.8} />,
  },
  {
    href: '/settings/billing',
    label: 'Billing',
    icon: <CreditCard size={15} strokeWidth={1.8} />,
  },
  {
    href: '/team',
    label: 'Team',
    icon: <Users size={15} strokeWidth={1.8} />,
  },
];

const ADMIN_ITEMS = [
  {
    href: '/admin/theme',
    label: 'Theme & Brand',
    icon: <ShieldCheck size={15} strokeWidth={1.8} />,
  },
  {
    href: '/admin/changelog',
    label: 'Changelog',
    icon: <BookOpen size={15} strokeWidth={1.8} />,
  },
  {
    href: '/admin/audit',
    label: 'Audit Log',
    icon: <ScrollText size={15} strokeWidth={1.8} />,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: <Users size={15} strokeWidth={1.8} />,
  },
];

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

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItem({ href, icon, label, badge, active, onNavigate }: {
  href: string; icon: React.ReactNode; label: string;
  badge?: string | null; active: boolean; onNavigate?: () => void;
}) {
  return (
    <li>
      <Link href={href} onClick={onNavigate}
        className={`flex items-center gap-3 py-[7px] rounded-lg text-[13.5px] transition-colors border-l-2 ${
          active
            ? 'border-[#E8C57E] bg-white/[0.1] text-white font-medium pl-[8px] pr-2.5'
            : 'border-transparent px-2.5 text-white/50 hover:text-white/85 hover:bg-white/[0.06]'
        }`}>
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 leading-none">{label}</span>
        {badge && (
          <span className="text-[9px] font-mono font-medium text-white/40 bg-white/[0.08] px-1.5 py-0.5 rounded-md tracking-wide">
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

// ─── Sidebar nav content ──────────────────────────────────────────────────────

function NavContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { profile, eventCount, planPct } = usePlanCtx();
  const router = useRouter();
  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Logo */}
      <Link href="/" onClick={onNavigate}
        className="h-14 px-4 flex items-center gap-2.5 shrink-0 transition-opacity hover:opacity-80"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span className="inline-block w-6 h-6 rounded-md shrink-0"
          style={{ background: 'linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)' }} />
        <span className="font-display text-[19px] font-bold tracking-tight text-white">Karta</span>
        {isAdmin && (
          <span className="ml-auto font-mono text-[9px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-md shrink-0"
            style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E' }}>
            Admin
          </span>
        )}
      </Link>

      {/* Workspace header */}
      <div className="h-14 flex items-center px-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-8 w-8 rounded-lg grid place-items-center shrink-0 ring-1 ring-white/20"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}>
            <span className="text-[12px] font-bold text-white">
              {profile?.full_name?.[0]?.toUpperCase() ?? 'K'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-white truncate leading-snug">
              {profile?.full_name ?? 'My workspace'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {profile?.plan === 'pro' ? (
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}>PRO</span>
              ) : profile?.plan === 'studio' ? (
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(31,77,58,0.8)', color: '#FAF6EE' }}>STUDIO</span>
              ) : (
                <span className="font-mono text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>FREE</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">

        {/* Main */}
        <div>
          <div className="px-2.5 mb-2 text-[10px] font-mono text-white/25 uppercase tracking-widest">Main</div>
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

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Workspace */}
        <div>
          <div className="px-2.5 mb-2 text-[10px] font-mono text-white/25 uppercase tracking-widest">Workspace</div>
          <ul className="space-y-0.5">
            {WORKSPACE_ITEMS.map(item => (
              <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                active={pathname === item.href} onNavigate={onNavigate} />
            ))}
          </ul>
        </div>

        {/* Admin section — only for admin+ */}
        {isAdmin && (
          <>
            <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <div>
              <div className="px-2.5 mb-2 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'rgba(232,197,126,0.5)' }}>
                Platform
              </div>
              <ul className="space-y-0.5">
                {ADMIN_ITEMS.map(item => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label}
                    active={pathname.startsWith(item.href)} onNavigate={onNavigate} />
                ))}
              </ul>
            </div>
          </>
        )}
      </nav>

      {/* Usage mini-card */}
      <div className="px-3 pb-2 shrink-0">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Events</span>
            <span className="text-[10px] font-mono text-white/40">
              {eventCount}&nbsp;/&nbsp;{planLimit === Infinity ? '∞' : planLimit}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${planPct}%`, background: planPct >= 90 ? '#C97A2D' : '#E8C57E' }} />
          </div>
          {profile?.plan !== 'studio' && (
            <Link href="/settings/billing" onClick={onNavigate}
              className="block mt-2 text-[10px] font-mono text-white/30 hover:text-white/55 transition-colors">
              Upgrade for more →
            </Link>
          )}
        </div>
      </div>

      {/* Sign out */}
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

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
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
        supabase.from('profiles').select('full_name, email, plan, role').eq('id', data.user.id).single(),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('user_id', data.user.id).neq('status', 'archived'),
      ]).then(([{ data: p }, { count }]) => {
        setProfile(p);
        setEventCount(count ?? 0);
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const ctxValue: PlanCtx = { profile, eventCount, initials, planPct, planLabel };

  // Editor & publish routes are full-screen — bypass all chrome
  const isFullScreen = /\/events\/[^/]+\/(edit|publish)/.test(pathname);
  if (isFullScreen) return <>{children}</>;

  return (
    <PlanContext.Provider value={ctxValue}>
      <div className="flex min-h-screen" style={{ background: '#F5F5F4' }}>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[252px] shrink-0 flex-col sticky top-0 h-screen" style={{ background: '#0F1F18' }}>
          <NavContent pathname={pathname} />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-[100] md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-[272px] flex flex-col shadow-[4px_0_32px_rgba(0,0,0,0.25)] animate-[slideInLeft_200ms_ease-out]"
              style={{ background: '#0F1F18' }}>
              <NavContent pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="h-14 bg-white px-4 md:px-5 flex items-center gap-3 shrink-0 sticky top-0 z-40 border-b"
            style={{ borderColor: '#E5E0D4' }}>
            <button className="md:hidden h-8 w-8 rounded-lg hover:bg-[#F5F5F4] grid place-items-center text-[#6B7A72] shrink-0 transition"
              onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
              <Menu size={16} strokeWidth={2} />
            </button>

            <div onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] text-[#6B7A72] cursor-pointer transition flex-1 sm:flex-none sm:min-w-[200px] sm:max-w-[280px] max-w-[180px] border"
              style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}>
              <Search size={13} strokeWidth={2} className="shrink-0" />
              <span className="flex-1 text-[13px] text-[#6B7A72]/70">Search</span>
              <span className="text-[11px] text-[#6B7A72]/50 font-mono hidden sm:block">⌘K</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Link href="/events/new"
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3.5 text-white text-[13px] font-medium rounded-lg transition hover:opacity-90"
                style={{ background: '#1F4D3A' }}>
                <Plus size={11} strokeWidth={2.8} />New event
              </Link>
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
