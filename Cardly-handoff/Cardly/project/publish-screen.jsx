// publish-screen.jsx — D3 v2 · Publish & Share (organizer-side post-publish)
// Forest/cream brand system, mono labels, 6px radii, density.

(function(){

const PT = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', canvasBg: '#F5F1E6',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F',
};

const PSvg = ({ children, size = 16, sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const PI = {
  back: (p) => <PSvg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></PSvg>,
  check: (p) => <PSvg {...p}><polyline points="20 6 9 17 4 12"/></PSvg>,
  copy: (p) => <PSvg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></PSvg>,
  download: (p) => <PSvg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></PSvg>,
  external: (p) => <PSvg {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></PSvg>,
  arrowRight: (p) => <PSvg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></PSvg>,
  edit: (p) => <PSvg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z"/></PSvg>,
  chart: (p) => <PSvg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></PSvg>,
  link: (p) => <PSvg {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></PSvg>,
  code: (p) => <PSvg {...p}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></PSvg>,
  qr: (p) => <PSvg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="14" y2="17"/><line x1="14" y1="20" x2="17" y2="20"/><line x1="20" y1="14" x2="20" y2="17"/><line x1="17" y1="17" x2="20" y2="17"/><line x1="17" y1="20" x2="21" y2="20"/></PSvg>,
  refresh: (p) => <PSvg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></PSvg>,
  send: (p) => <PSvg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" stroke="none"/></PSvg>,
};

// Brand icon marks (same as attendee preview)
const Brand = {
  whatsapp: (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path fill="#25D366" d="M12 .04C5.4.04.07 5.37.07 11.97c0 2.1.54 4.13 1.57 5.94L0 24l6.27-1.65a11.93 11.93 0 0 0 5.73 1.46h.01c6.6 0 11.93-5.33 11.93-11.93 0-3.18-1.24-6.17-3.49-8.42A11.86 11.86 0 0 0 12 .04zm5.43 14.34c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.07 4.49.71.3 1.26.49 1.69.62.71.22 1.35.19 1.86.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    </svg>
  ),
  x: (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#000"/>
      <path fill="#fff" d="M17.3 5.5h2.5l-5.5 6.3 6.5 8.7h-5.1l-4-5.3-4.6 5.3H4.6L10.5 13 4.3 5.5h5.2l3.6 4.8 3.8-4.8z"/>
    </svg>
  ),
  linkedin: (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#0A66C2"/>
      <path fill="#fff" d="M8.3 9.5v9H5.3v-9h3zm-1.5-4.4a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zm4 4.4h2.85v1.27h.04c.4-.74 1.37-1.52 2.82-1.52 3.02 0 3.58 1.96 3.58 4.5v4.75h-3v-4.21c0-1 0-2.3-1.42-2.3-1.42 0-1.64 1.1-1.64 2.23v4.28h-2.99v-9h-.24z"/>
    </svg>
  ),
  email: (s=20) => (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#EA4335"/>
      <path fill="#fff" d="M5 7.5l7 5 7-5V17H5V7.5zM18.5 6H5.5L12 10.5 18.5 6z"/>
    </svg>
  ),
};

// ─── Background art (same as editor — for preview thumbnail) ───
function PreviewArt() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(165deg, #1F4D3A 0%, #163828 60%, #2A6A50 100%)',
      color: PT.cream,
    }}>
      <svg viewBox="0 0 100 178" preserveAspectRatio="none" width="100%" height="100%"
           style={{ position: 'absolute', inset: 0, opacity: 0.16 }}>
        <defs>
          <radialGradient id="p-bart" cx="80%" cy="20%" r="80%">
            <stop offset="0%" stopColor="#E8C57E" stopOpacity="0.7"/>
            <stop offset="100%" stopColor="#E8C57E" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100" height="178" fill="url(#p-bart)"/>
        <circle cx="90" cy="170" r="60" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
        <circle cx="90" cy="170" r="45" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
        <circle cx="90" cy="170" r="30" fill="none" stroke="#E8C57E" strokeWidth="0.4"/>
      </svg>
      {/* photo zone */}
      <div style={{
        position: 'absolute', left: '50%', top: '20%',
        transform: 'translateX(-50%)',
        width: '40%', aspectRatio: '1',
        borderRadius: '50%',
        border: `1.5px solid ${PT.accent}`,
        background: 'rgba(232,239,235,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: PT.cream, fontSize: 9, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, opacity: 0.6,
      }}>AA</div>
      {/* name + role placeholders */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '20%', textAlign: 'center', padding: '0 10%' }}>
        <div style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 16, color: PT.cream, lineHeight: 1.1,
        }}>Aisha Ahmed</div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9,
          color: 'rgba(232,197,126,0.95)', marginTop: 4,
        }}>Climate Policy Lead</div>
      </div>
    </div>
  );
}

