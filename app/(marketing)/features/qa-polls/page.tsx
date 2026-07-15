import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Live Q&A & Polls — Eventera',
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
  { value: 'Anonymous', label: 'or named questions' },
  { value: 'Live polls', label: '& audience upvoting' },
  { value: 'Any phone', label: 'no download required' },
];

function QAPollsMockup() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(80px, 10vw, 120px) 24px clamp(120px, 14vw, 160px)', position: 'relative' as const }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' as const, justifyContent: 'center', position: 'relative' as const }}>

        {/* Text column */}
        <div style={{ flex: '1 1 300px', maxWidth: 420, textAlign: 'left' as const }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 24, height: 1, background: '#E8C57E' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#1F4D3A', textTransform: 'uppercase' as const }}>Session View</span>
          </div>
          <h2 style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18', marginBottom: 16, lineHeight: 1.15 }}>
            Questions the audience actually wants answered.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 17, color: '#3A4A42', lineHeight: 1.65, marginBottom: 32 }}>
            No mic needed. Anonymous or named. Ranked by the room in real time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { label: 'Anonymous', desc: 'or named — the attendee’s choice' },
              { label: 'Upvoting', desc: 'the room ranks the questions' },
              { label: 'Any phone', desc: 'no app download required' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.2)', borderRadius: 8, padding: '4px 10px', fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 14, fontWeight: 700, color: '#1F4D3A', flexShrink: 0 }}>{s.label}</div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#6B7A72' }}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device column */}
        <div style={{ flex: '0 0 auto', position: 'relative' as const }}>
          {/* Floating badge */}
          <div style={{ position: 'absolute' as const, top: -16, left: 20, background: '#1F4D3A', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 7, zIndex: 10, boxShadow: '0 4px 16px rgba(15,31,24,0.25)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#B8423C' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#FAF6EE' }}>87 questions · Session live</span>
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
              <div style={{ background: '#FFFFFF', borderRadius: 5, padding: '3px 10px', fontFamily: 'var(--font-sans)', fontSize: 11, color: '#6B7A72', border: '1px solid #E5E0D4' }}>
                eventera.so/e/summit/qa
              </div>
            </div>
            <div style={{ background: '#FAF6EE', display: 'flex', height: 320, overflow: 'hidden' }}>
              {/* Sidebar */}
              <div style={{ width: 130, background: '#FFFFFF', borderRight: '1px solid #E5E0D4', padding: '10px 8px', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 13, fontWeight: 700, color: '#1F4D3A', marginBottom: 14, padding: '0 4px' }}>Eventera</div>
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
                  <div>
                    <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 11, fontWeight: 700, color: '#0F1F18' }}>Fintech in East Africa</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#6B7A72' }}>87 questions · 312 voting</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B8423C' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#B8423C', fontWeight: 700 }}>LIVE</span>
                  </div>
                </div>
                {/* Top question */}
                <div style={{ background: '#FFFFFF', border: '1.5px solid #1F4D3A', borderRadius: 7, padding: '8px 10px', marginBottom: 5 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, color: '#E8C57E', marginBottom: 4, letterSpacing: '0.06em' }}>TOP</div>
                  <div style={{ width: '90%', height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                  <div style={{ width: '75%', height: 6, background: '#E5E0D4', borderRadius: 3, marginBottom: 6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ background: '#E8EFEB', borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: '#1F4D3A' }}>▲ 47</div>
                    <div style={{ width: 35, height: 5, background: '#E8EFEB', borderRadius: 3 }} />
                  </div>
                </div>
                {[{ v: 23, w1: 88, w2: 60 }, { v: 18, w1: 70, w2: 80 }].map((q, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 7, padding: '7px 10px', marginBottom: 5 }}>
                    <div style={{ width: `${q.w1}%`, height: 5, background: '#E5E0D4', borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ width: `${q.w2}%`, height: 5, background: '#E8EFEB', borderRadius: 3, marginBottom: 5 }} />
                    <div style={{ background: '#E8EFEB', display: 'inline-block', borderRadius: 4, padding: '2px 7px', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: '#1F4D3A' }}>▲ {q.v}</div>
                  </div>
                ))}
                {/* Poll */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 7, padding: '7px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#0F1F18', marginBottom: 5 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.2" strokeLinecap="round" aria-hidden><line x1="6" y1="20" x2="6" y2="13" /><line x1="12" y1="20" x2="12" y2="5" /><line x1="18" y1="20" x2="18" y2="10" /></svg>
                    Live Poll · 58 votes
                  </div>
                  {[42, 33, 25].map((pct, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      <div style={{ background: '#E8EFEB', borderRadius: 3, height: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#1F4D3A', borderRadius: 3 }} />
                      </div>
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
              <div style={{ background: '#1F4D3A', padding: '10px 10px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif', fontSize: 10, fontWeight: 700, color: '#FAF6EE' }}>Live Q&amp;A</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#B8423C' }} />
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: '#FAF6EE', fontWeight: 700 }}>LIVE</span>
                  </div>
                </div>
              </div>
              <div style={{ padding: '6px 8px' }}>
                <div style={{ background: '#FFFFFF', border: '1.5px solid #1F4D3A', borderRadius: 6, padding: '6px 8px', marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, color: '#E8C57E', fontWeight: 700, marginBottom: 3 }}>TOP</div>
                  <div style={{ width: '90%', height: 4, background: '#E5E0D4', borderRadius: 2, marginBottom: 2 }} />
                  <div style={{ width: '70%', height: 4, background: '#E5E0D4', borderRadius: 2, marginBottom: 4 }} />
                  <div style={{ background: '#E8EFEB', display: 'inline-block', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-sans)', fontSize: 9, color: '#1F4D3A', fontWeight: 600 }}>▲ 47</div>
                </div>
                {[23, 18].map((v, i) => (
                  <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 5, padding: '5px 8px', marginBottom: 4 }}>
                    <div style={{ width: i === 0 ? '85%' : '75%', height: 4, background: '#E5E0D4', borderRadius: 2, marginBottom: 4 }} />
                    <div style={{ background: '#E8EFEB', display: 'inline-block', borderRadius: 3, padding: '1px 5px', fontFamily: 'var(--font-sans)', fontSize: 9, color: '#1F4D3A', fontWeight: 600 }}>▲ {v}</div>
                  </div>
                ))}
                <div style={{ height: 22, background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 5, display: 'flex', alignItems: 'center', padding: '0 6px' }}>
                  <div style={{ width: 70, height: 4, background: '#E5E0D4', borderRadius: 2 }} />
                </div>
              </div>
            </div>
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
                fontFamily: 'var(--font-sans)',
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
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
              fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                fontFamily: 'var(--font-sans)',
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                    fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                fontFamily: 'var(--font-sans)',
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                    fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                    fontFamily: 'var(--font-sans)',
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
                  fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
                  fontFamily: 'var(--font-sans)',
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
              fontFamily: 'var(--theme-font-display, "Plus Jakarta Sans"), sans-serif',
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
              fontFamily: 'var(--font-sans)',
              fontSize: 18,
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto 40px',
            }}
          >
            Live Q&amp;A and polls are included on every Eventera plan. No clicker hardware, no third-party
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
                fontFamily: 'var(--font-sans)',
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
                fontFamily: 'var(--font-sans)',
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
