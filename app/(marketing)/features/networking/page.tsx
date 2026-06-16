import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Attendee Networking — Karta',
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
      'Karta reads attendee profiles and surfaces the 10 people each attendee is most likely to benefit from meeting. Powered by their interests and role.',
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
    title: 'Karta surfaces the right matches',
    body: 'Before the event, every attendee receives a list of the 10 people Karta thinks they should meet, based on profile data.',
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
    <section
      style={{
        background: 'linear-gradient(180deg, #1F4D3A 0%, #163828 100%)',
        padding: 'clamp(80px, 10vw, 120px) 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
        {/* Text column */}
        <div style={{ flex: '1 1 340px', maxWidth: 480, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#E8C57E', textTransform: 'uppercase' as const }}>
              Attendee View
            </span>
          </div>
          <h2 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#FAF6EE', marginBottom: 16, lineHeight: 1.15 }}>
            Your best connections, before lunch.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(250,246,238,0.65)', lineHeight: 1.65, marginBottom: 32 }}>
            AI reads every attendee profile and surfaces the 10 people each person is most likely to benefit from meeting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '68%', desc: 'of attendees use networking features' },
              { label: '4×', desc: 'more connections vs. unstructured networking' },
              { label: '82%', desc: 'meeting confirmation rate' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.3)', borderRadius: 8, padding: '4px 10px', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#E8C57E', flexShrink: 0 }}>
                  {s.label}
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: 'rgba(250,246,238,0.55)' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone column */}
        <div style={{ flex: '0 0 auto' }}>
        {/* Phone frame */}
        <div
          style={{
            width: 320,
            background: '#163828',
            borderRadius: 40,
            padding: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 40px 100px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ background: '#FAF6EE', borderRadius: 28, overflow: 'hidden' }}>
            {/* Header bar */}
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E0D4', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 700, color: '#0F1F18' }}>Who to meet</span>
              <span style={{ background: '#E8EFEB', color: '#1F4D3A', borderRadius: 999, padding: '3px 8px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>
                3 new matches
              </span>
            </div>

            {/* Match cards */}
            <div style={{ padding: '8px 0' }}>
              {/* Card 1 — Top match */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 14, margin: '8px 12px', padding: 14, display: 'flex', gap: 12, position: 'relative' as const }}>
                <div style={{ position: 'absolute' as const, top: 10, right: 10, background: 'rgba(232,197,126,0.2)', color: '#E8C57E', borderRadius: 4, padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                  Top Match
                </div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 700, color: '#FAF6EE', flexShrink: 0 }}>
                  KA
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 700, color: '#0F1F18', marginBottom: 2 }}>Kofi Asante</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginBottom: 6 }}>CTO · Flutterwave · Lagos</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                    {['Fintech', 'APIs', 'Python'].map((tag) => (
                      <span key={tag} style={{ background: '#E8EFEB', color: '#1F4D3A', borderRadius: 4, padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#2D7A4F', fontWeight: 600 }}>94% match</span>
                    <span style={{ background: '#1F4D3A', color: '#FAF6EE', borderRadius: 6, padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>Connect →</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 14, margin: '8px 12px', padding: 14, display: 'flex', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A45E, #E8C57E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 700, color: '#0F1F18', flexShrink: 0 }}>
                  FH
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 700, color: '#0F1F18', marginBottom: 2 }}>Fatima Hassan</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginBottom: 6 }}>Investment Director · Partech Africa</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                    {['Venture Capital', 'SaaS'].map((tag) => (
                      <span key={tag} style={{ background: '#E8EFEB', color: '#1F4D3A', borderRadius: 4, padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#2D7A4F', fontWeight: 600 }}>87% match</span>
                    <span style={{ background: '#1F4D3A', color: '#FAF6EE', borderRadius: 6, padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>Connect →</span>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 14, margin: '8px 12px', padding: 14, display: 'flex', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E8EFEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"DM Sans", sans-serif', fontSize: 16, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>
                  BB
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 700, color: '#0F1F18', marginBottom: 2 }}>Blessing Balogun</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72', marginBottom: 6 }}>Product Lead · Andela</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const, marginBottom: 8 }}>
                    {['Product', 'Design'].map((tag) => (
                      <span key={tag} style={{ background: '#E8EFEB', color: '#1F4D3A', borderRadius: 4, padding: '2px 6px', fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#2D7A4F', fontWeight: 600 }}>81% match</span>
                    <span style={{ background: '#1F4D3A', color: '#FAF6EE', borderRadius: 6, padding: '4px 10px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>Connect →</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer bar */}
            <div style={{ background: '#FFFFFF', borderTop: '1px solid #E5E0D4', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72' }}>3 of 12 matches shown</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#1F4D3A', fontWeight: 600 }}>See all →</span>
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
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 60% 70% at 80% 30%, rgba(232,197,126,0.14) 0%, transparent 60%), radial-gradient(ellipse 55% 55% at 15% 70%, rgba(31,77,58,0.08) 0%, transparent 65%)',
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
              Networking
            </span>
          </div>

          <h1
            style={{
              fontFamily: '"DM Sans", sans-serif',
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
                fontFamily: '"DM Sans", sans-serif',
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
            Networking is included in every Karta plan. No extra seat fees. No add-on required.
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
