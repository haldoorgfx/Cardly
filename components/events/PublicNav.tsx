'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, X } from 'lucide-react';

interface PublicNavProps {
  eventSlug?: string;
  eventName?: string;
}

export function PublicNav({ eventSlug }: PublicNavProps = {}) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, []);

  // Determine the dynamic middle nav item based on current page
  function getMiddleItem() {
    if (!eventSlug) return null;
    const isRegisterOrEventPage = pathname === `/e/${eventSlug}` || pathname.startsWith(`/e/${eventSlug}/register`) || pathname.startsWith(`/e/${eventSlug}/my-agenda`);
    if (isRegisterOrEventPage) return { href: `/e/${eventSlug}/register`, label: 'My tickets' };
    return { href: `/e/${eventSlug}/speakers`, label: 'Speakers' };
  }

  const middleItem = getMiddleItem();

  const eventLinks = eventSlug ? [
    { href: '/events', label: 'Discover' },
    ...(middleItem ? [middleItem] : []),
    { href: `/e/${eventSlug}/schedule`, label: 'Schedule' },
    { href: `/e/${eventSlug}/people`,   label: 'Network' },
  ] : [
    { href: '/events',       label: 'Discover' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/pricing',      label: 'Pricing' },
  ];

  function isActive(href: string) {
    if (href === '/events') return pathname === '/events';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        height: 64,
        background: 'rgba(250,246,238,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E0D4',
      }}
    >
      <div className="max-w-[1120px] mx-auto h-full px-5 flex items-center gap-6">
        {/* Wordmark — always Karta */}
        <Link href={eventSlug ? `/e/${eventSlug}` : '/'} className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity">
          <span className="font-display font-semibold text-[19px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Kart<span style={{ color: '#E8C57E' }}>a</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 flex-1 ml-4">
          {eventLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium transition-colors"
              style={{ color: isActive(link.href) ? '#1F4D3A' : '#3A4A42' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center h-9 px-4 rounded-lg text-[14px] font-medium transition-colors"
              style={{ color: '#1F4D3A', border: '1px solid #1F4D3A' }}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-block text-[14px] font-medium transition-colors"
              style={{ color: '#3A4A42' }}
            >
              Sign in
            </Link>
          )}
          <Link
            href={user ? '/events/new' : '/signup'}
            className="inline-flex items-center h-9 px-4 rounded-lg text-white text-[14px] font-medium transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            Host an event
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center transition"
            style={{ border: '1px solid #E5E0D4' }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-5 pb-4 pt-2 flex flex-col gap-3" style={{ background: '#FAF6EE', borderTop: '1px solid #E5E0D4' }}>
          {eventLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium py-1" style={{ color: '#0F1F18' }}>
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium py-1" style={{ color: '#3A4A42' }}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
