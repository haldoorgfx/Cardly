import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agenda Builder — Karta',
  description:
    'Build a multi-track, multi-day agenda with drag-and-drop. Speakers see their own schedule. Attendees bookmark sessions. Everyone arrives prepared.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

function IconGrid() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3M8 22h8" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconGrid />,
    title: 'Multi-Track & Multi-Day',
    description:
      'Organize parallel sessions across rooms and days. Color-code tracks. Attendees filter to what matters to them.',
  },
  {
    icon: <IconMic />,
    title: 'Speaker-Linked Sessions',
    description:
      "Every session links to the speaker's profile. One click to their bio, LinkedIn, and other talks at your event.",
  },
  {
    icon: <IconGlobe />,
    title: 'Public Agenda Page',
    description:
      'Your agenda lives on a shareable link. No app download. No login. Works perfectly on any phone.',
  },
  {
    icon: <IconClock />,
    title: 'Timezone-Aware',
    description:
      'Set your event timezone once. The agenda displays correctly for every attendee, wherever they are.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Add sessions',
    description: 'Set time, room, track, and description for each session in your programme.',
  },
  {
    number: '02',
    title: 'Link your speakers',
    description: 'Connect each session to a speaker profile — bio, photo, and socials auto-populate.',
  },
  {
    number: '03',
    title: 'Publish and share',
    description: 'Attendees browse, filter by track, and plan their day before they arrive.',
  },
];

const STATS = [
  { value: '500+', label: 'sessions managed' },
  { value: '12', label: 'parallel rooms supported' },
  { value: '0', label: 'app downloads required' },
];

export default function AgendaFeaturePage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: C.cream,
          position: 'relative',
          overflow: 'hidden',
          padding: 'clamp(80px, 12vw, 140px) 24px clamp(64px, 10vw, 120px)',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 60% at 60% -10%, rgba(31,77,58,0.07) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(232,197,126,0.10) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.primarySoft,
              border: `1px solid ${C.border}`,
              borderRadius: 999,
              padding: '6px 16px',
              marginBottom: 28,
            }}
          >
            <span style={{ color: C.primary, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'Inter, sans-serif' }}>
              Agenda Builder
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: C.ink,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            A schedule worth sharing —{' '}
            <span style={{ color: C.primary }}>before the event even starts.</span>
          </h1>

          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: C.inkSoft,
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto 40px',
            }}
          >
            Build a multi-track, multi-day agenda with drag-and-drop. Speakers see their own
            schedule. Attendees bookmark sessions. Everyone arrives prepared.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.primary,
                color: C.cream,
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 28px',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.surface,
                color: C.primary,
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 28px',
                borderRadius: 10,
                textDecoration: 'none',
                border: `1.5px solid ${C.border}`,
              }}
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature cards ───────────────────────────────────────────── */}
      <section style={{ background: C.surface, padding: 'clamp(64px, 10vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 16,
              }}
            >
              Built for complex programmes
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: C.muted, maxWidth: 500, margin: '0 auto' }}>
              Whether you have 5 sessions or 500, your agenda stays clear and navigable.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 24,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: C.cream,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: '32px 28px',
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: C.primarySoft,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.primary,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section style={{ background: C.cream, padding: 'clamp(64px, 10vw, 100px) 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 16,
              }}
            >
              How it works
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: C.muted }}>
              Agenda published before you finish your coffee.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 32,
            }}
          >
            {STEPS.map((step) => (
              <div key={step.number} style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
                <div
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 48,
                    fontWeight: 800,
                    color: C.primarySoft,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {step.number}
                </div>
                <h3
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
            textAlign: 'center',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  color: C.primary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: C.muted }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
          padding: 'clamp(72px, 12vw, 120px) 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 20,
            }}
          >
            Build your agenda today.
          </h2>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.65,
              marginBottom: 40,
            }}
          >
            Start for free. Your programme page is live the moment you publish.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: C.accent,
                color: C.ink,
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                padding: '14px 32px',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Create your event
            </Link>
            <Link
              href="/features/speakers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontFamily: 'Inter, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 32px',
                borderRadius: 10,
                textDecoration: 'none',
                border: '1.5px solid rgba(255,255,255,0.25)',
              }}
            >
              Explore Speaker Directory →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
