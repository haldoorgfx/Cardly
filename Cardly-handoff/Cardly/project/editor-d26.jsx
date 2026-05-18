// editor-d26.jsx — D2.6 · Preview as Attendee mode

(function(){
  const { tokens: T, EI, LeftRail, BackgroundArt,
          CanvasDimsChip, SectionLabel,
          PanelCard, TextInput, ShortcutsBlock,
          iconBtnStyle, ghostBtnStyle, kbdStyle } = window.ES;

  // ─── Preview top bar (Edit/Preview toggle prominent) ───
  function TopBarPreview() {
    return (
      <div style={{
        height: 52, flexShrink: 0,
        background: T.surface,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 16px', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <button style={{
            width: 30, height: 30, borderRadius: 6,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.inkSoft,
          }}><EI.back size={16}/></button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'Inter, sans-serif', fontSize: 13,
          }}>
            <span style={{ color: T.muted }}>Events</span>
            <span style={{ color: T.borderStrong }}>/</span>
            <span style={{ color: T.ink, fontWeight: 600 }}>5th Pan-African Youth Forum</span>
            <span style={{ color: T.borderStrong }}>/</span>
            <span style={{ color: T.primary, fontWeight: 600 }}>Preview</span>
          </div>
        </div>

        {/* Center: Edit / Preview toggle */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: T.cream,
          border: `1px solid ${T.border}`, borderRadius: 8,
          padding: 3, gap: 2,
        }}>
          <button style={{
            height: 28, padding: '0 14px',
            background: 'transparent',
            border: 'none', borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            color: T.inkSoft, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/>
            </svg>
            <span>Edit</span>
          </button>
          <button style={{
            height: 28, padding: '0 14px',
            background: T.primarySoft,
            border: '1px solid rgba(31,77,58,0.2)', borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 13,
            color: T.primary, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <EI.eye size={14}/>
            <span>Preview</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* device width pills (preview helpers) */}
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            height: 28, padding: 2,
            background: T.cream, border: `1px solid ${T.border}`, borderRadius: 6, gap: 2,
          }}>
            <DevicePill label="Mobile" active/>
            <DevicePill label="Story"/>
            <DevicePill label="Square"/>
          </div>
          <button style={ghostBtnStyle()}><EI.refresh size={14}/><span>Reset data</span></button>
          <button style={{
            height: 32, padding: '0 14px',
            background: T.primary, color: T.cream,
            border: 'none', borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}><span>Publish</span></button>
        </div>
      </div>
    );
  }

  function DevicePill({ label, active }) {
    return (
      <button style={{
        height: 22, padding: '0 8px',
        background: active ? T.surface : 'transparent',
        border: active ? `1px solid ${T.border}` : '1px solid transparent',
        borderRadius: 4,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        fontWeight: 600,
        color: active ? T.ink : T.muted,
        cursor: 'pointer',
      }}>{label}</button>
    );
  }

  // ─── Filled-in zones (no editor chrome) ───
  function FilledZones({ scale }) {
    const Photo = { x: 400, y: 120, w: 280, h: 280 };
    const Name  = { x: 80,  y: 1180, w: 920, h: 200 };
    const Role  = { x: 80,  y: 1420, w: 920, h: 110 };
    const s = (z) => ({ left: z.x*scale, top: z.y*scale, w: z.w*scale, h: z.h*scale });
    const ph = s(Photo), nm = s(Name), rl = s(Role);

    return (
      <>
        {/* Photo zone — rendered with portrait */}
        <div style={{
          position: 'absolute', left: ph.left, top: ph.top, width: ph.w, height: ph.h,
          borderRadius: '50%', overflow: 'hidden',
          border: `3px solid ${T.accent}`,
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
        }}>
          <PortraitSVG/>
        </div>

        {/* Full Name */}
        <div style={{
          position: 'absolute', left: nm.left, top: nm.top, width: nm.w, height: nm.h,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
            fontSize: 24, letterSpacing: '-0.02em',
            color: T.cream, textAlign: 'center',
          }}>Aisha Ahmed</div>
        </div>

        {/* Role */}
        <div style={{
          position: 'absolute', left: rl.left, top: rl.top, width: rl.w, height: rl.h,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            fontSize: 16,
            color: 'rgba(232,197,126,0.95)', textAlign: 'center',
            letterSpacing: '0.04em',
          }}>Speaker</div>
        </div>
      </>
    );
  }

  function PortraitSVG() {
    return (
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="prv-bg" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#f0d9a8"/>
            <stop offset="60%" stopColor="#c69a5e"/>
            <stop offset="100%" stopColor="#6b4a26"/>
          </radialGradient>
          <linearGradient id="prv-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a87645"/><stop offset="100%" stopColor="#724b25"/>
          </linearGradient>
          <linearGradient id="prv-shirt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1f4d3a"/><stop offset="100%" stopColor="#0f2a1f"/>
          </linearGradient>
        </defs>
        <rect width="100" height="100" fill="url(#prv-bg)"/>
        <path d="M 0 100 L 0 86 C 16 74 26 72 50 72 C 74 72 84 74 100 86 L 100 100 Z" fill="url(#prv-shirt)"/>
        <ellipse cx="50" cy="48" rx="22" ry="26" fill="url(#prv-skin)"/>
        <path d="M 28 44 C 28 30 38 24 50 24 C 62 24 72 30 72 44 C 72 40 70 36 65 35 C 60 33 55 35 50 35 C 45 35 40 33 35 35 C 30 36 28 40 28 44 Z" fill="#2c1a0e"/>
      </svg>
    );
  }

  // ─── Canvas (no chrome, no bottom bar) ───
  function CanvasArea() {
    const scale = 0.36; // a bit bigger since no bottom bar
    const cw = 1080*scale, ch = 1920*scale;
    return (
      <div style={{
        flex: 1, position: 'relative',
        background: T.canvasBg,
        backgroundImage: `radial-gradient(${T.borderStrong} 0.8px, transparent 0.8px)`,
        backgroundSize: '14px 14px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* preview banner */}
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 12px',
          background: T.primary, color: T.cream,
          borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600,
          zIndex: 2,
          boxShadow: '0 6px 20px rgba(31,77,58,0.25)',
        }}>
          <EI.eye size={12} sw={2}/>
          <span>Preview mode · Attendee</span>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 0 32px',
        }}>
          <div style={{
            width: cw, height: ch, position: 'relative',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 24px 60px rgba(31,77,58,0.16)',
            borderRadius: 10, overflow: 'hidden',
          }}>
            <BackgroundArt/>
            <FilledZones scale={scale}/>
          </div>

          {/* small attendee-side footer hint */}
          <div style={{
            marginTop: 16,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px',
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 12,
            color: T.inkSoft,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.success }}/>
            <span>This is what attendees will see after filling the form.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Test data panel ───
  function TestDataPanel() {
    return (
      <>
        <div style={{
          padding: '14px 14px 12px',
          borderBottom: `1px solid ${T.border}`,
          background: T.cream,
          position: 'sticky', top: 0, zIndex: 3,
        }}>
          <button style={{
            height: 26, padding: '0 8px',
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
            color: T.inkSoft, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            marginBottom: 10,
          }}>
            <EI.chevLeft size={12} sw={2}/>
            <span>Back to Edit</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 4,
              background: T.primarySoft, color: T.primary,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}><EI.eye size={13}/></div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Test as attendee</div>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
                color: T.ink, letterSpacing: '-0.01em',
              }}>Attendee variant</div>
            </div>
          </div>
          <div style={{
            marginTop: 8,
            fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.45,
            color: T.muted,
          }}>Fill in test data to see how the card will look to an attendee.</div>
        </div>

        <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Full Name */}
          <PanelCard label="Full Name · text">
            <TextInput value="Aisha Ahmed"/>
          </PanelCard>

          {/* Role */}
          <PanelCard label="Role · dropdown">
            <div style={{
              height: 32, padding: '0 10px',
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                flex: 1,
                fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                color: T.ink,
              }}>Speaker</span>
              <EI.chevDown size={14}/>
            </div>
          </PanelCard>

          {/* Photo */}
          <PanelCard label="Headshot · photo">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                border: `1px solid ${T.border}`,
                overflow: 'hidden', flexShrink: 0,
                background: T.cream,
              }}>
                <PortraitSVG/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
                  color: T.ink,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>aisha-portrait.jpg</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: T.muted, marginTop: 1, letterSpacing: '0.02em',
                }}>cropped · 1:1</div>
                <button style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: T.primary, padding: 0, marginTop: 4,
                  fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}>
                  <EI.refresh size={11}/><span>Replace test photo</span>
                </button>
              </div>
            </div>
          </PanelCard>

          {/* Live indicator */}
          <div style={{
            padding: '10px 12px',
            background: T.primarySoft,
            border: '1px solid rgba(31,77,58,0.18)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: T.success,
              boxShadow: '0 0 0 0 rgba(45,122,79,0.4)',
              animation: 'pulse-d26 1.6s ease-out infinite',
              flexShrink: 0,
            }}/>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: T.primary, letterSpacing: '0.06em', textTransform: 'uppercase',
                fontWeight: 600,
              }}>Live</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 12,
                color: T.ink, marginTop: 2,
              }}>Canvas updates as you type.</div>
            </div>
          </div>

          {/* Variant switcher within preview */}
          <div style={{
            paddingTop: 6, marginTop: 4,
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '8px 0 6px',
            }}>Preview variant</div>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {[
                { name: 'Attendee', count: 3, active: true },
                { name: 'Speaker', count: 4, active: false },
                { name: 'Sponsor', count: 2, active: false },
              ].map(v => (
                <button key={v.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 32, padding: '0 10px',
                  background: v.active ? T.surface : 'transparent',
                  border: `1px solid ${v.active ? T.border : 'transparent'}`,
                  borderRadius: 6, cursor: 'pointer',
                }}>
                  <div style={{
                    width: 14, height: 18, borderRadius: 2,
                    background: v.active ? T.primary : T.borderStrong, flexShrink: 0,
                  }}/>
                  <span style={{
                    flex: 1, textAlign: 'left',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500,
                    color: v.active ? T.ink : T.inkSoft,
                  }}>{v.name}</span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                    color: T.muted,
                  }}>{v.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset action */}
          <button style={{
            marginTop: 8,
            width: '100%', height: 36, padding: '0 12px',
            background: T.surface, color: T.inkSoft,
            border: `1px solid ${T.border}`, borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            cursor: 'pointer',
          }}>
            <EI.refresh size={13}/>
            <span>Reset test data</span>
          </button>
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
        <TestDataPanel/>
        <ShortcutsBlock/>
      </div>
    );
  }

  window.EditorD26 = function EditorD26({ width = 1280, height = 860 }) {
    return (
      <div style={{
        width, height,
        background: T.cream,
        fontFamily: 'Inter, sans-serif', color: T.ink,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <TopBarPreview/>
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <LeftRail collapsed/>
          <CanvasArea/>
          <RightSidebar/>
        </div>
        <style>{`@keyframes pulse-d26 {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,122,79,0.4); }
          50%      { box-shadow: 0 0 0 5px rgba(45,122,79,0); }
        }`}</style>
      </div>
    );
  };
})();
