'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavLink {
  href: string;
  label: string;
}

interface PublicNavProps {
  eventSlug?: string;
  eventTitle?: string;
}

export function PublicNav({ eventSlug, eventTitle }: PublicNavProps) {
  const pathname = usePathname();

  const eventLinks: NavLink[] = eventSlug
    ? [
        { href: `/e/${eventSlug}`, label: 'Overview' },
        { href: `/e/${eventSlug}/schedule`, label: 'Schedule' },
        { href: `/e/${eventSlug}/speakers`, label: 'Speakers' },
        { href: `/e/${eventSlug}/people`, label: 'People' },
        { href: `/e/${eventSlug}/q-and-a`, label: 'Q&A' },
      ]
    : [];

  return (
    <nav
      className="sticky top-0 z-40 border-b"
      style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
    >
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="flex items-center h-14 gap-6">
          {/* Logo / event title */}
          <Link
            href={eventSlug ? `/e/${eventSlug}` : '/events'}
            className="font-display font-medium text-[15px] shrink-0"
            style={{ color: '#1F4D3A' }}
          >
            {eventTitle ?? 'Karta'}
          </Link>

          {/* Nav links */}
          {eventLinks.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1">
              {eventLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors"
                    style={
                      isActive
                        ? { background: '#1F4D3A', color: '#fff' }
                        : { color: '#6B7A72' }
                    }
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
