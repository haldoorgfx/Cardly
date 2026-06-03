'use client';

/**
 * PreviewDownloadScreen — E2  (w09 design: centered stage, atmospheric gradient, breathing card)
 * All download/share logic preserved. Layout redesigned to match the Karta card-reveal moment.
 */

import { ArrowLeft, Link } from 'lucide-react';

interface Props {
  eventName: string;
  backgroundWidth: number;
  backgroundHeight: number;
  resultUrl: string;
  cardId?: string | null;
  onDownload: () => void;
  onEdit: () => void;
}

/* ── Social icons ─────────────────────────────────────────────────────────── */
function WhatsAppIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zM12 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.23c0-5.46 4.45-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="igPrev" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="30%" stopColor="#fa7e1e"/>
          <stop offset="60%" stopColor="#d62976"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igPrev)"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8zm-.9 13.5h1.4L7.7 6.9H6.2l10.2 12.1z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#1877F2"/>
      <path fill="#fff" d="M14.5 12.5h2.3l.4-3h-2.7V7.7c0-.87.27-1.46 1.52-1.46H17V3.65A21.4 21.4 0 0 0 14.83 3.5c-2.15 0-3.62 1.31-3.62 3.72v2.28h-2.4v3h2.4V21h2.99v-8.5z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#0A66C2"/>
      <path fill="#fff" d="M8.3 9.5v9H5.3v-9h3zm-1.5-4.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm4 4.4h2.85v1.27h.04c.4-.74 1.37-1.52 2.82-1.52 3.02 0 3.58 1.96 3.58 4.5v4.75h-3v-4.21c0-1 0-2.3-1.42-2.3-1.42 0-1.64 1.1-1.64 2.23v4.28h-2.99v-9h-.24z"/>
    </svg>
  );
}

/* ── Platform circle ──────────────────────────────────────────────────────── */
function PlatformCircle({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'white',
        border: '1px solid #E5E0D4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'border-color .15s, transform .12s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E8C57E';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#E5E0D4';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      {icon}
    </button>
  );
}

/* ── THE SCREEN ───────────────────────────────────────────────────────────── */
export default function PreviewDownloadScreen({
  eventName, backgroundWidth, backgroundHeight, resultUrl, cardId, onDownload, onEdit,
}: Props) {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const permanentUrl = cardId && typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}/card/${cardId}`
    : null;

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(`I'm attending ${eventName}! Get your personalized card:`);
    const url  = encodeURIComponent(pageUrl);
    const targets: Record<string, string> = {
      whatsapp:  `https://wa.me/?text=${text}%20${url}`,
      x:         `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      instagram: 'https://www.instagram.com/',
    };
    if (targets[platform]) window.open(targets[platform], '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    try {
      const response  = await fetch(resultUrl);
      const blob      = await response.blob();
      const file      = new File([blob], `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`, { type: 'image/png' });
      const shareData = { files: [file], text: `I'm attending ${eventName}!` };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        await navigator.share({ text: `I'm attending ${eventName}! ${pageUrl}` });
      }
    } catch { /* user cancelled or unsupported */ }
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(permanentUrl ?? pageUrl); } catch { /* ignore */ }
  };

  const aspect = backgroundWidth && backgroundHeight ? backgroundWidth / backgroundHeight : 4 / 5;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '56px 24px',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
        background: '#FAF6EE',
      }}
    >
      {/* ── Atmospheric background — forest+gold radial gradients ── */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 55% 45% at 50% 42%, rgba(232,197,126,0.30) 0%, transparent 60%)',
            'radial-gradient(ellipse 70% 60% at 50% 60%, rgba(31,77,58,0.16) 0%, transparent 65%)',
          ].join(', '),
        }}
      />

      {/* All content stacks above background */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* ── Kicker ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#C9A45E', marginBottom: 28,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#E8C57E',
            boxShadow: '0 0 0 4px rgba(232,197,126,0.25)',
            flexShrink: 0,
          }}/>
          Your card · Ready
        </div>

        {/* ── Card with breathing animation ── */}
        <div style={{ animation: 'breathe 3.4s ease-in-out infinite', marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt={`Your personalized ${eventName} card`}
            style={{
              display: 'block',
              width: 300, height: `${300 / aspect}px`,
              maxWidth: '100%',
              borderRadius: 14,
              boxShadow: [
                '0 0 40px rgba(232,197,126,0.30)',
                '0 0 90px rgba(232,197,126,0.12)',
                '0 18px 50px rgba(13,31,23,0.35)',
              ].join(', '),
            }}
          />
        </div>

        {/* ── Download button ── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
          <button
            onClick={onDownload}
            style={{
              width: '100%', height: 52,
              background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 10,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
              transition: 'background .15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = '#163828')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = '#1F4D3A')}
          >
            ↓ Download card
          </button>
        </div>

        {/* ── Platform share circles ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 18 }}>
          <PlatformCircle icon={<WhatsAppIcon/>} label="Share on WhatsApp" onClick={() => handleShare('whatsapp')}/>
          <PlatformCircle icon={<InstagramIcon/>} label="Share on Instagram" onClick={() => handleShare('instagram')}/>
          <PlatformCircle icon={<XIcon/>} label="Post on X" onClick={() => handleShare('x')}/>
          <PlatformCircle icon={<FacebookIcon/>} label="Share on Facebook" onClick={() => handleShare('facebook')}/>
          <PlatformCircle icon={<LinkedInIcon/>} label="Share on LinkedIn" onClick={() => handleShare('linkedin')}/>
        </div>

        {/* ── Copy link ── */}
        {(permanentUrl || pageUrl) && (
          <button
            onClick={handleCopyLink}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 14,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
            }}
          >
            <Link size={13} strokeWidth={2}/> Copy link
          </button>
        )}

        {/* ── Native share (mobile) ── */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginTop: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
            }}
          >
            ↑ Share image
          </button>
        )}

        {/* ── Edit link ── */}
        <button
          onClick={onEdit}
          style={{
            display: 'block', textAlign: 'center', marginTop: 22,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'Inter, sans-serif', fontSize: 14,
            color: '#C9A45E', textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 5,
          } as React.CSSProperties}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#E8C57E')}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#C9A45E')}
        >
          <ArrowLeft size={14} strokeWidth={2}/> Edit my info
        </button>

      </div>

      <style>{`
        @keyframes breathe {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
