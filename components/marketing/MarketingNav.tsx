'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';

/* ── Djibouti flag badge ─────────────────────────────── */
function DjiboutiFlag() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span
        className="inline-block w-3 h-2 rounded-sm"
        style={{ background: 'linear-gradient(to bottom, #6AB04C 33%, #FFFFFF 33% 66%, #44A5E0 66%)' }}
      />
      <span
        className="inline-block w-2 h-2"
        style={{ background: '#D62828', clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }}
      />
    </span>
  );
}

/* ── Cardly logo mark ────────────────────────────────── */
function LogoMark() {
  return (
    <span
      aria-hidden
      className="inline-block w-6 h-6 rounded-md shrink-0"
      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
    />
  );
}

const NAV_LINKS = [
  { label: 'Use cases',    href: '/use-cases' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing',      href: '/pricing' },
];

const MOBILE_LINKS = [
  { label: 'Use cases',    href: '/use-cases' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Pricing',      href: '/pricing' },
  { label: 'About',        href: '/about' },
];

/* ── Mobile full-screen overlay ─────────────────────── */
function MobileOverlay({ onClose }: { onClose: () => void }) {
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
            <LogoMark />
            <span className="font-display text-[22px] font-bold tracking-tight text-primary">Cardly</span>
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
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-5">
            Menu
          </div>
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
          </nav>

          {/* CTAs */}
          <div className="mt-8 grid gap-3">
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
          </div>

          {/* Footer strip */}
          <div className="mt-auto pt-10 flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
              cardly.app
            </div>
            <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-primary">
              <DjiboutiFlag />
              Made in Djibouti
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
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(250,246,238,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(229,224,212,0.6)' }}
      >
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <LogoMark />
            <span className="font-display text-[22px] font-bold tracking-tight text-primary">
              Cardly
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-9 text-[14px] text-ink-soft">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="hover:text-primary transition-colors"
                style={{ color: pathname.startsWith(href) ? '#1F4D3A' : undefined }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
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

      {open && <MobileOverlay onClose={() => setOpen(false)} />}
    </>
  );
}
