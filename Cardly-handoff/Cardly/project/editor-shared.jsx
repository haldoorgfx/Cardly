// editor-shared.jsx — Shared building blocks for all D2.* editor screens.
// Exposes: window.ES = { tokens, icons, ...components }

(function(){

const edTokens = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', canvasBg: '#F5F1E6',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F', warning: '#C97A2D', danger: '#B8423C',
};

const ESvg = ({ children, size = 16, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const EI = {
  back: (p) => <ESvg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></ESvg>,
  undo: (p) => <ESvg {...p}><path d="M3 7v6h6"/><path d="M3 13a9 9 0 1 0 3-7"/></ESvg>,
  redo: (p) => <ESvg {...p}><path d="M21 7v6h-6"/><path d="M21 13a9 9 0 1 1-3-7"/></ESvg>,
  eye:  (p) => <ESvg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></ESvg>,
  eyeOff: (p) => <ESvg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></ESvg>,
  play: (p) => <ESvg {...p}><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></ESvg>,
  chevDown: (p) => <ESvg {...p}><polyline points="6 9 12 15 18 9"/></ESvg>,
  chevRight: (p) => <ESvg {...p}><polyline points="9 6 15 12 9 18"/></ESvg>,
  chevLeft: (p) => <ESvg {...p}><polyline points="15 18 9 12 15 6"/></ESvg>,
  chevUp: (p) => <ESvg {...p}><polyline points="18 15 12 9 6 15"/></ESvg>,
  plus: (p) => <ESvg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></ESvg>,
  minus: (p) => <ESvg {...p}><line x1="5" y1="12" x2="19" y2="12"/></ESvg>,
  x: (p) => <ESvg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></ESvg>,
  text: (p) => <ESvg {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></ESvg>,
  image: (p) => <ESvg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></ESvg>,
  photo: (p) => <ESvg {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></ESvg>,
  list: (p) => <ESvg {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></ESvg>,
  type: (p) => <ESvg {...p}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></ESvg>,
  shapes: (p) => <ESvg {...p}><rect x="3" y="3" width="8" height="8" rx="1"/><circle cx="17" cy="7" r="4"/><path d="M7 21l4-8h-8z"/></ESvg>,
  help: (p) => <ESvg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></ESvg>,
  grid: (p) => <ESvg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></ESvg>,
  magnet: (p) => <ESvg {...p}><path d="M6 3v8a6 6 0 0 0 12 0V3"/><line x1="6" y1="3" x2="10" y2="3"/><line x1="14" y1="3" x2="18" y2="3"/><line x1="6" y1="11" x2="10" y2="11"/><line x1="14" y1="11" x2="18" y2="11"/></ESvg>,
  hand: (p) => <ESvg {...p}><path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8"/></ESvg>,
  resize: (p) => <ESvg {...p}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></ESvg>,
  fit: (p) => <ESvg {...p}><path d="M9 3H5a2 2 0 0 0-2 2v4"/><path d="M21 9V5a2 2 0 0 0-2-2h-4"/><path d="M3 15v4a2 2 0 0 0 2 2h4"/><path d="M15 21h4a2 2 0 0 0 2-2v-4"/></ESvg>,
  check: (p) => <ESvg {...p}><polyline points="20 6 9 17 4 12"/></ESvg>,
  refresh: (p) => <ESvg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></ESvg>,
  lock:  (p) => <ESvg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></ESvg>,
  lockOpen: (p) => <ESvg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></ESvg>,
  copy: (p) => <ESvg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></ESvg>,
  trash: (p) => <ESvg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></ESvg>,
  alignLeft: (p) => <ESvg {...p}><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></ESvg>,
  alignCenter: (p) => <ESvg {...p}><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></ESvg>,
  alignRight: (p) => <ESvg {...p}><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></ESvg>,
  bringForward: (p) => <ESvg {...p}><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></ESvg>,
  sendBack: (p) => <ESvg {...p}><rect x="4" y="4" width="12" height="12" rx="2"/><path d="M20 8v10a2 2 0 0 1-2 2H8"/></ESvg>,
  bringFront: (p) => <ESvg {...p}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M2 12V4a2 2 0 0 1 2-2h8"/><path d="M22 12v8a2 2 0 0 1-2 2h-8"/></ESvg>,
  sendBottom: (p) => <ESvg {...p}><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M2 8V4a2 2 0 0 1 2-2h4"/><path d="M22 16v4a2 2 0 0 1-2 2h-4"/></ESvg>,
};

const kbdStyle = () => ({
  marginLeft: 4,
  padding: '1px 5px',
  background: edTokens.cream, color: edTokens.muted,
  border: `1px solid ${edTokens.border}`, borderRadius: 4,
  fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
  lineHeight: 1.2,
});
const iconBtnStyle = (active) => ({
  width: 30, height: 30, borderRadius: 6,
  background: active ? edTokens.primarySoft : 'transparent',
  border: 'none', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  color: active ? edTokens.primary : edTokens.inkSoft,
});
const ghostBtnStyle = () => ({
  height: 32, padding: '0 10px',
  background: 'transparent', color: edTokens.ink,
  border: `1px solid ${edTokens.border}`, borderRadius: 6,
  fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13,
  display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
});
const linkBtn = () => ({
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: edTokens.primary, padding: 0,
  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: 4,
});

// ─── Top bar ───
function TopBar({ saveState = 'saved' }) {
  return (
    <div style={{
      height: 52, flexShrink: 0,
      background: edTokens.surface,
      borderBottom: `1px solid ${edTokens.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <button style={{
          width: 30, height: 30, borderRadius: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: edTokens.inkSoft,
        }}><EI.back size={16}/></button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Inter, sans-serif', fontSize: 13,
        }}>
          <span style={{ color: edTokens.muted }}>Events</span>
          <span style={{ color: edTokens.borderStrong }}>/</span>
          <span style={{
            color: edTokens.ink, fontWeight: 600,
            maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>5th Pan-African Youth Forum</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Undo · ⌘Z" style={iconBtnStyle(false)}><EI.undo size={15}/></button>
        <button title="Redo · ⇧⌘Z" style={iconBtnStyle(true)}><EI.redo size={15}/></button>

        <SaveStatusPill state={saveState}/>

        <div style={{ width: 1, height: 22, background: edTokens.border, margin: '0 4px' }}/>

        <button style={ghostBtnStyle()}><EI.eye size={14}/><span>Preview</span><kbd style={kbdStyle()}>⌘P</kbd></button>
        <button style={ghostBtnStyle()}><EI.play size={14}/><span>Test</span></button>
        <button style={{
          height: 32, padding: '0 14px',
          background: edTokens.primary, color: edTokens.cream,
          border: 'none', borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }}><span>Publish</span></button>
      </div>
    </div>
  );
}

function SaveStatusPill({ state }) {
  const map = {
    saved:    { bg: edTokens.primarySoft, fg: edTokens.primary, dot: edTokens.success, text: 'Saved 2s ago' },
    saving:   { bg: '#FFF7E0', fg: '#8A5A20', dot: edTokens.warning, text: 'Saving…' },
    unsaved:  { bg: '#F6E3E1', fg: '#7A2A26', dot: edTokens.danger, text: 'Unsaved changes' },
  };
  const c = map[state] || map.saved;
  return (
    <div title="Last saved 10:38:42 PM" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      height: 28, padding: '0 10px',
      background: c.bg, color: c.fg,
      borderRadius: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot }}/>
      <span>{c.text}</span>
    </div>
  );
}

// ─── Variants tab row ───
function VariantTabs({ active = 'Attendee', dims = '1080 × 1920 px · Instagram Story', counts = { Attendee: 0 }, tabs = [{ name: 'Attendee' }] }) {
  return (
    <div style={{
      height: 40, flexShrink: 0,
      background: edTokens.cream,
      borderBottom: `1px solid ${edTokens.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 6,
    }}>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: edTokens.muted, letterSpacing: '0.1em',
        textTransform: 'uppercase', marginRight: 8,
      }}>Variants</div>
      {tabs.map(t => <VariantTab key={t.name} label={t.name} active={t.name === active} count={counts[t.name] ?? 0}/>)}
      <button style={{
        height: 28, padding: '0 10px',
        background: 'transparent', color: edTokens.inkSoft,
        border: `1px dashed ${edTokens.borderStrong}`, borderRadius: 6,
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
        display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
      }}><EI.plus size={12} sw={2.2}/><span>Add variant</span></button>
      <div style={{ flex: 1 }}/>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: edTokens.muted, letterSpacing: '0.04em',
      }}>{dims}</div>
    </div>
  );
}

function VariantTab({ label, active, count }) {
  return (
    <div style={{
      height: 28, padding: '0 10px 0 12px',
      background: active ? edTokens.surface : 'transparent',
      border: `1px solid ${active ? edTokens.border : 'transparent'}`,
      borderRadius: 6,
      display: 'inline-flex', alignItems: 'center', gap: 8,
      cursor: 'pointer', position: 'relative',
      boxShadow: active ? '0 1px 2px rgba(15,31,24,0.04)' : 'none',
    }}>
      {active && <div style={{
        position: 'absolute', left: 8, right: 8, bottom: -1,
        height: 2, background: edTokens.primary, borderRadius: 1,
      }}/>}
      <div style={{
        width: 14, height: 18, borderRadius: 2,
        background: active ? edTokens.primary : edTokens.borderStrong,
        flexShrink: 0,
      }}/>
      <span style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        color: active ? edTokens.ink : edTokens.inkSoft,
      }}>{label}</span>
      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: edTokens.muted,
      }}>{count}</span>
    </div>
  );
}

