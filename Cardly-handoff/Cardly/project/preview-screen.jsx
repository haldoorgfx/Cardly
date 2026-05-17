// preview-screen.jsx — Screen 4 (Preview & Download / E2)
// The magic moment. Card preview gets max visual weight; sparkles settle on load;
// download CTA + inline share row of six.

const previewTokens = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F',
};

const PSvg = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconDownload = (p) => <PSvg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></PSvg>;
const IconArrowLeft = (p) => <PSvg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></PSvg>;
const IconCopy = (p) => <PSvg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></PSvg>;

// Brand-mark icons (simplified). Solid fills, recognizable silhouettes.
const Brand = {
  whatsapp: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zM12 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.98 1-3.62-.24-.37a9.9 9.9 0 0 1-1.52-5.23c0-5.46 4.45-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 0 1 2.9 7c0 5.46-4.45 9.9-9.9 9.9zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  ),
  instagram: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#feda75"/>
          <stop offset="30%" stopColor="#fa7e1e"/>
          <stop offset="60%" stopColor="#d62976"/>
          <stop offset="100%" stopColor="#4f5bd5"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#igGrad)"/>
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8"/>
      <circle cx="17.4" cy="6.6" r="1.1" fill="#fff"/>
    </svg>
  ),
  x: (s=22) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8zm-.9 13.5h1.4L7.7 6.9H6.2l10.2 12.1z"/>
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
};

// ---- Photo content for the card's circular zone (matches crop output) ----
function CardPhoto() {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="cp-bg" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f0d9a8"/>
            <stop offset="60%" stopColor="#c69a5e"/>
            <stop offset="100%" stopColor="#6b4a26"/>
          </radialGradient>
          <linearGradient id="cp-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a87645"/><stop offset="100%" stopColor="#724b25"/>
          </linearGradient>
          <linearGradient id="cp-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f4d3a"/><stop offset="100%" stopColor="#0f2a1f"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#cp-bg)"/>
        <path d="M 0 100 L 0 86 C 16 74 26 72 50 72 C 74 72 84 74 100 86 L 100 100 Z" fill="url(#cp-shirt)"/>
        <ellipse cx="50" cy="48" rx="22" ry="26" fill="url(#cp-skin)"/>
        <path d="M 28 44 C 28 30 38 24 50 24 C 62 24 72 30 72 44 C 72 40 70 36 65 35 C 60 33 55 35 50 35 C 45 35 40 33 35 35 C 30 36 28 40 28 44 Z" fill="#2c1a0e"/>
        <ellipse cx="50" cy="55" rx="13" ry="10" fill="#a87645" opacity="0.3"/>
      </svg>
    </div>
  );
}

// ---- Sparkles (settled state — 6 dots around card) ----
function Sparkles({ width, height }) {
  const dots = [
    { l: '8%',  t: '14%', s: 6, d: 0 },
    { l: '92%', t: '18%', s: 8, d: 0.4 },
    { l: '4%',  t: '64%', s: 5, d: 0.8 },
    { l: '95%', t: '70%', s: 7, d: 1.2 },
    { l: '18%', t: '94%', s: 5, d: 0.6 },
    { l: '82%', t: '95%', s: 6, d: 1.0 },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
    }}>
      {dots.map((d, i) => (
        <svg key={i} width={d.s * 2} height={d.s * 2} viewBox="0 0 24 24"
             style={{
               position: 'absolute', left: d.l, top: d.t,
               transform: 'translate(-50%, -50%)',
               animation: `sparkleIdle 3.6s ease-in-out ${d.d}s infinite`,
               color: previewTokens.accentDark,
             }}>
          <path fill="currentColor" d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>
        </svg>
      ))}
    </div>
  );
}

