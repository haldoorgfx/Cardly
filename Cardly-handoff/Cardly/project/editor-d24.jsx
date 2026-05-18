// editor-d24.jsx — D2.4 · Custom field (Dropdown type) selected.

(function(){
  const { tokens: T, EI, TopBar, VariantTabs, LeftRail, BackgroundArt,
          CanvasBottomBar, CanvasDimsChip, SectionLabel,
          PanelCard, TextInput, ShortcutsBlock } = window.ES;

  // ─── Zones on canvas ───
  function UnselectedTextZone({ scale }) {
    const Z = { x: 80, y: 1180, w: 920, h: 200 };
    const left = Z.x*scale, top = Z.y*scale, w = Z.w*scale, h = Z.h*scale;
    return (
      <>
        <div style={{
          position: 'absolute', left, top: top-18,
          padding: '1px 5px',
          background: 'rgba(15,31,24,0.6)', color: 'rgba(250,246,238,0.85)',
          backdropFilter: 'blur(4px)',
          borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
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
            fontSize: 24, color: T.cream, opacity: 0.4,
          }}>Your name</div>
        </div>
      </>
    );
  }

  function UnselectedPhotoZone({ scale }) {
    const Z = { x: 400, y: 120, w: 280, h: 280 };
    const left = Z.x*scale, top = Z.y*scale, w = Z.w*scale, h = Z.h*scale;
    return (
      <>
        <div style={{
          position: 'absolute', left, top: top-18,
          padding: '1px 5px',
          background: 'rgba(15,31,24,0.6)', color: 'rgba(250,246,238,0.85)',
          backdropFilter: 'blur(4px)',
          borderRadius: 3,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
        }}>headshot</div>
        <div style={{
          position: 'absolute', left, top, width: w, height: h,
          border: `1.5px dashed rgba(31,77,58,0.55)`,
          zIndex: 1,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: 'rgba(232,239,235,0.7)',
            border: `2px solid rgba(232,197,126,0.7)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.muted, opacity: 0.7,
          }}>
            <EI.image size={28} sw={1.4}/>
          </div>
        </div>
      </>
    );
  }

  function SelectedCustomZone({ scale }) {
    const Z = { x: 80, y: 1420, w: 920, h: 110 };
    const left = Z.x*scale, top = Z.y*scale, w = Z.w*scale, h = Z.h*scale;
    return (
      <>
        <div style={{
          position: 'absolute', left, top: top-22,
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '2px 7px',
          background: T.primary, color: T.cream,
          borderRadius: 4,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
          textTransform: 'lowercase', letterSpacing: '0.06em',
          zIndex: 3, whiteSpace: 'nowrap',
        }}>
          <EI.list size={10} sw={2}/>
          <span>role · custom · dropdown</span>
          <span style={{ color: 'rgba(250,246,238,0.55)', marginLeft: 2 }}>req · 5 opts</span>
        </div>

        <div style={{
          position: 'absolute', left, top, width: w, height: h,
          border: `2px solid ${T.primary}`,
          background: 'rgba(31,77,58,0.04)',
          zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '0 20px',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            fontSize: 18, color: T.cream, opacity: 0.7,
          }}>Speaker</div>
          <div style={{
            opacity: 0.65, color: T.cream,
          }}><EI.chevDown size={14} sw={2}/></div>
        </div>

        {(() => {
          const ps = [
            { l: left, t: top, c: 'nwse-resize' },
            { l: left + w/2, t: top, c: 'ns-resize' },
            { l: left + w, t: top, c: 'nesw-resize' },
            { l: left + w, t: top + h/2, c: 'ew-resize' },
            { l: left + w, t: top + h, c: 'nwse-resize' },
            { l: left + w/2, t: top + h, c: 'ns-resize' },
            { l: left, t: top + h, c: 'nesw-resize' },
            { l: left, t: top + h/2, c: 'ew-resize' },
          ];
          return ps.map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: p.l - 5, top: p.t - 5,
              width: 10, height: 10,
              background: T.surface, border: `2px solid ${T.primary}`,
              borderRadius: 2, zIndex: 4, cursor: p.c,
            }}/>
          ));
        })()}

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
            <UnselectedPhotoZone scale={scale}/>
            <UnselectedTextZone scale={scale}/>
            <SelectedCustomZone scale={scale}/>
          </div>
        </div>
        <CanvasBottomBar/>
      </div>
    );
  }

  // ─── Inputs reused ───
  function NumberInput({ value, suffix, label }) {
    return (
      <div style={{
        height: 28, padding: '0 8px',
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 4,
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

  function SelectField({ value, hint }) {
    return (
      <div style={{
        height: 32, padding: '0 10px',
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{
          flex: 1,
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
          color: T.ink,
        }}>{value}</span>
        {hint && <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
        }}>{hint}</span>}
        <EI.chevDown size={14}/>
      </div>
    );
  }

  function TypeSelector({ active }) {
    const opts = [
      { v: 'text',     label: 'Text',     icon: <EI.text size={13}/> },
      { v: 'dropdown', label: 'Dropdown', icon: <EI.list size={13}/> },
      { v: 'date',     label: 'Date',     icon: <EI.grid size={13}/> },
      { v: 'email',    label: 'Email',    icon: <EI.refresh size={13}/> },
    ];
    return (
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
      }}>
        {opts.map(o => {
          const sel = o.v === active;
          return (
            <button key={o.v} style={{
              height: 36, padding: '0 10px',
              background: sel ? T.primarySoft : T.surface,
              border: `1px solid ${sel ? 'rgba(31,77,58,0.25)' : T.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: sel ? T.primary : T.inkSoft,
              fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: sel ? 600 : 500,
            }}>
              {o.icon}<span>{o.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function ColorPicker({ hex }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 4,
          background: hex, border: `1px solid ${T.border}`, flexShrink: 0,
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

  // ─── Option row (reorderable) ───
  function OptionRow({ label, isDefault, dragging }) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 6px',
        background: T.surface,
        border: `1px solid ${dragging ? T.primary : T.border}`,
        boxShadow: dragging ? '0 4px 12px rgba(15,31,24,0.12)' : 'none',
        borderRadius: 6,
        transform: dragging ? 'translateY(-1px)' : 'none',
      }}>
        <div style={{
          width: 14, color: T.borderStrong, cursor: 'grab',
          display: 'flex', flexDirection: 'column', gap: 1.5, paddingTop: 1,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 1.5 }}>
              <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 1 }}/>
              <span style={{ width: 2, height: 2, background: 'currentColor', borderRadius: 1 }}/>
            </div>
          ))}
        </div>
        <div style={{
          flex: 1, minWidth: 0,
          fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
          color: T.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{label}</div>
        {isDefault && <span style={{
          padding: '1px 6px',
          background: T.primarySoft, color: T.primary,
          borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
          letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
        }}>Default</span>}
        <button title="Remove option" style={{
          width: 22, height: 22, borderRadius: 4,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: T.muted,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><EI.x size={12} sw={2}/></button>
      </div>
    );
  }

  function CustomFieldProperties() {
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
            }}><EI.list size={13}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Custom field</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
                color: T.ink, letterSpacing: '-0.01em',
              }}>Role</div>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted, letterSpacing: '0.04em',
            }}>#z_03</div>
          </div>
        </div>

        <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PanelCard label="Label"><TextInput value="Role"/></PanelCard>

          <PanelCard label="Type">
            <TypeSelector active="dropdown"/>
          </PanelCard>

          <PanelCard label="Options" trailing={
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: T.muted,
            }}>5</span>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <OptionRow label="Speaker" isDefault/>
              <OptionRow label="Attendee"/>
              <OptionRow label="Sponsor" dragging/>
              <OptionRow label="Exhibitor"/>
              <OptionRow label="VIP"/>
            </div>
            <button style={{
              width: '100%', marginTop: 8,
              height: 32, padding: '0 10px',
              background: T.cream, color: T.primary,
              border: `1px dashed ${T.borderStrong}`, borderRadius: 6,
              fontFamily: 'Inter, sans-serif', fontSize: 12.5, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              cursor: 'pointer',
            }}><EI.plus size={12} sw={2.2}/><span>Add option</span></button>
          </PanelCard>

          <PanelCard label="Default value">
            <SelectField value="Speaker"/>
          </PanelCard>

          <PanelCard label="Required" trailing={<Toggle on/>}>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: T.muted,
            }}>Attendee must pick an option.</div>
          </PanelCard>

          <PanelCard label="Typography">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SelectField value="Inter" hint="Aa"/>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ flex: 1 }}><SelectField value="Medium 500"/></div>
                <div style={{ width: 70 }}><NumberInput value="28" suffix="px"/></div>
              </div>
              <div style={{
                display: 'inline-flex',
                background: T.cream,
                border: `1px solid ${T.border}`, borderRadius: 6,
                padding: 2, gap: 2,
              }}>
                {[
                  { v: 'left',   icon: <EI.alignLeft size={13}/> },
                  { v: 'center', icon: <EI.alignCenter size={13}/> },
                  { v: 'right',  icon: <EI.alignRight size={13}/> },
                ].map(o => (
                  <button key={o.v} style={{
                    height: 26, minWidth: 36, padding: '0 8px',
                    background: o.v === 'center' ? T.surface : 'transparent',
                    border: o.v === 'center' ? `1px solid ${T.border}` : '1px solid transparent',
                    borderRadius: 4, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    color: o.v === 'center' ? T.ink : T.muted,
                  }}>{o.icon}</button>
                ))}
              </div>
            </div>
          </PanelCard>

          <PanelCard label="Color"><ColorPicker hex="#FAF6EE"/></PanelCard>

          <PanelCard label="Position">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <NumberInput label="X" value="80"   suffix="px"/>
              <NumberInput label="Y" value="1420" suffix="px"/>
              <NumberInput label="W" value="920"  suffix="px"/>
              <NumberInput label="H" value="110"  suffix="px"/>
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

  function LayersList({ selectedId = 'z_03' }) {
    const layers = [
      { id: 'z_03', label: 'Role',      type: 'dropdown', icon: <EI.list size={12}/>,  visible: true,  locked: false },
      { id: 'z_02', label: 'Headshot',  type: 'photo',    icon: <EI.photo size={12}/>, visible: true,  locked: false },
      { id: 'z_01', label: 'Full Name', type: 'text',     icon: <EI.text size={12}/>,  visible: true,  locked: false },
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
        <CustomFieldProperties/>
        <LayersList/>
        <ShortcutsBlock/>
      </div>
    );
  }

  window.EditorD24 = function EditorD24({ width = 1280, height = 860 }) {
    return (
      <div style={{
        width, height,
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <TopBar saveState="saved"/>
        <VariantTabs active="Attendee" counts={{ Attendee: 3 }} tabs={[{ name: 'Attendee' }]}/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftRail/>
          <CanvasArea/>
          <RightSidebar/>
        </div>
      </div>
    );
  };
})();
