import Link from 'next/link';
import { Globe, MessageCircle, Camera } from 'lucide-react';

/* ── Djibouti flag badge ─────────────────────── */
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

const FOOTER_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Use cases',    href: '/use-cases' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Pricing',      href: '/pricing' },
      { label: "What's new",   href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',    href: '/about' },
      { label: 'Blog',     href: '#' },
      { label: 'Contact',  href: 'mailto:hello@cardly.app' },
      { label: 'Partners', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Privacy',     href: '#' },
      { label: 'Terms',       href: '#' },
      { label: 'Status',      href: '#' },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer style={{ background: '#163828', color: 'rgba(250,246,238,0.85)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-20 pb-8">
        {/* Main grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                aria-hidden
                className="inline-block w-6 h-6 rounded-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)' }}
              />
              <span className="font-display text-[24px] font-bold tracking-tight text-cream">
                Cardly
              </span>
            </div>
            <p style={{ color: 'rgba(250,246,238,0.65)' }} className="text-[14px] leading-[1.55] max-w-[280px]">
              Personalized share cards for every campaign.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {[
                { Icon: Globe,         label: 'LinkedIn'    },
                { Icon: MessageCircle, label: 'X / Twitter' },
                { Icon: Camera,        label: 'Instagram'   },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 grid place-items-center rounded-full transition-colors border border-white/15 hover:bg-white/10 hover:border-white/30"
                >
                  <Icon size={15} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div
                className="font-mono text-[10px] tracking-[0.22em] uppercase mb-4"
                style={{ color: '#E8C57E' }}
              >
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('mailto:') ? (
                      <a
                        href={href}
                        className="text-[14px] transition-colors"
                        style={{ color: 'rgba(250,246,238,0.75)' }}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-[14px] transition-colors"
                        style={{ color: 'rgba(250,246,238,0.75)' }}
                      >
                        {label}
                      </Link>
                    )}
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
            © 2026 Cardly. Built with care for organizers everywhere.
          </div>
          <div
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-full"
            style={{ color: '#E8C57E', background: 'rgba(250,246,238,0.05)', border: '1px solid rgba(250,246,238,0.15)' }}
          >
            <DjiboutiFlag />
            Made in Djibouti
          </div>
        </div>
      </div>
    </footer>
  );
}
