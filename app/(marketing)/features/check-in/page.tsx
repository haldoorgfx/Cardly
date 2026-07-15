import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'QR Check-in — Eventera',
  description:
    'Check in every attendee with a phone camera. No app download for staff. No paper lists. Real-time attendance tracking the moment they walk in.',
};

const C = {
  primary: '#1F4D3A',
  primaryDark: '#163828',
  primarySoft: '#E8EFEB',
  accent: '#E8C57E',
  accentDark: '#C9A45E',
  ink: '#0F1F18',
  inkSoft: '#3A4A42',
  muted: '#65736B',
  cream: '#FAF6EE',
  surface: '#FFFFFF',
  border: '#E5E0D4',
} as const;

function IconScan() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}

function IconWifi() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
    </svg>
  );
}

function IconActivity() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

const features = [
  {
    icon: <IconScan />,
    title: 'Scan from Any Phone',
    description:
      "Staff open a link, point the camera. That's the entire setup. Works on iPhone and Android, Safari and Chrome. No app download, no account needed for door staff.",
  },
  {
    icon: <IconWifi />,
    title: 'Offline Mode',
    description:
      'Download your attendee list before the event. Check-in works even when the venue WiFi fails. Sync automatically when you\'re back online.',
  },
  {
    icon: <IconActivity />,
    title: 'Instant Attendance Feed',
    description:
      'Every scan updates your dashboard in real time. See arrivals as they happen. Know your room fill-rate live.',
  },
  {
    icon: <IconKey />,
    title: 'Ticket Type Control',
    description:
      'Give each ticket type different check-in permissions. VIP scans at the main entrance. Speakers walk straight to the green room. Staff only see what they need.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Unique QR in every confirmation',
    body: 'Every registrant gets a unique QR code in their confirmation email the moment they complete registration.',
  },
  {
    n: '02',
    title: 'Staff open the check-in link',
    body: 'Staff open the check-in link on any phone — no app download, no account. Just the link.',
  },
  {
    n: '03',
    title: 'Scan — confirmed in under 2 seconds',
    body: 'Scan the code and the attendee is confirmed instantly. The dashboard updates in real time.',
  },
];

const stats = [
  { value: '<2s', label: 'per scan' },
  { value: 'Any phone', label: 'browser-native, no app' },
  { value: 'Auto-sync', label: 'offline scans synced on reconnect' },
];

