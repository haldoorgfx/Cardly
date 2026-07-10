import Link from 'next/link';
import { Compass } from 'lucide-react';

const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Registration',  href: '/pricing' },
      { label: 'Agenda',        href: '/pricing' },
      { label: 'Speakers',      href: '/pricing' },
      { label: 'Check-in',      href: '/pricing' },
      { label: 'Networking',    href: '/pricing' },
      { label: 'Analytics',     href: '/pricing' },
      { label: 'Eventera Card',    href: '/pricing' },
    ],
  },
  {
    title: 'Use Cases',
    links: [
      { label: 'Conferences',    href: '/use-cases' },
      { label: 'NGOs',           href: '/use-cases' },
      { label: 'Political',      href: '/use-cases' },
      { label: 'Corporate',      href: '/use-cases' },
      { label: 'Religious',      href: '/use-cases' },
      { label: 'African Events', href: '/use-cases' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',    href: '/about' },
      { label: 'Blog',     href: '/blog' },
      { label: 'Contact',  href: '/contact' },
      { label: 'Partners', href: '/partners' },
      { label: 'Careers',  href: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: "What's new",  href: '/whats-new' },
      { label: 'Help Center', href: '/help' },
      { label: 'API Docs',    href: '/help' },
      { label: 'Status',      href: '/status' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms',   href: '/terms' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer style={{ background: '#163828', color: 'rgba(250,246,238,0.85)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-20 pb-8">

        {/* Main grid */}
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_0.8fr]">

          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eventera-logo-dark.png" alt="Eventera" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <p style={{ color: 'rgba(250,246,238,0.65)' }} className="text-[14px] leading-[1.55] max-w-[280px]">
              The event platform that makes every attendee proud to be there.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-full text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8C57E', color: '#163828' }}
            >
              <Compass size={16} strokeWidth={2.2} />
              Discover events
            </Link>
            <div className="flex items-center gap-2.5 mt-6">
              {/* Social icons — simple SVG anchors */}
              {[
                { label: 'LinkedIn',  path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', href: '#' },
                { label: 'Twitter/X', path: 'M4 4l16 16M4 20 20 4',       href: '#' },
                { label: 'Instagram', path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z', href: '#' },
              ].map(({ label, path, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 grid place-items-center rounded-full border transition-colors hover:bg-cream/10 hover:border-cream/30"
                  style={{ borderColor: 'rgba(250,246,238,0.15)' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className=" text-[10px] tracking-[0.22em] uppercase mb-4" style={{ color: '#E8C57E' }}>
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[14px] transition-colors hover:text-cream"
                      style={{ color: 'rgba(250,246,238,0.75)' }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(250,246,238,0.1)' }}
        >
          <div style={{ color: 'rgba(250,246,238,0.55)' }} className="text-[13px]">
            © 2026 Eventera. Built for organizers everywhere, with Africa at the heart.
          </div>
          {/* Made in Djibouti badge */}
          <div
            className="inline-flex items-center gap-2  text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
            style={{ color: '#E8C57E', background: 'rgba(250,246,238,0.05)', border: '1px solid rgba(250,246,238,0.15)' }}
          >
            {/* Djibouti flag mini */}
            <span className="inline-flex items-center gap-0.5" aria-hidden>
              <span className="inline-block w-3 h-2 rounded-sm overflow-hidden" style={{ background: 'linear-gradient(to bottom, #6AB04C 50%, #44A5E0 50%)' }} />
              <span className="inline-block w-0 h-0" style={{ borderLeft: '6px solid #D62828', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
            </span>
            Made in Djibouti
          </div>
        </div>
      </div>
    </footer>
  );
}
