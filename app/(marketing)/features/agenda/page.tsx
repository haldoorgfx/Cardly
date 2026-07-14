import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agenda Builder — Eventera',
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
  { value: 'Multi-track', label: 'multi-day agenda' },
  { value: '12', label: 'parallel rooms supported' },
  { value: '0', label: 'app downloads required' },
];

function AgendaMockup() {
  return (
    <section style={{ background: '#0F1F18', padding: 'clamp(72px,10vw,112px) clamp(20px,4vw,48px) 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* TOP ROW — text left, stats right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 40, alignItems: 'end', marginBottom: 48 }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.25)', color: '#E8C57E', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, borderRadius: 999, padding: '5px 14px', fontFamily: 'Inter,sans-serif', marginBottom: 20 }}>
              Organiser View
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 'clamp(1.7rem,3vw,2.4rem)', fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 14 }}>
              A schedule worth sharing<br/>before the event starts.
            </h2>
            <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 16, color: 'rgba(250,246,238,0.60)', lineHeight: 1.65, maxWidth: 400 }}>
              Multi-track, multi-day, drag-and-drop. Publish with one click. Attendees browse on any phone without an app.
            </p>
          </div>
          {/* Right — 3 stat chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12 }}>
            {[
              { n: '500+', label: 'sessions managed' },
              { n: '12', label: 'parallel tracks supported' },
              { n: '0', label: 'app downloads required' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 18px', flex: '1 1 120px' }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 28, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.03em', lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(250,246,238,0.45)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WIDE BROWSER FRAME — bleeds to bottom */}
        <div style={{ background: '#1A1A1A', borderRadius: '14px 14px 0 0', overflow: 'hidden', boxShadow: '0 -4px 60px rgba(0,0,0,0.4)' }}>
          {/* Chrome bar */}
          <div style={{ background: '#2A2A2A', height: 36, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6 }}>
            {['#FF5F57','#FEBC2E','#28C840'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            <div style={{ background: '#3A3A3A', borderRadius: 5, height: 22, flex: 1, maxWidth: 320, marginLeft: 12, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>{(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}/e/pan-african-summit/agenda</span>
            </div>
          </div>
          {/* App content */}
          <div style={{ background: '#FAF6EE' }}>
            {/* Day tabs */}
            <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E0D4', padding: '0 16px', display: 'flex', gap: 4, alignItems: 'center', height: 44 }}>
              {['Day 1 · Mar 15','Day 2 · Mar 16','Day 3 · Mar 17'].map((d, i) => (
                <div key={d} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontFamily: 'Inter,sans-serif', background: i === 0 ? '#1F4D3A' : 'transparent', color: i === 0 ? '#FAF6EE' : '#6B7A72', fontWeight: i === 0 ? 600 : 400 }}>{d}</div>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ fontSize: 11, color: '#6B7A72', fontFamily: 'Inter,sans-serif', padding: '4px 8px', border: '1px solid #E5E0D4', borderRadius: 6 }}>All tracks</div>
              </div>
            </div>
            {/* Schedule grid */}
            <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '64px 1fr 1fr 1fr', gap: 8 }}>
              {/* Column headers */}
              <div />
              {[['🎨','Design Track','#3B82F6'],['⚙️','Tech Track','#1F4D3A'],['💼','Business Track','#C9A45E']].map(([icon, name, color]) => (
                <div key={String(name)} style={{ fontSize: 11, fontFamily: 'Inter,sans-serif', color: String(color), fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, paddingBottom: 6, borderBottom: `2px solid ${String(color)}20` }}>
                  {String(icon)} {String(name)}
                </div>
              ))}

              {/* Time label col */}
              <div style={{ fontSize: 11, color: '#6B7A72', fontFamily: 'Inter,sans-serif', paddingTop: 8 }}>9:00</div>
              {/* Keynote spanning 3 cols */}
              <div style={{ gridColumn: '2 / 5', background: '#FFFFFF', border: '1px solid #E5E0D4', borderLeft: '3px solid #1F4D3A', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontFamily: 'Inter,sans-serif', fontWeight: 700, color: '#0F1F18' }}>Opening Keynote: The Future of African Innovation</div>
                <div style={{ fontSize: 10, color: '#6B7A72', marginTop: 3 }}>Dr. Amara Osei · Main Stage · All tracks</div>
              </div>

              <div style={{ fontSize: 11, color: '#6B7A72', fontFamily: 'Inter,sans-serif', paddingTop: 4 }}>10:30</div>
              <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>
                <div style={{ fontWeight: 600, color: '#0F1F18' }}>Designing for Low Bandwidth</div>
                <div style={{ color: '#6B7A72', fontSize: 10, marginTop: 2 }}>Aisha Mwangi · Studio A</div>
              </div>
              <div style={{ background: 'rgba(31,77,58,0.07)', border: '1px solid rgba(31,77,58,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>
                <div style={{ fontWeight: 600, color: '#0F1F18' }}>Building for M-Pesa</div>
                <div style={{ color: '#6B7A72', fontSize: 10, marginTop: 2 }}>Kofi Asante · Tech Lab</div>
              </div>
              <div style={{ background: 'rgba(201,164,94,0.07)', border: '1px solid rgba(201,164,94,0.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, fontFamily: 'Inter,sans-serif' }}>
                <div style={{ fontWeight: 600, color: '#0F1F18' }}>Investor Q&amp;A Panel</div>
                <div style={{ color: '#6B7A72', fontSize: 10, marginTop: 2 }}>4 speakers · Boardroom</div>
              </div>

              <div style={{ fontSize: 11, color: '#6B7A72', fontFamily: 'Inter,sans-serif', paddingTop: 4 }}>12:00</div>
              <div style={{ gridColumn: '2/5', background: 'transparent', border: '1.5px dashed #E5E0D4', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#6B7A72', fontFamily: 'Inter,sans-serif' }}>
                Networking Lunch · Rooftop Terrace
              </div>
            </div>
            <div style={{ height: 16 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

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
              fontFamily: 'Plus Jakarta Sans, sans-serif',
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

      <AgendaMockup />

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
