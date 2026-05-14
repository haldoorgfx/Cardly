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
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-14">
          <Link href="/" className="flex items-center">
            <span className="font-semibold text-[16px] text-[#0a0a0a]">Cardly</span>
          </Link>

          <ul className="hidden md:flex items-center gap-8 text-[14px] text-neutral-600">
            <li>
              <a className="hover:text-neutral-900 transition" href="#how">
                How it works
              </a>
            </li>
            <li>
              <a className="hover:text-neutral-900 transition" href="#showcase">
                Showcase
              </a>
            </li>
            <li>
              <Link className="hover:text-neutral-900 transition" href="/pricing">
                Pricing
              </Link>
            </li>
            <li>
              <a className="hover:text-neutral-900 transition" href="#faq">
                FAQ
              </a>
            </li>
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[14px] text-neutral-600 hover:text-neutral-900 px-3 py-1.5 transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-4 bg-[#0a0a0a] text-white text-[13px] font-medium rounded-md hover:bg-neutral-800 transition"
            >
              Get started
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-9 w-9 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-600 transition"
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
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-white flex flex-col" style={{ animation: 'slideInRight 200ms ease-out' }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-neutral-100">
              <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                <span className="font-semibold text-[16px] text-[#0a0a0a]">Cardly</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-500 transition"
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
                  className="flex items-center px-3 py-2.5 rounded-md text-[14px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Drawer CTA */}
            <div className="p-4 border-t border-neutral-100 space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2 rounded-md border border-neutral-200 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full h-9 px-4 rounded-md text-[14px] font-medium text-white bg-[#0a0a0a] hover:bg-neutral-800 transition"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