// ─── QR code — generative grid ───
function QRMark({ size = 220 }) {
  // Deterministic faux-QR grid. 25×25 modules.
  const N = 25;
  const data = [];
  // Seeded pseudo-random by index
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = (i / N) | 0;
    // finder squares: top-left, top-right, bottom-left
    const finder = (x < 7 && y < 7) || (x > N-8 && y < 7) || (x < 7 && y > N-8);
    if (finder) {
      const inFinder = ((x === 0 || x === 6) && y >= 0 && y <= 6)
        || ((x >= 0 && x <= 6) && (y === 0 || y === 6))
        || ((x === N-7 || x === N-1) && y >= 0 && y <= 6)
        || ((x >= N-7 && x <= N-1) && (y === 0 || y === 6))
        || ((x === 0 || x === 6) && y >= N-7 && y <= N-1)
        || ((x >= 0 && x <= 6) && (y === N-7 || y === N-1));
      const center = (x >= 2 && x <= 4 && y >= 2 && y <= 4)
        || (x >= N-5 && x <= N-3 && y >= 2 && y <= 4)
        || (x >= 2 && x <= 4 && y >= N-5 && y <= N-3);
      data.push(inFinder || center);
      continue;
    }
    // pseudo-random pattern (deterministic)
    const v = (Math.sin(x * 13.7 + y * 7.31) * 10000) % 1;
    data.push(Math.abs(v) > 0.55);
  }
  const cell = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill={PT.surface}/>
      {data.map((on, i) => on ? (
        <rect key={i}
              x={(i % N) * cell} y={((i / N) | 0) * cell}
              width={cell + 0.4} height={cell + 0.4}
              fill={PT.ink} rx={cell * 0.18}/>
      ) : null)}
      {/* cardly mark in center */}
      <g transform={`translate(${size/2 - 16}, ${size/2 - 16})`}>
        <rect x="-6" y="-6" width="44" height="44" rx="8" fill={PT.surface}/>
        <rect x="0" y="0" width="32" height="32" rx="8" fill={PT.primary}/>
        <text x="16" y="22" textAnchor="middle"
              fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="14"
              fill={PT.accent}>cl</text>
      </g>
    </svg>
  );
}

