import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, ArrowRight, Search, LifeBuoy, Tag } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 — Page not found',
};

const HELPFUL: { href: string; label: string; icon: typeof Compass }[] = [
  { href: '/events', label: 'Discover events', icon: Search },
  { href: '/pricing', label: 'Pricing', icon: Tag },
  { href: '/help', label: 'Help center', icon: LifeBuoy },
];

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-5 py-16" style={{ background: '#FAF6EE' }}>
      <div
        className="w-full text-center"
        style={{
          maxWidth: 560,
          background: '#FFFFFF',
          border: '1px solid #E5E0D4',
          borderRadius: 24,
          boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 30px 60px -40px rgba(15,31,24,0.22)',
          padding: 'clamp(32px, 5vw, 56px)',
        }}
      >
        {/* Brand mark — solid forest tile, no gradient */}
        <div
          className="inline-grid place-items-center"
          style={{ width: 56, height: 56, borderRadius: 16, background: '#1F4D3A', color: '#FAF6EE' }}
        >
          <Compass size={26} strokeWidth={1.8} aria-hidden />
        </div>

        {/* Eyebrow */}
        <div
          style={{
            marginTop: 24,
            fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#65736B',
          }}
        >
          Error 404
        </div>

        {/* Headline */}
        <h1
          className="font-title font-extrabold"
          style={{
            marginTop: 12,
            fontSize: 'clamp(30px, 5vw, 44px)',
            lineHeight: 1.04,
            letterSpacing: '-0.03em',
            color: '#0F1F18',
          }}
        >
          We couldn&rsquo;t find that page.
        </h1>

        {/* Body */}
        <p
          style={{
            margin: '16px auto 0',
            maxWidth: 400,
            fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
            fontSize: 16,
            lineHeight: 1.6,
            color: '#3A4A42',
          }}
        >
          The page may have moved, or the link is incomplete. If you&rsquo;re headed to an event,
          double-check the link with the organizer.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3" style={{ marginTop: 32 }}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-semibold text-white transition hover:opacity-90"
            style={{
              background: '#1F4D3A',
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              height: 50,
              padding: '0 24px',
              borderRadius: 100,
              fontSize: 15,
            }}
          >
            Back to home <ArrowRight size={17} strokeWidth={2} />
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 font-semibold transition hover:border-[#1F4D3A]"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E5E0D4',
              color: '#1F4D3A',
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              height: 50,
              padding: '0 24px',
              borderRadius: 100,
              fontSize: 15,
            }}
          >
            Discover events
          </Link>
        </div>

        {/* Helpful links */}
        <div
          style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid #E5E0D4' }}
        >
          <div
            style={{
              fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#65736B',
              marginBottom: 14,
            }}
          >
            Or head somewhere useful
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {HELPFUL.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 transition hover:bg-[#E8EFEB]"
                style={{
                  fontFamily: 'var(--theme-font-body, "Inter"), sans-serif',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#0F1F18',
                  background: '#FAF6EE',
                  border: '1px solid #E5E0D4',
                  borderRadius: 100,
                  padding: '8px 14px',
                }}
              >
                <Icon size={15} strokeWidth={1.9} style={{ color: '#1F4D3A' }} aria-hidden />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
