import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Eventera — The Event Platform',
  description:
    'Eventera started as a social card tool for event attendees. Then organizers asked for tickets. Then check-in. Then agenda. We built the whole platform. The Eventera Card is still the feature nobody else has.',
  openGraph: {
    title: 'About Eventera',
    description:
      'Eventera started as a social card tool for event attendees. Then organizers asked for tickets. Then check-in. Then agenda. We built the whole platform. The Eventera Card is still the feature nobody else has.',
    url: `${process.env.NEXT_PUBLIC_APP_URL}/about`,
    siteName: 'Eventera',
    type: 'website',
  },
};

// --- colours ----------------------------------------------------------------
const C = {
  primary:      '#1F4D3A',
  primaryDark:  '#163828',
  primarySoft:  '#E8EFEB',
  accent:       '#E8C57E',
  accentDark:   '#C9A45E',
  ink:          '#0F1F18',
  inkSoft:      '#3A4A42',
  muted:        '#6B7A72',
  cream:        '#FAF6EE',
  surface:      '#FFFFFF',
  border:       '#E5E0D4',
} as const;

// --- small helper icon components --------------------------------------------
function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="7" fill={color} fillOpacity="0.15" />
      <path d="M3.5 7l2.5 2.5L10.5 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="7" fill={C.muted} fillOpacity="0.12" />
      <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" fill={C.accent} />
    </svg>
  );
}

