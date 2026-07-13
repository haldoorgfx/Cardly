'use client';
import { PoweredByInline } from '@/components/white-label/attendee-brand';

/**
 * PreviewDownloadScreen — E2 / W09
 * Card reveal after generation. Matches w09-card-reveal.html exactly:
 * gold-atmosphere stage, breathe animation, gold glow, guilloche overlay, confetti on mount.
 */

import { useEffect, useRef } from 'react';
import { Download, ArrowLeft } from 'lucide-react';

interface Props {
  eventName: string;
  backgroundWidth: number;
  backgroundHeight: number;
  resultUrl: string;
  cardId?: string | null;
  qrToken?: string | null;
  attendeeName?: string | null;
  onDownload: () => void;
  onEdit: () => void;
}

/* ── Share icons ─────────────────────────────────────────────────────────── */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.8-2.8-.2-.3A8 8 0 1112 20zm4.5-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3A3 3 0 006 9.6c0 1.8 1.3 3.5 1.5 3.7s2.5 3.9 6.1 5.3c2.1.8 2.6.6 3.1.6s1.6-.6 1.8-1.3.3-1.2.2-1.3z"/>
    </svg>
  );
}

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="none" stroke="#C13584" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="#C13584" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#C13584"/>
    </svg>
  );
}

function XIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--ink,#0F1F18)">
      <path d="M17.5 3h3l-7 8 8.2 10h-6.4l-5-6.2L7 21H4l7.5-8.6L3.6 3H10l4.5 5.7L17.5 3zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19z"/>
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/>
    </svg>
  );
}

function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3v10zM6.5 7.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3a3 3 0 012.7-1.5c2 0 3.2 1.3 3.2 4V19z"/>
    </svg>
  );
}

/* ── Platform button ─────────────────────────────────────────────────────── */
function PlatformBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        background: '#FFFFFF',
        border: '1px solid #E5E0D4',
        boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'border-color .15s, transform .12s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8C57E';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E0D4';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      }}
    >
      {icon}
    </button>
  );
}

/* ── Confetti burst (28 pieces, gold + forest) ───────────────────────────── */
function useConfetti(stageRef: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const colors = ['#E8C57E', '#C9A45E', '#1F4D3A', '#2D7A4F', '#F5E9CC'];
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position:absolute; width:8px; height:8px;
        top:-20px; opacity:0; z-index:0; pointer-events:none;
        left:${15 + Math.random() * 70}%;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '1px'};
      `;
      const dur = 2600 + Math.random() * 1800;
      const delay = Math.random() * 600;
      const x = (Math.random() * 2 - 1) * 120;
      const h = stage.offsetHeight * 0.7;
      c.animate(
        [
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: `translate(${x}px,${h}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
      );
      stage.appendChild(c);
      pieces.push(c);
    }
    return () => { pieces.forEach(p => p.remove()); };
  }, [stageRef]);
}