// ---- Toast (showing the just-saved state on the desktop variant) ----
function SavedToast({ floating = false }) {
  return (
    <div style={{
      position: floating ? 'absolute' : 'relative',
      ...(floating ? { left: '50%', top: 24, transform: 'translateX(-50%)' } : {}),
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '10px 16px',
      background: previewTokens.ink,
      color: previewTokens.cream,
      borderRadius: 999,
      boxShadow: '0 8px 24px rgba(15,31,24,0.25)',
      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
      zIndex: 4,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: '50%',
        background: previewTokens.success, color: previewTokens.cream,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <PSvg size={12} sw={2.6}><polyline points="20 6 9 17 4 12"/></PSvg>
      </span>
      <span>Saved to your photos</span>
    </div>
  );
}

// ---- Share button (round, 48px) ----
function ShareCircle({ icon, label, brand = false }) {
  return (
    <button title={label} aria-label={label} style={{
      width: 48, height: 48, borderRadius: '50%',
      background: previewTokens.surface,
      border: `1px solid ${previewTokens.border}`,
      boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 4px 12px rgba(15,31,24,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      color: previewTokens.ink,
    }}>
      {brand ? icon : icon}
    </button>
  );
}

// ---- Download CTA ----
function DownloadCTA({ fullWidth = true, label = 'Download' }) {
  return (
    <button style={{
      width: fullWidth ? '100%' : 'auto',
      height: 60, padding: '0 28px',
      background: previewTokens.primary,
      color: previewTokens.cream,
      border: 'none', borderRadius: 16,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 17,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
    }}>
      <IconDownload size={20} sw={2.2}/>
      <span>{label}</span>
    </button>
  );
}

// ---- Edit my info text link ----
function EditLink({ align = 'center' }) {
  return (
    <button style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 500,
      color: previewTokens.inkSoft, padding: 8,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      alignSelf: align === 'center' ? 'center' : 'flex-start',
    }}>
      <IconArrowLeft size={14} sw={2}/>
      <span>Edit my info</span>
    </button>
  );
}

// ---- Halo (hero gradient at 8% behind card) ----
function CardHalo({ width = 360, height = 460 }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      width, height,
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
      opacity: 0.08,
      borderRadius: '50%',
      filter: 'blur(48px)',
      pointerEvents: 'none',
    }}/>
  );
}