// ─── Left rail ───
function AddElementRow({ icon, label, sub }) {
  return (
    <button style={{
      width: '100%',
      padding: '8px 8px 8px 10px',
      background: edTokens.surface,
      border: `1px solid ${edTokens.border}`,
      borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
      cursor: 'grab', textAlign: 'left',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: edTokens.primarySoft, color: edTokens.primary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12.5,
          color: edTokens.ink, lineHeight: 1.2,
        }}>{label}</div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, color: edTokens.muted,
          marginTop: 2, lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{sub}</div>
      </div>
      <div style={{ color: edTokens.muted, opacity: 0.6 }}><EI.plus size={14} sw={2}/></div>
    </button>
  );
}

function LeftRail({ collapsed = false }) {
  if (collapsed) {
    return (
      <div style={{
        width: 60, flexShrink: 0,
        background: edTokens.cream,
        borderRight: `1px solid ${edTokens.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 6, padding: '14px 0',
      }}>
        {[EI.text, EI.photo, EI.list, EI.type, EI.image].map((Icon, i) => (
          <button key={i} style={{
            width: 36, height: 36, borderRadius: 6,
            background: edTokens.surface, border: `1px solid ${edTokens.border}`,
            color: edTokens.borderStrong, cursor: 'not-allowed',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.6,
          }}><Icon size={14}/></button>
        ))}
      </div>
    );
  }
  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: edTokens.cream,
      borderRight: `1px solid ${edTokens.border}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{ padding: '14px 12px 6px' }}><SectionLabel>Add element</SectionLabel></div>
      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <AddElementRow icon={<EI.text size={14}/>}    label="Text field"   sub="Name, title, country…"/>
        <AddElementRow icon={<EI.photo size={14}/>}   label="Photo zone"   sub="Headshot or logo"/>
        <AddElementRow icon={<EI.list size={14}/>}    label="Custom field" sub="Dropdown, badge, role…"/>
        <AddElementRow icon={<EI.type size={14}/>}    label="Static text"  sub="Fixed text on the card"/>
        <AddElementRow icon={<EI.image size={14}/>}   label="Image"        sub="PNG · JPG · SVG · GIF"/>
      </div>

      <div style={{ padding: '14px 12px 0' }}>
        <button style={{
          width: '100%', height: 32, padding: '0 8px',
          background: 'transparent', border: `1px solid ${edTokens.border}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: edTokens.inkSoft, cursor: 'pointer',
        }}>
          <EI.chevRight size={12} sw={2}/>
          <EI.shapes size={13}/>
          <span style={{ flex: 1, textAlign: 'left' }}>Decorative shapes</span>
          <span style={{ color: edTokens.muted, fontSize: 10 }}>4</span>
        </button>
      </div>

      <div style={{ flex: 1 }}/>

      <div style={{
        padding: 12,
        borderTop: `1px solid ${edTokens.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button title="Help · ⌘/" style={{
          width: 28, height: 28, borderRadius: 6,
          background: edTokens.surface, border: `1px solid ${edTokens.border}`,
          color: edTokens.inkSoft, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><EI.help size={14}/></button>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: edTokens.muted, letterSpacing: '0.04em',
        }}>Drag · drop to canvas</div>
      </div>
    </div>
  );
}

function SectionLabel({ children, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
      color: edTokens.muted, letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      <span>{children}</span>
      {count !== undefined && <span style={{ color: edTokens.muted, opacity: 0.7 }}>· {count}</span>}
    </div>
  );
}

// ─── Canvas chrome bits ───
function BackgroundArt() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(165deg, #1F4D3A 0%, #163828 60%, #2A6A50 100%)',
      color: edTokens.cream,
    }}>
      <svg viewBox="0 0 100 178" preserveAspectRatio="none" width="100%" height="100%"
           style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
        <defs>
          <radialGradient id="bart-shared" cx="80%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#E8C57E" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#E8C57E" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100" height="178" fill="url(#bart-shared)"/>
        <circle cx="90" cy="170" r="60" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
        <circle cx="90" cy="170" r="45" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
        <circle cx="90" cy="170" r="30" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
      </svg>
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: edTokens.accent, color: edTokens.primary,
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>AU</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 6.5,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: 'rgba(250,246,238,0.7)',
        }}>African Union · Youth Programme</div>
      </div>
      <div style={{ position: 'absolute', top: 90, left: 14, right: 14 }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 6,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: edTokens.accent, marginBottom: 4,
        }}>I'm attending</div>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 22, lineHeight: 1.0, letterSpacing: '-0.02em',
        }}>5th Pan-African<br/>Youth Forum</div>
      </div>
      <div style={{
        position: 'absolute', left: 14, right: 14, bottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 6, borderTop: '1px solid rgba(232,197,126,0.25)',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 6,
        color: 'rgba(250,246,238,0.7)', letterSpacing: '0.06em',
      }}>
        <span>4–6 NOV 2025</span><span>DJIBOUTI</span>
      </div>
    </div>
  );
}

