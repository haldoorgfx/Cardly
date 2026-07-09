'use client';

/**
 * PreviewDownloadScreen — E2
 * Shows the generated card image. Download CTA + share row.
 * Mobile: single column. Desktop: two-column.
 */

import { Download, ArrowLeft, Copy, Link, Share2 } from 'lucide-react';

interface Props {
  eventName: string;
  backgroundWidth: number;
  backgroundHeight: number;
  resultUrl: string;
  cardId?: string | null;
  onDownload: () => void;
  onEdit: () => void;
}

/* ── Share icons (inline SVG, no external dep) ───────────────────────────── */
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zM12 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.23c0-5.46 4.45-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  );
}


function XIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8zm-.9 13.5h1.4L7.7 6.9H6.2l10.2 12.1z"/>
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

/* ── Halo ───────────────────────────────────────────────────────────────── */
function CardHalo() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      width: 400, height: 500,
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
      opacity: 0.07,
      borderRadius: '50%',
      filter: 'blur(48px)',
      pointerEvents: 'none',
    }}/>
  );
}

/* ── Share circle button ─────────────────────────────────────────────────── */
function ShareCircle({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: '50%',
        background: '#FFFFFF',
        border: '1px solid #E5E0D4',
        boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 4px 12px rgba(15,31,24,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        color: '#0F1F18',
        transition: 'transform .15s ease-out',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {icon}
    </button>
  );
}

/* ── THE SCREEN ──────────────────────────────────────────────────────────── */
export default function PreviewDownloadScreen({
  eventName, backgroundWidth, backgroundHeight, resultUrl, cardId, onDownload, onEdit,
}: Props) {
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Permanent re-download link using the stored card ID
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

  // Native share with the actual PNG file attached — works on iOS/Android
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
    try { await navigator.clipboard.writeText(pageUrl); } catch { /* ignore */ }
  };

  const handleCopyPermanentLink = async () => {
    if (!permanentUrl) return;
    try { await navigator.clipboard.writeText(permanentUrl); } catch { /* ignore */ }
  };

  const shareRow = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Native share first — attaches the actual PNG on iOS/Android */}
      <ShareCircle icon={<Share2 size={20} strokeWidth={1.8}/>} label="Share image" onClick={handleNativeShare}/>
      <ShareCircle icon={<WhatsAppIcon/>} label="Share on WhatsApp" onClick={() => handleShare('whatsapp')}/>
      <ShareCircle icon={<XIcon/>} label="Post on X" onClick={() => handleShare('x')}/>
      <ShareCircle icon={<FacebookIcon/>} label="Share on Facebook" onClick={() => handleShare('facebook')}/>
      <ShareCircle icon={<LinkedInIcon/>} label="Share on LinkedIn" onClick={() => handleShare('linkedin')}/>
      <ShareCircle icon={<Copy size={20} strokeWidth={1.8}/>} label="Copy link" onClick={handleCopyLink}/>
    </div>
  );

  const permanentLinkRow = permanentUrl ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#F0F5F2', borderRadius: 10, padding: '10px 14px',
    }}>
      <Link size={14} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0 }}/>
      <span style={{ fontSize: 12, color: '#3A4A42', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Save this link to re-download your card anytime
      </span>
      <button
        onClick={handleCopyPermanentLink}
        style={{
          flexShrink: 0, background: '#1F4D3A', color: '#fff',
          border: 'none', borderRadius: 7, padding: '5px 12px',
          fontSize: 11, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Copy
      </button>
    </div>
  ) : null;

  // Determine aspect ratio for result display
  const aspect = backgroundWidth && backgroundHeight ? backgroundWidth / backgroundHeight : 4 / 5;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF6EE', fontFamily: 'Inter, sans-serif', color: '#0F1F18' }}>

      {/* ── Mobile / tablet ─────────────────────────────────────────────── */}
      <div className="relative lg:hidden">
        {/* Halo */}
        <div style={{ position: 'absolute', left: '50%', top: 260, transform: 'translateX(-50%)' }}>
          <CardHalo/>
        </div>

        <div style={{ position: 'relative', zIndex: 1, padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Heading */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.03em',
              margin: 0, color: '#0F1F18',
            }}>Looks great.</h1>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, lineHeight: 1.45, color: '#3A4A42', marginTop: 6 }}>
              Your card is ready.
            </div>
          </div>

          {/* Card */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Your personalized event card"
              style={{
                width: '100%', maxWidth: 320,
                aspectRatio: `${aspect}`,
                objectFit: 'contain',
                borderRadius: 16,
                boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.14)',
                animation: 'cardLoadIn 400ms ease-out both',
              }}
            />
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={onDownload}
              style={{
                width: '100%', height: 60, padding: '0 28px',
                background: '#1F4D3A', color: '#FAF6EE',
                border: 'none', borderRadius: 16,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 17,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
              }}
            >
              <Download size={20} strokeWidth={2.2}/> Download
            </button>
            <button
              onClick={onEdit}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                color: '#3A4A42', padding: 8,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <ArrowLeft size={14} strokeWidth={2}/> Edit my info
            </button>
          </div>

          {/* Share */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', letterSpacing: '0.02em', textAlign: 'center' }}>
              Or share directly
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {shareRow}
            </div>
          </div>

          {/* Permanent re-download link */}
          {permanentLinkRow}
        </div>
      </div>

      {/* ── Desktop: two-column ─────────────────────────────────────────── */}
      <div
        className="hidden lg:grid"
        style={{
          height: '100vh', overflow: 'hidden',
          gridTemplateColumns: '58% 42%',
          maxWidth: 1200, margin: '0 auto',
          padding: '0 56px',
          alignItems: 'center',
          gap: 56,
        }}
      >
        {/* Left: card */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 700 }}>
            <CardHalo/>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="Your personalized event card"
            style={{
              position: 'relative', zIndex: 1,
              width: '100%', maxWidth: 480,
              aspectRatio: `${aspect}`,
              objectFit: 'contain',
              borderRadius: 20,
              boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.14)',
              animation: 'cardLoadIn 400ms ease-out both',
            }}
          />
        </div>

        {/* Right: headline + CTAs + share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: '#E8EFEB', color: '#1F4D3A',
              borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F4D3A' }}/>
              Your card · ready
            </div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.035em',
              margin: 0, color: '#0F1F18',
            }}>Looks great.</h1>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 19, lineHeight: 1.5,
              color: '#3A4A42', marginTop: 12, maxWidth: 380,
            }}>
              Download the PNG, then share it where your audience hangs out.
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
            <button
              onClick={onDownload}
              style={{
                width: '100%', height: 60, padding: '0 28px',
                background: '#1F4D3A', color: '#FAF6EE',
                border: 'none', borderRadius: 16,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 17,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
              }}
            >
              <Download size={20} strokeWidth={2.2}/> Download
            </button>
            <button
              onClick={onEdit}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
                color: '#3A4A42', padding: 8,
                display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
              }}
            >
              <ArrowLeft size={14} strokeWidth={2}/> Edit my info
            </button>
          </div>

          {/* Share */}
          <div style={{
            paddingTop: 20,
            borderTop: '1px solid #E5E0D4',
            display: 'flex', flexDirection: 'column', gap: 12,
            maxWidth: 380,
          }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>
              Or share directly
            </div>
            {shareRow}
          </div>

          {/* Copy event link */}
          <button
            onClick={handleCopyLink}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72',
              padding: 0, alignSelf: 'flex-start',
            }}
          >
            <Link size={13} strokeWidth={2}/> Copy event link
          </button>

          {/* Permanent re-download link */}
          {permanentLinkRow && (
            <div style={{ maxWidth: 380 }}>{permanentLinkRow}</div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes cardLoadIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );
}