// ---- THE SCREEN ----
window.PreviewScreen = function PreviewScreen({ variant = 'mobile', width, height }) {
  const EventCardPreview = window.EventCardPreview;
  const name = 'Aisha Ahmed';
  const title = 'Climate Policy Lead';

  const shareRow = (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <ShareCircle icon={Brand.whatsapp(22)} label="Share on WhatsApp"/>
      <ShareCircle icon={Brand.instagram(22)} label="Share to Instagram"/>
      <ShareCircle icon={Brand.x(22)} label="Post on X"/>
      <ShareCircle icon={Brand.facebook(22)} label="Share on Facebook"/>
      <ShareCircle icon={Brand.linkedin(22)} label="Share on LinkedIn"/>
      <ShareCircle icon={<IconCopy size={20} sw={1.8}/>} label="Copy link"/>
    </div>
  );

  // ============== MOBILE ==============
  if (variant === 'mobile') {
    const cardScale = 0.78; // ~310 wide, 85% of 375 ≈ 318
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: previewTokens.cream,
        fontFamily: 'Inter, sans-serif', color: previewTokens.ink,
      }}>
        {/* halo behind everything */}
        <div style={{ position: 'absolute', left: '50%', top: 220, transform: 'translateX(-50%)' }}>
          <CardHalo width={360} height={460}/>
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          padding: '24px 20px 20px',
          display: 'flex', flexDirection: 'column', gap: 22,
        }}>
          {/* heading */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 36, lineHeight: 1.05, letterSpacing: '-0.03em',
              margin: 0, color: previewTokens.ink,
            }}>Looks great.</h1>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 17, lineHeight: 1.45,
              color: previewTokens.inkSoft, marginTop: 6,
            }}>Your card is ready.</div>
          </div>

          {/* card hero with sparkles */}
          <div style={{
            position: 'relative',
            display: 'flex', justifyContent: 'center',
            padding: '12px 8px',
          }}>
            <div style={{ position: 'relative' }}>
              <Sparkles/>
              <div style={{
                width: 400 * cardScale, height: 500 * cardScale,
                animation: 'cardLoadIn 400ms ease-out both',
              }}>
                <EventCardPreview scale={cardScale} placeholder={false}
                  name={name} title={title} renderPhoto={() => <CardPhoto/>}/>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <DownloadCTA/>
            <EditLink/>
          </div>

          {/* inline share */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: previewTokens.muted,
              letterSpacing: '0.02em', textAlign: 'center',
            }}>Or share directly</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {shareRow}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== TABLET ==============
  if (variant === 'tablet') {
    const cardScale = 1.0;
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: previewTokens.cream,
        fontFamily: 'Inter, sans-serif', color: previewTokens.ink,
      }}>
        <div style={{ position: 'absolute', left: '50%', top: 320, transform: 'translateX(-50%)' }}>
          <CardHalo width={520} height={620}/>
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 560, margin: '0 auto',
          padding: '40px 32px',
          display: 'flex', flexDirection: 'column', gap: 28,
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.03em',
              margin: 0, color: previewTokens.ink,
            }}>Looks great.</h1>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 18, lineHeight: 1.5,
              color: previewTokens.inkSoft, marginTop: 8,
            }}>Your card is ready to share.</div>
          </div>

          <div style={{
            position: 'relative',
            display: 'flex', justifyContent: 'center',
            padding: '16px 16px',
          }}>
            <div style={{ position: 'relative' }}>
              <Sparkles/>
              <div style={{
                width: 400 * cardScale, height: 500 * cardScale,
                animation: 'cardLoadIn 400ms ease-out both',
              }}>
                <EventCardPreview scale={cardScale} placeholder={false}
                  name={name} title={title} renderPhoto={() => <CardPhoto/>}/>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <DownloadCTA/>
            <EditLink/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: previewTokens.muted,
            }}>Or share directly</div>
            {shareRow}
          </div>
        </div>
      </div>
    );
  }

  // ============== DESKTOP — two-column ==============
  const cardScale = 1.25;
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      background: previewTokens.cream,
      fontFamily: 'Inter, sans-serif', color: previewTokens.ink,
    }}>
      {/* large halo center-left */}
      <div style={{ position: 'absolute', left: '32%', top: '50%', transform: 'translate(-50%, -50%)' }}>
        <CardHalo width={700} height={840}/>
      </div>

      {/* floating toast — shows post-download state */}
      <SavedToast floating/>

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        height: '100%', padding: '0 56px',
        display: 'grid', gridTemplateColumns: '58% 42%',
        alignItems: 'center', gap: 56,
      }}>
        {/* Left: massive card + sparkles */}
        <div style={{
          position: 'relative',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <div style={{ position: 'relative' }}>
            <Sparkles/>
            <div style={{
              width: 400 * cardScale, height: 500 * cardScale,
              animation: 'cardLoadIn 400ms ease-out both',
            }}>
              <EventCardPreview scale={cardScale} placeholder={false}
                name={name} title={title} renderPhoto={() => <CardPhoto/>}/>
            </div>
          </div>
        </div>

        {/* Right: headline + CTAs + share */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px',
              background: previewTokens.primarySoft, color: previewTokens.primary,
              borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: previewTokens.primary }}/>
              Your card · ready
            </div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 64, lineHeight: 1.0, letterSpacing: '-0.035em',
              margin: 0, color: previewTokens.ink,
            }}>Looks great.</h1>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 19, lineHeight: 1.5,
              color: previewTokens.inkSoft, marginTop: 12,
              maxWidth: 380,
            }}>Download the PNG, then share it where your audience hangs out.</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
            <DownloadCTA/>
            <EditLink align="left"/>
          </div>

          <div style={{
            paddingTop: 20,
            borderTop: `1px solid ${previewTokens.border}`,
            display: 'flex', flexDirection: 'column', gap: 12,
            maxWidth: 380,
          }}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 13, color: previewTokens.muted,
            }}>Or share directly</div>
            {shareRow}
          </div>
        </div>
      </div>
    </div>
  );
};
