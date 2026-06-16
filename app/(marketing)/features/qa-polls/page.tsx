import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Live Q&A & Polls — Karta',
  description:
    'Anonymous Q&A, upvoting, and live polls that run on any phone. No app. No clicker. Speakers see what the audience actually wants to know.',
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

function IconMessageCircle() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function IconThumbsUp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

const features = [
  {
    icon: <IconMessageCircle />,
    title: 'Anonymous Q&A',
    description:
      'Attendees submit questions from their phone. Names are optional. That means more questions, better questions, from people who\'d never grab the mic.',
  },
  {
    icon: <IconThumbsUp />,
    title: 'Question Upvoting',
    description:
      'The audience votes up the questions they want answered. Speakers tackle the highest-voted first. No more repetitive questions — they get buried automatically.',
  },
  {
    icon: <IconBarChart />,
    title: 'Live Polls',
    description:
      'Launch a multiple-choice poll mid-session. Results appear on screen in real time. Word clouds for open-ended responses. Audience reactions that actually change the room.',
  },
  {
    icon: <IconShield />,
    title: 'Moderation Tools',
    description:
      'Organizers see all questions before they go live. Flag inappropriate ones, pin the best ones to the top, answer questions with a text reply the whole room sees.',
  },
];

const steps = [
  {
    n: '01',
    title: 'Enable Q&A for any session',
    body: 'Organizer enables Q&A for any session in the agenda. Takes one click. Works per-session so different rooms have independent queues.',
  },
  {
    n: '02',
    title: 'Attendees open the event link',
    body: 'Attendees open the event link on their phone during the session. No download, no account. They submit and upvote instantly.',
  },
  {
    n: '03',
    title: 'Speakers present the top questions',
    body: 'The highest-voted questions surface automatically. Speakers see a live view. The best questions get answered on stage.',
  },
];

const stats = [
  { value: '3×', label: 'more questions vs. open mic' },
  { value: '94%', label: 'of speakers say sessions are more engaging' },
  { value: 'Any phone', label: 'no download required' },
];

function QAPollsMockup() {
  return (
    <section
      style={{
        background: 'linear-gradient(180deg, #1F4D3A 0%, #163828 100%)',
        padding: 'clamp(80px, 10vw, 120px) 24px',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
        {/* Phone column — LEFT on desktop */}
        <div style={{ flex: '0 0 auto', order: 2 }}>
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
          {/* Fixed-height screen — clips like a real phone viewport */}
          <div style={{ background: '#FFFFFF', borderRadius: 28, overflow: 'hidden', height: 560, display: 'flex', flexDirection: 'column' as const }}>
            {/* Top bar */}
            <div style={{ background: '#1F4D3A', padding: '12px 14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#FAF6EE' }}>Live Q&amp;A</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#B8423C' }} />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, color: '#FAF6EE' }}>LIVE</span>
                </div>
              </div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 700, color: '#FAF6EE', marginBottom: 3 }}>Fintech in East Africa</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(250,246,238,0.65)' }}>87 questions · 312 voting</div>
            </div>

            {/* Questions list */}
            <div style={{ background: '#FAF6EE', padding: 8, display: 'flex', flexDirection: 'column' as const, gap: 6, flexShrink: 0 }}>
              {/* Q1 — TOP */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1.5px solid #1F4D3A', padding: 11 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#E8C57E', marginBottom: 5 }}>
                  Top Question
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0F1F18', lineHeight: 1.45, marginBottom: 8, textAlign: 'left' as const }}>
                  What&apos;s the biggest barrier to mobile payment adoption in rural areas?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E8EFEB', color: '#1F4D3A', borderRadius: 6, padding: '2px 7px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>▲ 47</div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72' }}>Anonymous</span>
                </div>
              </div>

              {/* Q2 */}
              <div style={{ background: '#FFFFFF', borderRadius: 10, border: '1px solid #E5E0D4', padding: 10 }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#0F1F18', lineHeight: 1.45, marginBottom: 7, textAlign: 'left' as const }}>
                  How do you see CBDCs impacting cross-border remittances?
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#E8EFEB', color: '#1F4D3A', borderRadius: 6, padding: '2px 7px', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600 }}>▲ 23</div>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72' }}>Kofi A.</span>
                </div>
              </div>
            </div>

            {/* Live Poll section */}
            <div style={{ background: '#FAF6EE', borderTop: '1px solid #E5E0D4', padding: '10px 8px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 700, color: '#0F1F18' }}>📊 Live Poll</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72' }}>58 votes</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#0F1F18', marginBottom: 8, textAlign: 'left' as const }}>
                Biggest challenge for your startup?
              </div>
              {[
                { label: 'Funding', pct: 42 },
                { label: 'Regulation', pct: 33 },
                { label: 'Talent', pct: 25 },
              ].map((opt) => (
                <div key={opt.label} style={{ marginBottom: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#0F1F18' }}>{opt.label}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72' }}>{opt.pct}%</span>
                  </div>
                  <div style={{ background: '#E8EFEB', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${opt.pct}%`, height: '100%', background: '#1F4D3A', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Input bar — pinned to bottom */}
            <div style={{ marginTop: 'auto', background: '#FFFFFF', borderTop: '1px solid #E5E0D4', height: 44, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8, flexShrink: 0 }}>
              <div style={{ flex: 1, height: 28, background: '#FAF6EE', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72' }}>Ask anonymously...</span>
              </div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1F4D3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Text column — RIGHT on desktop */}
        <div style={{ flex: '1 1 300px', maxWidth: 440, textAlign: 'left' as const, order: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#E8C57E', textTransform: 'uppercase' as const }}>
              Session View
            </span>
          </div>
          <h2 style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#FAF6EE', marginBottom: 16, lineHeight: 1.15 }}>
            Questions the audience actually wants answered.
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(250,246,238,0.65)', lineHeight: 1.65, marginBottom: 32 }}>
            No mic needed. Anonymous or named. Ranked by the room in real time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: '3×', desc: 'more questions vs. open mic' },
              { label: '94%', desc: 'of speakers say sessions are more engaging' },
              { label: 'Any phone', desc: 'no app download required' },
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
      </div>
    </section>
  );
}

export default function QAPollsPage() {
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
              'radial-gradient(ellipse 65% 65% at 85% 15%, rgba(232,197,126,0.13) 0%, transparent 65%), radial-gradient(ellipse 60% 50% at 10% 80%, rgba(31,77,58,0.07) 0%, transparent 60%)',
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
              Live Q&amp;A &amp; Polls
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
            Every voice in the room —{' '}
            <span style={{ color: C.primary }}>not just the loudest one.</span>
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
            Anonymous Q&amp;A, upvoting, and live polls that run on any phone. No app. No clicker.
            Speakers see what the audience actually wants to know.
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

      <QAPollsMockup />

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
              Audience tools that actually get used
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
              Because if it requires an app download, half the room won&apos;t bother.
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
              How Q&amp;A works
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
              Set up in one click. Live from the first question.
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
            Make every session a two-way conversation.
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
            Live Q&amp;A and polls are included on every Karta plan. No clicker hardware, no third-party
            tools.
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
