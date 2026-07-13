import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Attendee Networking — Eventera',
  description:
    'Attendee profiles, AI-powered match suggestions, and 1:1 meeting scheduling — so the right people find each other before they\'re stuck in different sessions.',
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

function IconUser() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconFeed() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.93a16 16 0 0 0 6.16 6.16l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const features = [
  {
    icon: <IconUser />,
    title: 'Attendee Profiles',
    description:
      'Every confirmed attendee gets a profile visible to other attendees. Name, title, company, what they\'re looking to connect about. Control what\'s shown.',
  },
  {
    icon: <IconSparkle />,
    title: 'AI Match Suggestions',
    description:
      'Eventera reads attendee profiles and surfaces the 10 people each attendee is most likely to benefit from meeting. Powered by their interests and role.',
  },
  {
    icon: <IconCalendar />,
    title: 'Meeting Scheduler',
    description:
      'Attendees request 1:1 meetings directly from a profile. Both parties confirm. The meeting time is saved to their agenda. No back-and-forth needed.',
  },
  {
    icon: <IconFeed />,
    title: 'Networking Feed',
    description:
      'A live activity feed of who\'s attending, arriving, and looking to connect. The pre-event buzz that gets people excited to show up.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Opt-in at registration',
    body: 'Attendees opt into networking when they register. They fill in what they\'re looking for — connections, partnerships, mentors, clients.',
  },
  {
    n: '02',
    title: 'Eventera surfaces the right matches',
    body: 'Before the event, every attendee receives a list of the 10 people Eventera thinks they should meet, based on profile data.',
  },
  {
    n: '03',
    title: 'Arrive ready to connect',
    body: 'Attendees connect, schedule meetings, and walk in with a plan. The best networking happens before the doors even open.',
  },
];

const stats = [
  { value: '68%', label: 'of attendees use networking features' },
  { value: '4×', label: 'more connections vs. unstructured networking' },
  { value: '82%', label: 'meeting confirmation rate' },
];

function NetworkingMockup() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(80px, 10vw, 120px) 24px clamp(120px, 14vw, 160px)', position: 'relative' as const }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative' as const }}>

        {/* Text column */}
        <div style={{ flex: '1 1 300px', maxWidth: 420, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#1F4D3A', textTransform: 'uppercase' as const }}>Attendee Matching</span>
          </div>
          <h2 style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18', marginBottom: 16, lineHeight: 1.15 }}>
            Your best connections, before lunch.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: '#3A4A42', lineHeight: 1.65, marginBottom: 32 }}>
            AI reads every attendee profile and surfaces the 10 people each person is most likely to benefit from meeting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '68%', desc: 'of attendees use networking' },
              { label: '4×', desc: 'more connections vs. unstructured' },
              { label: '82%', desc: 'meeting confirmation rate' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>{s.label}</div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7A72' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device column */}
        <div style={{ flex: '0 0 auto', position: 'relative' as const }}>
          {/* Floating badge */}
          <div style={{ position: 'absolute' as const, top: -16, left: 20, background: '#1F4D3A', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 7, zIndex: 10, boxShadow: '0 4px 16px rgba(15,31,24,0.25)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#FAF6EE' }}>412 connections made</span>
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
              <div style={{ background: '#FFFFFF', borderRadius: 5, padding: '3px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72', border: '1px solid #E5E0D4' }}>
                eventera.so/e/summit/networking
              </div>
            </div>
            <div style={{ background: '#FAF6EE', display: 'flex', height: 320, overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{ width: 130, background: '#FFFFFF', borderRight: '1px solid #E5E0D4', padding: '10px 8px', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 700, color: '#1F4D3A', marginBottom: 14, padding: '0 4px' }}>Eventera</div>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#1F4D3A' }}>Who to meet</div>
                  <div style={{ background: '#E8EFEB', borderRadius: 999, padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#1F4D3A', fontWeight: 600 }}>12 matches</div>
                </div>
                {[
                  { initials: 'KA', pct: 94, w1: 55, w2: 72, bg: '#E8EFEB' },
                  { initials: 'FH', pct: 87, w1: 62, w2: 65, bg: 'rgba(232,197,126,0.2)' },
                  { initials: 'BB', pct: 81, w1: 70, w2: 55, bg: '#E8EFEB' },
                ].map((m) => (
                  <div key={m.initials} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '8px 10px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ width: m.w1, height: 6, background: 'rgba(15,31,24,0.3)', borderRadius: 3, marginBottom: 3 }} />
                      <div style={{ width: m.w2, height: 5, background: '#E5E0D4', borderRadius: 3 }} />
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, color: '#2D7A4F', flexShrink: 0 }}>{m.pct}%</div>
                  </div>
                ))}
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7A72', marginTop: 8, marginBottom: 5 }}>Networking feed</div>
                {[{ w: 100 }, { w: 85 }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8EFEB', flexShrink: 0 }} />
                    <div style={{ width: r.w, height: 5, background: '#E5E0D4', borderRadius: 3 }} />
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
              <div style={{ background: '#1F4D3A', padding: '10px 10px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#FAF6EE' }}>Top match</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#E8C57E', fontWeight: 700 }}>94%</div>
              </div>
              <div style={{ padding: '8px 8px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E8EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>KA</div>
                  <div>
                    <div style={{ width: 60, height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ width: 80, height: 5, background: '#E8EFEB', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ background: '#1F4D3A', borderRadius: 5, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 45, height: 5, background: 'rgba(250,246,238,0.5)', borderRadius: 3 }} />
                </div>
                <div style={{ marginTop: 6 }}>
                  {[{ initials: 'FH', w: 55 }, { initials: 'BB', w: 48 }].map((m) => (
                    <div key={m.initials} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8EFEB', flexShrink: 0 }} />
                      <div style={{ width: m.w, height: 5, background: '#E5E0D4', borderRadius: 3 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function NetworkingPage() {
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
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: C.primary,
              }}
            >
              Networking
            </span>
          </div>

          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: 'clamp(34px, 5.5vw, 64px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: C.ink,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            The conversations that make the{' '}
            <span style={{ color: C.primary }}>event worth attending.</span>
          </h1>

          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(17px, 2.2vw, 20px)',
              lineHeight: 1.65,
              color: C.inkSoft,
              maxWidth: 600,
              margin: '0 auto 40px',
            }}
          >
            Attendee profiles, AI-powered match suggestions, and 1:1 meeting scheduling — so the
            right people find each other before they&apos;re stuck in different sessions.
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

      <NetworkingMockup />

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
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 12,
              }}
            >
              Built for meaningful connections
            </h2>
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 17,
                color: C.muted,
                maxWidth: 500,
                margin: '0 auto',
                lineHeight: 1.6,
              }}
            >
              Not another badge scanner. A system that surfaces the right people and gets them in
              the same room.
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
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
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
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 12,
              }}
            >
              How networking works
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
              From opt-in to first meeting — three steps.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 40,
            }}
          >
            {steps.map((s) => (
              <div key={s.n}>
                <div
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
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
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
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
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
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
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: 'clamp(28px, 4.5vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 16,
            }}
          >
            Turn attendees into a community.
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 18,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto 40px',
            }}
          >
            Networking is included in every Eventera plan. No extra seat fees. No add-on required.
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
