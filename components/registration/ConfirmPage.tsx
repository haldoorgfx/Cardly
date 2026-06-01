'use client';

import { useEffect, useState } from 'react';
import { Download, Share2, Check } from 'lucide-react';
import type { Database } from '@/types/database';

type RegRow = Database['public']['Tables']['registrations']['Row'];

interface Props {
  registration: RegRow;
  eventTitle: string;
  eventSlug: string;
  ticketName: string | null;
}

// Karta card confetti
function useConfetti() {
  useEffect(() => {
    const colors = ['#E8C57E', '#C9A45E', '#1F4D3A', '#2D7A4F', '#F5E9CC'];
    const container = document.getElementById('confetti-stage');
    if (!container) return;

    const particles = Array.from({ length: 28 }, () => {
      const el = document.createElement('div');
      const isCircle = Math.random() > 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = isCircle ? 6 + Math.random() * 5 : 3 + Math.random() * 3;
      el.style.cssText = `
        position:absolute; pointer-events:none; z-index:10;
        left:${15 + Math.random() * 70}%;
        top:-20px;
        width:${size}px; height:${size}px;
        background:${color};
        border-radius:${isCircle ? '50%' : '2px'};
        animation: confetti-fall ${2.6 + Math.random() * 1.8}s cubic-bezier(.2,.6,.4,1) ${Math.random() * 0.6}s forwards;
        --tx: ${-120 + Math.random() * 240}px;
      `;
      return el;
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        to { transform: translateX(var(--tx)) translateY(70vh) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    particles.forEach(p => container.appendChild(p));
    return () => { particles.forEach(p => p.remove()); style.remove(); };
  }, []);
}

export function ConfirmPage({ registration, eventTitle, eventSlug, ticketName }: Props) {
  useConfetti();
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    // Retrieve card from sessionStorage
    try {
      const stored = sessionStorage.getItem(`card_${registration.qr_code_token}`);
      if (stored) setCardDataUrl(stored);
    } catch { /* ignore */ }
  }, [registration.qr_code_token]);

  function handleDownload() {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `karta-card-${registration.attendee_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  }

  async function handleShare() {
    const url = `${window.location.origin}/e/${eventSlug}`;
    if (navigator.share) {
      await navigator.share({
        title: `I'm attending ${eventTitle}!`,
        text: `Just registered for ${eventTitle}. Get your Karta Card too!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  const shareLinks = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`I'm attending ${eventTitle}! 🎟️`)}`,
      color: '#25D366',
      icon: (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm attending ${eventTitle}! 🎟️`)}&url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventSlug}`)}`,
      color: '#000000',
      icon: (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventSlug}`)}`,
      color: '#0A66C2',
      icon: (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16 relative overflow-hidden"
      style={{ background: '#0A0F0C' }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(31,77,58,0.25) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(232,197,126,0.08) 0%, transparent 60%)',
        }}
      />

      {/* Confetti stage */}
      <div id="confetti-stage" className="fixed inset-0 pointer-events-none overflow-hidden" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-[360px] w-full">

        {/* Kicker */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8C57E', boxShadow: '0 0 8px rgba(232,197,126,0.6)' }} />
          <span className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: '#E8C57E' }}>
            You&apos;re registered!
          </span>
        </div>

        {/* Karta Card display */}
        {cardDataUrl ? (
          <div
            className="w-full max-w-[280px] rounded-2xl overflow-hidden mb-8"
            style={{
              boxShadow: '0 0 0 1px rgba(232,197,126,0.2), 0 8px 40px rgba(232,197,126,0.15), 0 30px 80px rgba(10,15,12,0.8)',
              animation: 'breathe 3.4s ease-in-out infinite',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cardDataUrl} alt="Your Karta Card" className="w-full h-auto block" />
          </div>
        ) : (
          /* QR Code fallback when card is not available */
          <div className="mb-8 flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${registration.qr_code_token}`}
              alt="Check-in QR code"
              className="rounded-xl"
              style={{ width: 200, height: 200, background: 'white', padding: 12 }}
            />
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Show this QR at the door
            </p>
          </div>
        )}

        {/* Attendee name */}
        <h1 className="font-display font-semibold text-[26px] mb-1 text-white" style={{ letterSpacing: '-0.015em' }}>
          {registration.attendee_name}
        </h1>
        <p className="text-[14px] mb-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {ticketName ?? 'Registered'} · {eventTitle}
        </p>

        {/* QR code (always shown when card is visible too) */}
        {cardDataUrl && (
          <div className="flex items-center gap-2 mb-6 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${registration.qr_code_token}`}
              alt="QR"
              className="rounded"
              style={{ width: 36, height: 36, background: 'white', padding: 3 }}
            />
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
              Show at door for check-in
            </span>
          </div>
        )}

        {/* Download button */}
        {cardDataUrl && (
          <button
            onClick={handleDownload}
            className="w-full h-12 rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 transition mb-4"
            style={{
              background: downloaded ? '#2D7A4F' : '#1F4D3A',
              color: 'white',
            }}
          >
            {downloaded ? (
              <><Check size={16} strokeWidth={2.5} /> Saved to your device</>
            ) : (
              <><Download size={16} strokeWidth={2} /> Download your Karta Card</>
            )}
          </button>
        )}

        {/* Share platforms */}
        <div className="flex gap-3 justify-center">
          {shareLinks.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 w-11 rounded-full flex items-center justify-center transition"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: s.color,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#E8C57E')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
              title={`Share on ${s.label}`}
            >
              {s.icon}
            </a>
          ))}
          <button
            onClick={handleShare}
            className="h-11 w-11 rounded-full flex items-center justify-center transition"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#E8C57E')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            title="Share"
          >
            <Share2 size={17} strokeWidth={2} />
          </button>
        </div>

        {/* Back to event */}
        <a
          href={`/e/${eventSlug}`}
          className="mt-8 text-[13px] transition"
          style={{ color: 'rgba(232,197,126,0.6)' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#E8C57E')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(232,197,126,0.6)')}
        >
          Back to event →
        </a>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
