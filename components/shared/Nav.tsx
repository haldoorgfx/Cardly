'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

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
      <header className="sticky top-0 z-40 bg-[#FAF6EE]/80 backdrop-blur-md border-b border-[#E5E0D4]">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-14">
          <Link href="/" className="flex items-center">
            <span className="font-semibold text-[16px] text-[#0F1F18]">Karta</span>
          </Link>

          <ul className="hidden md:flex items-center gap-8 text-[14px] text-[#3A4A42]">
            <li>
              <a className="hover:text-[#0F1F18] transition" href="#how">
                How it works
              </a>
            </li>
            <li>
              <a className="hover:text-[#0F1F18] transition" href="#showcase">
                Showcase
              </a>
            </li>
            <li>
              <Link className="hover:text-[#0F1F18] transition" href="/pricing">
                Pricing
              </Link>
            </li>
            <li>
              <a className="hover:text-[#0F1F18] transition" href="#faq">
                FAQ
              </a>
            </li>
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-[14px] text-[#3A4A42] hover:text-[#0F1F18] px-3 py-1.5 transition"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-4 bg-[#1F4D3A] text-white text-[13px] font-medium rounded-md hover:bg-[#163828] transition"
            >
              Get started
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-11 w-11 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-600 transition"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={2} />
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
          <div className="absolute right-0 top-0 bottom-0 w-[280px] bg-[#FAF6EE] flex flex-col" style={{ animation: 'slideInRight 200ms ease-out' }}>
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-[#E5E0D4]">
              <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                <span className="font-semibold text-[16px] text-[#0F1F18]">Karta</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-md hover:bg-neutral-100 grid place-items-center text-neutral-500 transition"
                aria-label="Close menu"
              >
                <X size={16} strokeWidth={2.2} />
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
                  className="flex items-center px-3 py-3 rounded-md text-[14px] text-[#3A4A42] hover:text-[#0F1F18] hover:bg-[#E8EFEB] transition"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Drawer CTA */}
            <div className="p-4 border-t border-[#E5E0D4] space-y-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-md border border-[#E5E0D4] text-[14px] font-medium text-[#3A4A42] hover:bg-[#E8EFEB] transition"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full h-11 px-4 rounded-md text-[14px] font-medium text-white bg-[#1F4D3A] hover:bg-[#163828] transition"
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
