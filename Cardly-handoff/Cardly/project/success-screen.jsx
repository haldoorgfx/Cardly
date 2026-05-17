// success-screen.jsx — Screen 5 (Success / Viral Share / E3)
// Card saved → push the share. Three layouts.

const sxTokens = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F',
  // platform brand colors
  whatsapp: '#25D366', instaA: '#fa7e1e', instaB: '#d62976', instaC: '#4f5bd5',
  x: '#000000', facebook: '#1877F2', linkedin: '#0A66C2', tiktok: '#000000',
};

const SxSvg = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconCheck = (p) => <SxSvg {...p}><polyline points="20 6 9 17 4 12"/></SxSvg>;
const IconCopy = (p) => <SxSvg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></SxSvg>;
const IconPencil = (p) => <SxSvg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></SxSvg>;
const IconChev = (p) => <SxSvg {...p}><polyline points="9 18 15 12 9 6"/></SxSvg>;
const IconLink = (p) => <SxSvg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></SxSvg>;
const IconForward = (p) => <SxSvg {...p}><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></SxSvg>;

// Same brand marks from preview-screen
const BrandMark = {
  whatsapp: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zM12 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.23c0-5.46 4.45-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  ),
  instagram: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="igGradB" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="30%" stopColor="#fa7e1e"/>
          <stop offset="60%" stopColor="#d62976"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igGradB)"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff"/>
    </svg>
  ),
  x: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8z"/>
    </svg>
  ),
  facebook: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#1877F2"/>
      <path fill="#fff" d="M14.5 12.5h2.3l.4-3h-2.7V7.7c0-.87.27-1.46 1.52-1.46H17V3.65A21.4 21.4 0 0 0 14.83 3.5c-2.15 0-3.62 1.31-3.62 3.72v2.28h-2.4v3h2.4V21h2.99v-8.5z"/>
    </svg>
  ),
  linkedin: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#0A66C2"/>
      <path fill="#fff" d="M8.3 9.5v9H5.3v-9h3zm-1.5-4.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm4 4.4h2.85v1.27h.04c.4-.74 1.37-1.52 2.82-1.52 3.02 0 3.58 1.96 3.58 4.5v4.75h-3v-4.21c0-1 0-2.3-1.42-2.3-1.42 0-1.64 1.1-1.64 2.23v4.28h-2.99v-9h-.24z"/>
    </svg>
  ),
  tiktok: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M16.3 8.5c-1.07-.7-1.74-1.84-1.95-3.1h-2.6v10.4c0 1.46-1.18 2.64-2.64 2.64A2.64 2.64 0 1 1 11.1 14V11.3a5.34 5.34 0 1 0 5.95 5.3V11.5a6.06 6.06 0 0 0 3.55 1.14V10.04c-1.51 0-2.96-.51-4.3-1.54z"/>
    </svg>
  ),
};

// Inline portrait (matches earlier screens)
function MiniCardPhoto() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="sx-bg" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f0d9a8"/>
            <stop offset="60%" stopColor="#c69a5e"/>
            <stop offset="100%" stopColor="#6b4a26"/>
          </radialGradient>
          <linearGradient id="sx-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a87645"/><stop offset="100%" stopColor="#724b25"/>
          </linearGradient>
          <linearGradient id="sx-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f4d3a"/><stop offset="100%" stopColor="#0f2a1f"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sx-bg)"/>
        <path d="M 0 100 L 0 86 C 16 74 26 72 50 72 C 74 72 84 74 100 86 L 100 100 Z" fill="url(#sx-shirt)"/>
        <ellipse cx="50" cy="48" rx="22" ry="26" fill="url(#sx-skin)"/>
        <path d="M 28 44 C 28 30 38 24 50 24 C 62 24 72 30 72 44 C 72 40 70 36 65 35 C 60 33 55 35 50 35 C 45 35 40 33 35 35 C 30 36 28 40 28 44 Z" fill="#2c1a0e"/>
      </svg>
    </div>
  );
}

// ---- Success badge ----
function SuccessBadge({ size = 64 }) {
  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* gold accent ring (earned feeling) */}
      <div style={{
        position: 'absolute', inset: -6,
        borderRadius: '50%',
        border: `2px solid ${sxTokens.accent}`,
        opacity: 0.55,
      }}/>
      <div style={{
        position: 'absolute', inset: -12,
        borderRadius: '50%',
        border: `1px solid ${sxTokens.accent}`,
        opacity: 0.25,
      }}/>
      {/* forest disc */}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: sxTokens.primary,
        color: sxTokens.accent,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(31,77,58,0.35)',
      }}>
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
             style={{ animation: 'checkDraw 400ms ease-out 0.2s both' }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    </div>
  );
}