function CanvasBottomBar({ zoom = '31%' }) {
  return (
    <div style={{
      height: 40, flexShrink: 0,
      background: edTokens.surface,
      borderTop: `1px solid ${edTokens.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 12px', gap: 8,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', height: 28,
        border: `1px solid ${edTokens.border}`, borderRadius: 6,
        background: edTokens.cream, overflow: 'hidden',
      }}>
        <button style={miniIconBtn()}><EI.minus size={12} sw={2.2}/></button>
        <div style={{
          padding: '0 10px', height: '100%',
          display: 'inline-flex', alignItems: 'center',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: edTokens.ink, fontWeight: 500,
          borderLeft: `1px solid ${edTokens.border}`,
          borderRight: `1px solid ${edTokens.border}`,
        }}>{zoom}</div>
        <button style={miniIconBtn()}><EI.plus size={12} sw={2.2}/></button>
      </div>
      <button style={ghostBtnSmall()}><EI.fit size={13}/><span>Fit</span></button>
      <div style={{ width: 1, height: 18, background: edTokens.border, margin: '0 4px' }}/>
      <ToggleChip icon={<EI.grid size={12}/>}   label="Grid" on/>
      <ToggleChip icon={<EI.magnet size={12}/>} label="Snap" on/>
      <div style={{ flex: 1 }}/>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: edTokens.muted, letterSpacing: '0.04em',
      }}>
        <EI.hand size={12}/>
        <span>space + drag to pan</span>
      </div>
    </div>
  );
}
function miniIconBtn() {
  return {
    width: 26, height: 26, padding: 0,
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    color: edTokens.inkSoft,
  };
}
function ghostBtnSmall() {
  return {
    height: 28, padding: '0 10px',
    background: edTokens.cream, color: edTokens.ink,
    border: `1px solid ${edTokens.border}`, borderRadius: 6,
    fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12,
    display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
  };
}
function ToggleChip({ icon, label, on }) {
  return (
    <button style={{
      height: 28, padding: '0 10px',
      background: on ? edTokens.primarySoft : edTokens.cream,
      color: on ? edTokens.primary : edTokens.inkSoft,
      border: `1px solid ${on ? 'rgba(31,77,58,0.18)' : edTokens.border}`,
      borderRadius: 6,
      fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500,
      display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
    }}>{icon}<span>{label}</span></button>
  );
}

// ─── Right-sidebar primitives ───
function PanelCard({ label, children, hint, trailing }) {
  return (
    <div style={{
      background: edTokens.surface,
      border: `1px solid ${edTokens.border}`,
      borderRadius: 6,
      padding: '10px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, gap: 8,
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: edTokens.muted, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>{label}</div>
        {trailing}
      </div>
      {children}
      {hint && <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 11, color: edTokens.muted,
        marginTop: 6,
      }}>{hint}</div>}
    </div>
  );
}

function TextInput({ value, mono, height = 32 }) {
  return (
    <div style={{
      height, padding: '0 10px',
      background: edTokens.surface,
      border: `1px solid ${edTokens.border}`,
      borderRadius: 6,
      display: 'flex', alignItems: 'center',
      fontFamily: mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
      fontSize: mono ? 11 : 13, fontWeight: mono ? 500 : 500,
      color: edTokens.ink,
    }}>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

function ChipRO({ children }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      height: 26, padding: '0 8px',
      background: edTokens.cream, color: edTokens.ink,
      border: `1px solid ${edTokens.border}`, borderRadius: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
      letterSpacing: '0.02em',
    }}>{children}</div>
  );
}

function ShortcutRow({ keys, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 2px',
      fontFamily: 'Inter, sans-serif', fontSize: 12,
      color: edTokens.inkSoft,
    }}>
      <span>{label}</span>
      <div style={{ display: 'inline-flex', gap: 3 }}>
        {keys.map((k, i) => (
          <kbd key={i} style={{
            padding: '1px 6px', minWidth: 18, textAlign: 'center',
            background: edTokens.surface, color: edTokens.ink,
            border: `1px solid ${edTokens.border}`, borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            fontWeight: 500, lineHeight: 1.4,
          }}>{k}</kbd>
        ))}
      </div>
    </div>
  );
}

function ShortcutsBlock() {
  return (
    <>
      <div style={{ padding: '18px 14px 8px' }}><SectionLabel>Shortcuts</SectionLabel></div>
      <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ShortcutRow keys={['click']} label="Select zone"/>
        <ShortcutRow keys={['drag']} label="Reposition"/>
        <ShortcutRow keys={['⌫']} label="Delete"/>
        <ShortcutRow keys={['⌘','D']} label="Duplicate"/>
        <ShortcutRow keys={['⌘','Z']} label="Undo"/>
        <ShortcutRow keys={['⇧','⌘','Z']} label="Redo"/>
        <ShortcutRow keys={['[',']']} label="Layer order"/>
        <ShortcutRow keys={['⌘','P']} label="Preview"/>
        <ShortcutRow keys={['G']} label="Toggle grid"/>
        <ShortcutRow keys={['⌘','/']} label="All shortcuts"/>
      </div>
    </>
  );
}

// ─── Canvas dimension chip ───
function CanvasDimsChip({ zoom = '31%' }) {
  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px',
      background: edTokens.surface, border: `1px solid ${edTokens.border}`,
      borderRadius: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
      color: edTokens.inkSoft, letterSpacing: '0.04em',
      zIndex: 2,
    }}>
      <span style={{ color: edTokens.muted }}>canvas</span>
      <span style={{ color: edTokens.ink, fontWeight: 500 }}>1080 × 1920 px</span>
      <span style={{ width: 1, height: 12, background: edTokens.border, margin: '0 2px' }}/>
      <span style={{ color: edTokens.muted }}>{zoom}</span>
    </div>
  );
}

// ─── EXPORT ───
window.ES = {
  tokens: edTokens,
  ESvg, EI, kbdStyle, iconBtnStyle, ghostBtnStyle, linkBtn,
  TopBar, VariantTabs, VariantTab, LeftRail, SectionLabel,
  BackgroundArt, CanvasBottomBar, CanvasDimsChip,
  PanelCard, TextInput, ChipRO, ShortcutRow, ShortcutsBlock,
  AddElementRow,
};
})();
