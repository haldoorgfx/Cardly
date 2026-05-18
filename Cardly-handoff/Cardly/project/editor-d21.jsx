// editor-d21.jsx — D2.1 · Empty Editor (uses editor-shared)

(function(){
  const { tokens: T, EI, TopBar, VariantTabs, LeftRail, BackgroundArt,
          CanvasBottomBar, CanvasDimsChip, SectionLabel,
          PanelCard, TextInput, ChipRO, ShortcutsBlock, linkBtn } = window.ES;

  function StatusPill() {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '2px 8px',
        background: '#FCEBC9', color: '#8A5A20',
        border: '1px solid rgba(201,164,94,0.4)',
        borderRadius: 999,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
        textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C97A2D' }}/>
        <span>Draft</span>
      </div>
    );
  }

  function EventPanel() {
    return (
      <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionLabel>Event</SectionLabel>
          <StatusPill/>
        </div>
        <PanelCard label="Name"><TextInput value="5th Pan-African Youth Forum"/></PanelCard>
        <PanelCard label="Canvas">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ChipRO>1080 × 1920 px</ChipRO>
            <button style={linkBtn()}><EI.resize size={12}/><span>Resize</span></button>
          </div>
        </PanelCard>
        <PanelCard label="Background">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 56, height: 80, borderRadius: 4,
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
              }}>1080 × 1920 · 412 KB</div>
              <button style={{ ...linkBtn(), marginTop: 6 }}>
                <EI.refresh size={11}/><span>Replace</span>
              </button>
            </div>
          </div>
        </PanelCard>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <PanelCard label="Variants">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
                color: T.ink, letterSpacing: '-0.02em',
              }}>1</span>
              <button style={linkBtn()}>Manage</button>
            </div>
          </PanelCard>
          <PanelCard label="Zones">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
                color: T.ink, letterSpacing: '-0.02em',
              }}>0</span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
              }}>on Attendee</span>
            </div>
          </PanelCard>
        </div>
      </div>
    );
  }

  function LayersEmpty() {
    return (
      <>
        <div style={{ padding: '18px 14px 8px' }}><SectionLabel count={0}>Layers</SectionLabel></div>
        <div style={{ padding: '0 14px' }}>
          <div style={{
            padding: '16px 14px',
            background: T.surface,
            border: `1px dashed ${T.borderStrong}`,
            borderRadius: 6, textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, margin: '0 auto 8px',
              borderRadius: '50%',
              background: T.primarySoft, color: T.primary,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><EI.shapes size={15}/></div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600,
              color: T.ink,
            }}>No elements yet</div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 11, lineHeight: 1.4,
              color: T.muted, marginTop: 3,
            }}>Add a zone from the left rail.</div>
          </div>
        </div>
      </>
    );
  }

  function CanvasArea() {
    const scale = 0.31;
    const cw = 1080 * scale, ch = 1920 * scale;
    return (
      <div style={{
        flex: 1, position: 'relative',
        background: T.canvasBg,
        backgroundImage: `radial-gradient(${T.borderStrong} 0.8px, transparent 0.8px)`,
        backgroundSize: '14px 14px', backgroundPosition: '0 0',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <CanvasDimsChip zoom="31%"/>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, padding: '40px 0 48px',
        }}>
          <div style={{
            width: cw, height: ch, position: 'relative',
            background: T.surface, borderRadius: 4,
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.08)',
            overflow: 'hidden',
          }}>
            <BackgroundArt/>
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px',
              background: 'rgba(15,31,24,0.7)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 6,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: 'rgba(250,246,238,0.9)', letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                border: `1.5px dashed ${T.accent}`,
              }}/>
              <span>no zones yet</span>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 12,
            color: T.inkSoft,
            boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
          }}>
            <EI.chevRight size={12} sw={2}/>
            <span>Start by adding a text field or photo zone from the left.</span>
          </div>
        </div>
        <CanvasBottomBar/>
      </div>
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
        <EventPanel/>
        <LayersEmpty/>
        <ShortcutsBlock/>
      </div>
    );
  }

  window.EditorD21 = function EditorD21({ width = 1280, height = 860 }) {
    return (
      <div style={{
        width, height,
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <TopBar saveState="saved"/>
        <VariantTabs active="Attendee" counts={{ Attendee: 0 }} tabs={[{ name: 'Attendee' }]}/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftRail/>
          <CanvasArea/>
          <RightSidebar/>
        </div>
      </div>
    );
  };
})();