// ---- Caption helper card ----
function CaptionCard({ copied = false }) {
  return (
    <div style={{
      background: sxTokens.surface,
      border: `1px solid ${sxTokens.border}`,
      borderRadius: 18,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: sxTokens.muted, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>Suggested caption</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontFamily: 'Inter, sans-serif', fontSize: 12,
          color: sxTokens.muted,
        }}>
          <IconPencil size={12} sw={2}/>
          <span>Tap to edit</span>
        </div>
      </div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5,
        color: sxTokens.ink, fontWeight: 500,
      }}>Excited to be at the 5th Pan-African Youth Forum in Djibouti. Tap the link if you're attending too. 🌱</div>
      <div style={{
        display: 'flex', justifyContent: 'flex-end', marginTop: 2,
      }}>
        <button style={{
          height: 36, padding: '0 14px',
          background: copied ? sxTokens.success : sxTokens.primarySoft,
          color: copied ? sxTokens.cream : sxTokens.primary,
          border: 'none', borderRadius: 10,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          transition: 'background .2s ease-out, color .2s ease-out',
        }}>
          {copied ? <IconCheck size={14} sw={2.4}/> : <IconCopy size={14} sw={2}/>}
          <span>{copied ? 'Copied' : 'Copy caption'}</span>
        </button>
      </div>
    </div>
  );
}