/* ── THE SCREEN ──────────────────────────────────────────────────────────── */
export default function PreviewDownloadScreen({
  eventName, backgroundWidth, backgroundHeight, resultUrl, cardId, qrToken, attendeeName, onDownload, onEdit,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  useConfetti(stageRef);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const permanentUrl = cardId && typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}/card/${cardId}`
    : null;

  const aspect = backgroundWidth && backgroundHeight ? backgroundWidth / backgroundHeight : 5 / 7;

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
      const response = await fetch(resultUrl);
      const blob     = await response.blob();
      const file     = new File([blob], `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`, { type: 'image/png' });
      const shareData = { files: [file], text: `I'm attending ${eventName}!` };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.share) {
        await navigator.share({ text: `I'm attending ${eventName}! ${pageUrl}` });
      }
    } catch { /* user cancelled or not supported */ }
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(permanentUrl ?? pageUrl); } catch { /* ignore */ }
  };

  const shareRow = (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
      <PlatformBtn icon={<WhatsAppIcon/>}   label="Share on WhatsApp" onClick={() => handleShare('whatsapp')}/>
      <PlatformBtn icon={<InstagramIcon/>}  label="Open Instagram"    onClick={() => handleShare('instagram')}/>
      <PlatformBtn icon={<XIcon/>}          label="Post on X"         onClick={() => handleShare('x')}/>
      <PlatformBtn icon={<FacebookIcon/>}   label="Share on Facebook" onClick={() => handleShare('facebook')}/>
      <PlatformBtn icon={<LinkedInIcon/>}   label="Share on LinkedIn" onClick={() => handleShare('linkedin')}/>
    </div>
  );

  /* ── Styles inlined so keyframes work without a global CSS file ──── */
  const keyframes = `
    @keyframes breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
    @keyframes cardIn   { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 3px rgba(232,197,126,0.25)} 50%{box-shadow:0 0 0 6px rgba(232,197,126,0.15)} }
  `;

  const cardGlow = {
    boxShadow: '0 18px 50px rgba(13,31,23,0.35)',
  } as const;

  /* ── STAGE: centered column, both mobile and desktop ─────────────── */
  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '56px 24px',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#0F1F18',
        background: '#FAF6EE',
      }}
    >
      <style>{keyframes}</style>

      {/* Gold-atmosphere stage gradient (matches w09 ::before) */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 45% at 50% 42%, rgba(232,197,126,0.30) 0%, transparent 60%),
          radial-gradient(ellipse 70% 60% at 50% 60%, rgba(31,77,58,0.16) 0%, transparent 65%)
        `,
      }}/>

      {/* All content sits above the atmosphere */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Kicker badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#C9A45E', marginBottom: 28,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#E8C57E',
            boxShadow: '0 0 0 4px rgba(232,197,126,0.25)',
            animation: 'dotPulse 2s ease-in-out infinite',
            display: 'inline-block',
          }}/>
          Your card · Ready
        </div>

        {/* Card shell — breathe animation */}
        <div style={{ animation: 'breathe 3.4s ease-in-out infinite', animationDelay: '0.4s' }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', animation: 'cardIn 500ms ease-out both' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Your personalized Eventera card"
              style={{
                display: 'block',
                width: 300,
                aspectRatio: `${aspect}`,
                objectFit: 'cover',
                borderRadius: 14,
                ...cardGlow,
              }}
            />
            {/* Guilloche texture overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)',
              opacity: 0.5,
            }}/>
          </div>
        </div>

        {/* Actions */}
        <div style={{ width: '100%', marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={onDownload}
            style={{
              width: '100%', height: 52,
              background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
              transition: 'background .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#163828'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1F4D3A'; }}
          >
            <Download size={18} strokeWidth={2.2}/> Download card
          </button>

          {/* Platform share row */}
          <div style={{ paddingTop: 4 }}>
            {shareRow}
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                color: '#6B7A72', padding: '4px 0',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Share to apps…
            </button>
          )}

          {/* Edit / Copy link */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <button
              onClick={onEdit}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                color: '#C9A45E', padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'color .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#E8C57E'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#C9A45E'; }}
            >
              <ArrowLeft size={14} strokeWidth={2}/> Edit my info
            </button>

            {(permanentUrl || pageUrl) && (
              <button
                onClick={handleCopyLink}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72', padding: 0,
                  transition: 'color .15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3A4A42'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B7A72'; }}
              >
                Copy link
              </button>
            )}
          </div>

          {/* Ticket QR for door check-in */}
          {qrToken && (
            <div style={{
              marginTop: 8, padding: '16px', borderRadius: 14, textAlign: 'center',
              background: 'rgba(255,255,255,0.6)', border: '1px solid #E5E0D4',
            }}>
              <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7A72', marginBottom: 10 }}>
                Show at door
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr/${qrToken}`}
                alt="Check-in QR code"
                style={{ width: 120, height: 120, borderRadius: 8, background: 'white', padding: 6, display: 'block', margin: '0 auto 8px' }}
              />
              {attendeeName && (
                <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: '#3A4A42', fontWeight: 500 }}>{attendeeName}</p>
              )}
            </div>
          )}

          {/* "Powered by" */}
          <div style={{
            textAlign: 'center', marginTop: 16,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em',
          }}>
            <PoweredByInline />
          </div>
        </div>
      </div>
    </div>
  );
}
