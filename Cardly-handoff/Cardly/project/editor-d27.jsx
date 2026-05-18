// editor-d27.jsx — D2.7 · Mobile Fallback (<768px)
// Upgrade nudge — does NOT try to recreate the editor on phone.

(function(){
  const { tokens: T, EI } = window.ES;

  function MonoCaption({ children, color }) {
    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: color || T.muted, letterSpacing: '0.1em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{children}</div>
    );
  }

  function MonitorIcon({ size = 44 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    );
  }

  function Smartphone({ size = 18 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    );
  }

  function CopyIcon({ size = 14 }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    );
  }

  window.EditorD27 = function EditorD27({ width = 375, height = 780 }) {
    return (
      <div style={{
        width, height, position: 'relative', overflow: 'hidden',
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
      }}>
        {/* subtle decorative blobs */}
        <div style={{
          position: 'absolute', width: 280, height: 280,
          top: -80, right: -80,
          borderRadius: '50%',
          background: T.primarySoft, opacity: 0.7, filter: 'blur(40px)',
        }}/>
        <div style={{
          position: 'absolute', width: 220, height: 220,
          bottom: -60, left: -80,
          borderRadius: '50%',
          background: 'rgba(232,197,126,0.35)', filter: 'blur(40px)',
        }}/>

        {/* Top: tiny breadcrumb-ish header (just the brand + status) */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '20px 20px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: T.primary, color: T.accent,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>cl</div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              color: T.muted, letterSpacing: '0.06em',
            }}>cardly</div>
          </div>
          <MonoCaption color={T.muted}>Editor</MonoCaption>
        </div>

        {/* Center card */}
        <div style={{
          position: 'relative', zIndex: 1,
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 'calc(100% - 100px)',
        }}>
          <div style={{
            width: '100%', maxWidth: 360,
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: '28px 24px 22px',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          }}>
            {/* mono label */}
            <MonoCaption>Editor · Desktop required</MonoCaption>

            {/* icon */}
            <div style={{
              position: 'relative',
              width: 92, height: 92, borderRadius: '50%',
              background: T.primarySoft,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: T.primary,
            }}>
              <MonitorIcon size={42}/>
              {/* phone "no" overlay — calm, geometric */}
              <div style={{
                position: 'absolute',
                bottom: -4, right: -4,
                width: 30, height: 30, borderRadius: '50%',
                background: T.surface,
                border: `2px solid ${T.cream}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: T.danger,
                boxShadow: '0 2px 6px rgba(15,31,24,0.15)',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="3" width="12" height="18" rx="2"/>
                  <line x1="4" y1="4" x2="20" y2="20"/>
                </svg>
              </div>
            </div>

            {/* headline */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
                fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.025em',
                margin: 0, color: T.ink,
                textWrap: 'balance',
              }}>The editor works best on a laptop</h1>
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.55,
                color: T.inkSoft, margin: '10px 0 0',
                textWrap: 'pretty',
              }}>The canvas needs a larger screen to position zones precisely. Open this link on a laptop or tablet to keep editing.</p>
            </div>

            {/* Event meta chip */}
            <div style={{
              width: '100%',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              background: T.cream,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: T.primary, color: T.accent,
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 11,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>AU</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                  color: T.ink, lineHeight: 1.2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>5th Pan-African Youth Forum</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: T.muted, letterSpacing: '0.04em', marginTop: 2,
                }}>cardly.io/edit/paff-2025</div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{
              width: '100%', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <button style={{
                width: '100%', height: 50,
                background: T.primary, color: T.cream,
                border: 'none', borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
              }}>
                <CopyIcon size={16}/>
                <span>Copy event link</span>
              </button>
              <button style={{
                width: '100%', height: 46,
                background: T.surface, color: T.ink,
                border: `1.5px solid ${T.border}`, borderRadius: 12,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer',
              }}>
                <EI.eye size={15} sw={1.8}/>
                <span>View as attendee</span>
              </button>
            </div>

            {/* tiny helper */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              background: T.primarySoft,
              borderRadius: 999,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.primary, letterSpacing: '0.04em',
            }}>
              <Smartphone size={12}/>
              <span>Editing on phone · coming later</span>
            </div>
          </div>

          {/* powered by */}
          <div style={{
            marginTop: 20,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
            color: T.muted, letterSpacing: '0.04em',
          }}>
            powered by <span style={{ color: T.ink, fontWeight: 500 }}>cardly</span>
          </div>
        </div>
      </div>
    );
  };
})();
