'use client';
import { PoweredByInline } from '@/components/white-label/attendee-brand';

/**
 * SuccessShareScreen — E3
 * Post-download success screen. Pushes the viral share.
 * Mobile: single column. Desktop: two-column.
 */

import { useState } from 'react';
import { Check, Copy, ChevronRight, Link, Forward, ArrowLeft } from 'lucide-react';

interface Props {
  eventName: string;
  backgroundWidth: number;
  backgroundHeight: number;
  resultUrl: string | null;
  onBack: () => void;
}

/* ── Brand icons ─────────────────────────────────────────────────────────── */
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zM12 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.23c0-5.46 4.45-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  );
}

function InstagramIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="igSucc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="30%" stopColor="#fa7e1e"/>
          <stop offset="60%" stopColor="#d62976"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igSucc)"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff"/>
    </svg>
  );
}

function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8z"/>
    </svg>
  );
}

function FacebookIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#1877F2"/>
      <path fill="#fff" d="M14.5 12.5h2.3l.4-3h-2.7V7.7c0-.87.27-1.46 1.52-1.46H17V3.65A21.4 21.4 0 0 0 14.83 3.5c-2.15 0-3.62 1.31-3.62 3.72v2.28h-2.4v3h2.4V21h2.99v-8.5z"/>
    </svg>
  );
}

function LinkedInIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#0A66C2"/>
      <path fill="#fff" d="M8.3 9.5v9H5.3v-9h3zm-1.5-4.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm4 4.4h2.85v1.27h.04c.4-.74 1.37-1.52 2.82-1.52 3.02 0 3.58 1.96 3.58 4.5v4.75h-3v-4.21c0-1 0-2.3-1.42-2.3-1.42 0-1.64 1.1-1.64 2.23v4.28h-2.99v-9h-.24z"/>
    </svg>
  );
}

function TikTokIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M16.3 8.5c-1.07-.7-1.74-1.84-1.95-3.1h-2.6v10.4c0 1.46-1.18 2.64-2.64 2.64A2.64 2.64 0 1 1 11.1 14V11.3a5.34 5.34 0 1 0 5.95 5.3V11.5a6.06 6.06 0 0 0 3.55 1.14V10.04c-1.51 0-2.96-.51-4.3-1.54z"/>
    </svg>
  );
}

/* ── Success badge ───────────────────────────────────────────────────────── */
function SuccessBadge({ size = 64 }: { size?: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: '2px solid #E8C57E', opacity: 0.55 }}/>
      <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: '1px solid #E8C57E', opacity: 0.25 }}/>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: '#1F4D3A', color: '#E8C57E',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(31,77,58,0.35)',
      }}>
        <Check size={size * 0.45} strokeWidth={2.6} color="#E8C57E"/>
      </div>
    </div>
  );
}

