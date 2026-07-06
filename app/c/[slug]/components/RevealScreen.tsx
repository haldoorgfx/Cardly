'use client';

/**
 * RevealScreen — the "Card reveal moment".
 *
 * The emotional centerpiece of the attendee flow. After the card PNG is
 * generated server-side (/api/render, sharp), this screen presents that REAL
 * rendered image large on a gold-glow stage with a confetti burst, a slow
 * "breathing" scale, a soft gold glow, and a mono "YOUR CARD · READY" label.
 *
 * It does NOT render a mock card — `resultUrl` is the object URL of the actual
 * sharp-rendered PNG produced by the flow.
 *
 * Actions:
 *   • Download card       → reuses AttendeeFlow's handleDownload (real PNG)
 *   • Social share circles → open native share targets (same handlers pattern
 *                            as PreviewDownloadScreen / SuccessShareScreen)
 *   • Enter the event →   → advances into the existing SuccessShareScreen,
 *                            which owns all caption/viral-share logic
 *
 * Respects prefers-reduced-motion: confetti is skipped and the breathing /
 * intro animations collapse to a static presentation.
 */

import { useEffect, useRef, useState } from 'react';
import { Download, Check, ArrowRight } from 'lucide-react';

interface Props {
  eventName: string;
  backgroundWidth: number;
  backgroundHeight: number;
  resultUrl: string;
  /** Reuses AttendeeFlow.handleDownload — the real PNG download. */
  onDownload: () => void;
  /** Advances into the existing SuccessShareScreen (share/caption logic). */
  onEnter: () => void;
  /** Back to the form to edit info (regenerates idempotency key upstream). */
  onEdit: () => void;
}

/* ── Share icons (match PreviewDownloadScreen palette) ─────────────────────── */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2zm0 18a8 8 0 01-4.1-1.1l-.3-.2-2.8.7.8-2.8-.2-.3A8 8 0 1112 20zm4.5-6c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.5 6.5 0 01-3.2-2.8c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.5l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 00-.7.3A3 3 0 006 9.6c0 1.8 1.3 3.5 1.5 3.7s2.5 3.9 6.1 5.3c2.1.8 2.6.6 3.1.6s1.6-.6 1.8-1.3.3-1.2.2-1.3z"/>
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="none" stroke="#C13584" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" fill="none" stroke="#C13584" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#C13584"/>
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0F1F18">
      <path d="M17.5 3h3l-7 8 8.2 10h-6.4l-5-6.2L7 21H4l7.5-8.6L3.6 3H10l4.5 5.7L17.5 3zm-1.1 16h1.7L7.7 4.8H5.9L16.4 19z"/>
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3v10zM6.5 7.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2-.1.2-.1.5-.1.8V19h-3V9h3v1.3a3 3 0 012.7-1.5c2 0 3.2 1.3 3.2 4V19z"/>
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z"/>
    </svg>
  );
}

