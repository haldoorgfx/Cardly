import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Registration & Tickets — Eventera',
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
    <section style={{ background: '#FAF6EE', padding: 'clamp(80px, 10vw, 120px) 24px clamp(120px, 14vw, 160px)', position: 'relative' as const }}>
      <div aria-hidden style={{ position: 'absolute' as const, inset: 0, background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(31,77,58,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative' as const }}>

        {/* Text column */}
        <div style={{ flex: '1 1 300px', maxWidth: 420, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#1F4D3A', textTransform: 'uppercase' as const }}>Organizer View</span>
          </div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18', marginBottom: 16, lineHeight: 1.15 }}>
            See every registration the moment it happens.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: '#3A4A42', lineHeight: 1.65, marginBottom: 32 }}>
            Track registrations, ticket types, and capacity in real time — all from one dashboard.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '847', desc: 'registered so far' },
              { label: '97%', desc: 'registration completion rate' },
              { label: '< 60s', desc: 'average time to register' },
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#FAF6EE' }}>847 registered · Registration open</span>
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
                eventera.so/e/summit/registration
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
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#1F4D3A', marginBottom: 10 }}>Pan-African Summit · Registration</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: '#1F4D3A' }}>847</div>
                    <div style={{ width: 52, height: 6, background: '#E5E0D4', borderRadius: 3, marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 20, fontWeight: 800, color: '#0F1F18' }}>1,200</div>
                    <div style={{ width: 44, height: 6, background: '#E5E0D4', borderRadius: 3, marginTop: 4 }} />
                  </div>
                </div>
                {[
                  { color: '#1F4D3A', pct: 62 },
                  { color: '#E8C57E', pct: 28 },
                  { color: '#B8423C', pct: 10 },
                ].map((t, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 6, padding: '6px 8px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: t.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: 55, height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                      <div style={{ background: '#E8EFEB', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${t.pct}%`, height: '100%', background: t.color, opacity: 0.6, borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7A72', flexShrink: 0 }}>{t.pct}%</div>
                  </div>
                ))}
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B7A72', marginTop: 6, marginBottom: 5 }}>Recent</div>
                {[{ w: 65 }, { w: 55 }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#E8EFEB', flexShrink: 0 }} />
                    <div>
                      <div style={{ width: r.w, height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                      <div style={{ width: 40, height: 5, background: '#E8EFEB', borderRadius: 3 }} />
                    </div>
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
              <div style={{ background: '#1F4D3A', padding: '10px 10px 8px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 10, fontWeight: 700, color: '#FAF6EE' }}>Pan-African Summit</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, color: 'rgba(250,246,238,0.6)', marginTop: 2 }}>Mar 15 · Nairobi</div>
              </div>
              <div style={{ padding: '8px 8px 6px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ height: 26, background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 5, marginBottom: 5 }} />
                ))}
                <div style={{ height: 30, background: '#1F4D3A', borderRadius: 6, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 50, height: 6, background: 'rgba(250,246,238,0.5)', borderRadius: 3 }} />
                </div>
              </div>
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
              fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
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
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
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
              fontFamily: 'Plus Jakarta Sans, sans-serif',
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