// ─── Top bar ───
function TopBar() {
  return (
    <div style={{
      height: 52, flexShrink: 0,
      background: PT.surface,
      borderBottom: `1px solid ${PT.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <button style={{
          width: 30, height: 30, borderRadius: 6,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: PT.inkSoft,
        }}><PI.back size={16}/></button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'Inter, sans-serif', fontSize: 13, minWidth: 0,
        }}>
          <span style={{ color: PT.muted }}>Events</span>
          <span style={{ color: PT.borderStrong }}>/</span>
          <span style={{
            color: PT.ink, fontWeight: 600, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 380,
          }}>HOM · Instagram Story Safe-Zone Overlay (v2)</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Published pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 28, padding: '0 10px',
          background: PT.primarySoft, color: PT.primary,
          borderRadius: 999,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: PT.success,
          }}/>
          <span>Published</span>
        </div>
        <button style={{
          height: 32, padding: '0 12px',
          background: 'transparent', color: PT.ink,
          border: `1px solid ${PT.border}`, borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }}>
          <PI.edit size={13}/>
          <span>Edit</span>
        </button>
        <button style={{
          height: 32, padding: '0 14px',
          background: PT.ink, color: PT.cream,
          border: 'none', borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }}>
          <span>Dashboard</span>
        </button>
      </div>
    </div>
  );
}

// ─── Hero success block ───
function Hero() {
  return (
    <div style={{
      padding: '40px 32px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      textAlign: 'center', position: 'relative',
    }}>
      {/* Badge with gold rings (matches attendee success badge) */}
      <div style={{
        position: 'relative',
        width: 60, height: 60,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: -6,
          borderRadius: '50%',
          border: `2px solid ${PT.accent}`,
          opacity: 0.55,
        }}/>
        <div style={{
          position: 'absolute', inset: -12,
          borderRadius: '50%',
          border: `1px solid ${PT.accent}`,
          opacity: 0.25,
        }}/>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: PT.primary,
          color: PT.accent,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(31,77,58,0.35)',
        }}>
          <PI.check size={28} sw={2.6}/>
        </div>
      </div>

      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: PT.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
          marginBottom: 8,
        }}>Your event is live</div>
        <h1 style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
          fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.025em',
          margin: 0, color: PT.ink,
          maxWidth: 720, textWrap: 'balance',
        }}>HOM · Instagram Story Safe-Zone Overlay (v2) is live.</h1>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          marginTop: 10,
          fontFamily: 'Inter, sans-serif', fontSize: 14, color: PT.inkSoft,
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PT.primary }}/>
            <span>3 zones defined</span>
          </span>
          <span style={{ color: PT.borderStrong }}>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PT.success }}/>
            <span>Ready for attendees</span>
          </span>
          <span style={{ color: PT.borderStrong }}>·</span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: PT.muted,
          }}>1080 × 1920</span>
        </div>
      </div>
    </div>
  );
}

// ─── Panel ───
function SectionLabel({ children, count }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
      color: PT.muted, letterSpacing: '0.1em',
      textTransform: 'uppercase',
    }}>
      <span>{children}</span>
      {count !== undefined && <span style={{ color: PT.muted, opacity: 0.7 }}>· {count}</span>}
    </div>
  );
}

function Panel({ label, action, children }) {
  return (
    <div style={{
      background: PT.surface,
      border: `1px solid ${PT.border}`,
      borderRadius: 10,
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <SectionLabel>{label}</SectionLabel>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Share link block ───
function ShareLinkBlock() {
  return (
    <Panel label="Share link" action={
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: PT.muted, letterSpacing: '0.04em',
      }}>
        <PI.link size={11}/>
        <span>public · no signup</span>
      </span>
    }>
      {/* URL input + Copy button group */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        background: PT.surface,
        border: `1px solid ${PT.border}`, borderRadius: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          padding: '0 12px',
          display: 'flex', alignItems: 'center',
          background: PT.cream,
          borderRight: `1px solid ${PT.border}`,
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5,
            color: PT.ink, fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
          }}>cardly.io/c/hom-instagram-story-safe-zone-overlay-2-tb9h</span>
        </div>
        <button style={{
          padding: '0 16px', height: 44,
          background: PT.surface, color: PT.ink,
          border: 'none', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <PI.copy size={14}/>
          <span>Copy</span>
        </button>
      </div>

      {/* Share-to buttons */}
      <div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: PT.muted, letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 8,
        }}>Share to</div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
        }}>
          <ShareBtn icon={Brand.whatsapp(18)} label="WhatsApp" sub="Group chat"/>
          <ShareBtn icon={Brand.x(18)}        label="X"        sub="Compose"/>
          <ShareBtn icon={Brand.linkedin(18)} label="LinkedIn" sub="Post"/>
          <ShareBtn icon={Brand.email(18)}    label="Email"    sub="Compose"/>
        </div>
      </div>

      {/* Caption snippet */}
      <div style={{
        background: PT.cream,
        border: `1px solid ${PT.border}`,
        borderRadius: 8,
        padding: '12px 14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          marginBottom: 6,
        }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: PT.muted, letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Suggested caption</div>
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: PT.primary,
            fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: 0,
          }}>
            <PI.copy size={12}/><span>Copy</span>
          </button>
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.5,
          color: PT.ink,
        }}>Get your personalized card for HOM Instagram Story Safe-Zone Overlay (v2) — just add your name and photo. 30 seconds.</div>
      </div>
    </Panel>
  );
}

function ShareBtn({ icon, label, sub }) {
  return (
    <button style={{
      padding: '10px 8px',
      background: PT.surface,
      border: `1px solid ${PT.border}`, borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      cursor: 'pointer',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: PT.cream,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12,
        color: PT.ink,
      }}>{label}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5,
        color: PT.muted, letterSpacing: '0.04em',
      }}>{sub}</div>
    </button>
  );
}

// ─── QR code block ───
function QRBlock() {
  return (
    <Panel label="QR code" action={
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: PT.muted, letterSpacing: '0.04em',
      }}>
        <PI.qr size={11}/>
        <span>1024 × 1024</span>
      </span>
    }>
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '6px 0 10px',
      }}>
        <div style={{
          padding: 14,
          background: PT.surface,
          border: `1px solid ${PT.border}`, borderRadius: 12,
        }}>
          <QRMark size={196}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          flex: 1, height: 40, padding: '0 14px',
          background: PT.primary, color: PT.cream,
          border: 'none', borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          cursor: 'pointer',
        }}>
          <PI.download size={14}/>
          <span>Download PNG</span>
        </button>
        <button style={{
          height: 40, padding: '0 14px',
          background: PT.surface, color: PT.ink,
          border: `1px solid ${PT.border}`, borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          cursor: 'pointer',
        }}>
          <span>SVG</span>
        </button>
      </div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.5,
        color: PT.muted, textAlign: 'center',
      }}>Great for posters and printed badges. Scanning opens the share link directly.</div>
    </Panel>
  );
}

// ─── Embed block ───
function EmbedBlock() {
  const code = `<iframe src="https://cardly.io/c/hom-instagram-story-safe-zone-overlay-2-tb9h"
        width="375" height="812"
        frameborder="0" allow="camera"></iframe>`;
  return (
    <Panel label="Embed in your site" action={
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: PT.primary,
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: 0,
      }}>
        <PI.copy size={12}/><span>Copy snippet</span>
      </button>
    }>
      {/* Code block with traffic-light strip */}
      <div style={{
        background: PT.ink,
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          borderBottom: '1px solid rgba(250,246,238,0.08)',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57' }}/>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FEBC2E' }}/>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840' }}/>
          <span style={{
            marginLeft: 8,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: 'rgba(250,246,238,0.55)', letterSpacing: '0.04em',
          }}>embed.html · html</span>
        </div>
        <pre style={{
          margin: 0,
          padding: '14px 16px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.65,
          color: PT.cream,
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>
<span style={{ color: '#9EC6B2' }}>{'<iframe'}</span>{' '}
<span style={{ color: '#E8C57E' }}>src</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>"https://cardly.io/c/hom-instagram-story-safe-zone-overlay-2-tb9h"</span>{'\n        '}
<span style={{ color: '#E8C57E' }}>width</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>"375"</span>{' '}
<span style={{ color: '#E8C57E' }}>height</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>"812"</span>{'\n        '}
<span style={{ color: '#E8C57E' }}>frameborder</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>"0"</span>{' '}
<span style={{ color: '#E8C57E' }}>allow</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>"camera"</span>
<span style={{ color: '#9EC6B2' }}>{'></iframe>'}</span>
        </pre>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      }}>
        <SizeChip label="Mobile"  size="375 × 812"/>
        <SizeChip label="Tablet"  size="768 × 1024"/>
        <SizeChip label="Custom"  size="responsive" active/>
      </div>
    </Panel>
  );
}

function SizeChip({ label, size, active }) {
  return (
    <button style={{
      padding: '8px 10px',
      background: active ? PT.primarySoft : PT.surface,
      border: `1px solid ${active ? 'rgba(31,77,58,0.2)' : PT.border}`,
      borderRadius: 6, cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
    }}>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        color: active ? PT.primary : PT.ink,
      }}>{label}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: PT.muted, letterSpacing: '0.04em',
      }}>{size}</div>
    </button>
  );
}

// ─── Preview block ───
function PreviewBlock() {
  return (
    <Panel label="Attendee preview" action={
      <button style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: PT.primary,
        fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: 0,
      }}>
        <PI.external size={12}/><span>Open link</span>
      </button>
    }>
      <div style={{
        background: PT.cream,
        border: `1px solid ${PT.border}`,
        borderRadius: 10,
        padding: '20px 16px',
        display: 'flex', justifyContent: 'center',
      }}>
        {/* phone-shaped preview */}
        <div style={{
          width: 156, height: 280,
          background: PT.ink,
          borderRadius: 18,
          padding: 6,
          boxShadow: '0 12px 32px rgba(15,31,24,0.16)',
        }}>
          <div style={{
            width: '100%', height: '100%',
            borderRadius: 13, overflow: 'hidden',
            position: 'relative',
            background: PT.cream,
          }}>
            <PreviewArt/>
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: 'Inter, sans-serif', fontSize: 12, color: PT.muted,
        textAlign: 'center', lineHeight: 1.5,
      }}>This is what attendees see when they open the link on their phone.</div>
    </Panel>
  );
}

// ─── Next steps + analytics ───
function NextStepsBlock() {
  const steps = [
    { n: 1, t: 'Share the link',     d: 'Send via WhatsApp, post to your channels, or drop into your event page.' },
    { n: 2, t: 'Attendees personalize', d: 'They open the link, add their name and photo, and confirm in ~30 seconds.' },
    { n: 3, t: 'They share their card',  d: 'Each attendee posts to social. Your event reaches their network.' },
  ];
  return (
    <Panel label="What happens next">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {steps.map(s => (
          <div key={s.n} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: PT.primary, color: PT.cream,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{s.n}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14,
                color: PT.ink, lineHeight: 1.3,
              }}>{s.t}</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.5,
                color: PT.inkSoft, marginTop: 2,
              }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 8, paddingTop: 14,
        borderTop: `1px solid ${PT.border}`,
      }}>
        <button style={{
          width: '100%', height: 44,
          background: PT.cream, color: PT.primary,
          border: `1px solid rgba(31,77,58,0.25)`, borderRadius: 6,
          fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13.5,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <PI.chart size={15} sw={2}/>
          <span>View event analytics</span>
          <PI.arrowRight size={14}/>
        </button>
      </div>
    </Panel>
  );
}

// ─── Stats strip (early signals) ───
function StatsStrip() {
  return (
    <div style={{
      background: PT.surface,
      border: `1px solid ${PT.border}`,
      borderRadius: 10,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 24,
    }}>
      <Stat label="Views"     value="0"    sub="last 24h"/>
      <Divider/>
      <Stat label="Cards made" value="0"   sub="all-time"/>
      <Divider/>
      <Stat label="Shared"    value="0"    sub="to social"/>
      <div style={{ flex: 1 }}/>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        background: PT.cream, border: `1px solid ${PT.border}`,
        borderRadius: 999,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: PT.muted, letterSpacing: '0.04em',
      }}>
        <PI.refresh size={11}/>
        <span>updates live</span>
      </div>
    </div>
  );
}
function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        color: PT.muted, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 6,
      }}>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22,
          color: PT.ink, letterSpacing: '-0.02em',
        }}>{value}</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: PT.muted, letterSpacing: '0.04em',
        }}>{sub}</span>
      </div>
    </div>
  );
}
function Divider() {
  return <div style={{ width: 1, height: 32, background: PT.border, flexShrink: 0 }}/>;
}

// ─── THE PAGE ───
window.PublishScreen = function PublishScreen({ width = 1280, height = 1080 }) {
  return (
    <div style={{
      width, minHeight: height,
      background: PT.cream,
      fontFamily: 'Inter, sans-serif', color: PT.ink,
      display: 'flex', flexDirection: 'column',
    }}>
      <TopBar/>
      <div style={{
        maxWidth: 1100, width: '100%', margin: '0 auto',
        padding: '8px 32px 48px',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <Hero/>

        <StatsStrip/>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20,
        }}>
          <ShareLinkBlock/>
          <QRBlock/>
        </div>

        <EmbedBlock/>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20,
        }}>
          <PreviewBlock/>
          <NextStepsBlock/>
        </div>

        {/* Footer microcopy */}
        <div style={{
          marginTop: 8, padding: '14px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: PT.muted, letterSpacing: '0.04em',
        }}>
          <span>powered by <span style={{ color: PT.ink, fontWeight: 500 }}>cardly</span></span>
          <span>event id · paff-2025-tb9h</span>
        </div>
      </div>
    </div>
  );
};
})();
