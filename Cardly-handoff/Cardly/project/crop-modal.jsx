// crop-modal.jsx — Screen 3 (Photo Crop Modal / E1.5)
// Full-screen on mobile/tablet, centered 600px dialog on desktop.
// Demonstrates: crop frame, dimmed photo outside frame, zoom slider, helper, CTAs.

const cropTokens = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
};

const CSvg = ({ children, size = 18, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IconX = (p) => <CSvg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></CSvg>;
const IconZoomOut = (p) => <CSvg {...p}><circle cx="11" cy="11" r="7"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></CSvg>;
const IconZoomIn = (p) => <CSvg {...p}><circle cx="11" cy="11" r="7"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></CSvg>;
const IconUpload = (p) => <CSvg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></CSvg>;
const IconCheck = (p) => <CSvg {...p}><polyline points="20 6 9 17 4 12"/></CSvg>;
const IconMove = (p) => <CSvg {...p}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></CSvg>;
const IconPinch = (p) => <CSvg {...p}><path d="M8 8L4 4"/><path d="M4 8V4h4"/><path d="M16 16l4 4"/><path d="M20 16v4h-4"/></CSvg>;

// ---- Stylized portrait placeholder (CSS-generated, no real face) ----
// Used as the "uploaded photo" inside the cropper.
function PhotoPlaceholder({ width = 400, height = 500, zoom = 1.6, offsetX = 0, offsetY = 0 }) {
  // Scaled portrait composition. The wrapper applies zoom + translate.
  const W = width, H = height;
  const scale = zoom;
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'linear-gradient(160deg, #d6c5a0 0%, #c4a878 40%, #8b6a3e 100%)',
    }}>
      <div style={{
        position: 'absolute',
        left: '50%', top: '50%',
        width: W, height: H,
        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`,
        transformOrigin: 'center center',
      }}>
        {/* Stylized portrait silhouette — geometric, not a real face */}
        <svg viewBox="0 0 400 500" width="100%" height="100%" style={{ display: 'block' }}>
          <defs>
            <radialGradient id="bg-warm" cx="50%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#f0d9a8"/>
              <stop offset="60%" stopColor="#c69a5e"/>
              <stop offset="100%" stopColor="#6b4a26"/>
            </radialGradient>
            <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a87645"/>
              <stop offset="100%" stopColor="#724b25"/>
            </linearGradient>
            <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f4d3a"/>
              <stop offset="100%" stopColor="#0f2a1f"/>
            </linearGradient>
          </defs>
          <rect width="400" height="500" fill="url(#bg-warm)"/>
          {/* shoulders / shirt */}
          <path d="M 0 500 L 0 420 C 80 360 120 350 200 350 C 280 350 320 360 400 420 L 400 500 Z" fill="url(#shirt)"/>
          {/* neck */}
          <path d="M 170 360 L 170 290 Q 200 305 230 290 L 230 360 Z" fill="url(#skin)" opacity="0.9"/>
          {/* head silhouette */}
          <ellipse cx="200" cy="220" rx="92" ry="108" fill="url(#skin)"/>
          {/* hair */}
          <path d="M 110 200 C 110 130 150 105 200 105 C 250 105 290 130 290 200 C 290 180 280 165 260 158 C 240 152 220 158 200 158 C 180 158 160 152 140 158 C 120 165 110 180 110 200 Z" fill="#2c1a0e"/>
          {/* gentle face shading for depth */}
          <ellipse cx="200" cy="240" rx="55" ry="40" fill="#a87645" opacity="0.3"/>
        </svg>
      </div>
    </div>
  );
}

// ---- Crop frame overlay (circular cutout via mask) ----
function CropFrame({ size = 280, shape = 'circle' }) {
  const r = size / 2;
  return (
    <>
      {/* SVG mask — dims everything outside the frame */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <mask id="cropmask">
            <rect width="100%" height="100%" fill="white"/>
            {shape === 'circle' ?
              <circle cx="50%" cy="50%" r={r} fill="black"/> :
              <rect x="50%" y="50%" width={size} height={size} rx="16"
                    transform={`translate(-${r}, -${r})`} fill="black"/>}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15,31,24,0.7)" mask="url(#cropmask)"/>
      </svg>
      {/* Frame ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: size, height: size,
        transform: 'translate(-50%, -50%)',
        borderRadius: shape === 'circle' ? '50%' : 16,
        border: `2px solid ${cropTokens.cream}`,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.15), 0 0 24px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
      }}/>
      {/* Center crosshair (very subtle) */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 1, height: 18, marginLeft: -0.5, marginTop: -9,
        background: 'rgba(250,246,238,0.4)', pointerEvents: 'none',
      }}/>
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 18, height: 1, marginLeft: -9, marginTop: -0.5,
        background: 'rgba(250,246,238,0.4)', pointerEvents: 'none',
      }}/>
    </>
  );
}

// ---- Zoom slider ----
function ZoomSlider({ value = 1.6, min = 1, max = 3, dark = false, width = '100%' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width }}>
      <div style={{ color: dark ? 'rgba(250,246,238,0.7)' : cropTokens.inkSoft }}>
        <IconZoomOut size={18} sw={2}/>
      </div>
      <div style={{
        position: 'relative', flex: 1, height: 24,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999,
          background: dark ? 'rgba(250,246,238,0.18)' : cropTokens.border,
        }}/>
        <div style={{
          position: 'absolute', left: 0, height: 4, borderRadius: 999,
          width: `${pct}%`, background: cropTokens.primary,
        }}/>
        <div style={{
          position: 'absolute', left: `calc(${pct}% - 11px)`,
          width: 22, height: 22, borderRadius: '50%',
          background: cropTokens.primary,
          border: '3px solid #fff',
          boxShadow: '0 2px 6px rgba(15,31,24,0.25)',
        }}/>
      </div>
      <div style={{ color: dark ? 'rgba(250,246,238,0.7)' : cropTokens.inkSoft }}>
        <IconZoomIn size={18} sw={2}/>
      </div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
        color: dark ? 'rgba(250,246,238,0.85)' : cropTokens.ink,
        minWidth: 36, textAlign: 'right',
      }}>{value.toFixed(1)}×</div>
    </div>
  );
}

// ---- Dimmed background mockup (the form ghosted behind the modal) ----
function DimmedBackdrop({ width, height }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: cropTokens.cream, overflow: 'hidden',
    }}>
      {/* faint suggestion of the form below */}
      <div style={{
        position: 'absolute', inset: 0,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
        filter: 'blur(2px)', opacity: 0.6,
      }}>
        <div style={{ height: 56, background: '#fff', border: `1px solid ${cropTokens.border}`, borderRadius: 12 }}/>
        <div style={{ height: 360, background: '#fff', border: `1px solid ${cropTokens.border}`, borderRadius: 20 }}/>
        <div style={{ height: 24, width: 140, background: '#fff', borderRadius: 6, marginTop: 6 }}/>
        <div style={{ height: 56, background: '#fff', border: `1px solid ${cropTokens.border}`, borderRadius: 14 }}/>
        <div style={{ height: 56, background: '#fff', border: `1px solid ${cropTokens.border}`, borderRadius: 14 }}/>
      </div>
      {/* ink 80% scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,31,24,0.8)' }}/>
    </div>
  );
}

// ---- Hint chip ----
function HintChip({ icon, label, dark }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 10px',
      background: dark ? 'rgba(250,246,238,0.10)' : cropTokens.primarySoft,
      color: dark ? cropTokens.cream : cropTokens.primary,
      borderRadius: 999,
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
    }}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

// ---- THE SCREEN ----
window.CropModalScreen = function CropModalScreen({ variant = 'mobile', width, height }) {

  // ============== MOBILE — full-screen, dark canvas ==============
  if (variant === 'mobile') {
    const cropSize = 280;
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}>
        <DimmedBackdrop width={width} height={height}/>

        {/* Modal — full-screen sheet */}
        <div style={{
          position: 'absolute', inset: 0,
          background: cropTokens.ink,
          display: 'flex', flexDirection: 'column',
          color: cropTokens.cream,
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 20px 12px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: 12,
          }}>
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: 'rgba(250,246,238,0.55)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 4,
              }}>Step 2 of 3</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
                letterSpacing: '-0.02em', color: cropTokens.cream,
              }}>Position your photo</div>
            </div>
            <button style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(250,246,238,0.08)', border: 'none',
              color: cropTokens.cream, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><IconX size={18} sw={2}/></button>
          </div>

          {/* Crop area */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            margin: '4px 0',
          }}>
            <PhotoPlaceholder zoom={1.6} offsetX={-12} offsetY={-8}/>
            <CropFrame size={cropSize} shape="circle"/>

            {/* hint chips */}
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 12,
              display: 'flex', justifyContent: 'center', gap: 6, padding: '0 16px',
              flexWrap: 'wrap',
            }}>
              <HintChip dark icon={<IconMove size={12} sw={2}/>} label="Drag to reposition"/>
              <HintChip dark icon={<IconPinch size={12} sw={2}/>} label="Pinch to zoom"/>
            </div>
          </div>

          {/* Slider */}
          <div style={{
            padding: '16px 20px 8px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(250,246,238,0.08)',
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: 'rgba(250,246,238,0.55)', letterSpacing: '0.06em',
              textTransform: 'uppercase', marginBottom: 8,
            }}>Zoom</div>
            <ZoomSlider value={1.6} dark/>
          </div>

          {/* Buttons */}
          <div style={{
            padding: '16px 20px 22px',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <button style={{
              height: 56, background: cropTokens.primary,
              color: cropTokens.cream, border: 'none', borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              cursor: 'pointer',
            }}>
              <IconCheck size={18} sw={2.2}/>
              <span>Use this photo</span>
            </button>
            <button style={{
              height: 48, background: 'transparent',
              color: cropTokens.cream, border: '1.5px solid rgba(250,246,238,0.25)',
              borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}>
              <IconUpload size={16} sw={2}/>
              <span>Re-upload</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============== TABLET — full-screen, more breathing room ==============
  if (variant === 'tablet') {
    const cropSize = 340;
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}>
        <DimmedBackdrop width={width} height={height}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: cropTokens.ink,
          display: 'flex', flexDirection: 'column',
          color: cropTokens.cream,
        }}>
          <div style={{
            padding: '24px 32px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                color: 'rgba(250,246,238,0.55)', letterSpacing: '0.1em',
                textTransform: 'uppercase', marginBottom: 6,
              }}>Step 2 of 3</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28,
                letterSpacing: '-0.025em', color: cropTokens.cream,
              }}>Position your photo</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14,
                color: 'rgba(250,246,238,0.65)', marginTop: 6,
              }}>Drag to reposition. Pinch or use slider to zoom.</div>
            </div>
            <button style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(250,246,238,0.08)', border: 'none',
              color: cropTokens.cream, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}><IconX size={20} sw={2}/></button>
          </div>

          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <PhotoPlaceholder zoom={1.6} offsetX={-12} offsetY={-8}/>
            <CropFrame size={cropSize} shape="circle"/>
          </div>

          <div style={{
            padding: '20px 32px',
            background: 'rgba(0,0,0,0.2)',
            borderTop: '1px solid rgba(250,246,238,0.08)',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                color: 'rgba(250,246,238,0.55)', letterSpacing: '0.06em',
                textTransform: 'uppercase', marginBottom: 10,
              }}>Zoom</div>
              <ZoomSlider value={1.6} dark/>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={{
                height: 52, padding: '0 22px',
                background: 'transparent', color: cropTokens.cream,
                border: '1.5px solid rgba(250,246,238,0.25)', borderRadius: 14,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
              }}>
                <IconUpload size={16} sw={2}/>
                <span>Re-upload</span>
              </button>
              <button style={{
                height: 52, padding: '0 28px',
                background: cropTokens.primary, color: cropTokens.cream,
                border: 'none', borderRadius: 14,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25)',
              }}>
                <IconCheck size={18} sw={2.2}/>
                <span>Use this photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== DESKTOP — centered 600px dialog over dimmed bg ==============
  const cropSize = 360;
  return (
    <div style={{
      width, height, position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, sans-serif', color: cropTokens.ink,
    }}>
      <DimmedBackdrop width={width} height={height}/>

      {/* Dialog */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        background: cropTokens.surface,
        borderRadius: 24,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: cropTokens.muted, letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: 6,
            }}>Step 2 of 3</div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 28,
              letterSpacing: '-0.025em', color: cropTokens.ink, lineHeight: 1.15,
            }}>Position your photo</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14,
              color: cropTokens.muted, marginTop: 6,
            }}>Drag to reposition. Scroll or use the slider to zoom.</div>
          </div>
          <button style={{
            width: 40, height: 40, borderRadius: '50%',
            background: cropTokens.primarySoft, border: 'none',
            color: cropTokens.primary, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}><IconX size={18} sw={2}/></button>
        </div>

        {/* Crop stage */}
        <div style={{
          position: 'relative', height: 420,
          background: cropTokens.ink, overflow: 'hidden',
          margin: '0 28px', borderRadius: 18,
        }}>
          <PhotoPlaceholder zoom={1.6} offsetX={-8} offsetY={-4}/>
          <CropFrame size={cropSize} shape="circle"/>
          {/* zone-shape readout */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: 'rgba(15,31,24,0.7)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(250,246,238,0.12)',
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'rgba(250,246,238,0.85)',
          }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              border: `1.5px solid ${cropTokens.accent}`,
            }}/>
            <span>Circle · matches card zone</span>
          </div>
        </div>

        {/* Slider */}
        <div style={{
          padding: '20px 28px 8px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: cropTokens.inkSoft, letterSpacing: '0.06em',
            textTransform: 'uppercase', minWidth: 44,
          }}>Zoom</div>
          <div style={{ flex: 1 }}>
            <ZoomSlider value={1.6}/>
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '16px 28px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12,
        }}>
          <button style={{
            height: 52, padding: '0 22px',
            background: cropTokens.surface, color: cropTokens.ink,
            border: `1.5px solid ${cropTokens.border}`, borderRadius: 14,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          }}>
            <IconUpload size={16} sw={2}/>
            <span>Re-upload</span>
          </button>
          <button style={{
            height: 52, padding: '0 28px',
            background: cropTokens.primary, color: cropTokens.cream,
            border: 'none', borderRadius: 14,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
            display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
          }}>
            <IconCheck size={18} sw={2.2}/>
            <span>Use this photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
