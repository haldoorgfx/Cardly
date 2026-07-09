import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Registration & Tickets — Karta',
  description:
    'Free and paid ticketing, custom registration forms, early-bird pricing, promo codes, and a waitlist — all in one shareable link.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

function IconTicket() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  );
}

function IconForm() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function IconTag() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconTicket />,
    title: 'Free & Paid Tickets',
    description:
      'Create unlimited ticket types. Set prices, limits, and sale windows. Stripe-powered, funds deposited directly to you.',
  },
  {
    icon: <IconForm />,
    title: 'Custom Registration Forms',
    description:
      'Add fields beyond name and email. T-shirt size, dietary needs, company, role — whatever your event needs to know.',
  },
  {
    icon: <IconTag />,
    title: 'Early Bird & Promo Codes',
    description:
      'Schedule automatic price changes. Reward your community with discount codes. No extra setup required.',
  },
  {
    icon: <IconUsers />,
    title: 'Waitlist & Capacity Control',
    description:
      'Set hard capacity limits. Automatically waitlist when full. Release spots one-by-one or in bulk.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Create ticket types',
    description: 'Set pricing, capacity limits, and sale windows for each ticket tier.',
  },
  {
    number: '02',
    title: 'Share your event link',
    description: 'Attendees register in under 60 seconds — no account required.',
  },
  {
    number: '03',
    title: 'Manage your list',
    description: 'Export CSV, send updates, and release waitlist spots with one click.',
  },
];

const STATS = [
  { value: '10,000+', label: 'tickets sold monthly' },
  { value: '<60s', label: 'average registration time' },
  { value: '97%', label: 'registration completion rate' },
];

function RegistrationMockup() {
  return (
    <section
      style={{
        background: '#0F1F18',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#E8C57E',
            textTransform: 'uppercase' as const,
            marginBottom: 16,
          }}
        >
          ATTENDEE VIEW
        </div>
        <h2
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#FAF6EE',
            marginBottom: 12,
          }}
        >
          What your attendees see
        </h2>
        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 16,
            color: 'rgba(250,246,238,0.65)',
            marginBottom: 48,
            lineHeight: 1.6,
          }}
        >
          A registration experience they&apos;ll actually complete.
        </p>

        {/* Phone frame */}
        <div
          style={{
            background: '#163828',
            borderRadius: 36,
            width: 300,
            margin: '0 auto',
            padding: 10,
            boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
          }}
        >
          <div
            style={{
              background: '#FAF6EE',
              borderRadius: 28,
              overflow: 'hidden',
            }}
          >
            {/* Top bar */}
            <div style={{ background: '#1F4D3A', padding: 16 }}>
              <div
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: 4,
                }}
              >
                Pan-African Tech Summit
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                Mar 15 · Nairobi
              </div>
            </div>

            {/* Ticket selector */}
            <div style={{ background: '#FFFFFF', padding: 16 }}>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: '#6B7A72',
                  marginBottom: 10,
                }}
              >
                Select ticket
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0F1F18' }}>General</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>$0 Free</span>
              </div>
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  borderRadius: 8,
                  padding: '10px 12px',
                  marginBottom: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0F1F18' }}>Early Bird</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>$49</span>
              </div>
              <div
                style={{
                  background: 'rgba(31,77,58,0.05)',
                  border: '1px solid #E5E0D4',
                  borderLeft: '3px solid #1F4D3A',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#0F1F18' }}>VIP Access</span>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#0F1F18',
                      background: '#E8C57E',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}
                  >
                    Selling fast
                  </span>
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#1F4D3A' }}>$149</span>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  color: '#6B7A72',
                  marginBottom: 10,
                }}
              >
                Your details
              </div>
              {['Full name', 'Email address', 'Company / Organisation'].map((placeholder) => (
                <div
                  key={placeholder}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    borderRadius: 8,
                    height: 40,
                    marginBottom: 8,
                    padding: '0 12px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7A72' }}>{placeholder}</span>
                </div>
              ))}
            </div>

            {/* Register button */}
            <div style={{ padding: '0 16px 16px' }}>
              <div
                style={{
                  background: '#1F4D3A',
                  color: '#FAF6EE',
                  borderRadius: 10,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                Register for VIP · $149
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 12,
                color: '#6B7A72',
                textAlign: 'center',
                paddingBottom: 16,
              }}
            >
              🔒 Secured · 2 spots remaining
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function RegistrationFeaturePage() {
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
              Registration &amp; Tickets
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
            Sell tickets. Build your list.{' '}
            <span style={{ color: C.primary }}>Own your event.</span>
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
            Free and paid ticketing, custom registration forms, early-bird pricing, promo
            codes, and a waitlist — all in one shareable link.
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

      <RegistrationMockup />

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
              Everything you need to fill seats
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: C.muted, maxWidth: 500, margin: '0 auto' }}>
              No third-party ticketing fees on top of your ticket price. Just clean, fast registration.
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
              From setup to sold-out in minutes.
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
            Ready to open registrations?
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
            Start for free. No credit card. Your first event is live in under 5 minutes.
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
              href="/features/agenda"
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
              Explore Agenda Builder →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