/* ── Caption card ────────────────────────────────────────────────────────── */
function CaptionCard({ eventName }: { eventName: string }) {
  const [copied, setCopied] = useState(false);
  const caption = `Excited to be at ${eventName}! Click the link below to get your own personalized card. 🌱`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 18, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: '#6B7A72', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Suggested caption
        </div>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5, color: '#0F1F18', fontWeight: 500 }}>
        {caption}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
        <button
          onClick={handleCopy}
          style={{
            height: 36, padding: '0 14px',
            background: copied ? '#2D7A4F' : '#E8EFEB',
            color: copied ? '#FAF6EE' : '#1F4D3A',
            border: 'none', borderRadius: 10,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            transition: 'background .2s, color .2s',
          }}
        >
          {copied ? <Check size={14} strokeWidth={2.4}/> : <Copy size={14} strokeWidth={2}/>}
          <span>{copied ? 'Copied' : 'Copy caption'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Big share button ────────────────────────────────────────────────────── */
function BigShareButton({
  brandIcon, brandColor, label, sub, onClick,
}: { brandIcon: React.ReactNode; brandColor: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 68,
        background: '#FFFFFF', border: '1.5px solid #E5E0D4', borderRadius: 16,
        padding: '0 14px 0 0',
        display: 'flex', alignItems: 'stretch',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(15,31,24,0.03), 0 4px 12px rgba(15,31,24,0.04)',
        overflow: 'hidden', textAlign: 'left',
        transition: 'transform .15s ease-out',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{
        width: 64, flexShrink: 0,
        background: '#FFFFFF', borderRight: '1px solid #E5E0D4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 12, bottom: 12, width: 4, borderRadius: 2, background: brandColor }}/>
        {brandIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0, padding: '0 4px 0 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 16, color: '#0F1F18', letterSpacing: '-0.01em' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72', marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', color: '#6B7A72' }}>
        <ChevronRight size={18} strokeWidth={2}/>
      </div>
    </button>
  );
}

/* ── Small share circle ──────────────────────────────────────────────────── */
function SmallShare({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button title={label} aria-label={label} onClick={onClick} style={{
      width: 40, height: 40, borderRadius: '50%',
      background: '#FFFFFF', border: '1px solid #E5E0D4',
      boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, color: '#0F1F18',
    }}>{icon}</button>
  );
}

/* ── Forward prompt ──────────────────────────────────────────────────────── */
function ForwardPrompt({ pageUrl }: { pageUrl: string }) {
  const handleForward = () => {
    const text = encodeURIComponent(`Get your personalized event card: ${pageUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 16, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: '#E8EFEB', opacity: 0.45, pointerEvents: 'none' }}/>
      <div style={{
        position: 'relative',
        width: 40, height: 40, borderRadius: 12,
        background: '#1F4D3A', color: '#FAF6EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Forward size={18} strokeWidth={2}/>
      </div>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#0F1F18' }}>
          Know someone else attending?
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#3A4A42', marginTop: 2 }}>
          Forward this link so they can make a card too.
        </div>
      </div>
      <button
        onClick={handleForward}
        style={{
          position: 'relative',
          height: 36, padding: '0 12px',
          background: '#1F4D3A', color: '#FAF6EE',
          border: 'none', borderRadius: 10,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          cursor: 'pointer', flexShrink: 0,
        }}
      >Forward</button>
    </div>
  );
}

/* ── THE SCREEN ──────────────────────────────────────────────────────────── */
export default function SuccessShareScreen({
  eventName, backgroundWidth, backgroundHeight, resultUrl, onBack,
}: Props) {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const aspect  = backgroundWidth && backgroundHeight ? backgroundWidth / backgroundHeight : 4 / 5;
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const handleShare = (platform: string) => {
    const text = encodeURIComponent(`I'm attending ${eventName}! Get your personalized card:`);
    const url  = encodeURIComponent(pageUrl);
    const targets: Record<string, string> = {
      whatsapp:  `https://wa.me/?text=${text}%20${url}`,
      x:         `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (targets[platform]) window.open(targets[platform], '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(pageUrl); showToast('Link copied'); }
    catch { showToast('Could not copy link'); }
  };

  // Instagram & TikTok can't be posted to via a URL from the web. Use the native
  // Web Share sheet with the card image when the browser supports it (mobile),
  // and fall back to copying the link so the button is never a dead no-op.
  const handleNativeShare = async () => {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const shareText = `I'm attending ${eventName}! Get your personalized card:`;
    // Best path: share the actual card image via the OS share sheet.
    if (resultUrl && nav?.share) {
      try {
        const resp = await fetch(resultUrl);
        const blob = await resp.blob();
        const file = new File(
          [blob],
          `${eventName.toLowerCase().replace(/\s+/g, '-') || 'eventera'}-card.png`,
          { type: blob.type || 'image/png' },
        );
        const shareData: ShareData = { files: [file], title: eventName, text: shareText, url: pageUrl };
        if (!nav.canShare || nav.canShare(shareData)) {
          await nav.share(shareData);
          return;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return; // user dismissed
        // otherwise fall through to link-only share / copy
      }
    }
    // Next best: share just the link via the OS sheet.
    if (nav?.share) {
      try {
        await nav.share({ title: eventName, text: shareText, url: pageUrl });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    // Final fallback (desktop): copy the link.
    await handleCopyLink();
  };

  const topWash = (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 0, height: 280,
      background: 'linear-gradient(180deg, rgba(31,77,58,0.05) 0%, rgba(232,197,126,0.04) 40%, rgba(250,246,238,0) 100%)',
      pointerEvents: 'none',
    }}/>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EE', fontFamily: 'Inter, sans-serif', color: '#0F1F18' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)',
          zIndex: 60, whiteSpace: 'nowrap',
          padding: '10px 16px', borderRadius: 12,
          background: 'rgba(15,31,24,0.9)', color: '#FAF6EE',
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          boxShadow: '0 8px 28px rgba(15,31,24,0.28)', backdropFilter: 'blur(8px)',
        }}>
          {toast}
        </div>
      )}

      {/* ── Mobile / tablet ─────────────────────────────────────────────── */}
      <div className="relative lg:hidden">
        {topWash}
        <div style={{ position: 'relative', zIndex: 1, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Success header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
            <SuccessBadge size={60}/>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.025em', margin: 0, color: '#0F1F18' }}>
                Card saved
              </h1>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5, color: '#3A4A42', marginTop: 6, maxWidth: 280, margin: '6px auto 0' }}>
                Now share it where your audience hangs out.
              </div>
            </div>
            {/* Mini card */}
            {resultUrl && (
              <div style={{ marginTop: 4 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="Your card" style={{
                  width: 120, aspectRatio: `${aspect}`, objectFit: 'contain', borderRadius: 10,
                  boxShadow: '0 4px 12px rgba(15,31,24,0.10), 0 12px 32px rgba(31,77,58,0.12)',
                }}/>
              </div>
            )}
          </div>

          {/* Caption helper */}
          <CaptionCard eventName={eventName}/>

          {/* Big share buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#0F1F18' }}>
              Share where it matters
            </h2>
            <BigShareButton brandIcon={<InstagramIcon size={28}/>} brandColor="#d62976" label="Instagram" sub="Share card or copy link" onClick={handleNativeShare}/>
            <BigShareButton brandIcon={<WhatsAppIcon size={28}/>} brandColor="#25D366" label="WhatsApp Status" sub="Send on WhatsApp" onClick={() => handleShare('whatsapp')}/>
            <BigShareButton brandIcon={<XIcon size={28}/>} brandColor="#000" label="Post on X" sub="Compose a post" onClick={() => handleShare('x')}/>
          </div>

          {/* Secondary row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72' }}>More options</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmallShare icon={<FacebookIcon size={18}/>} label="Facebook" onClick={() => handleShare('facebook')}/>
              <SmallShare icon={<LinkedInIcon size={18}/>} label="LinkedIn" onClick={() => handleShare('linkedin')}/>
              <SmallShare icon={<TikTokIcon size={18}/>} label="TikTok" onClick={handleNativeShare}/>
              <SmallShare icon={<Link size={16} strokeWidth={1.8}/>} label="Copy link" onClick={handleCopyLink}/>
            </div>
          </div>

          {/* Forward */}
          <ForwardPrompt pageUrl={pageUrl}/>

          {/* Back link */}
          <button onClick={onBack} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72', padding: 0,
          }}>
            <ArrowLeft size={14} strokeWidth={2}/> Back to preview
          </button>

          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em', textAlign: 'center' }}>
            <PoweredByInline />
          </div>
        </div>
      </div>

      {/* ── Desktop: two-column ─────────────────────────────────────────── */}
      <div
        className="hidden lg:grid"
        style={{
          minHeight: '100vh', overflowY: 'auto',
          gridTemplateColumns: '46% 54%',
          maxWidth: 1200, margin: '0 auto',
          padding: '40px 56px',
          alignItems: 'center', gap: 56,
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 460 }}>
          <SuccessBadge size={72}/>
          <div>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.035em', margin: 0, color: '#0F1F18' }}>
              Card saved.
            </h1>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: 1.5, color: '#3A4A42', marginTop: 14, maxWidth: 380 }}>
              Now share it where your audience hangs out.
            </div>
          </div>

          {/* Mini card + file meta */}
          {resultUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 18,
              background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 18, padding: 16,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Your card" style={{
                width: 90, aspectRatio: `${aspect}`, objectFit: 'contain', borderRadius: 8,
                boxShadow: '0 2px 8px rgba(15,31,24,0.08)',
                flexShrink: 0,
              }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: '#6B7A72', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>Saved file</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 15, color: '#0F1F18', lineHeight: 1.2 }}>
                  {eventName.toLowerCase().replace(/\s+/g, '-')}-card.png
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginTop: 2 }}>
                  Your personalized card
                </div>
                <button onClick={handleCopyLink} style={{
                  marginTop: 10, background: 'transparent', border: 'none',
                  color: '#1F4D3A', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <Link size={13} strokeWidth={2}/> Copy share link
                </button>
              </div>
            </div>
          )}

          <ForwardPrompt pageUrl={pageUrl}/>

          <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em' }}>
            <PoweredByInline />
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 520 }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 28, letterSpacing: '-0.025em', margin: 0, color: '#0F1F18' }}>
            Share where it matters
          </h2>

          <CaptionCard eventName={eventName}/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <BigShareButton brandIcon={<InstagramIcon size={30}/>} brandColor="#d62976" label="Instagram" sub="Share card or copy link" onClick={handleNativeShare}/>
            <BigShareButton brandIcon={<WhatsAppIcon size={30}/>} brandColor="#25D366" label="WhatsApp Status" sub="Send on WhatsApp" onClick={() => handleShare('whatsapp')}/>
            <BigShareButton brandIcon={<XIcon size={30}/>} brandColor="#000" label="Post on X" sub="Compose a post" onClick={() => handleShare('x')}/>
          </div>

          <div style={{ paddingTop: 16, borderTop: '1px solid #E5E0D4', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>More options</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SmallShare icon={<FacebookIcon size={18}/>} label="Facebook" onClick={() => handleShare('facebook')}/>
              <SmallShare icon={<LinkedInIcon size={18}/>} label="LinkedIn" onClick={() => handleShare('linkedin')}/>
              <SmallShare icon={<TikTokIcon size={18}/>} label="TikTok" onClick={handleNativeShare}/>
              <SmallShare icon={<Link size={16} strokeWidth={1.8}/>} label="Copy link" onClick={handleCopyLink}/>
            </div>
          </div>

          <button onClick={onBack} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72', padding: 0,
          }}>
            <ArrowLeft size={14} strokeWidth={2}/> Back to preview
          </button>
        </div>
      </div>
    </div>
  );
}