function CheckInMockup() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(80px, 10vw, 120px) 24px clamp(120px, 14vw, 160px)', position: 'relative' as const, overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative' as const }}>

        {/* Text column */}
        <div style={{ flex: '1 1 300px', maxWidth: 420, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#1F4D3A', textTransform: 'uppercase' as const }}>Door Staff View</span>
          </div>
          <h2 style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18', marginBottom: 16, lineHeight: 1.15 }}>
            367 checked in. 45 still to arrive.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: '#3A4A42', lineHeight: 1.65, marginBottom: 32 }}>
            Every QR scan updates your dashboard in real time. Know your room fill rate as it happens.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '< 2s', desc: 'per scan' },
              { label: 'Offline', desc: 'works even without WiFi' },
              { label: 'Any phone', desc: 'no app download for staff' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>{s.label}</div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#65736B' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device column */}
        <div style={{ flex: '0 0 auto', position: 'relative' as const }}>
          {/* Floating badge */}
          <div style={{ position: 'absolute' as const, top: -16, left: 20, background: '#1F4D3A', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 7, zIndex: 10, boxShadow: '0 4px 16px rgba(15,31,24,0.25)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#FAF6EE' }}>367 checked in · Doors open</span>
          </div>

          {/* Laptop */}
          <div style={{ background: '#2c2c2e', borderRadius: '12px 12px 0 0', padding: '10px 12px 0', width: 500, boxShadow: '0 24px 64px rgba(15,31,24,0.18)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#444', margin: '0 auto 7px' }} />
            <div style={{ background: '#e8e6e1', borderRadius: '6px 6px 0 0', padding: '7px 10px 6px' }}>
              <div style={{ display: 'flex', gap: 5, marginBottom: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
              </div>
              <div style={{ background: '#FFFFFF', borderRadius: 5, padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#65736B', border: '1px solid #E5E0D4' }}>
                eventera.so/e/summit/check-in
              </div>
            </div>
            <div style={{ background: '#FAF6EE', display: 'flex', height: 320, overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{ width: 130, background: '#FFFFFF', borderRight: '1px solid #E5E0D4', padding: '10px 8px', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 13, fontWeight: 700, color: '#1F4D3A', marginBottom: 14, padding: '0 4px' }}>Eventera</div>
                <div style={{ background: '#E8EFEB', borderRadius: 6, padding: '5px 8px', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: '#1F4D3A', flexShrink: 0 }} />
                  <div style={{ width: 55, height: 7, background: '#1F4D3A', opacity: 0.4, borderRadius: 3 }} />
                </div>
                {[60, 45, 70, 40, 55].map((w, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', marginBottom: 3 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: '#E5E0D4', flexShrink: 0 }} />
                    <div style={{ width: w, height: 7, background: '#E5E0D4', borderRadius: 3 }} />
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 11, fontWeight: 700, color: '#1F4D3A' }}>Check-in · Live</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#2D7A4F', fontWeight: 600 }}>LIVE</span>
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 26, fontWeight: 800, color: '#1F4D3A', letterSpacing: '-0.02em' }}>367</div>
                  <div style={{ width: 60, height: 6, background: '#E5E0D4', borderRadius: 3, marginTop: 4, marginBottom: 8 }} />
                  <div style={{ background: '#E8EFEB', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: '71%', height: '100%', background: '#1F4D3A', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#65736B', marginTop: 3 }}>of 512 expected · 71%</div>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#65736B', marginBottom: 6 }}>Recent arrivals</div>
                {[{ w1: 40, w2: 25 }, { w1: 55, w2: 30 }, { w1: 48, w2: 28 }, { w1: 62, w2: 22 }].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, paddingBottom: i < 3 ? 5 : 0, borderBottom: i < 3 ? '1px solid #F0EDE5' : 'none' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8EFEB', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: row.w1, height: 5, background: '#D4D0C8', borderRadius: 3, marginBottom: 2 }} />
                      <div style={{ width: row.w2, height: 4, background: '#E8EFEB', borderRadius: 3 }} />
                    </div>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ background: '#222225', height: 14, borderRadius: '0 0 3px 3px' }} />
          <div style={{ background: '#1a1a1d', height: 5, width: '112%', margin: '0 -6%', borderRadius: '0 0 8px 8px' }} />

          {/* Phone overlay */}
          <div style={{ position: 'absolute' as const, bottom: -20, right: -35, width: 150, background: '#0F1F18', borderRadius: 24, padding: 6, boxShadow: '0 8px 40px rgba(0,0,0,0.45)', zIndex: 10 }}>
            <div style={{ background: '#FAF6EE', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ background: '#1F4D3A', padding: '16px 10px 14px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 11, fontWeight: 700, color: '#FAF6EE' }}>Checked In</div>
                <div style={{ width: 50, height: 5, background: 'rgba(250,246,238,0.3)', borderRadius: 3 }} />
              </div>
              <div style={{ padding: '8px 8px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#1F4D3A,#E8C57E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>AY</div>
                  <div>
                    <div style={{ width: 55, height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ width: 70, height: 5, background: '#E8EFEB', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ background: '#1F4D3A', borderRadius: 5, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 55, height: 5, background: 'rgba(250,246,238,0.4)', borderRadius: 3 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CheckInPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        style={{
          background: C.cream,
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(80px, 12vw, 140px) 24px clamp(64px, 8vw, 100px)',
        }}
      >
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.primarySoft,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: '6px 14px',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: C.primary,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: C.primary,
              }}
            >
              Check-in
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              fontSize: 'clamp(36px, 6vw, 68px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: C.ink,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Zero queues.{' '}
            <span style={{ color: C.primary }}>Zero spreadsheets.</span>
            <br />
            Just scan.
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(17px, 2.2vw, 20px)',
              lineHeight: 1.65,
              color: C.inkSoft,
              maxWidth: 580,
              margin: '0 auto 40px',
            }}
          >
            Check in every attendee with a phone camera. No app download for staff. No paper lists.
            Real-time attendance tracking the moment they walk in.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.primary,
                color: C.surface,
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              Start for free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: C.primary,
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 999,
                textDecoration: 'none',
                border: `1.5px solid ${C.border}`,
              }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <CheckInMockup />

      {/* ── Features grid ─────────────────────────────────────── */}
      <section
        style={{
          background: C.surface,
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 12,
              }}
            >
              Everything your door staff needs
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 17,
                color: C.muted,
                maxWidth: 480,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Built for venues, pop-ups, and stadiums. Scales from 50 to 50,000 attendees.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {features.map((f) => (
              <div
                key={f.title}
                style={{
                  background: C.cream,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '32px 28px',
                  boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: C.primarySoft,
                    color: C.primary,
                    marginBottom: 20,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.ink,
                    marginBottom: 10,
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: C.inkSoft,
                    margin: 0,
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section
        style={{
          background: C.cream,
          padding: 'clamp(64px, 8vw, 100px) 24px',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 12,
              }}
            >
              How check-in works
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 17,
                color: C.muted,
                maxWidth: 440,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Three steps from setup to doors open.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 40,
            }}
          >
            {steps.map((s, i) => (
              <div key={s.n} style={{ position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: 28,
                      right: -20,
                      width: 40,
                      height: 1,
                      background: C.border,
                    }}
                  />
                )}
                <div
                  style={{
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontSize: 56,
                    fontWeight: 800,
                    color: C.primarySoft,
                    lineHeight: 1,
                    marginBottom: 16,
                    letterSpacing: '-0.03em',
                  }}
                >
                  {s.n}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.ink,
                    marginBottom: 10,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: C.inkSoft,
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────── */}
      <section
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
          padding: 'clamp(40px, 6vw, 64px) 24px',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            textAlign: 'center',
          }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                  fontSize: 'clamp(32px, 5vw, 48px)',
                  fontWeight: 800,
                  color: C.primary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 14,
                  color: C.muted,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.06em',
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
          padding: 'clamp(80px, 10vw, 120px) 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              fontSize: 'clamp(28px, 4.5vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 16,
            }}
          >
            Open your doors with confidence.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 18,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 480,
              margin: '0 auto 40px',
            }}
          >
            Set up check-in in minutes. Your first event is free.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.surface,
                color: C.primary,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 999,
                textDecoration: 'none',
              }}
            >
              Get started free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'transparent',
                color: '#FFFFFF',
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 999,
                textDecoration: 'none',
                border: '1.5px solid rgba(255,255,255,0.35)',
              }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
