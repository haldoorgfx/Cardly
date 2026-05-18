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

  const navItems = [
    {
      href: '/dashboard',
      label: 'Events',
      icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
      badge: null,
    },
    {
      href: '/analytics',
      label: 'Analytics',
      icon: '<path d="M3 3v18h18"/><path d="M7 14l3-3 4 4 5-5"/>',
      badge: null,
    },
    {
      href: '/templates',
      label: 'Templates',
      icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/>',
      badge: 'NEW',
    },
    {
      href: '/brand',
      label: 'Brand kit',
      icon: '<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>',
      badge: null,
    },
  ];

  const workspaceNavItems = [
    {
      href: '/settings',
      label: 'Settings',
      icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    },
    {
      href: '/settings/billing',
      label: 'Billing',
      icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    },
    {
      href: '/team',
      label: 'Team',
      icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 bg-white border-r border-[#e5e5ea] flex flex-col">
        {/* Workspace switcher */}
        <div className="px-4 h-16 flex items-center border-b border-[#e5e5ea]">
          <button className="flex items-center gap-2.5 w-full hover:bg-[#fafafa] rounded-xl px-2 py-1.5 transition">
            <span className="h-9 w-9 rounded-xl grid place-items-center text-white font-display font-bold shrink-0" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
              {initials[0] ?? 'C'}
            </span>
            <span className="flex-1 text-left min-w-0">
              <span className="block font-display font-semibold text-[14px] leading-tight truncate">
                {profile?.full_name ?? 'Cardly'}
              </span>
              <span className="block text-[11px] text-[#0f0f1a]/50 font-mono">{planLabel}</span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[#0f0f1a]/50 shrink-0">
              <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 text-[14px] overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(item => {
              const active = pathname === item.href || (item.href === '/dashboard' && pathname.startsWith('/events'));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${active ? 'bg-[#fafafa] text-[#0f0f1a] font-medium' : 'text-[#0f0f1a]/70 hover:bg-[#fafafa]'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: item.icon }} />
                    {item.label}
                    {item.badge && (
                      <span className="ml-auto text-[10px] font-mono text-[#6c63ff] bg-[#6c63ff]/10 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 mb-2 px-3 text-[11px] font-mono tracking-widest text-[#0f0f1a]/40">WORKSPACE</div>
          <ul className="space-y-0.5">
            {workspaceNavItems.map(item => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition ${active ? 'bg-[#fafafa] text-[#0f0f1a] font-medium' : 'text-[#0f0f1a]/70 hover:bg-[#fafafa]'}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" dangerouslySetInnerHTML={{ __html: item.icon }} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#0f0f1a]/70 hover:bg-[#fafafa] transition text-left"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </li>
          </ul>
        </nav>

        {/* Plan usage widget */}
        <div className="m-3 mt-0 rounded-2xl p-4 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
          <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          <div className="relative">
            <div className="text-[11px] font-mono opacity-80 uppercase">
              {planLimit === Infinity
                ? 'UNLIMITED EVENTS'
                : `${eventCount} OF ${planLimit} EVENTS USED`}
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white transition-all duration-500" style={{ width: `${planPct}%` }} />
            </div>
            {profile?.plan !== 'studio' && (
              <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium underline decoration-white/40 underline-offset-4 hover:decoration-white">
                Upgrade to Studio →
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-[#e5e5ea] bg-white px-8 flex items-center gap-6 shrink-0">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0f0f1a]/40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search events…"
              className="w-full pl-9 pr-14 py-2 bg-[#fafafa] rounded-xl text-[13.5px] placeholder-[#0f0f1a]/40 focus:bg-white focus:ring-2 focus:ring-[#6c63ff]/30 transition border border-transparent focus:border-[#6c63ff]/30 outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#0f0f1a]/40 border border-[#e5e5ea] px-1.5 py-0.5 rounded bg-white">⌘K</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 w-9 rounded-xl hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/60 hover:text-[#0f0f1a] transition relative">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>
            <button className="h-9 w-9 rounded-xl hover:bg-[#fafafa] grid place-items-center text-[#0f0f1a]/60 hover:text-[#0f0f1a] transition">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>
            <span className="h-6 w-px bg-[#e5e5ea] mx-1" />
            <div className="flex items-center gap-2.5 pr-2 pl-1 py-1 rounded-xl hover:bg-[#fafafa] transition cursor-pointer">
              <span
                className="h-8 w-8 rounded-full grid place-items-center text-white font-display font-bold text-[12px]"
                style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
              >
                {initials}
              </span>
              <span className="text-[13px] font-medium">{profile?.full_name?.split(' ')[0] ?? ''}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#0f0f1a]/50">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
