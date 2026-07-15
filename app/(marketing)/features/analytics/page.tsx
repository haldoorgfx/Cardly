import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Event Analytics — Eventera',
  description:
    'Registration trends, ticket revenue, page views, check-in rates, and geographic breakdown. The metrics that help you sell more tickets and plan better events.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

function IconTrendUp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function IconCheckSquare() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 11 3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
      <line x1="2" x2="22" y1="20" y2="20" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconTrendUp />,
    title: 'Registration Trends',
    description:
      'See registrations by day and hour. Identify your traffic spikes. Know which channels drive the most sign-ups.',
  },
  {
    icon: <IconDollar />,
    title: 'Ticket Revenue Dashboard',
    description:
      'Gross revenue, fees, net payout — all in one view. Break down by ticket type. Export for your accountant.',
  },
  {
    icon: <IconCheckSquare />,
    title: 'Check-in Analytics',
    description:
      'See real-time attendance as your event happens. Check-in rate by ticket type, peak arrival times, no-show rate.',
  },
  {
    icon: <IconBarChart />,
    title: 'Page Performance',
    description:
      'Total page views, unique visitors, bounce rate, and time spent. Know what\'s working on your event landing page.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Tracking is automatic',
    description: 'Your event page tracks all visits from the moment it goes live. Zero setup.',
  },
  {
    number: '02',
    title: 'Every action is logged',
    description: 'Each registration, ticket sale, and check-in is captured in real time.',
  },
  {
    number: '03',
    title: 'View live during your event',
    description: 'Watch your dashboard update as attendees arrive. Export any dataset with one click.',
  },
];

const STATS = [
  { value: 'Live', label: 'real-time data' },
  { value: 'Exportable', label: 'download any dataset' },
  { value: 'CSV', label: 'export on all plans' },
];

function AnalyticsMockup() {
  const barHeights = [24, 36, 30, 56, 44, 80, 70];
  const barDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <section style={{ background: 'linear-gradient(165deg, #1F4D3A 0%, #163828 100%)', padding: 'clamp(72px,10vw,112px) clamp(20px,4vw,48px) 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* TOP ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 40, alignItems: 'end', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.25)', color: '#E8C57E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, borderRadius: 999, padding: '5px 14px', fontFamily: 'var(--font-sans)', marginBottom: 20 }}>
              Organiser Dashboard
            </div>
            <h2 style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>
              Every metric that matters, live.
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'rgba(250,246,238,0.60)', lineHeight: 1.65, maxWidth: 400 }}>
              From the moment your page goes live — registrations, revenue, check-in rates, page views. All in one place.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12 }}>
            {[
              { n: '412', label: 'registrations' },
              { n: '$8,200', label: 'gross revenue' },
              { n: '87%', label: 'check-in rate' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', flex: '1 1 120px' }}>
                <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 28, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(250,246,238,0.45)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDE DASHBOARD FRAME */}
        <div style={{ background: '#1A2620', borderRadius: '14px 14px 0 0', padding: 20, boxShadow: '0 -4px 60px rgba(0,0,0,0.4)' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 700, color: '#FAF6EE' }}>Pan-African Tech Summit</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D7A4F', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#2D7A4F' }}>Live · Mar 15, 2025</span>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginTop: 16, marginBottom: 20 }}>
            {[
              { val: '412', label: 'Registrations', sub: '+23 today', subColor: '#2D7A4F' },
              { val: '$8,200', label: 'Revenue', sub: '+$340 today', subColor: '#2D7A4F' },
              { val: '87%', label: 'Check-in rate', sub: '359 of 412', subColor: 'rgba(250,246,238,0.45)' },
              { val: '2,841', label: 'Page views', sub: '+124 today', subColor: '#2D7A4F' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 24, fontWeight: 700, color: '#FAF6EE', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'rgba(250,246,238,0.45)', marginTop: 4 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: s.subColor, marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: 'rgba(250,246,238,0.7)' }}>Registrations this week</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(250,246,238,0.4)' }}>Export CSV →</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
              {barHeights.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 0, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '100%', height: h, background: i === 5 ? '#E8C57E' : i === 6 ? 'rgba(31,77,58,0.5)' : 'rgba(31,77,58,0.7)', borderRadius: '4px 4px 0 0' }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', marginTop: 6 }}>
              {barDays.map((d, i) => (
                <div key={i} style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 10, color: 'rgba(250,246,238,0.35)', textAlign: 'center' as const }}>{d}</div>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16, marginTop: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#FAF6EE', marginBottom: 10 }}>Ticket breakdown</div>
              {[
                { label: 'General', price: '$0', pct: 62 },
                { label: 'Professional', price: '$49', pct: 35 },
                { label: 'VIP', price: '$149', pct: 8 },
              ].map((r) => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(250,246,238,0.7)' }}>{r.label} {r.price}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B7A72' }}>{r.pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', height: 6, borderRadius: 3 }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: '#1F4D3A', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#FAF6EE', marginBottom: 10 }}>Top referrer channels</div>
              {[
                { label: 'Instagram', pct: 38 },
                { label: 'WhatsApp', pct: 27 },
                { label: 'Direct', pct: 20 },
                { label: 'Other', pct: 15 },
              ].map((r) => (
                <div key={r.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#FAF6EE' }}>{r.label}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B7A72' }}>{r.pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', height: 6, borderRadius: 3 }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: '#1F4D3A', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AnalyticsFeaturePage() {
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
            <span style={{ color: C.primary, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-sans)' }}>
              Event Analytics
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: C.ink,
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Know exactly how your event is performing —{' '}
            <span style={{ color: C.primary }}>in real time.</span>
          </h1>

          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: C.inkSoft,
              lineHeight: 1.7,
              maxWidth: 600,
              margin: '0 auto 40px',
            }}
          >
            Registration trends, ticket revenue, page views, check-in rates, and geographic
            breakdown. The metrics that help you sell more tickets and plan better events.
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
                fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--font-sans)',
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

      <AnalyticsMockup />

      {/* ── Feature cards ───────────────────────────────────────────── */}
      <section style={{ background: C.surface, padding: 'clamp(64px, 10vw, 100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 16,
              }}
            >
              The full picture, not just a headcount
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: C.muted, maxWidth: 520, margin: '0 auto' }}>
              Every metric you need to understand your audience and improve your next event.
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {f.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>
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
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: C.ink,
                marginBottom: 16,
              }}
            >
              How it works
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: C.muted }}>
              Analytics on by default. No tracking scripts to install.
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: C.ink,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {step.title}
                </h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>
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
                  fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  fontWeight: 800,
                  color: C.primary,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                {s.value}
              </span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: C.muted }}>
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
        <div style={{ position: 'relative', maxWidth: 640, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
              marginBottom: 20,
            }}
          >
            Stop guessing. Start knowing.
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.65,
              marginBottom: 40,
            }}
          >
            Start for free. Analytics are included on every plan, from day one.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: C.accent,
                color: C.ink,
                fontFamily: 'var(--font-sans)',
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
              href="/features/registration"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.12)',
                color: '#FFFFFF',
                fontFamily: 'var(--font-sans)',
                fontSize: 15,
                fontWeight: 600,
                padding: '14px 32px',
                borderRadius: 10,
                textDecoration: 'none',
                border: '1.5px solid rgba(255,255,255,0.25)',
              }}
            >
              Explore Registration →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
