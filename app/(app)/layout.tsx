'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/app/(auth)/actions';

type Profile = {
  full_name: string | null;
  email: string | null;
  plan: string;
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [eventCount, setEventCount] = useState(0);

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

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const planLimit = profile ? (PLAN_LIMITS[profile.plan] ?? 1) : 1;
  const planPct = planLimit === Infinity ? 50 : Math.min((eventCount / planLimit) * 100, 100);
  const planLabel = profile?.plan === 'studio' ? 'Studio' : profile?.plan === 'pro' ? 'Pro' : 'Free';

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-[232px] shrink-0 bg-white border-r border-[#e5e5ea] flex flex-col sticky top-0 h-screen">

        {/* Workspace header */}
        <div className="px-3 h-[60px] flex items-center border-b border-[#e5e5ea] shrink-0">
          <div className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-xl hover:bg-[#fafafa] transition cursor-pointer">
            <span
              className="h-8 w-8 rounded-xl grid place-items-center text-white font-display font-bold text-[13px] shrink-0"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              {initials[0] ?? 'C'}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-semibold text-[13.5px] leading-tight truncate">
                {profile?.full_name ?? 'Cardly workspace'}
              </span>
              <span className="block text-[10.5px] text-[#0f0f1a]/45 font-mono">{planLabel} plan</span>
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#0f0f1a]/40 shrink-0">
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
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 ${
                      active
                        ? 'bg-[#6c63ff]/[0.08] text-[#6c63ff] font-semibold'
                        : 'text-[#0f0f1a]/65 hover:bg-[#fafafa] hover:text-[#0f0f1a]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#6c63ff]" />
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
                      <span className="ml-auto text-[9.5px] font-mono font-medium text-[#6c63ff] bg-[#6c63ff]/10 px-1.5 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 mb-2 px-3 text-[10px] font-mono tracking-widest text-[#0f0f1a]/35 uppercase">Workspace</div>
          <ul className="space-y-0.5">
            {WORKSPACE_ITEMS.map(item => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`relative flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 ${
                      active
                        ? 'bg-[#6c63ff]/[0.08] text-[#6c63ff] font-semibold'
                        : 'text-[#0f0f1a]/65 hover:bg-[#fafafa] hover:text-[#0f0f1a]'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#6c63ff]" />
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
                onClick={() => signOut()}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#0f0f1a]/65 hover:bg-[#fafafa] hover:text-[#0f0f1a] transition text-left text-[13.5px]"
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
        <div className="m-3 mt-0 rounded-2xl p-4 relative overflow-hidden text-white shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
          <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/15 blur-2xl pointer-events-none" />
          <div className="relative">
            <div className="text-[10px] font-mono tracking-widest opacity-80 uppercase">
              {planLimit === Infinity
                ? 'Unlimited events'
                : `${eventCount} / ${planLimit} events used`}
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
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium opacity-90 hover:opacity-100 transition underline underline-offset-2 decoration-white/40 hover:decoration-white"
              >
                Upgrade plan →
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Sticky top bar */}
        <header className="h-[60px] border-b border-[#e5e5ea] bg-white/80 backdrop-blur-xl px-6 flex items-center gap-4 shrink-0 sticky top-0 z-40">
          <div className="relative flex-1 max-w-[380px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0f0f1a]/35 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search events…"
              className="w-full pl-8 pr-16 py-1.5 bg-[#f4f4f6] rounded-xl text-[13px] placeholder-[#0f0f1a]/35 focus:bg-white focus:ring-2 focus:ring-[#6c63ff]/20 focus:border-[#6c63ff]/30 transition border border-transparent focus:border-[#6c63ff]/30 outline-none h-9"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#0f0f1a]/35 bg-white border border-[#e5e5ea] px-1.5 py-0.5 rounded-md leading-none">
              ⌘K
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* New event shortcut */}
            <Link
              href="/events/new"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12.5px] font-semibold text-white hover:opacity-90 transition"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New
            </Link>

            <span className="h-5 w-px bg-[#e5e5ea] mx-0.5" />

            {/* Notifications bell */}
            <button className="h-8 w-8 rounded-xl hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/55 hover:text-[#0f0f1a] transition relative">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>

            {/* Help */}
            <button className="h-8 w-8 rounded-xl hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/55 hover:text-[#0f0f1a] transition">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            <span className="h-5 w-px bg-[#e5e5ea] mx-0.5" />

            {/* Avatar */}
            <Link href="/settings" className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-[#fafafa] transition cursor-pointer">
              <span
                className="h-7 w-7 rounded-full grid place-items-center text-white font-display font-bold text-[11px] shrink-0"
                style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
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
    </div>
  );
}
