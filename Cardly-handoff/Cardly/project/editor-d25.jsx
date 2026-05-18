// editor-d25.jsx — D2.5 · Multi-variant active (Speaker variant)

(function(){
  const { tokens: T, EI, TopBar, VariantTabs, LeftRail, BackgroundArt,
          CanvasBottomBar, CanvasDimsChip, SectionLabel,
          PanelCard, TextInput, ShortcutsBlock, linkBtn } = window.ES;

  // ─── Speaker variant: different zones ───
  function SpeakerZones({ scale }) {
    // Photo zone — top-right
    const Photo = { x: 720, y: 80, w: 300, h: 300 };
    // Speaker badge — top-left
    const Badge = { x: 60, y: 100, w: 280, h: 80 };
    // Name
    const Name  = { x: 60, y: 1080, w: 960, h: 180 };
    // Talk title
    const Talk  = { x: 60, y: 1300, w: 960, h: 220 };

    const scaled = (z) => ({ left: z.x*scale, top: z.y*scale, w: z.w*scale, h: z.h*scale });

    function ZoneFrame({ z, label, badge, children }) {
      const s = scaled(z);
      return (
        <>
          <div style={{
            position: 'absolute', left: s.left, top: s.top - 18,
            padding: '1px 5px',
            background: 'rgba(15,31,24,0.6)', color: 'rgba(250,246,238,0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: 3,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            zIndex: 3,
          }}>{label}{badge}</div>
          <div style={{
            position: 'absolute', left: s.left, top: s.top, width: s.w, height: s.h,
            border: `1.5px dashed rgba(31,77,58,0.55)`,
            background: 'rgba(31,77,58,0.02)',
            zIndex: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{children}</div>
        </>
      );
    }

    return (
      <>
        {/* Speaker badge — primary-fill text zone */}
        <ZoneFrame z={Badge} label="role_badge">
          <div style={{
            padding: '6px 14px', borderRadius: 6,
            background: T.primary, color: T.accent,
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            fontSize: 12, letterSpacing: '0.16em',
          }}>SPEAKER</div>
        </ZoneFrame>

        {/* Photo */}
        <ZoneFrame z={Photo} label="headshot">
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: 'rgba(232,239,235,0.7)',
            border: `2px solid rgba(232,197,126,0.7)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.muted, opacity: 0.8,
          }}>
            <EI.image size={28} sw={1.4}/>
          </div>
        </ZoneFrame>

        {/* Name */}
        <ZoneFrame z={Name} label="full_name">
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
            fontSize: 22, letterSpacing: '-0.02em',
            color: T.cream, opacity: 0.55, textAlign: 'center',
          }}>Speaker Name</div>
        </ZoneFrame>

        {/* Talk title */}
        <ZoneFrame z={Talk} label="talk_title">
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
            fontSize: 13, lineHeight: 1.25,
            color: T.cream, opacity: 0.5, textAlign: 'center', padding: '0 14px',
          }}>"Climate finance for youth-led initiatives across the continent"</div>
        </ZoneFrame>
      </>
    );
  }

  function CanvasArea() {
    const scale = 0.31;
    const cw = 1080*scale, ch = 1920*scale;
    return (
      <div style={{
        flex: 1, position: 'relative',
        background: T.canvasBg,
        backgroundImage: `radial-gradient(${T.borderStrong} 0.8px, transparent 0.8px)`,
        backgroundSize: '14px 14px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <CanvasDimsChip zoom="31%"/>

        {/* small variant breadcrumb at top-left of canvas */}
        <div style={{
          position: 'absolute', top: 12, left: 16,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: T.primarySoft, color: T.primary,
          border: '1px solid rgba(31,77,58,0.2)',
          borderRadius: 6,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
          zIndex: 2,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary }}/>
          <span>Viewing: Speaker variant</span>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px 0 48px',
        }}>
          <div style={{
            width: cw, height: ch, position: 'relative',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.08)',
            borderRadius: 4, overflow: 'visible',
          }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4 }}>
              <BackgroundArt/>
            </div>
            <SpeakerZones scale={scale}/>
          </div>
        </div>
        <CanvasBottomBar/>
      </div>
    );
  }

  // ─── Variant-info right sidebar ───
  function VariantInfo() {
    return (
      <>
        {/* Header */}
        <div style={{
          padding: '14px 14px 10px',
          borderBottom: `1px solid ${T.border}`,
          background: T.cream,
          position: 'sticky', top: 0, zIndex: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <button title="Back to Event" style={{
              width: 22, height: 22, borderRadius: 4,
              background: T.surface, border: `1px solid ${T.border}`,
              color: T.inkSoft, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><EI.chevLeft size={12} sw={2.2}/></button>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>Event</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 28, borderRadius: 3,
              background: T.primary, flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              color: T.accent,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
            }}>SP</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Variant</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
                color: T.ink, letterSpacing: '-0.01em',
              }}>Speaker</div>
            </div>
            {/* three-dot menu */}
            <button title="Variant menu" style={{
              width: 26, height: 26, borderRadius: 4,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: T.inkSoft,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.6"/>
                <circle cx="12" cy="12" r="1.6"/>
                <circle cx="19" cy="12" r="1.6"/>
              </svg>
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PanelCard label="Name">
            <TextInput value="Speaker"/>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.muted, marginTop: 6,
            }}>Shows on the variants tab and in shareable URLs.</div>
          </PanelCard>

          <PanelCard label="Background" trailing={
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.primary,
            }}>shared</span>
          }>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 50, height: 72, borderRadius: 4,
                border: `1px solid ${T.border}`,
                overflow: 'hidden', flexShrink: 0, position: 'relative',
              }}>
                <BackgroundArt/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                  color: T.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>paff-2025-bg.png</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: T.muted, marginTop: 2, letterSpacing: '0.02em',
                }}>1080 × 1920 · inherited</div>
                <button style={{ ...linkBtn(), marginTop: 6 }}>
                  <EI.refresh size={11}/><span>Use different background</span>
                </button>
              </div>
            </div>
          </PanelCard>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PanelCard label="Zones">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
                  color: T.ink, letterSpacing: '-0.02em',
                }}>4</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
                }}>on Speaker</span>
              </div>
            </PanelCard>
            <PanelCard label="Shared">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
                  color: T.ink, letterSpacing: '-0.02em',
                }}>2</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
                }}>with Attendee</span>
              </div>
            </PanelCard>
          </div>

          {/* Duplicate-from selector */}
          <PanelCard label="Duplicate zones from">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 36, padding: '0 10px',
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
              }}>
                <div style={{
                  width: 14, height: 18, borderRadius: 2, background: T.primary, flexShrink: 0,
                }}/>
                <span style={{
                  flex: 1, fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                  color: T.ink,
                }}>Attendee</span>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
                }}>3 zones</span>
                <EI.chevDown size={14}/>
              </div>
              <button style={{
                height: 32, padding: '0 12px',
                background: T.cream, color: T.primary,
                border: `1px solid rgba(31,77,58,0.25)`, borderRadius: 6,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                cursor: 'pointer',
              }}>
                <EI.copy size={13}/>
                <span>Duplicate from Attendee</span>
              </button>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.muted,
                marginTop: 2,
              }}>Copies all 3 zones at their current positions.</div>
            </div>
          </PanelCard>

          {/* Danger zone */}
          <div style={{ marginTop: 4 }}>
            <button style={{
              width: '100%', height: 36, padding: '0 12px',
              background: T.surface, color: T.danger,
              border: `1px solid rgba(184,66,60,0.3)`, borderRadius: 6,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              cursor: 'pointer',
            }}>
              <EI.trash size={13}/>
              <span>Delete Speaker variant</span>
            </button>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.muted,
              marginTop: 6, textAlign: 'center',
            }}>This can't be undone — zones aren't recoverable.</div>
          </div>
        </div>
      </>
    );
  }

  function LayersList() {
    const layers = [
      { id: 'z_04', label: 'Talk title',   type: 'text',  icon: <EI.text size={12}/>,  visible: true,  locked: false },
      { id: 'z_03', label: 'Speaker Name', type: 'text',  icon: <EI.text size={12}/>,  visible: true,  locked: false },
      { id: 'z_02', label: 'Headshot',     type: 'photo', icon: <EI.photo size={12}/>, visible: true,  locked: true },
      { id: 'z_01', label: 'Role badge',   type: 'text',  icon: <EI.text size={12}/>,  visible: true,  locked: false },
    ];
    return (
      <>
        <div style={{ padding: '4px 14px 8px' }}>
          <SectionLabel count={layers.length}>Layers</SectionLabel>
        </div>
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {layers.map(l => (
            <div key={l.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 32, padding: '0 8px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 6, cursor: 'pointer',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4,
                background: T.cream, color: T.inkSoft,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{l.icon}</div>
              <div style={{
                flex: 1, minWidth: 0,
                fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 500,
                color: T.ink,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{l.label}</div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
                color: T.muted, letterSpacing: '0.04em',
              }}>{l.type}</div>
              <button style={{
                width: 22, height: 22, borderRadius: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: l.visible ? T.inkSoft : T.borderStrong,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{l.visible ? <EI.eye size={12}/> : <EI.eyeOff size={12}/>}</button>
              <button style={{
                width: 22, height: 22, borderRadius: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: l.locked ? T.primary : T.borderStrong,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{l.locked ? <EI.lock size={12}/> : <EI.lockOpen size={12}/>}</button>
            </div>
          ))}
        </div>
      </>
    );
  }

  function RightSidebar() {
    return (
      <div style={{
        width: 320, flexShrink: 0,
        background: T.cream,
        borderLeft: `1px solid ${T.border}`,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <VariantInfo/>
        <LayersList/>
        <ShortcutsBlock/>
      </div>
    );
  }

  window.EditorD25 = function EditorD25({ width = 1280, height = 860 }) {
    return (
      <div style={{
        width, height,
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <TopBar saveState="saved"/>
        <VariantTabs
          active="Speaker"
          counts={{ Attendee: 3, Speaker: 4, Sponsor: 2 }}
          tabs={[{ name: 'Attendee' }, { name: 'Speaker' }, { name: 'Sponsor' }]}
        />
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftRail/>
          <CanvasArea/>
          <RightSidebar/>
        </div>
      </div>
    );
  };
})();
