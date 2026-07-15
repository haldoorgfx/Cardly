'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';

/* Persistent conversion CTA for the landing page. Slides up once the visitor
   scrolls past the hero and hides again near the footer so it never competes
   with the final CTA. Dismissible for the session. Reduced-motion safe (the
   global baseline neutralises the transition, so it simply appears/hides). */
export default function StickyCTA() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      const y = window.scrollY;
      const past = y > window.innerHeight * 0.75;
      const nearBottom = y + window.innerHeight > document.documentElement.scrollHeight - 760;
      setShow(past && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center gap-3 sm:gap-5 rounded-full"
        aria-hidden={!show}
        style={{
          background: '#1F4D3A',
          border: '1px solid #163828',
          boxShadow: '0 16px 40px -12px rgba(15,31,24,0.45)',
          padding: '9px 9px 9px 20px',
          maxWidth: 'calc(100vw - 32px)',
          transform: show ? 'translateY(0)' : 'translateY(160%)',
          opacity: show ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
        }}
      >
        <span
          className="hidden sm:inline"
          style={{ fontFamily: 'var(--theme-font-body, "Inter"), sans-serif', fontSize: 14.5, color: '#FAF6EE', fontWeight: 500, whiteSpace: 'nowrap' }}
        >
          Set up your first event in 10 minutes.
        </span>
        <Link
          href="/signup"
          tabIndex={show ? undefined : -1}
          className="inline-flex items-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{
            background: '#FAF6EE',
            color: '#1F4D3A',
            fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
            fontSize: 14.5,
            padding: '10px 18px',
            whiteSpace: 'nowrap',
          }}
        >
          Start free <ArrowRight size={15} strokeWidth={2.2} />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          tabIndex={show ? undefined : -1}
          className="grid place-items-center rounded-full transition-colors hover:bg-white/10"
          style={{ width: 30, height: 30, color: 'rgba(250,246,238,0.6)', flexShrink: 0 }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
