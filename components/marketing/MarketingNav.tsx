'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/* ── Karta logo mark ────────────────────────────────── */
function LogoMark() {
  return (
    <span
      aria-hidden
      className="inline-block w-6 h-6 rounded-md shrink-0"
      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
    />
  );
}

/* ── User avatar (initials) ──────────────────────────── */
function UserAvatar({ user }: { user: User }) {
  const initials = (user.user_metadata?.full_name as string | undefined)
    ? (user.user_metadata.full_name as string)
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : (user.email ?? 'U')[0].toUpperCase();

  return (
    <div
      className="w-8 h-8 rounded-full grid place-items-center font-display font-semibold text-[13px] shrink-0"
      style={{
        background: 'linear-gradient(135deg, #E8C57E 0%, #C9A45E 100%)',
        color: '#163828',
      }}
      title={user.email}
    >
      {initials}
    </div>
  );
}

const NAV_LINKS = [
  { label: 'Use cases',    href: '/#use-cases' },
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing',      href: '/#pricing' },
];

const MOBILE_LINKS = [
  { label: 'Use cases',    href: '/#use-cases' },
  { label: 'How it works', href: '/#how' },
  { label: 'Pricing',      href: '/#pricing' },
  { label: 'About',        href: '/about' },
];

/* ── Mobile full-screen overlay ─────────────────────── */
function MobileOverlay({
  onClose,
  user,
  onSignOut,
  logoUrl,
}: {
  onClose: () => void;
  user: User | null;
  onSignOut: () => void;
  logoUrl: string | null;
}) {
  return (
    <div className="md:hidden fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: '#FAF6EE',
          backgroundImage: [
            'radial-gradient(circle at 1px 1px, rgba(15,31,24,0.045) 1px, transparent 1px)',
            'radial-gradient(60% 50% at 20% 18%, rgba(31,77,58,0.25), transparent 60%)',
            'radial-gradient(50% 45% at 90% 85%, rgba(232,197,126,0.30), transparent 60%)',
          ].join(', '),
          backgroundSize: '24px 24px, 100% 100%, 100% 100%',
        }}
      />

      <div className="relative flex flex-col min-h-screen">
        {/* Header row */}
        <div className="h-[68px] px-5 flex items-center justify-between">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="max-h-[28px] max-w-[120px] object-contain" />
            ) : (
              <>
                <LogoMark />
                <span className="font-display text-[22px] font-bold tracking-tight text-primary">Karta</span>
              </>
            )}
          </Link>
          <button
            onClick={onClose}
            className="w-10 h-10 grid place-items-center rounded-lg text-ink hover:bg-primary-soft transition"
            aria-label="Close menu"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Links */}
        <div className="px-5 pt-6 pb-10 flex-1 flex flex-col">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-5">Menu</div>
          <nav className="flex flex-col">
            {MOBILE_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="group flex items-center justify-between py-5 border-b font-display font-semibold text-ink text-[30px] tracking-[-0.025em] hover:text-primary transition-colors"
                style={{ borderColor: 'rgba(229,224,212,0.7)' }}
              >
                {label}
                <span className="text-primary translate-x-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} strokeWidth={2} />
                </span>
              </Link>
            ))}
            {user && (
              <Link
                href="/dashboard"
                onClick={onClose}
                className="group flex items-center justify-between py-5 border-b font-display font-semibold text-ink text-[30px] tracking-[-0.025em] hover:text-primary transition-colors"
                style={{ borderColor: 'rgba(229,224,212,0.7)' }}
              >
                Dashboard
                <span className="text-primary translate-x-0 group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={20} strokeWidth={2} />
                </span>
              </Link>
            )}
          </nav>

          {/* CTAs */}
          <div className="mt-8 grid gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="inline-flex items-center justify-between px-5 py-4 rounded-full bg-primary text-cream font-medium transition hover:bg-primary-dark"
                >
                  Go to dashboard
                  <LayoutDashboard size={16} strokeWidth={2} />
                </Link>
                <button
                  onClick={() => { onSignOut(); onClose(); }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full border text-ink font-medium hover:border-primary hover:text-primary transition-colors"
                  style={{ borderColor: 'rgba(15,31,24,0.15)' }}
                >
                  <LogOut size={15} strokeWidth={2} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  onClick={onClose}
                  className="inline-flex items-center justify-between px-5 py-4 rounded-full bg-primary text-cream font-medium transition hover:bg-primary-dark"
                >
                  Start free
                  <ArrowRight size={16} strokeWidth={2} />
                </Link>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full border text-ink font-medium hover:border-primary hover:text-primary transition-colors"
                  style={{ borderColor: 'rgba(15,31,24,0.15)' }}
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Footer strip */}
          <div className="mt-auto pt-10 flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">karta.cre8so.com</div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-primary">
              Built for Africa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main nav ────────────────────────────────────────── */
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const pathname = usePathname();

  /* ── Auth + logo state ── */
  useEffect(() => {
    const supabase = createClient();

    // Get initial session + logo in parallel
    Promise.all([
      supabase.auth.getUser(),
      supabase.from('site_settings').select('logo_url').eq('id', 1).single(),
    ]).then(([{ data: authData }, { data: settings }]) => {
      setUser(authData.user ?? null);
      setLogoUrl(settings?.logo_url ?? null);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenuOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(250,246,238,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(229,224,212,0.6)' }}
      >
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="max-h-[32px] max-w-[140px] object-contain" />
            ) : (
              <>
                <LogoMark />
                <span className="font-display text-[22px] font-bold tracking-tight text-primary">Karta</span>
              </>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-9 text-[14px] text-ink-soft">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-primary transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs — signed out */}
          {!user && (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="px-3 py-2 text-[14px] text-ink-soft hover:text-primary transition-colors">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-cream text-[14px] font-medium hover:bg-primary-dark transition-colors"
              >
                Start free
                <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </div>
          )}

          {/* Desktop CTAs — signed in */}
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {/* User avatar + dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-colors hover:bg-primary-soft"
                  aria-label="User menu"
                >
                  <UserAvatar user={user} />
                  <span className="text-[13px] font-medium text-ink-soft">
                    {(user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ?? 'Account'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-52 bg-surface rounded-xl overflow-hidden"
                    style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 24px rgba(15,31,24,0.10)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid #E5E0D4' }}>
                      <div className="text-[13px] font-medium text-ink truncate">
                        {(user.user_metadata?.full_name as string | undefined) ?? 'Account'}
                      </div>
                      <div className="text-[12px] text-muted truncate">{user.email}</div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-ink-soft hover:bg-primary-soft hover:text-primary transition-colors"
                    >
                      <LayoutDashboard size={14} strokeWidth={2} />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2.5 px-4 py-3 text-[13px] text-ink-soft hover:bg-primary-soft hover:text-primary transition-colors"
                      style={{ borderTop: '1px solid rgba(229,224,212,0.6)' }}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] text-left transition-colors hover:bg-red-50 hover:text-red-600"
                      style={{ borderTop: '1px solid #E5E0D4', color: '#B8423C' }}
                    >
                      <LogOut size={14} strokeWidth={2} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden w-10 h-10 grid place-items-center rounded-lg text-ink hover:bg-primary-soft transition"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {open && (
        <MobileOverlay
          onClose={() => setOpen(false)}
          user={user}
          onSignOut={handleSignOut}
          logoUrl={logoUrl}
        />
      )}
    </>
  );
}
