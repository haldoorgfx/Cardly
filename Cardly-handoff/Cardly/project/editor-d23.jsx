// editor-d23.jsx — D2.3 · Photo zone selected (Circle shape, border ON)

(function(){
  const { tokens: T, EI, TopBar, VariantTabs, LeftRail, BackgroundArt,
          CanvasBottomBar, CanvasDimsChip, SectionLabel,
          PanelCard, TextInput, ShortcutsBlock } = window.ES;

  // ─── Selected photo zone ───
  function SelectedPhotoZone({ scale }) {
    // Position: top-right area of the card, 280×280 circle
    const Z = { x: 400, y: 120, w: 280, h: 280 };
    const left = Z.x * scale, top = Z.y * scale, w = Z.w * scale, h = Z.h * scale;
    return (
      <>
        {/* Floating mono label above zone */}
        <div style={{
          position: 'absolute',
          left, top: top - 22,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '2px 7px',
          background: T.primary, color: T.cream,
          borderRadius: 4,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
          textTransform: 'lowercase', letterSpacing: '0.06em',
          zIndex: 3, whiteSpace: 'nowrap',
        }}>
          <EI.photo size={10} sw={2}/>
          <span>headshot · photo</span>
          <span style={{ color: 'rgba(250,246,238,0.55)', marginLeft: 2 }}>req</span>
        </div>

        {/* Bounding box (square — the shape's bounding rect) */}
        <div style={{
          position: 'absolute', left, top, width: w, height: h,
          border: `2px dashed ${T.primary}`,
          zIndex: 2,
        }}>
          {/* Circular fill inside */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: T.primarySoft,
            border: `3px solid ${T.accent}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.muted,
          }}>
            <EI.image size={36} sw={1.4}/>
          </div>
        </div>

        {/* 8 resize handles around bounding box */}
        {(() => {
          const positions = [
            { l: left, t: top, cursor: 'nwse-resize' },
            { l: left + w/2, t: top, cursor: 'ns-resize' },
            { l: left + w, t: top, cursor: 'nesw-resize' },
            { l: left + w, t: top + h/2, cursor: 'ew-resize' },
            { l: left + w, t: top + h, cursor: 'nwse-resize' },
            { l: left + w/2, t: top + h, cursor: 'ns-resize' },
            { l: left, t: top + h, cursor: 'nesw-resize' },
            { l: left, t: top + h/2, cursor: 'ew-resize' },
          ];
          return positions.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: p.l - 5, top: p.t - 5,
              width: 10, height: 10,
              background: T.surface, border: `2px solid ${T.primary}`,
              borderRadius: 2, zIndex: 4, cursor: p.cursor,
            }}/>
          ));
        })()}

        {/* Dimension readout */}
        <div style={{
          position: 'absolute',
          left: left + w + 8, top: top + h - 16,
          padding: '2px 6px',
          background: T.ink, color: T.cream,
          borderRadius: 4,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
          whiteSpace: 'nowrap', zIndex: 4,
        }}>{Z.w} × {Z.h}</div>
      </>
    );
  }

  // Unselected text zone (rendered below the photo zone in z-order — dashed only)
  function UnselectedTextZone({ scale }) {
    const Z = { x: 80, y: 1180, w: 920, h: 200 };
    const left = Z.x * scale, top = Z.y * scale, w = Z.w * scale, h = Z.h * scale;
    return (
      <>
        <div style={{
          position: 'absolute',
          left, top: top - 18,
          padding: '1px 5px',
          background: 'rgba(15,31,24,0.6)', color: 'rgba(250,246,238,0.85)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          letterSpacing: '0.04em',
        }}>full_name</div>
        <div style={{
          position: 'absolute', left, top, width: w, height: h,
          border: `1.5px dashed rgba(31,77,58,0.55)`,
          background: 'rgba(31,77,58,0.02)',
          zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
            fontSize: 24, letterSpacing: '-0.02em',
            color: T.cream, textAlign: 'center', opacity: 0.4,
          }}>Your name</div>
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
        backgroundSize: '14px 14px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <CanvasDimsChip zoom="31%"/>
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
            <UnselectedTextZone scale={scale}/>
            <SelectedPhotoZone scale={scale}/>
          </div>
        </div>
        <CanvasBottomBar/>
      </div>
    );
  }

  // ─── Reused property-panel primitives ───
  function NumberInput({ value, suffix, label }) {
    return (
      <div style={{
        height: 28, position: 'relative',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
        display: 'flex', alignItems: 'center',
        padding: '0 8px', gap: 4,
      }}>
        {label && <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: T.muted, textTransform: 'uppercase', minWidth: 12,
        }}>{label}</span>}
        <span style={{
          flex: 1, textAlign: 'right',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: T.ink, fontWeight: 500,
        }}>{value}</span>
        {suffix && <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
        }}>{suffix}</span>}
      </div>
    );
  }

  function Toggle({ on }) {
    return (
      <div style={{
        width: 32, height: 18, borderRadius: 999,
        background: on ? T.primary : T.borderStrong,
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: T.surface,
          boxShadow: '0 1px 2px rgba(15,31,24,0.2)',
        }}/>
      </div>
    );
  }

  function ColorPicker({ hex }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          background: hex, border: `1px solid ${T.border}`,
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)', flexShrink: 0,
        }}/>
        <div style={{
          flex: 1, height: 28, padding: '0 8px',
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
          display: 'flex', alignItems: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: T.ink, fontWeight: 500, textTransform: 'uppercase',
        }}>{hex}</div>
      </div>
    );
  }

  function SliderRow({ value, max, suffix }) {
    const pct = (value / max) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 28 }}>
        <div style={{ position: 'relative', flex: 1, height: 28, display: 'flex', alignItems: 'center' }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 999,
            background: T.border,
          }}/>
          <div style={{
            position: 'absolute', left: 0, width: `${pct}%`, height: 4, borderRadius: 999,
            background: T.primary,
          }}/>
          <div style={{
            position: 'absolute', left: `calc(${pct}% - 7px)`,
            width: 14, height: 14, borderRadius: '50%',
            background: T.surface, border: `2px solid ${T.primary}`,
            boxShadow: '0 1px 2px rgba(15,31,24,0.15)',
          }}/>
        </div>
        <div style={{
          width: 56, height: 28,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 8px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: T.ink, fontWeight: 500,
        }}>
          <span>{value}</span>
          <span style={{ color: T.muted, fontSize: 10 }}>{suffix}</span>
        </div>
      </div>
    );
  }

  function LayerBtn({ icon, title }) {
    return (
      <button title={title} style={{
        height: 28, flex: 1,
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: T.inkSoft,
      }}>{icon}</button>
    );
  }

  function ActionBtn({ icon, label, danger }) {
    return (
      <button style={{
        flex: 1, height: 32, padding: '0 8px',
        background: T.surface,
        border: `1px solid ${danger ? 'rgba(184,66,60,0.3)' : T.border}`,
        borderRadius: 6,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
        color: danger ? T.danger : T.inkSoft,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}>{icon}<span>{label}</span></button>
    );
  }

  // ─── SHAPE picker (4 tile buttons with preview icons) ───
  function ShapeTile({ shape, active, label }) {
    const sw = 18;
    const previewStyle = {
      width: sw, height: sw, flexShrink: 0,
      background: active ? T.primary : T.borderStrong,
      transition: 'background .12s',
    };
    let preview;
    if (shape === 'circle')  preview = <div style={{ ...previewStyle, borderRadius: '50%' }}/>;
    else if (shape === 'square') preview = <div style={{ ...previewStyle, borderRadius: 0 }}/>;
    else if (shape === 'rounded') preview = <div style={{ ...previewStyle, borderRadius: 5 }}/>;
    else if (shape === 'hex') preview = (
      <svg width={sw} height={sw} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
        <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" fill={active ? T.primary : T.borderStrong}/>
      </svg>
    );
    return (
      <button style={{
        flex: 1, padding: '8px 6px',
        background: active ? T.primarySoft : T.surface,
        border: `1px solid ${active ? 'rgba(31,77,58,0.25)' : T.border}`,
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
      }}>
        {preview}
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
          textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600,
          color: active ? T.primary : T.inkSoft,
        }}>{label}</span>
      </button>
    );
  }

  function PhotoZoneProperties() {
    return (
      <>
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
            }}>Event / Attendee</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 4,
              background: T.primarySoft, color: T.primary,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><EI.photo size={13}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Photo zone</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
                color: T.ink, letterSpacing: '-0.01em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>Headshot</div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted, letterSpacing: '0.04em',
            }}>#z_02</div>
          </div>
        </div>

        <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PanelCard label="Label"><TextInput value="Headshot"/></PanelCard>

          <PanelCard label="Required" trailing={<Toggle on/>}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: T.muted,
            }}>Attendee must upload a photo.</div>
          </PanelCard>

          <PanelCard label="Shape">
            <div style={{ display: 'flex', gap: 6 }}>
              <ShapeTile shape="circle" label="Circle" active/>
              <ShapeTile shape="square" label="Square"/>
              <ShapeTile shape="rounded" label="Round"/>
              <ShapeTile shape="hex" label="Hex"/>
            </div>
            <div style={{
              marginTop: 10, padding: '6px 8px',
              background: T.cream, borderRadius: 4,
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted, letterSpacing: '0.04em',
            }}>Crop frame will match this shape.</div>
          </PanelCard>

          <PanelCard label="Border" trailing={<Toggle on/>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ColorPicker hex="#E8C57E"/>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: T.muted, textTransform: 'uppercase', minWidth: 38,
                }}>Width</div>
                <div style={{ flex: 1 }}>
                  <SliderRow value={6} max={10} suffix="px"/>
                </div>
              </div>
            </div>
          </PanelCard>

          <PanelCard label="Position">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <NumberInput label="X" value="400" suffix="px"/>
              <NumberInput label="Y" value="120" suffix="px"/>
              <NumberInput label="W" value="280" suffix="px"/>
              <NumberInput label="H" value="280" suffix="px"/>
            </div>
            <div style={{
              marginTop: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted,
            }}>
              <span>aspect locked · 1:1</span>
              <button style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.primary, fontWeight: 600, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                fontFamily: 'JetBrains Mono, monospace',
              }}>Unlock</button>
            </div>
          </PanelCard>

          <PanelCard label="Layer">
            <div style={{ display: 'flex', gap: 6 }}>
              <LayerBtn title="Bring forward · ]" icon={<EI.bringForward size={14}/>}/>
              <LayerBtn title="Send back · [" icon={<EI.sendBack size={14}/>}/>
              <LayerBtn title="Bring to front · ⇧]" icon={<EI.bringFront size={14}/>}/>
              <LayerBtn title="Send to back · ⇧[" icon={<EI.sendBottom size={14}/>}/>
            </div>
          </PanelCard>

          <div style={{ display: 'flex', gap: 6 }}>
            <ActionBtn icon={<EI.copy size={13}/>} label="Duplicate"/>
            <ActionBtn icon={<EI.lockOpen size={13}/>} label="Lock"/>
            <ActionBtn icon={<EI.trash size={13}/>} label="Delete" danger/>
          </div>
        </div>
      </>
    );
  }

  function LayersList({ selectedId = 'z_02' }) {
    const layers = [
      { id: 'z_02', label: 'Headshot',  type: 'photo', icon: <EI.photo size={12}/>, visible: true, locked: false },
      { id: 'z_01', label: 'Full Name', type: 'text',  icon: <EI.text size={12}/>,  visible: true, locked: false },
    ];
    return (
      <>
        <div style={{ padding: '4px 14px 8px' }}>
          <SectionLabel count={layers.length}>Layers</SectionLabel>
        </div>
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {layers.map(l => {
            const sel = l.id === selectedId;
            return (
              <div key={l.id} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 32, padding: '0 8px',
                background: sel ? T.primarySoft : T.surface,
                border: `1px solid ${sel ? 'rgba(31,77,58,0.2)' : T.border}`,
                borderRadius: 6, cursor: 'pointer',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: sel ? T.primary : T.cream,
                  color: sel ? T.cream : T.inkSoft,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{l.icon}</div>
                <div style={{
                  flex: 1, minWidth: 0,
                  fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: sel ? 600 : 500,
                  color: sel ? T.primary : T.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{l.label}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
                  color: T.muted, letterSpacing: '0.04em',
                }}>{l.type}</div>
                <button title="Toggle visibility" style={{
                  width: 22, height: 22, borderRadius: 4,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: l.visible ? T.inkSoft : T.borderStrong,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{l.visible ? <EI.eye size={12}/> : <EI.eyeOff size={12}/>}</button>
                <button title="Lock" style={{
                  width: 22, height: 22, borderRadius: 4,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: l.locked ? T.primary : T.borderStrong,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{l.locked ? <EI.lock size={12}/> : <EI.lockOpen size={12}/>}</button>
              </div>
            );
          })}
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
        <PhotoZoneProperties/>
        <LayersList/>
        <ShortcutsBlock/>
      </div>
    );
  }

  window.EditorD23 = function EditorD23({ width = 1280, height = 860 }) {
    return (
      <div style={{
        width, height,
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <TopBar saveState="saved"/>
        <VariantTabs active="Attendee" counts={{ Attendee: 2 }} tabs={[{ name: 'Attendee' }]}/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftRail/>
          <CanvasArea/>
          <RightSidebar/>
        </div>
      </div>
    );
  };
})();
