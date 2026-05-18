// arrival-screen.jsx — Screen 1 (Arrival / E0) for Cardly attendee redesign.
// Brand tokens locked: forest green / cream. Three layouts via `variant`:
//   "mobile"  — 375px, single column, sticky CTA at bottom of artboard
//   "tablet"  — ≤640px column, max-w 500, centered, more breathing room
//   "desktop" — ≥1024px, two-column 60/40, both vertically centered

const arrivalTokens = {
  primary: '#1F4D3A',
  primaryDark: '#163828',
  primarySoft: '#E8EFEB',
  accent: '#E8C57E',
  accentDark: '#C9A45E',
  ink: '#0F1F18',
  inkSoft: '#3A4A42',
  muted: '#6B7A72',
  cream: '#FAF6EE',
  surface: '#FFFFFF',
  border: '#E5E0D4',
  borderStrong: '#C9C3B1',
};

// --- Lucide-style icons (inline SVG, stroke=1.8) ---
const SvgIcon = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const ArrowRight = (p) => <SvgIcon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></SvgIcon>;
const ShieldCheck = (p) => <SvgIcon {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></SvgIcon>;
const Clock = (p) => <SvgIcon {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
const Sparkles = (p) => <SvgIcon {...p}><path d="M12 3l1.6 4.9L18.5 9.5l-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6z"/><path d="M19 3v4"/><path d="M17 5h4"/></SvgIcon>;
const MapPin = (p) => <SvgIcon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></SvgIcon>;
const CalDays = (p) => <SvgIcon {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></SvgIcon>;

// --- Organizer brand strip (compact / full variants) ---
function EventBrandStrip({ compact = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 12 : 14,
      padding: compact ? '12px 16px' : '14px 18px',
      background: arrivalTokens.surface,
      border: `1px solid ${arrivalTokens.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
    }}>
      <div style={{
        width: compact ? 38 : 44, height: compact ? 38 : 44, borderRadius: '50%',
        background: arrivalTokens.primary, color: arrivalTokens.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
        fontSize: compact ? 13 : 15, letterSpacing: '-0.02em',
        flexShrink: 0,
      }}>AU</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif',
          fontWeight: 700, fontSize: compact ? 14 : 15, lineHeight: 1.2,
          color: arrivalTokens.ink, letterSpacing: '-0.01em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>5th Pan-African Youth Forum</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 3,
          fontFamily: 'Inter, sans-serif',
          fontSize: 12, color: arrivalTokens.muted,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <CalDays size={12} sw={2}/> 4–6 Nov 2025
          </span>
          <span style={{ color: arrivalTokens.borderStrong }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <MapPin size={12} sw={2}/> Ayla Hôtel Djibouti
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Floating card wrapper with idle translateY animation ---
function FloatingCard({ children, delay = 0 }) {
  return (
    <div style={{
      animation: `cardFloat 4s ease-in-out ${delay}s infinite`,
      display: 'inline-block',
    }}>
      {children}
    </div>
  );
}

// --- Primary CTA button ---
function PrimaryCTA({ label = 'Create my card', fullWidth = true }) {
  return (
    <button style={{
      width: fullWidth ? '100%' : 'auto',
      height: 56, padding: '0 24px',
      background: arrivalTokens.primary,
      color: arrivalTokens.cream,
      border: 'none', borderRadius: 14,
      fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: 'pointer',
      boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
      transition: 'transform .12s ease-out, background .2s ease-out',
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span>{label}</span>
      <ArrowRight size={18} sw={2}/>
    </button>
  );
}

// --- Footer line ---
function PoweredBy({ align = 'center' }) {
  return (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 11, color: arrivalTokens.muted,
      letterSpacing: '0.04em',
      textAlign: align,
    }}>
      powered by <span style={{ color: arrivalTokens.ink, fontWeight: 500 }}>cardly</span>
    </div>
  );
}

// --- Trust micro-row ---
function TrustLine({ align = 'center' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start',
      gap: 14,
      fontFamily: 'Inter, sans-serif',
      fontSize: 12, color: arrivalTokens.muted,
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <ShieldCheck size={13} sw={2}/> Free
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Sparkles size={13} sw={2}/> No signup
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <Clock size={13} sw={2}/> ~30 seconds
      </span>
    </div>
  );
}

// --- Background decorative blob (positioned absolute) ---
function DecorBlob({ style }) {
  return (
    <div style={{
      position: 'absolute',
      borderRadius: '50%',
      background: arrivalTokens.primarySoft,
      filter: 'blur(40px)',
      pointerEvents: 'none',
      ...style,
    }}/>
  );
}

// --- THE SCREEN ---
window.ArrivalScreen = function ArrivalScreen({ variant = 'mobile', width, height }) {
  const EventCardPreview = window.EventCardPreview;

  // ---------- MOBILE (375) ----------
  if (variant === 'mobile') {
    // Card scale: base 400 → fit ~310px → scale ≈ 0.775
    const cardScale = 0.78;
    return (
      <div style={{
        width, height,
        position: 'relative', overflow: 'hidden',
        background: arrivalTokens.cream,
        fontFamily: 'Inter, sans-serif',
        color: arrivalTokens.ink,
      }}>
        <DecorBlob style={{ width: 280, height: 280, top: 60, right: -80, opacity: 0.9 }}/>
        <DecorBlob style={{ width: 220, height: 220, bottom: -60, left: -60, opacity: 0.7,
                            background: 'rgba(232,197,126,0.35)' }}/>

        <div style={{
          position: 'relative', zIndex: 1,
          padding: '20px 20px 0',
          display: 'flex', flexDirection: 'column', gap: 20,
          height: '100%', boxSizing: 'border-box',
        }}>
          <EventBrandStrip compact/>

          {/* Card hero */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginTop: 4,
          }}>
            <FloatingCard>
              <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
                <EventCardPreview scale={cardScale}/>
              </div>
            </FloatingCard>
          </div>

          {/* Copy */}
          <div style={{ marginTop: 4 }}>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: 28, lineHeight: 1.15,
              letterSpacing: '-0.02em', margin: 0,
              color: arrivalTokens.ink,
              textWrap: 'pretty',
            }}>Get your personalized card</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 15, lineHeight: 1.55,
              color: arrivalTokens.inkSoft,
              margin: '8px 0 0', textWrap: 'pretty',
            }}>Add your name and photo. Download in seconds. Share anywhere.</p>
          </div>

          {/* Spacer to push CTA / trust down */}
          <div style={{ flex: 1 }}/>

          {/* Sticky CTA region */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 12,
            padding: '16px 0 20px',
            marginTop: 'auto',
          }}>
            <PrimaryCTA/>
            <TrustLine/>
            <PoweredBy/>
          </div>
        </div>
      </div>
    );
  }

  // ---------- TABLET (≤700, single column 500 centered) ----------
  if (variant === 'tablet') {
    const cardScale = 0.95;
    return (
      <div style={{
        width, height,
        position: 'relative', overflow: 'hidden',
        background: arrivalTokens.cream,
        fontFamily: 'Inter, sans-serif',
        color: arrivalTokens.ink,
      }}>
        <DecorBlob style={{ width: 480, height: 480, top: -80, right: -120, opacity: 0.9 }}/>
        <DecorBlob style={{ width: 360, height: 360, bottom: -120, left: -80, opacity: 0.6,
                            background: 'rgba(232,197,126,0.30)' }}/>

        <div style={{
          position: 'relative', zIndex: 1,
          maxWidth: 500, margin: '0 auto',
          padding: '32px 24px',
          display: 'flex', flexDirection: 'column', gap: 28,
          height: '100%', boxSizing: 'border-box',
        }}>
          <EventBrandStrip/>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <FloatingCard>
              <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
                <EventCardPreview scale={cardScale}/>
              </div>
            </FloatingCard>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: 34, lineHeight: 1.12,
              letterSpacing: '-0.025em', margin: 0,
              color: arrivalTokens.ink,
              textWrap: 'balance',
            }}>Get your personalized card</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 17, lineHeight: 1.55,
              color: arrivalTokens.inkSoft,
              margin: '10px auto 0', maxWidth: 380,
              textWrap: 'pretty',
            }}>Add your name and photo. Download in seconds. Share anywhere.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 'auto' }}>
            <PrimaryCTA/>
            <TrustLine/>
            <div style={{ marginTop: 4 }}>
              <PoweredBy/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DESKTOP (≥1024, two-column) ----------
  // Card 60% left, form/copy 40% right, both vertically centered.
  const cardScale = 1.15;
  return (
    <div style={{
      width, height,
      position: 'relative', overflow: 'hidden',
      background: arrivalTokens.cream,
      fontFamily: 'Inter, sans-serif',
      color: arrivalTokens.ink,
    }}>
      {/* decorative blobs */}
      <DecorBlob style={{ width: 700, height: 700, top: -200, left: -200, opacity: 0.9 }}/>
      <DecorBlob style={{ width: 520, height: 520, bottom: -200, right: -160, opacity: 0.55,
                          background: 'rgba(232,197,126,0.32)' }}/>

      {/* top bar with brand strip + powered by */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 24,
      }}>
        <div style={{ flex: '0 1 460px', minWidth: 0 }}>
          <EventBrandStrip compact/>
        </div>
        <div>
          <PoweredBy align="right"/>
        </div>
      </div>

      {/* Main two-column */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        padding: '0 40px',
        height: 'calc(100% - 92px)',
        display: 'grid',
        gridTemplateColumns: '60% 40%',
        alignItems: 'center',
        gap: 56,
      }}>
        {/* Left: card hero */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
        }}>
          <FloatingCard>
            <div style={{ width: 400 * cardScale, height: 500 * cardScale }}>
              <EventCardPreview scale={cardScale}/>
            </div>
          </FloatingCard>
        </div>

        {/* Right: copy + CTA */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 28,
          maxWidth: 420,
        }}>
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start',
            alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: arrivalTokens.primarySoft,
            color: arrivalTokens.primary,
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: arrivalTokens.primary,
            }}/>
            You're invited
          </div>

          <h1 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700, fontSize: 52, lineHeight: 1.05,
            letterSpacing: '-0.03em', margin: 0,
            color: arrivalTokens.ink,
            textWrap: 'balance',
          }}>Get your personalized card.</h1>

          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 19, lineHeight: 1.55,
            color: arrivalTokens.inkSoft,
            margin: 0, maxWidth: 380,
            textWrap: 'pretty',
          }}>Add your name and photo. Download in seconds. Share anywhere your audience hangs out.</p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <PrimaryCTA fullWidth={false}/>
            <div style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 14, color: arrivalTokens.muted,
            }}>Free · No signup · ~30 seconds</div>
          </div>

          {/* Inline trust strip with three subtle proof rows */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12, marginTop: 8,
          }}>
            {[
              { i: <ShieldCheck size={16} sw={2}/>, t: 'Private', s: 'Photo never leaves your browser' },
              { i: <Sparkles size={16} sw={2}/>, t: 'Branded', s: 'Matches the event design' },
              { i: <Clock size={16} sw={2}/>, t: 'Fast', s: 'Done in under a minute' },
            ].map((c, idx) => (
              <div key={idx} style={{
                padding: '12px 12px 14px',
                background: arrivalTokens.surface,
                border: `1px solid ${arrivalTokens.border}`,
                borderRadius: 12,
              }}>
                <div style={{ color: arrivalTokens.primary, marginBottom: 6 }}>{c.i}</div>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: 600, fontSize: 13,
                  color: arrivalTokens.ink, marginBottom: 2,
                }}>{c.t}</div>
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 12, lineHeight: 1.4,
                  color: arrivalTokens.muted,
                }}>{c.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
