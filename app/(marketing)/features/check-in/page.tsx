import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'QR Check-in — Karta',
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
  muted: '#6B7A72',
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
    <section
      style={{
        background: 'linear-gradient(180deg, #1F4D3A 0%, #163828 100%)',
        padding: 'clamp(80px, 10vw, 120px) 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' as const, marginBottom: 56 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase' as const,
              color: '#E8C57E',
            }}>
              Door Staff View
            </span>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
          </div>
          <h2
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FAF6EE',
              marginBottom: 12,
              lineHeight: 1.15,
            }}
          >
            Scan. Confirm. Next.
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 17,
              color: 'rgba(250,246,238,0.65)',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            Works on any phone — no app download, no training for door staff.
          </p>
        </div>

        {/* Phones row */}
        <div
          style={{
            display: 'flex',
            gap: 32,
            justifyContent: 'center',
            flexWrap: 'wrap' as const,
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT PHONE — Scanner */}
          <div
            style={{
              width: 280,
              background: '#163828',
              borderRadius: 36,
              padding: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 40px 100px rgba(0,0,0,0.45)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                background: '#0F1F18',
                borderRadius: 24,
                overflow: 'hidden',
                paddingBottom: 16,
              }}
            >
              {/* Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 6px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', fontWeight: 600 }}>9:41</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <div style={{ width: 14, height: 8, border: '1.5px solid #6B7A72', borderRadius: 2, position: 'relative' as const }}>
                    <div style={{ position: 'absolute' as const, left: 1, top: 1, bottom: 1, width: '70%', background: '#6B7A72', borderRadius: 1 }} />
                  </div>
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 7.5c1.4-1.4 3.2-2.2 5-2.2s3.6.8 5 2.2" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M3.5 5.2C4.5 4.3 5.2 4 6 4s1.5.3 2.5 1.2" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="6" cy="9" r="1" fill="#6B7A72"/>
                  </svg>
                </div>
              </div>

              {/* App header */}
              <div style={{ padding: '8px 0 12px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: '#FAF6EE' }}>Karta Check-in</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#E8C57E', marginTop: 2 }}>Pan-African Summit</div>
              </div>

              {/* Camera viewfinder */}
              <div
                style={{
                  margin: '0 14px',
                  width: 'calc(100% - 28px)',
                  aspectRatio: '1',
                  background: '#1A1A1A',
                  borderRadius: 8,
                  position: 'relative' as const,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                {/* Top-left corner */}
                <div style={{ position: 'absolute' as const, top: 12, left: 12 }}>
                  <div style={{ width: 20, height: 2, background: '#E8C57E' }} />
                  <div style={{ width: 2, height: 18, background: '#E8C57E' }} />
                </div>
                {/* Top-right corner */}
                <div style={{ position: 'absolute' as const, top: 12, right: 12 }}>
                  <div style={{ width: 20, height: 2, background: '#E8C57E', marginLeft: 'auto' }} />
                  <div style={{ width: 2, height: 18, background: '#E8C57E', marginLeft: 'auto' }} />
                </div>
                {/* Bottom-left corner */}
                <div style={{ position: 'absolute' as const, bottom: 12, left: 12 }}>
                  <div style={{ width: 2, height: 18, background: '#E8C57E' }} />
                  <div style={{ width: 20, height: 2, background: '#E8C57E' }} />
                </div>
                {/* Bottom-right corner */}
                <div style={{ position: 'absolute' as const, bottom: 12, right: 12 }}>
                  <div style={{ width: 2, height: 18, background: '#E8C57E', marginLeft: 'auto' }} />
                  <div style={{ width: 20, height: 2, background: '#E8C57E', marginLeft: 'auto' }} />
                </div>
                {/* Scanning line */}
                <div
                  style={{
                    position: 'absolute' as const,
                    left: '10%',
                    width: '80%',
                    height: 2,
                    background: '#E8C57E',
                    opacity: 0.7,
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' as const, padding: '0 20px', lineHeight: 1.4 }}>
                  Point at QR code
                </span>
              </div>

              {/* Stats */}
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.5)', textAlign: 'center' as const, marginTop: 12, padding: '0 14px' }}>
                367 checked in · 45 remaining
              </div>
              {/* Manual search */}
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#E8C57E', textAlign: 'center' as const, marginTop: 10, textDecoration: 'underline' }}>
                Manual search
              </div>
            </div>
          </div>

          {/* RIGHT PHONE — Confirmation */}
          <div
            style={{
              width: 280,
              background: '#163828',
              borderRadius: 36,
              padding: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 40px 100px rgba(0,0,0,0.45)',
              flexShrink: 0,
            }}
          >
            <div style={{ background: '#FAF6EE', borderRadius: 24, overflow: 'hidden' }}>
              {/* Status bar on green */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px 6px', background: '#1F4D3A' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.6)', fontWeight: 600 }}>9:47</span>
                <div style={{ width: 14, height: 8, border: '1.5px solid rgba(250,246,238,0.4)', borderRadius: 2, position: 'relative' as const }}>
                  <div style={{ position: 'absolute' as const, left: 1, top: 1, bottom: 1, width: '70%', background: 'rgba(250,246,238,0.4)', borderRadius: 1 }} />
                </div>
              </div>

              {/* Green confirmation strip */}
              <div style={{ background: '#1F4D3A', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 18, fontWeight: 700, color: '#FAF6EE' }}>Checked In</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.6)' }}>9:47 AM</div>
              </div>

              {/* Attendee card */}
              <div style={{ background: '#FFFFFF', padding: 20, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #1F4D3A, #E8C57E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: 18, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                  AY
                </div>
                <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 17, fontWeight: 700, color: '#0F1F18' }}>Amara Yusuf</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72', textAlign: 'center' as const }}>Climate Policy Lead · COP29</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', background: '#E8EFEB', color: '#1F4D3A', borderRadius: 999, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, marginTop: 4 }}>
                  VIP Access · #A1-047
                </div>
              </div>

              {/* Tap to scan next */}
              <div style={{ padding: '0 16px 20px' }}>
                <div style={{ background: '#1F4D3A', color: '#FAF6EE', borderRadius: 10, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700 }}>
                  Tap to scan next
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
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 20% 50%, rgba(31,77,58,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 80% 20%, rgba(232,197,126,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

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
                fontFamily: 'Inter, sans-serif',
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
              fontFamily: '"DM Sans", sans-serif',
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
              fontFamily: 'Inter, sans-serif',
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
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 10,
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
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 10,
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
                fontFamily: '"DM Sans", sans-serif',
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
                fontFamily: 'Inter, sans-serif',
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
                    fontFamily: '"DM Sans", sans-serif',
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
                    fontFamily: 'Inter, sans-serif',
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
                fontFamily: '"DM Sans", sans-serif',
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
                fontFamily: 'Inter, sans-serif',
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
                    fontFamily: '"DM Sans", sans-serif',
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
                    fontFamily: '"DM Sans", sans-serif',
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
                    fontFamily: 'Inter, sans-serif',
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
                  fontFamily: '"DM Sans", sans-serif',
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
                  fontFamily: 'Inter, sans-serif',
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
              fontFamily: '"DM Sans", sans-serif',
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
              fontFamily: 'Inter, sans-serif',
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
                fontFamily: 'Inter, sans-serif',
                fontWeight: 700,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 10,
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
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: 15,
                padding: '14px 28px',
                borderRadius: 10,
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