/* ── Social share circle ───────────────────────────────────────────────────── */
function ShareCircle({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: '50%',
        background: '#FFFFFF', border: '1px solid #E5E0D4',
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

/* ── Confetti burst (30 pieces) — reduced-motion aware ─────────────────────── */
function useConfetti(stageRef: React.RefObject<HTMLDivElement>, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const stage = stageRef.current;
    if (!stage) return;
    const colors = ['#E8C57E', '#C9A45E', '#1F4D3A', '#2D7A4F', '#F5E9CC'];
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 30; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position:absolute; width:8px; height:8px;
        top:-16px; opacity:0; z-index:0; pointer-events:none;
        left:${12 + Math.random() * 76}%;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '1px'};
      `;
      const dur = 2600 + Math.random() * 1800;
      const delay = Math.random() * 500;
      const x = (Math.random() * 2 - 1) * 120;
      const h = stage.offsetHeight * 0.78;
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
  }, [stageRef, enabled]);
}

/* ── THE SCREEN ────────────────────────────────────────────────────────────── */
export default function RevealScreen({
  eventName, backgroundWidth, backgroundHeight, resultUrl, onDownload, onEnter, onEdit,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);

  // Resolve prefers-reduced-motion on mount (client-only).
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useConfetti(stageRef, !reduceMotion);

  const [saved, setSaved] = useState(false);
  const handleDownload = () => {
    onDownload();
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const aspect = backgroundWidth && backgroundHeight ? backgroundWidth / backgroundHeight : 5 / 7;

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(`I'm attending ${eventName}! Get your personalized card:`);
    const url  = encodeURIComponent(pageUrl);
    const targets: Record<string, string> = {
      whatsapp:  `https://wa.me/?text=${text}%20${url}`,
      instagram: 'https://www.instagram.com/',
      x:         `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    };
    if (targets[platform]) window.open(targets[platform], '_blank', 'noopener,noreferrer');
  };

  /* Self-contained keyframes so animation works without touching global CSS.
     Under reduced motion these classes are simply not applied. */
  const keyframes = `
    @keyframes revealBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
    @keyframes revealCardIn  { from{opacity:0;transform:translateY(16px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes revealDot     { 0%,100%{box-shadow:0 0 0 4px rgba(232,197,126,0.25)} 50%{box-shadow:0 0 0 7px rgba(232,197,126,0.14)} }
  `;

  const cardGlow = {
    boxShadow: '0 0 40px rgba(232,197,126,0.32), 0 0 90px rgba(232,197,126,0.12), 0 18px 50px rgba(13,31,23,0.40)',
  } as const;

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
        // Gold-glow stage on a cream base (no black background) — matches prototype.
        background: `
          radial-gradient(ellipse 60% 42% at 50% 40%, rgba(232,197,126,0.28) 0%, transparent 62%),
          radial-gradient(ellipse 75% 55% at 50% 60%, rgba(31,77,58,0.12) 0%, transparent 66%),
          #FAF6EE
        `,
      }}
    >
      <style>{keyframes}</style>

      {/* Content sits above the confetti layer */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Mono "YOUR CARD · READY" status label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          fontWeight: 500, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: '#C9A45E', marginBottom: 26,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#E8C57E',
            boxShadow: '0 0 0 4px rgba(232,197,126,0.25)',
            animation: reduceMotion ? 'none' : 'revealDot 2s ease-in-out infinite',
            display: 'inline-block',
          }}/>
          Your card · Ready
        </div>

        {/* Card — the REAL rendered PNG, breathing + gold glow */}
        <div style={{ animation: reduceMotion ? 'none' : 'revealBreathe 3.4s ease-in-out infinite', animationDelay: reduceMotion ? undefined : '0.4s' }}>
          <div style={{
            position: 'relative', borderRadius: 14, overflow: 'hidden',
            animation: reduceMotion ? 'none' : 'revealCardIn 520ms ease-out both',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Your personalized Eventera card"
              style={{
                display: 'block',
                width: 272,
                aspectRatio: `${aspect}`,
                objectFit: 'cover',
                borderRadius: 14,
                ...cardGlow,
              }}
            />
            {/* Guilloche texture overlay (matches KartaCard) */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)',
              opacity: 0.5,
            }}/>
          </div>
        </div>

        {/* Actions */}
        <div style={{ width: '100%', marginTop: 34, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <button
            onClick={handleDownload}
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
            {saved ? <Check size={18} strokeWidth={2.4}/> : <Download size={18} strokeWidth={2.2}/>}
            {saved ? 'Saved to your device' : 'Download card'}
          </button>

          {/* Social share circles */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <ShareCircle icon={<WhatsAppIcon/>}  label="Share on WhatsApp" onClick={() => handleShare('whatsapp')}/>
            <ShareCircle icon={<InstagramIcon/>} label="Open Instagram"    onClick={() => handleShare('instagram')}/>
            <ShareCircle icon={<XIcon/>}         label="Post on X"         onClick={() => handleShare('x')}/>
            <ShareCircle icon={<LinkedInIcon/>}  label="Share on LinkedIn" onClick={() => handleShare('linkedin')}/>
            <ShareCircle icon={<FacebookIcon/>}  label="Share on Facebook" onClick={() => handleShare('facebook')}/>
          </div>

          {/* Enter the event → (into the existing share screen) */}
          <button
            onClick={onEnter}
            style={{
              width: '100%',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
              color: '#1F4D3A', padding: '6px 0', marginTop: 2,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#163828'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#1F4D3A'; }}
          >
            Enter the event <ArrowRight size={16} strokeWidth={2.2}/>
          </button>

          {/* Edit my info */}
          <button
            onClick={onEdit}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
              color: '#6B7A72', padding: 0, alignSelf: 'center',
              transition: 'color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#3A4A42'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6B7A72'; }}
          >
            Edit my info
          </button>

          {/* Powered by */}
          <div style={{
            textAlign: 'center', marginTop: 8,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em',
          }}>
            powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>eventera</span>
          </div>
        </div>
      </div>
    </div>
  );
}