// ---- Big share button (64px) with branded left bar + icon ----
function BigShareButton({ brandIcon, brandColor, label, sub }) {
  return (
    <button style={{
      width: '100%', height: 68,
      background: sxTokens.surface,
      border: `1.5px solid ${sxTokens.border}`,
      borderRadius: 16,
      padding: '0 14px 0 0',
      display: 'flex', alignItems: 'stretch',
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(15,31,24,0.03), 0 4px 12px rgba(15,31,24,0.04)',
      overflow: 'hidden',
      textAlign: 'left',
    }}>
      <div style={{
        width: 64, flexShrink: 0,
        background: sxTokens.surface,
        borderRight: `1px solid ${sxTokens.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        {/* color strip on inner edge */}
        <div style={{
          position: 'absolute', left: 0, top: 12, bottom: 12,
          width: 4, borderRadius: 2,
          background: brandColor,
        }}/>
        {brandIcon}
      </div>
      <div style={{
        flex: 1, minWidth: 0, padding: '0 4px 0 16px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 16,
          color: sxTokens.ink, letterSpacing: '-0.01em',
        }}>{label}</div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13,
          color: sxTokens.muted, marginTop: 2,
        }}>{sub}</div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', color: sxTokens.muted,
      }}>
        <IconChev size={18} sw={2}/>
      </div>
    </button>
  );
}

// ---- Small share circle (40px) ----
function SmallShare({ icon, label }) {
  return (
    <button title={label} aria-label={label} style={{
      width: 40, height: 40, borderRadius: '50%',
      background: sxTokens.surface,
      border: `1px solid ${sxTokens.border}`,
      boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      color: sxTokens.ink,
    }}>{icon}</button>
  );
}

// ---- Forward prompt ----
function ForwardPrompt() {
  return (
    <div style={{
      background: sxTokens.surface,
      border: `1px solid ${sxTokens.border}`,
      borderRadius: 16,
      padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: sxTokens.primarySoft, opacity: 0.45, pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'relative',
        width: 40, height: 40, borderRadius: 12,
        background: sxTokens.primary, color: sxTokens.cream,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <IconForward size={18} sw={2}/>
      </div>
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14,
          color: sxTokens.ink,
        }}>Know someone else attending?</div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12, color: sxTokens.inkSoft,
          marginTop: 2,
        }}>Forward this link so they can make a card too.</div>
      </div>
      <button style={{
        position: 'relative',
        height: 36, padding: '0 12px',
        background: sxTokens.primary, color: sxTokens.cream,
        border: 'none', borderRadius: 10,
        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
        cursor: 'pointer', flexShrink: 0,
      }}>Forward</button>
    </div>
  );
}

// ---- Powered by ----
function SxPoweredBy({ align = 'center' }) {
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11, color: sxTokens.muted,
      letterSpacing: '0.04em', textAlign: align,
    }}>powered by <span style={{ color: sxTokens.ink, fontWeight: 500 }}>cardly</span></div>
  );
}

// ---- Small card preview ----
function MiniCard({ scale = 0.38 }) {
  const EventCardPreview = window.EventCardPreview;
  return (
    <div style={{ width: 400 * scale, height: 500 * scale, position: 'relative' }}>
      <EventCardPreview scale={scale} placeholder={false}
        name="Aisha Ahmed" title="Climate Policy Lead"
        renderPhoto={() => <MiniCardPhoto/>}/>
    </div>
  );
}

// ---- THE SCREEN ----
window.SuccessScreen = function SuccessScreen({ variant = 'mobile', width, height }) {

  // Top wash background (cream + faint hero-gradient at top)
  const TopWash = (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: 0, height: 280,
      background: 'linear-gradient(180deg, rgba(31,77,58,0.05) 0%, rgba(232,197,126,0.04) 40%, rgba(250,246,238,0) 100%)',
      pointerEvents: 'none',
    }}/>
  );

  // ============== MOBILE ==============
  if (variant === 'mobile') {
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: sxTokens.cream,
        fontFamily: 'Inter, sans-serif', color: sxTokens.ink,
      }}>
        {TopWash}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '28px 20px 24px',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {/* success header */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 14, textAlign: 'center',
          }}>
            <SuccessBadge size={60}/>
            <div>
              <h1 style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: 28, lineHeight: 1.15, letterSpacing: '-0.025em',
                margin: 0, color: sxTokens.ink,
              }}>Card saved</h1>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 15, lineHeight: 1.5,
                color: sxTokens.inkSoft, marginTop: 6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto',
              }}>Now share it where your audience hangs out.</div>
            </div>
            {/* small card */}
            <div style={{ marginTop: 4 }}>
              <MiniCard scale={0.36}/>
            </div>
          </div>

          {/* caption helper */}
          <CaptionCard/>

          {/* share where it matters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
              letterSpacing: '-0.02em', margin: 0, color: sxTokens.ink,
            }}>Share where it matters</h2>
            <BigShareButton brandIcon={BrandMark.instagram(28)} brandColor={sxTokens.instaB}
              label="Instagram Stories" sub="Open in Instagram"/>
            <BigShareButton brandIcon={BrandMark.whatsapp(28)} brandColor={sxTokens.whatsapp}
              label="WhatsApp Status" sub="Send on WhatsApp"/>
            <BigShareButton brandIcon={BrandMark.x(28)} brandColor={sxTokens.x}
              label="Post on X" sub="Compose a post"/>
          </div>

          {/* secondary small row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: sxTokens.muted,
            }}>More options</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <SmallShare icon={BrandMark.facebook(18)} label="Facebook"/>
              <SmallShare icon={BrandMark.linkedin(18)} label="LinkedIn"/>
              <SmallShare icon={BrandMark.tiktok(18)} label="TikTok"/>
              <SmallShare icon={<IconLink size={16} sw={1.8}/>} label="Copy link"/>
            </div>
          </div>

          {/* forward */}
          <ForwardPrompt/>

          {/* footer */}
          <div style={{ marginTop: 4 }}>
            <SxPoweredBy/>
          </div>
        </div>
      </div>
    );
  }

  // ============== TABLET ==============
  if (variant === 'tablet') {
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: sxTokens.cream,
        fontFamily: 'Inter, sans-serif', color: sxTokens.ink,
      }}>
        {TopWash}
        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 560, margin: '0 auto',
          padding: '40px 32px 32px',
          display: 'flex', flexDirection: 'column', gap: 28,
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 18, textAlign: 'center',
          }}>
            <SuccessBadge size={68}/>
            <div>
              <h1 style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: 36, lineHeight: 1.1, letterSpacing: '-0.03em',
                margin: 0, color: sxTokens.ink,
              }}>Card saved</h1>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 17, lineHeight: 1.5,
                color: sxTokens.inkSoft, marginTop: 8, maxWidth: 380, marginLeft: 'auto', marginRight: 'auto',
              }}>Now share it where your audience hangs out.</div>
            </div>
            <div style={{ marginTop: 4 }}>
              <MiniCard scale={0.46}/>
            </div>
          </div>

          <CaptionCard copied={false}/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 24,
              letterSpacing: '-0.02em', margin: 0, color: sxTokens.ink,
            }}>Share where it matters</h2>
            <BigShareButton brandIcon={BrandMark.instagram(28)} brandColor={sxTokens.instaB}
              label="Instagram Stories" sub="Open in Instagram"/>
            <BigShareButton brandIcon={BrandMark.whatsapp(28)} brandColor={sxTokens.whatsapp}
              label="WhatsApp Status" sub="Send on WhatsApp"/>
            <BigShareButton brandIcon={BrandMark.x(28)} brandColor={sxTokens.x}
              label="Post on X" sub="Compose a post"/>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: sxTokens.muted,
            }}>More options</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SmallShare icon={BrandMark.facebook(18)} label="Facebook"/>
              <SmallShare icon={BrandMark.linkedin(18)} label="LinkedIn"/>
              <SmallShare icon={BrandMark.tiktok(18)} label="TikTok"/>
              <SmallShare icon={<IconLink size={16} sw={1.8}/>} label="Copy link"/>
            </div>
          </div>

          <ForwardPrompt/>
          <SxPoweredBy/>
        </div>
      </div>
    );
  }

  // ============== DESKTOP ==============
  // Two-column: success/card/forward LEFT, caption + share buttons RIGHT
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: sxTokens.cream,
      fontFamily: 'Inter, sans-serif', color: sxTokens.ink,
    }}>
      {TopWash}

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        height: '100%',
        padding: '0 56px',
        display: 'grid', gridTemplateColumns: '46% 54%',
        alignItems: 'center', gap: 56,
      }}>
        {/* Left: success + card + forward */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 24,
          maxWidth: 460,
        }}>
          <SuccessBadge size={72}/>
          <div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 56, lineHeight: 1.0, letterSpacing: '-0.035em',
              margin: 0, color: sxTokens.ink,
            }}>Card saved.</h1>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: 1.5,
              color: sxTokens.inkSoft, marginTop: 14, maxWidth: 380,
            }}>Now share it where your audience hangs out. The link is waiting in your downloads — your photo isn't.</div>
          </div>

          {/* small card + meta */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            background: sxTokens.surface,
            border: `1px solid ${sxTokens.border}`,
            borderRadius: 18,
            padding: 16,
          }}>
            <MiniCard scale={0.32}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: sxTokens.muted, letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 4,
              }}>Saved file</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15,
                color: sxTokens.ink, lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>aisha-ahmed_paff-2025.png</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12,
                color: sxTokens.muted, marginTop: 2,
              }}>1080 × 1350 · 280 KB</div>
              <button style={{
                marginTop: 10,
                background: 'transparent', border: 'none',
                color: sxTokens.primary, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                padding: 0,
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}>
                <IconLink size={13} sw={2}/>
                <span>Copy share link</span>
              </button>
            </div>
          </div>

          <ForwardPrompt/>
          <SxPoweredBy align="left"/>
        </div>

        {/* Right: caption + share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 520 }}>
          <h2 style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28,
            letterSpacing: '-0.025em', margin: 0, color: sxTokens.ink,
          }}>Share where it matters</h2>

          <CaptionCard/>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <BigShareButton brandIcon={BrandMark.instagram(30)} brandColor={sxTokens.instaB}
              label="Instagram Stories" sub="Open in Instagram"/>
            <BigShareButton brandIcon={BrandMark.whatsapp(30)} brandColor={sxTokens.whatsapp}
              label="WhatsApp Status" sub="Send on WhatsApp"/>
            <BigShareButton brandIcon={BrandMark.x(30)} brandColor={sxTokens.x}
              label="Post on X" sub="Compose a post"/>
          </div>

          <div style={{
            paddingTop: 16,
            borderTop: `1px solid ${sxTokens.border}`,
            display: 'flex', alignItems: 'center', gap: 12,
            justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: sxTokens.muted,
            }}>More options</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <SmallShare icon={BrandMark.facebook(18)} label="Facebook"/>
              <SmallShare icon={BrandMark.linkedin(18)} label="LinkedIn"/>
              <SmallShare icon={BrandMark.tiktok(18)} label="TikTok"/>
              <SmallShare icon={<IconLink size={16} sw={1.8}/>} label="Copy link"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