// --- page --------------------------------------------------------------------
export default function AboutPage() {
  return (
    <>
      {/* -- SECTION 1 — HERO ------------------------------------------------- */}
      <section
        style={{ background: C.cream, position: 'relative', overflow: 'hidden' }}
        className="border-b"
      >
        {/* mesh background */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              `radial-gradient(ellipse 70% 60% at 20% -10%, rgba(31,77,58,0.10) 0%, transparent 70%)`,
              `radial-gradient(ellipse 50% 50% at 80% 110%, rgba(232,197,126,0.13) 0%, transparent 65%)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />

        <div
          style={{ maxWidth: 860, margin: '0 auto', padding: '88px 20px 96px', position: 'relative', textAlign: 'center' }}
        >
          {/* overline */}
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.primary,
              marginBottom: 20,
            }}
          >
            Our story
          </p>

          {/* H1 */}
          <h1
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(40px, 6vw, 64px)',
              lineHeight: 1.0,
              letterSpacing: '-0.02em',
              color: C.primary,
              margin: '0 auto',
              maxWidth: 760,
            }}
          >
            We started with a card. We built a platform.
          </h1>

          {/* sub */}
          <p
            style={{
              fontSize: 18,
              color: C.inkSoft,
              lineHeight: 1.6,
              marginTop: 24,
              maxWidth: 620,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Eventera launched with one idea: every event attendee deserves a personalized card worth
            sharing. Three years and a few hundred thousand cards later, organizers kept asking for
            more. So we built the platform underneath.
          </p>
        </div>
      </section>

      {/* -- SECTION 2 — PLATFORM ORIGIN STORY ------------------------------- */}
      <section style={{ background: C.cream }}>
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '80px 20px',
            display: 'grid',
            gap: 56,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'start',
          }}
        >
          {/* Left — narrative */}
          <div style={{ maxWidth: 520 }}>
            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(30px, 4vw, 38px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                color: C.primary,
                marginBottom: 28,
              }}
            >
              One tool became the whole toolkit.
            </h2>

            {[
              `In 2023, we built a simple tool: upload your event design, add your name and photo, download your personalized card. Organizers loved it. Attendees shared it. It worked.`,
              `Then the requests came in. "Can you add ticket sales?" "Can attendees check in with QR codes?" "We need an agenda page our speakers can share." Each ask was reasonable. Each ask was something their existing tools didn't do well together.`,
              `So we built it. Registration. Paid ticketing. A public event page. Multi-track agenda. Speaker directory. QR check-in. Attendee networking. Live Q&A. Analytics. One platform, one link.`,
            ].map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 15,
                  color: C.inkSoft,
                  lineHeight: 1.65,
                  marginBottom: 18,
                }}
              >
                {para}
              </p>
            ))}

            {/* emphasized para */}
            <p
              style={{
                fontSize: 15,
                color: C.ink,
                lineHeight: 1.65,
                fontWeight: 500,
              }}
            >
              The Eventera Card never went away. It became the differentiator — the feature no
              competitor has copied, the moment that turns every registration into a share.
            </p>
          </div>

          {/* Right — platform feature card */}
          <div
            style={{
              borderRadius: 16,
              padding: '28px 28px 24px',
              background: 'linear-gradient(135deg, #1F4D3A 0%, #163828 100%)',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(250,246,238,0.65)',
                marginBottom: 20,
              }}
            >
              What Eventera does today
            </p>

            {/* 3x3 chip grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
              {[
                'Registration',
                'Agenda',
                'Speakers',
                'QR Check-in',
                'Networking',
                'Live Q&A',
                'Gamification',
                'Sponsor Tools',
                'Analytics',
              ].map((feature) => (
                <div
                  key={feature}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    fontSize: 13,
                    color: 'rgba(250,246,238,0.90)',
                    textAlign: 'center',
                  }}
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* Eventera Card highlight */}
            <div
              style={{
                borderTop: '1px solid rgba(232,197,126,0.30)',
                marginTop: 16,
                paddingTop: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}
            >
              <SparkleIcon />
              <div>
                <span
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: 14,
                    color: C.accent,
                    display: 'block',
                    marginBottom: 2,
                  }}
                >
                  Eventera Card
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: 'rgba(250,246,238,0.65)',
                    lineHeight: 1.5,
                  }}
                >
                  Personalized for every attendee. Included on every plan.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- SECTION 3 — THE DIFFERENTIATOR ---------------------------------- */}
      <section
        style={{
          background: 'rgba(232,239,235,0.40)',
          borderTop: `1px solid rgba(229,224,212,0.70)`,
          borderBottom: `1px solid rgba(229,224,212,0.70)`,
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '80px 20px',
            display: 'grid',
            gap: 56,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            alignItems: 'center',
          }}
        >
          {/* Left — comparison cards */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
            {/* Card A — Other platforms */}
            <div
              style={{
                flex: 1,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '20px 16px',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: C.muted,
                  marginBottom: 16,
                }}
              >
                Other platforms
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Registration', yes: true },
                  { label: 'Tickets',      yes: true },
                  { label: 'Agenda',       yes: true },
                  { label: 'Check-in',     yes: true },
                  { label: 'Eventera Card',   yes: false },
                ].map(({ label, yes }) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: yes ? C.inkSoft : C.muted }}>
                    {yes ? <CheckIcon color={C.muted} /> : <CrossIcon />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Card B — Eventera */}
            <div
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #1F4D3A 0%, #163828 100%)',
                border: `1.5px solid ${C.accentDark}`,
                borderRadius: 14,
                padding: '20px 16px',
              }}
            >
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.20em',
                  textTransform: 'uppercase',
                  color: C.accent,
                  marginBottom: 16,
                }}
              >
                Eventera
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Registration', gold: false },
                  { label: 'Tickets',      gold: false },
                  { label: 'Agenda',       gold: false },
                  { label: 'Check-in',     gold: false },
                  { label: 'Eventera Card',   gold: true  },
                ].map(({ label, gold }) => (
                  <li
                    key={label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: gold ? C.accent : 'rgba(250,246,238,0.85)',
                      fontWeight: gold ? 600 : 400,
                    }}
                  >
                    <CheckIcon color={gold ? C.accent : 'rgba(250,246,238,0.70)'} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — text */}
          <div>
            {/* gold pill overline */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(232,197,126,0.14)',
                border: `1px solid rgba(232,197,126,0.35)`,
                borderRadius: 99,
                padding: '4px 12px',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 11,
                letterSpacing: '0.16em',
                textTransform: 'uppercase' as const,
                color: C.accentDark,
                marginBottom: 20,
              }}
            >
              The Eventera difference
            </div>

            <h2
              style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3.5vw, 34px)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: C.primary,
                marginBottom: 20,
              }}
            >
              Eventbrite handles registration. Only Eventera gives every attendee a card worth sharing.
            </h2>

            <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65, marginBottom: 14 }}>
              When someone registers on Eventbrite, they get a confirmation email. When they register
              on Eventera, they get a personalized card — their photo, their name, your event brand —
              ready to post on Instagram or send on WhatsApp.
            </p>

            <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65, marginBottom: 20 }}>
              That card is organic reach. 740 cards shared at one summit meant 11,000 potential new
              event attendees saw the brand that week. No ad budget. No influencer. Just a card worth
              sharing.
            </p>

            <Link
              href="/how-it-works"
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: C.accentDark,
                textDecoration: 'none',
              }}
            >
              See how the card works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* -- SECTION 4 — VALUES ---------------------------------------------- */}
      <section style={{ background: C.cream, padding: '80px 20px' }}>
        {/* header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.primary,
              marginBottom: 14,
            }}
          >
            What we believe
          </p>
          <h2
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 40px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: C.ink,
            }}
          >
            Three things we don&apos;t compromise on.
          </h2>
        </div>

        {/* cards grid */}
        <div
          style={{
            maxWidth: 1060,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {[
            {
              title: 'Design first',
              body: 'Events should be beautiful. The platform should get out of the way of the designer\'s vision. We never ship anything we wouldn\'t use ourselves.',
            },
            {
              title: 'Built for Africa',
              body: 'We built Eventera for how events actually run in Africa — mobile-first, offline-capable, M-Pesa ready, WhatsApp-native. That said, anyone can use it anywhere.',
            },
            {
              title: 'Organizer-grade',
              body: 'We talk to event organizers every week. Every feature ships because a real organizer needed it. We don\'t build features to fill a pricing page.',
            },
          ].map((v, i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 16,
                padding: 28,
              }}
            >
              <h3
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 18,
                  color: C.ink,
                  letterSpacing: '-0.01em',
                  marginBottom: 12,
                }}
              >
                {v.title}
              </h3>
              <p style={{ fontSize: 15, color: C.inkSoft, lineHeight: 1.65 }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -- SECTION 5 — TEAM ------------------------------------------------ */}
      <section style={{ background: C.cream, padding: '64px 20px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: '-0.02em',
              color: C.primary,
              marginBottom: 8,
            }}
          >
            The team.
          </h2>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 40 }}>Small, focused, shipping fast.</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 20,
            }}
          >
            {/* Abdalla */}
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: 24,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${C.primary} 0%, ${C.accent} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 20,
                  color: C.cream,
                  margin: '0 auto 14px',
                }}
              >
                AY
              </div>
              <p
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 15,
                  color: C.ink,
                  marginBottom: 4,
                }}
              >
                Abdalla Yusuf
              </p>
              <p
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: C.muted,
                }}
              >
                Founder &amp; CEO
              </p>
            </div>

            {/* Open roles */}
            {[
              { role: 'Product Designer',     initials: '—' },
              { role: 'Full-stack Engineer',  initials: '—' },
              { role: 'Growth',               initials: '—' },
            ].map(({ role, initials }) => (
              <Link
                key={role}
                href="/contact"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: C.surface,
                    border: `1.5px dashed ${C.border}`,
                    borderRadius: 14,
                    padding: 24,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      border: `1.5px dashed ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 600,
                      fontSize: 20,
                      color: C.muted,
                      margin: '0 auto 14px',
                    }}
                  >
                    {initials}
                  </div>
                  <p
                    style={{
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontWeight: 600,
                      fontSize: 15,
                      color: C.muted,
                      marginBottom: 4,
                    }}
                  >
                    Open role
                  </p>
                  <p
                    style={{
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontSize: 11,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: C.muted,
                      opacity: 0.7,
                    }}
                  >
                    {role}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -- SECTION 6 — PRESS ----------------------------------------------- */}
      <section
        style={{
          borderTop: `1px solid ${C.border}`,
          background: C.cream,
          padding: '56px 20px 40px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: C.muted,
              marginBottom: 28,
            }}
          >
            As seen in
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '8px 40px',
            }}
          >
            {['Disrupt Africa', 'TechCabal', 'Rest of World'].map((name) => (
              <span
                key={name}
                style={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 18,
                  color: `rgba(15,31,24,0.40)`,
                }}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -- SECTION 7 — FINAL CTA ------------------------------------------- */}
      <section
        style={{
          background: `linear-gradient(135deg, ${C.primary} 0%, #2A6A50 60%, ${C.accent} 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* mesh overlay */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: [
              `radial-gradient(ellipse 60% 60% at 10% 120%, rgba(31,77,58,0.60) 0%, transparent 65%)`,
              `radial-gradient(ellipse 40% 40% at 90% -20%, rgba(232,197,126,0.20) 0%, transparent 60%)`,
            ].join(', '),
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            padding: '88px 20px 80px',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 700,
              fontSize: 'clamp(30px, 5vw, 48px)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: C.cream,
              marginBottom: 16,
            }}
          >
            Build the event your attendees will talk about.
          </h2>

          <p
            style={{
              fontSize: 17,
              color: 'rgba(250,246,238,0.80)',
              lineHeight: 1.6,
              maxWidth: 480,
              margin: '0 auto 36px',
            }}
          >
            It takes 10 minutes to set up. Everything else is just running a great event.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 28px',
                borderRadius: 99,
                background: C.accent,
                color: C.primaryDark,
                fontWeight: 600,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Start free &rarr;
            </Link>
            <Link
              href="/contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 28px',
                borderRadius: 99,
                border: `1.5px solid rgba(250,246,238,0.40)`,
                color: C.cream,
                fontWeight: 500,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              Talk to us &rarr;
            </Link>
          </div>

          {/* footer note */}
          <p
            style={{
              marginTop: 40,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'rgba(250,246,238,0.40)',
            }}
          >
            Made in Djibouti 🇩🇯 · {(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '')}
          </p>
        </div>
      </section>
    </>
  );
}
