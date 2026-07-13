import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Speaker Directory — Eventera',
  description:
    'Public speaker profiles with photo, bio, LinkedIn, and session schedule. The directory your attendees browse before the event. The credential your speakers share after.',
};

const C = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF', border: '#E5E0D4',
} as const;

function IconUser() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 1 0-16 0" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.122 2.122 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <IconUser />,
    title: 'Rich Speaker Profiles',
    description:
      'Name, title, company, photo, bio, LinkedIn, Twitter, website. Everything an attendee needs to get excited about a talk.',
  },
  {
    icon: <IconLink />,
    title: 'Session-Linked Profiles',
    description:
      "Each speaker's profile shows their sessions, time, and room. No confusion. No spreadsheet for attendees to dig through.",
  },
  {
    icon: <IconStar />,
    title: 'Featured Speakers',
    description:
      'Pin your headline speakers to the top. Show them on the event page hero. Give them the prominence they deserve.',
  },
  {
    icon: <IconShare />,
    title: 'Speaker-Shareable URLs',
    description:
      'Every speaker gets their own URL. They share it on LinkedIn. It drives traffic back to your event. Organic reach, free.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Add speakers',
    description: 'Upload a photo, fill in bio and social links. Takes two minutes per speaker.',
  },
  {
    number: '02',
    title: 'Link to sessions',
    description: 'Connect each speaker to their agenda sessions — profile and schedule stay in sync.',
  },
  {
    number: '03',
    title: 'Directory goes live',
    description: 'The speaker directory publishes automatically alongside your event page.',
  },
];

const STATS = [
  { value: '50+', label: 'speakers per event supported' },
  { value: '3×', label: 'more event page visits from speaker profiles' },
  { value: '100%', label: 'of plans include shareable speaker URLs' },
];

function SpeakersMockup() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(80px, 10vw, 120px) 24px clamp(120px, 14vw, 160px)', position: 'relative' as const }}>
      <div aria-hidden style={{ position: 'absolute' as const, inset: 0, background: 'radial-gradient(ellipse 55% 50% at 80% 55%, rgba(31,77,58,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative' as const }}>

        {/* Text column */}
        <div style={{ flex: '1 1 300px', maxWidth: 420, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#1F4D3A', textTransform: 'uppercase' as const }}>Speaker Directory</span>
          </div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18', marginBottom: 16, lineHeight: 1.15 }}>
            A directory that builds anticipation before day one.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: '#3A4A42', lineHeight: 1.65, marginBottom: 32 }}>
            Every speaker gets a public profile. Attendees browse before the event. Speakers share it after.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '32', desc: 'speakers published' },
              { label: '3×', desc: 'more event page visits from profiles' },
              { label: '100%', desc: 'of plans include speaker URLs' },
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
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#FAF6EE' }}>32 speakers published</span>
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
                eventera.so/e/summit/speakers
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 700, color: '#1F4D3A' }}>Speaker Directory</div>
                  <div style={{ background: '#E8EFEB', borderRadius: 999, padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#1F4D3A', fontWeight: 600 }}>32 speakers</div>
                </div>
                {/* Featured keynote */}
                <div style={{ background: 'linear-gradient(135deg,#1F4D3A,#163828)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#E8C57E,#C9A45E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#163828', flexShrink: 0 }}>AO</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#E8C57E', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 3 }}>KEYNOTE</div>
                    <div style={{ width: 80, height: 6, background: 'rgba(250,246,238,0.5)', borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ width: 60, height: 5, background: 'rgba(250,246,238,0.3)', borderRadius: 3 }} />
                  </div>
                </div>
                {/* Speaker grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {['#E8EFEB', 'rgba(232,197,126,0.15)', '#E8EFEB', 'rgba(31,77,58,0.1)'].map((bg, i) => (
                    <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 7, padding: '8px 8px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: bg, marginBottom: 5 }} />
                      <div style={{ width: i % 2 === 0 ? 58 : 50, height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                      <div style={{ width: i % 2 === 0 ? 48 : 62, height: 5, background: '#E8EFEB', borderRadius: 3, marginBottom: 5 }} />
                      <div style={{ width: 45, height: 14, background: '#E8EFEB', borderRadius: 4 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ background: '#222225', height: 14, borderRadius: '0 0 3px 3px' }} />
          <div style={{ background: '#1a1a1d', height: 5, width: '112%', margin: '0 -6%', borderRadius: '0 0 8px 8px' }} />

          {/* Phone overlay */}
          <div style={{ position: 'absolute' as const, bottom: -20, right: -35, width: 150, background: '#0F1F18', borderRadius: 24, padding: 6, boxShadow: '0 8px 40px rgba(0,0,0,0.45)', zIndex: 10 }}>
            <div style={{ background: '#FAF6EE', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(135deg,#1F4D3A,#163828)', padding: '12px 10px 10px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#E8C57E,#C9A45E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#163828' }}>AO</div>
                <div style={{ width: 60, height: 6, background: 'rgba(250,246,238,0.5)', borderRadius: 3 }} />
                <div style={{ width: 80, height: 5, background: 'rgba(250,246,238,0.3)', borderRadius: 3 }} />
                <div style={{ background: 'rgba(232,197,126,0.2)', borderRadius: 4, padding: '2px 8px', fontFamily: 'Inter, sans-serif', fontSize: 8, color: '#E8C57E', fontWeight: 600, marginTop: 2 }}>Opening Keynote</div>
              </div>
              <div style={{ padding: '8px 8px 6px' }}>
                {[{ w1: 55, w2: 48 }, { w1: 62, w2: 70 }, { w1: 50, w2: 60 }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8EFEB', flexShrink: 0 }} />
                    <div>
                      <div style={{ width: r.w1, height: 5, background: '#E5E0D4', borderRadius: 3, marginBottom: 2 }} />
                      <div style={{ width: r.w2, height: 4, background: '#E8EFEB', borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SpeakersFeaturePage() {
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
              Speaker Directory
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
            Give your speakers a stage{' '}
            <span style={{ color: C.primary }}>before they arrive.</span>
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
            Public speaker profiles with photo, bio, LinkedIn, and session schedule. The
            directory your attendees browse before the event. The credential your speakers
            share after.
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

      <SpeakersMockup />

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
              Profiles that work before and after
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: C.muted, maxWidth: 540, margin: '0 auto' }}>
              Attendees discover speakers in advance. Speakers share their profile long after the event ends.
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
              Your speaker lineup, beautifully presented in minutes.
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
            Your speakers deserve a better stage.
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
            Start for free. Speaker profiles go live the moment you publish your event.
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
              href="/features/analytics"
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
              Explore Analytics →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
