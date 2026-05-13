'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-cream/80 border-b border-border/60">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl grad-bg grid place-items-center text-white font-display font-bold">
              C
            </span>
            <span className="font-display font-bold text-[17px]">Cardly</span>
          </Link>

          <ul className="hidden md:flex items-center gap-9 text-[14px] text-ink/70">
            <li>
              <a className="hover:text-ink transition" href="#how">
                How it works
              </a>
            </li>
            <li>
              <a className="hover:text-ink transition" href="#showcase">
                Showcase
              </a>
            </li>
            <li>
              <Link className="hover:text-ink transition" href="/pricing">
                Pricing
              </Link>
            </li>
            <li>
              <a className="hover:text-ink transition" href="#faq">
                FAQ
              </a>
            </li>
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[14px] text-ink/80 hover:text-ink px-3 py-2 rounded-lg transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium text-white grad-bg px-4 py-2 rounded-xl shadow-soft hover:opacity-95 transition"
            >
              Start free
              <ArrowIcon />
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-9 w-9 rounded-xl hover:bg-cream grid place-items-center text-ink/60 transition"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[#0F1F18]/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white shadow-[−4px_0_40px_rgba(15,31,24,0.12)] flex flex-col animate-[slideInRight_200ms_ease-out]" style={{ animation: 'slideInRight 200ms ease-out' }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-border">
              <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <span className="h-8 w-8 rounded-xl grad-bg grid place-items-center text-white font-display font-bold">
                  C
                </span>
                <span className="font-display font-bold text-[17px]">Cardly</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-xl hover:bg-cream grid place-items-center text-[#0F1F18]/50 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Drawer links */}
            <nav className="flex-1 px-4 py-5 space-y-1">
              {[
                { href: '#how', label: 'How it works' },
                { href: '#showcase', label: 'Showcase' },
                { href: '/pricing', label: 'Pricing' },
                { href: '#faq', label: 'FAQ' },
              ].map(item => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center px-3 py-2.5 rounded-xl text-[14px] text-[#0F1F18]/70 hover:text-[#0F1F18] hover:bg-cream transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Drawer CTA */}
            <div className="p-4 border-t border-border space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 rounded-xl border border-border text-[14px] font-medium text-[#0F1F18]/80 hover:bg-cream transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-[14px] font-medium text-white bg-primary hover:opacity-95 transition"
              >
                Start free
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
