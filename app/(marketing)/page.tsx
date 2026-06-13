import Link from 'next/link';
import {
  Sparkles, Check, Ticket, LayoutTemplate, ScanLine, LayoutGrid,
  User, Network, MessageSquare, Briefcase, BarChart2,
  Sun, Users, ArrowRight, Quote,
} from 'lucide-react';
import { FAQAccordion, type FAQItem } from '@/components/marketing/FAQAccordion';

export const metadata = {
  title: { absolute: 'Karta — The complete event platform' },
  description:
    'Registration, tickets, agenda, check-in, networking, and a personalized Karta Card for every attendee. The complete event platform built for organizers everywhere.',
};

/* ─────────────────────────────────────────────────────────
   MOCK UI COMPONENTS (pure CSS/TSX — no images)
───────────────────────────────────────────────────────── */

function DashboardMock() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#163828',
        border: '1px solid rgba(232,197,126,0.15)',
        padding: '20px',
        width: '100%',
      }}
    >
      <div style={{ color: 'rgba(250,246,238,0.5)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', marginBottom: 14 }}>
        Event Analytics
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 56 }}>
        {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 4,
              background: i === 5 ? '#E8C57E' : 'rgba(250,246,238,0.15)',
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        {['847 reg.', '412 check-ins', '1,200 cards'].map((s) => (
          <div key={s} style={{ fontSize: 9, color: 'rgba(250,246,238,0.45)', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>{s}</div>
        ))}
      </div>
    </div>
  );
}

function EventPageMock() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E0D4',
        padding: '18px',
        width: '100%',
      }}
    >
      <div style={{ height: 48, borderRadius: 8, background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', marginBottom: 12 }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F1F18', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 6 }}>
        Pan-African Climate Summit
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 9, background: '#E8EFEB', color: '#1F4D3A', borderRadius: 100, padding: '3px 8px', fontFamily: 'var(--font-sans)' }}>Mar 15 · Nairobi</span>
        <span style={{ fontSize: 9, background: '#FAF6EE', color: '#6B7A72', borderRadius: 100, padding: '3px 8px', fontFamily: 'var(--font-sans)', border: '1px solid #E5E0D4' }}>2,400 attending</span>
      </div>
      <div
        style={{
          background: '#1F4D3A',
          color: '#FAF6EE',
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 100,
          padding: '7px 14px',
          textAlign: 'center',
          letterSpacing: '-0.01em',
        }}
      >
        Register →
      </div>
    </div>
  );
}

function CardConfirmMock() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#FAF6EE',
        border: '1px solid #E5E0D4',
        padding: '18px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(31,77,58,0.16)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1F4D3A', fontFamily: 'var(--font-display)', marginBottom: 12 }}>
        Your Karta Card is ready
      </div>
      {/* Mini card preview */}
      <div
        style={{
          background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)',
          borderRadius: 10,
          padding: '14px',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,197,126,0.35)', border: '1.5px solid rgba(232,197,126,0.6)' }} />
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.01em' }}>Amara Yusuf</div>
            <div style={{ fontSize: 8, color: 'rgba(250,246,238,0.6)', marginTop: 1 }}>Climate Policy Lead</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 7, color: 'rgba(232,197,126,0.8)', fontFamily: 'var(--font-sans)', letterSpacing: '0.12em' }}>KARTA</div>
      </div>
      <div
        style={{
          background: '#1F4D3A',
          color: '#FAF6EE',
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 100,
          padding: '6px 12px',
          textAlign: 'center',
        }}
      >
        Download card
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 1 — HERO
───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: '#FAF6EE' }}>
      {/* Mesh gradient blobs */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '-15%', right: '-8%',
          width: 720, height: 640,
          background: 'radial-gradient(ellipse, rgba(31,77,58,0.13) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '-20%', left: '-10%',
          width: 560, height: 560,
          background: 'radial-gradient(ellipse, rgba(232,197,126,0.10) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div
        className="relative mx-auto px-5 lg:px-10 pt-14 pb-20 lg:pt-20 lg:pb-28"
        style={{ maxWidth: 1200 }}
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

          {/* LEFT — copy */}
          <div>
            {/* Eyebrow pill */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
              style={{
                background: '#E8EFEB',
                border: '1px solid rgba(31,77,58,0.2)',
                color: '#1F4D3A',
                fontSize: 12,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.04em',
              }}
            >
              <Sparkles size={13} strokeWidth={2} />
              The complete event platform
            </div>

            <h1
              className="font-title font-bold leading-[1.0]"
              style={{
                fontSize: 'clamp(40px, 5vw, 62px)',
                color: '#1F4D3A',
                letterSpacing: '-0.035em',
              }}
            >
              The event platform that makes every attendee want to share.
            </h1>

            <p
              className="mt-6 leading-[1.6]"
              style={{ fontSize: 17, color: '#3A4A42', maxWidth: 500 }}
            >
              Registration, tickets, agenda, check-in, networking — and the only
              event platform where every registrant automatically gets a
              personalized card to share on social.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full font-medium transition-colors"
                style={{
                  background: '#1F4D3A',
                  color: '#FAF6EE',
                  padding: '12px 24px',
                  fontSize: 15,
                }}
              >
                Start free <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <Link
                href="/#platform"
                className="inline-flex items-center gap-2 rounded-full font-medium transition-colors"
                style={{
                  background: 'transparent',
                  border: '1.5px solid rgba(31,77,58,0.25)',
                  color: '#1F4D3A',
                  padding: '12px 24px',
                  fontSize: 15,
                }}
              >
                See the platform <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </div>

            {/* Trust chips */}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ fontSize: 13, color: '#6B7A72' }}>
              {['Free for 1 event', 'No credit card', 'Setup in 10 minutes'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={13} strokeWidth={2.5} style={{ color: '#1F4D3A' }} />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT — 3-screen composite (desktop only) */}
          <div className="relative hidden lg:flex items-center justify-center" style={{ minHeight: 360 }}>
            {/* Back-left panel: DashboardMock */}
            <div
              className="absolute"
              style={{
                transform: 'rotate(-5deg)',
                width: '64%',
                top: '10%',
                left: '0%',
                zIndex: 1,
                opacity: 0.88,
              }}
            >
              <DashboardMock />
            </div>

            {/* Back-right panel: EventPageMock */}
            <div
              className="absolute"
              style={{
                transform: 'rotate(3.5deg)',
                width: '52%',
                top: '5%',
                right: '0%',
                zIndex: 2,
                opacity: 0.9,
              }}
            >
              <EventPageMock />
            </div>

            {/* Front-center: CardConfirmMock */}
            <div
              className="relative"
              style={{
                width: '56%',
                zIndex: 10,
                marginTop: 60,
                filter: 'drop-shadow(0 24px 48px rgba(31,77,58,0.22))',
              }}
            >
              <CardConfirmMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 2 — TRUST STRIP
───────────────────────────────────────────────────────── */
function TrustStrip() {
  return (
    <section
      style={{
        borderTop: '1px solid #E5E0D4',
        borderBottom: '1px solid #E5E0D4',
        background: '#FAF6EE',
      }}
    >
      <div
        className="mx-auto px-5 lg:px-10 py-6"
        style={{ maxWidth: 1200 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Left: trusted by */}
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ fontSize: 12, color: '#6B7A72', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}>
              Trusted by organizations across Africa:
            </span>
            {[
              { initials: 'AU', name: 'African Union' },
              { initials: 'UNDP', name: 'UNDP' },
              { initials: 'MTN', name: 'MTN' },
            ].map((org) => (
              <span
                key={org.initials}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  border: '1px solid #E5E0D4',
                  background: '#FFFFFF',
                  fontSize: 11,
                  color: '#3A4A42',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.06em',
                }}
              >
                <span
                  style={{
                    width: 18, height: 18,
                    borderRadius: '50%',
                    background: '#E8EFEB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 700,
                    color: '#1F4D3A',
                  }}
                >
                  {org.initials.slice(0, 1)}
                </span>
                {org.name}
              </span>
            ))}
          </div>

          {/* Right: stats */}
          <div
            style={{
              fontSize: 12,
              color: '#6B7A72',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            4,200+ attendees registered · 850+ events · 11,000+ cards shared
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 3 — PLATFORM FEATURES
───────────────────────────────────────────────────────── */
const PLATFORM_FEATURES = [
  {
    icon: <Ticket size={22} strokeWidth={1.7} />,
    title: 'Registration & Tickets',
    body: 'Free and paid tickets, custom forms, Stripe + Flutterwave.',
  },
  {
    icon: <LayoutTemplate size={22} strokeWidth={1.7} />,
    title: 'Event Pages',
    body: 'Beautiful public pages with photos, agenda preview, and ticket CTAs.',
  },
  {
    icon: <ScanLine size={22} strokeWidth={1.7} />,
    title: 'QR Check-in',
    body: 'Scan attendees at the door with any phone. Offline-ready.',
  },
  {
    icon: <LayoutGrid size={22} strokeWidth={1.7} />,
    title: 'Agenda Builder',
    body: 'Multi-track drag-and-drop schedule on a clean time grid.',
  },
  {
    icon: <User size={22} strokeWidth={1.7} />,
    title: 'Speaker Directory',
    body: 'Full profiles, session assignments, and speaker portals.',
  },
  {
    icon: <Network size={22} strokeWidth={1.7} />,
    title: 'Attendee Networking',
    body: 'Profiles, 1:1 messaging, and curated AI connection suggestions.',
  },
  {
    icon: <MessageSquare size={22} strokeWidth={1.7} />,
    title: 'Live Q&A & Polls',
    body: 'Real-time session engagement that actually gets used.',
  },
  {
    icon: <Briefcase size={22} strokeWidth={1.7} />,
    title: 'Sponsor Tools',
    body: 'Exhibitor booths, lead retrieval, and sponsor showcases.',
  },
  {
    icon: <BarChart2 size={22} strokeWidth={1.7} />,
    title: 'Analytics',
    body: 'Registration funnel, session engagement, revenue, and card virality.',
  },
];

function MiniCardPreview({ name, role, accent }: { name: string; role: string; accent: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 100%)',
        border: `1px solid ${accent}`,
        borderRadius: 8,
        padding: '10px 12px',
        minWidth: 110,
      }}
    >
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(232,197,126,0.3)', marginBottom: 6 }} />
      <div style={{ fontSize: 9, fontWeight: 700, color: '#FAF6EE', letterSpacing: '-0.01em' }}>{name}</div>
      <div style={{ fontSize: 8, color: 'rgba(250,246,238,0.55)', marginTop: 2 }}>{role}</div>
    </div>
  );
}

function PlatformFeatures() {
  return (
    <section id="platform" style={{ background: '#FAF6EE', paddingTop: 80, paddingBottom: 96 }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1F4D3A',
              marginBottom: 14,
            }}
          >
            Everything for your event
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(30px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            One platform. Every phase of your event.
          </h2>
          <p style={{ marginTop: 14, fontSize: 17, color: '#3A4A42', maxWidth: 480, margin: '14px auto 0' }}>
            From the first ticket sale to the last card shared.
          </p>
        </div>

        {/* 3×3 grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {PLATFORM_FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E0D4',
                borderRadius: 12,
                padding: '28px',
              }}
            >
              <div
                style={{
                  width: 44, height: 44,
                  borderRadius: 10,
                  background: '#E8EFEB',
                  color: '#1F4D3A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <div
                className="font-display font-semibold"
                style={{ fontSize: 17, color: '#0F1F18', letterSpacing: '-0.02em', marginBottom: 6 }}
              >
                {f.title}
              </div>
              <p style={{ fontSize: 14, color: '#3A4A42', lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>

        {/* Karta Card feature tile */}
        <div
          className="flex items-center justify-between gap-8 px-6 py-8 sm:px-10 sm:py-9"
          style={{
            background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
            border: '1px solid rgba(232,197,126,0.35)',
            borderRadius: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            {/* "Unique to Karta" pill */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(232,197,126,0.18)',
                border: '1px solid rgba(232,197,126,0.4)',
                color: '#E8C57E',
                borderRadius: 100,
                padding: '4px 12px',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              <Sparkles size={11} strokeWidth={2} />
              Unique to Karta
            </span>
            <div
              className="font-title font-bold"
              style={{ fontSize: 30, color: '#E8C57E', letterSpacing: '-0.03em', marginBottom: 12 }}
            >
              Karta Card
            </div>
            <p style={{ fontSize: 15, color: 'rgba(250,246,238,0.8)', lineHeight: 1.6, maxWidth: 520 }}>
              Every attendee gets a personalized, branded card at registration — the feature no other event platform has.
            </p>
          </div>
          {/* Mini card previews (hidden on mobile) */}
          <div className="hidden lg:flex gap-3 shrink-0">
            <MiniCardPreview name="Amara Yusuf" role="Policy Lead" accent="rgba(232,197,126,0.5)" />
            <MiniCardPreview name="Kofi Mensah" role="Speaker" accent="rgba(232,197,126,0.3)" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 4 — KARTA DIFFERENCE
───────────────────────────────────────────────────────── */
function RegistrationFormMock() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E0D4',
        borderRadius: 14,
        padding: '20px',
        width: '100%',
        opacity: 0.8,
        transform: 'rotate(-5deg)',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F1F18', marginBottom: 12, fontFamily: 'var(--font-display)' }}>
        Register for the event
      </div>
      {['Full name', 'Email address', 'Job title'].map((label) => (
        <div key={label} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: '#6B7A72', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
          <div style={{ height: 28, borderRadius: 6, background: '#FAF6EE', border: '1px solid #E5E0D4' }} />
        </div>
      ))}
      <div style={{ height: 30, borderRadius: 100, background: '#1F4D3A', marginTop: 12 }} />
    </div>
  );
}

function GeneratedCardMock() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)',
        borderRadius: 16,
        padding: '20px',
        width: '100%',
        boxShadow: '0 24px 60px rgba(31,77,58,0.28)',
        position: 'relative',
      }}
    >
      {/* "Generated in 2s" pill */}
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#E8C57E',
          color: '#163828',
          fontSize: 10,
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          letterSpacing: '0.1em',
          borderRadius: 100,
          padding: '4px 12px',
          whiteSpace: 'nowrap',
        }}
      >
        Generated in 2s
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <div
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            background: 'rgba(232,197,126,0.25)',
            border: '2px solid rgba(232,197,126,0.5)',
          }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FAF6EE', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
            Amara Yusuf
          </div>
          <div style={{ fontSize: 11, color: 'rgba(250,246,238,0.6)', marginTop: 2 }}>Climate Policy Lead</div>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
        {['Instagram', 'WhatsApp', 'X'].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              background: 'rgba(250,246,238,0.1)',
              borderRadius: 100,
              padding: '5px 0',
              textAlign: 'center',
              fontSize: 9,
              color: 'rgba(250,246,238,0.6)',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.06em',
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function KartaDifference() {
  return (
    <section
      style={{
        background: 'rgba(232,239,235,0.3)',
        borderTop: '1px solid #E5E0D4',
        borderBottom: '1px solid #E5E0D4',
        paddingTop: 80,
        paddingBottom: 96,
      }}
    >
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

          {/* LEFT — copy */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(232,197,126,0.15)',
                border: '1px solid rgba(201,164,94,0.35)',
                color: '#C9A45E',
                borderRadius: 100,
                padding: '4px 12px',
                fontSize: 11,
                fontFamily: 'var(--font-sans)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 18,
              }}
            >
              The Karta difference
            </span>
            <h2
              className="font-title font-bold"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18 }}
            >
              Every attendee leaves with a card worth sharing.
            </h2>
            <p style={{ fontSize: 16, color: '#3A4A42', lineHeight: 1.65, marginBottom: 20, maxWidth: 500 }}>
              On every other platform, registration ends with a confirmation email. On Karta, it ends with a moment — a card that says &ldquo;I was there,&rdquo; personalized and ready to post.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Generated automatically at registration — no designer needed',
                'Their photo, their name, your brand — every card unique',
                'One tap to Instagram, WhatsApp, X, LinkedIn',
                'Every share reaches people who haven\'t heard of your event yet',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: '#3A4A42' }}>
                  <Check size={15} strokeWidth={2.5} style={{ color: '#1F4D3A', marginTop: 2, flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/#how"
              style={{ fontSize: 14, color: '#C9A45E', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              See how it works <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {/* RIGHT — card over form */}
          <div className="relative flex items-center justify-center" style={{ minHeight: 300 }}>
            <div style={{ width: '80%', position: 'absolute', top: 0, left: '5%' }}>
              <RegistrationFormMock />
            </div>
            <div style={{ width: '72%', position: 'relative', zIndex: 10, marginTop: 80 }}>
              <GeneratedCardMock />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 5 — HOW IT WORKS
───────────────────────────────────────────────────────── */
function StepMock({ type }: { type: 'event' | 'tickets' | 'agenda' | 'register' | 'analytics' }) {
  if (type === 'event') {
    return (
      <div style={{ background: '#163828', borderRadius: 8, padding: '12px', marginTop: 12 }}>
        <div style={{ height: 8, background: 'rgba(250,246,238,0.2)', borderRadius: 4, marginBottom: 6, width: '70%' }} />
        <div style={{ height: 6, background: 'rgba(250,246,238,0.1)', borderRadius: 4, marginBottom: 4, width: '90%' }} />
        <div style={{ height: 6, background: 'rgba(250,246,238,0.1)', borderRadius: 4, width: '55%' }} />
      </div>
    );
  }
  if (type === 'tickets') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '12px', marginTop: 12 }}>
        {['Free · $0', 'General · $25', 'VIP · $80'].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 2 ? '1px solid #E5E0D4' : 'none' }}>
            <div style={{ fontSize: 9, color: '#0F1F18', fontFamily: 'var(--font-sans)' }}>{t}</div>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: '#E8EFEB' }} />
          </div>
        ))}
      </div>
    );
  }
  if (type === 'agenda') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '10px', marginTop: 12 }}>
        {['09:00 — Opening keynote', '10:30 — Panel discussion', '12:00 — Networking lunch'].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i < 2 ? '1px solid #F0EDE5' : 'none' }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: i === 0 ? '#E8C57E' : '#E8EFEB', flexShrink: 0 }} />
            <div style={{ fontSize: 8, color: '#3A4A42', fontFamily: 'var(--font-sans)' }}>{s}</div>
          </div>
        ))}
      </div>
    );
  }
  if (type === 'register') {
    return (
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '12px', marginTop: 12 }}>
        {['Name', 'Email', 'Role'].map((f, i) => (
          <div key={i} style={{ height: 18, background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 4, marginBottom: 5 }} />
        ))}
        <div style={{ height: 20, background: '#1F4D3A', borderRadius: 100, marginTop: 6 }} />
        <div style={{ marginTop: 8, height: 28, background: 'linear-gradient(135deg, #163828, #1F4D3A)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 7, color: '#E8C57E', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>KARTA CARD READY</div>
        </div>
      </div>
    );
  }
  // analytics
  return (
    <div style={{ background: '#163828', borderRadius: 8, padding: '12px', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 36 }}>
        {[40, 60, 45, 80, 65, 90, 75].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 3, background: i === 5 ? '#E8C57E' : 'rgba(250,246,238,0.2)' }} />
        ))}
      </div>
    </div>
  );
}

const HOW_STEPS: { n: string; title: string; desc: string; mock: 'event' | 'tickets' | 'agenda' | 'register' | 'analytics' }[] = [
  { n: '1', title: 'Create your event', desc: 'Design your event page. Add cover photo, description, venue, date.', mock: 'event' },
  { n: '2', title: 'Set up tickets', desc: 'Free or paid. Early bird, VIP, general — with promo codes.', mock: 'tickets' },
  { n: '3', title: 'Build your agenda', desc: 'Multi-track schedule, speakers, session descriptions.', mock: 'agenda' },
  { n: '4', title: 'Attendees register', desc: 'They fill a form, pay if needed, and get their Karta Card.', mock: 'register' },
  { n: '5', title: 'Track everything', desc: 'Check-ins, session attendance, networking, card shares — in real time.', mock: 'analytics' },
];

function HowItWorks() {
  return (
    <section id="how" style={{ paddingTop: 80, paddingBottom: 96, background: '#FAF6EE' }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-14">
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1F4D3A',
              marginBottom: 14,
            }}
          >
            How Karta works
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            From first ticket to last card shared.
          </h2>
        </div>

        {/* Steps grid */}
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute"
            style={{
              top: 24,
              left: '10%',
              right: '10%',
              height: 2,
              background: 'linear-gradient(90deg, rgba(232,197,126,0.2) 0%, #E8C57E 50%, rgba(232,197,126,0.2) 100%)',
              zIndex: 0,
            }}
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="relative" style={{ zIndex: 1 }}>
                {/* Number dot */}
                <div
                  style={{
                    width: 48, height: 48,
                    borderRadius: '50%',
                    background: '#E8C57E',
                    border: '4px solid #FAF6EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#163828',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 14,
                    boxShadow: '0 0 0 2px rgba(232,197,126,0.4)',
                  }}
                >
                  {step.n}
                </div>
                <div
                  className="font-display font-semibold"
                  style={{ fontSize: 15, color: '#0F1F18', letterSpacing: '-0.02em', marginBottom: 6 }}
                >
                  {step.title}
                </div>
                <p style={{ fontSize: 13, color: '#6B7A72', lineHeight: 1.55 }}>{step.desc}</p>
                <StepMock type={step.mock} />
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-14">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full font-medium transition-colors"
            style={{ background: '#1F4D3A', color: '#FAF6EE', padding: '13px 28px', fontSize: 15 }}
          >
            Start your first event <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 6 — USE CASES
───────────────────────────────────────────────────────── */
const USE_CASES = [
  {
    title: 'Tech Conferences',
    icon: <LayoutGrid size={20} strokeWidth={1.8} />,
    body: 'Multi-track agendas, speaker directories, startup networking.',
    gradient: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
  },
  {
    title: 'NGO Campaigns',
    icon: <Network size={20} strokeWidth={1.8} />,
    body: 'Supporter cards, awareness drives, fundraising registration.',
    gradient: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #3E7E5E 100%)',
  },
  {
    title: 'Political Events',
    icon: <Users size={20} strokeWidth={1.8} />,
    body: 'Rally registration, volunteer coordination, endorsement cards.',
    gradient: 'linear-gradient(120deg, #163828 0%, #1F4D3A 100%)',
  },
  {
    title: 'Corporate Events',
    icon: <Briefcase size={20} strokeWidth={1.8} />,
    body: 'Brand activations, product launches, lead retrieval for sponsors.',
    gradient: 'linear-gradient(130deg, #1F4D3A 0%, #2A6A50 60%, #C9A45E 100%)',
  },
  {
    title: 'Religious Organizations',
    icon: <Sun size={20} strokeWidth={1.8} />,
    body: 'Community conferences, Ramadan iftar events, charity drives.',
    gradient: 'linear-gradient(160deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
  },
];

// Topo SVG lines
function TopoLines() {
  return (
    <svg
      viewBox="0 0 300 150"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden
    >
      <path d="M0 30 Q75 10 150 35 T300 25" stroke="#E8C57E" strokeWidth="1" fill="none" opacity="0.12" />
      <path d="M0 55 Q80 35 160 58 T300 50" stroke="#E8C57E" strokeWidth="1" fill="none" opacity="0.10" />
      <path d="M0 80 Q70 60 140 82 T300 75" stroke="#E8C57E" strokeWidth="1" fill="none" opacity="0.08" />
      <path d="M0 105 Q90 85 170 108 T300 100" stroke="#E8C57E" strokeWidth="1" fill="none" opacity="0.06" />
      <path d="M0 130 Q85 110 155 132 T300 125" stroke="#E8C57E" strokeWidth="1" fill="none" opacity="0.05" />
    </svg>
  );
}

function UseCases() {
  return (
    <section id="use-cases" style={{ background: '#FAF6EE', paddingTop: 80, paddingBottom: 96 }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-12">
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1F4D3A',
              marginBottom: 14,
            }}
          >
            Use cases
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Whatever you&apos;re organizing, Karta handles it.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Cards 1-5 */}
          {USE_CASES.map((c) => (
            <article
              key={c.title}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E0D4',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              {/* Gradient cover with topo lines */}
              <div
                style={{
                  height: 150,
                  background: c.gradient,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <TopoLines />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 14,
                    left: 16,
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(250,246,238,0.12)',
                    border: '1px solid rgba(250,246,238,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FAF6EE',
                  }}
                >
                  {c.icon}
                </div>
              </div>
              <div style={{ padding: '20px 24px 24px' }}>
                <div
                  className="font-display font-semibold"
                  style={{ fontSize: 18, color: '#0F1F18', letterSpacing: '-0.02em', marginBottom: 8 }}
                >
                  {c.title}
                </div>
                <p style={{ fontSize: 14, color: '#3A4A42', lineHeight: 1.6 }}>{c.body}</p>
              </div>
            </article>
          ))}

          {/* Card 6 — African Summits (special dark) */}
          <article
            style={{
              background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 100%)',
              border: '1px solid rgba(232,197,126,0.3)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ height: 150, background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 100%)', position: 'relative', overflow: 'hidden' }}>
              <TopoLines />
              <span
                style={{
                  position: 'absolute',
                  top: 14,
                  left: 16,
                  background: 'rgba(232,197,126,0.2)',
                  border: '1px solid rgba(232,197,126,0.4)',
                  color: '#E8C57E',
                  fontSize: 10,
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  borderRadius: 100,
                  padding: '4px 10px',
                }}
              >
                Built for Africa
              </span>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <h3
                className="font-display font-semibold"
                style={{ fontSize: 18, color: '#E8C57E', letterSpacing: '-0.02em', marginBottom: 8 }}
              >
                African Summits
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(250,246,238,0.8)', lineHeight: 1.6 }}>
                Mobile-first, WhatsApp-native, Flutterwave payments. Built for how Africa events run.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 7 — PRICING
───────────────────────────────────────────────────────── */
const FREE_FEATURES = [
  '1 active event',
  '50 registrations',
  'Basic event page',
  'QR check-in',
  'Karta Card for every attendee',
  'Karta watermark on cards',
];
const PRO_FEATURES = [
  'Unlimited events',
  '500 registrations/month',
  'Full agenda builder',
  'Speaker directory',
  'Attendee networking',
  '1:1 messaging',
  'Remove Karta watermark',
  'Email notifications',
  'Basic analytics',
];
const STUDIO_FEATURES = [
  'Unlimited registrations',
  'AI matchmaking',
  'Live Q&A & Polls',
  'Gamification & leaderboard',
  'Sponsor tools & lead retrieval',
  'Multiple brand kits',
  '3 team seats',
  'API access',
  'Priority support',
];

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  popular,
  everythingInPro,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
  everythingInPro?: boolean;
}) {
  return (
    <div
      style={{
        background: popular ? '#1F4D3A' : '#FFFFFF',
        border: popular ? '1.5px solid #E8C57E' : '1px solid #E5E0D4',
        borderRadius: 16,
        padding: '32px 28px',
        display: 'flex',
        flexDirection: 'column',
        marginTop: popular ? -12 : 0,
        marginBottom: popular ? 12 : 0,
        position: 'relative',
      }}
    >
      {popular && (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#E8C57E',
            color: '#163828',
            fontSize: 10,
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            borderRadius: 100,
            padding: '4px 14px',
            whiteSpace: 'nowrap',
          }}
        >
          POPULAR
        </div>
      )}

      {popular && (
        <div style={{ background: '#E8EFEB', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#1F4D3A', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Most organizers start here
          </div>
        </div>
      )}

      <div
        className="font-display font-semibold"
        style={{ fontSize: 15, color: popular ? '#E8C57E' : '#1F4D3A', marginBottom: 10 }}
      >
        {name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
        <span
          className="font-display font-bold"
          style={{ fontSize: 42, color: popular ? '#FAF6EE' : '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1 }}
        >
          {price}
        </span>
        {period && (
          <span style={{ fontSize: 14, color: popular ? 'rgba(250,246,238,0.6)' : '#6B7A72' }}>{period}</span>
        )}
      </div>

      {everythingInPro && (
        <div style={{ fontSize: 12, color: popular ? 'rgba(250,246,238,0.6)' : '#6B7A72', marginBottom: 12 }}>
          Everything in Pro, plus:
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {features.map((f) => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: popular ? 'rgba(250,246,238,0.9)' : '#3A4A42' }}>
            <Check size={14} strokeWidth={2.5} style={{ color: popular ? '#E8C57E' : '#1F4D3A', marginTop: 2, flexShrink: 0 }} />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          borderRadius: 100,
          fontWeight: 600,
          fontSize: 14,
          padding: '11px 20px',
          background: popular ? '#E8C57E' : 'transparent',
          color: popular ? '#163828' : '#1F4D3A',
          border: popular ? 'none' : '1.5px solid rgba(31,77,58,0.35)',
          textDecoration: 'none',
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" style={{ background: '#FAF6EE', paddingTop: 80, paddingBottom: 96 }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 1200 }}>
        <div className="text-center mb-12">
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1F4D3A',
              marginBottom: 14,
            }}
          >
            Pricing
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em' }}
          >
            Start free. Pay as you grow.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          <PricingCard
            name="Free"
            price="$0"
            period="/mo"
            features={FREE_FEATURES}
            cta="Start free"
            href="/signup"
          />
          <PricingCard
            name="Pro"
            price="$19"
            period="/mo"
            features={PRO_FEATURES}
            cta="Start Pro"
            href="/signup?plan=pro"
            popular
          />
          <PricingCard
            name="Studio"
            price="$49"
            period="/mo"
            features={STUDIO_FEATURES}
            cta="Start Studio"
            href="/signup?plan=studio"
            everythingInPro
          />
        </div>

        <div className="text-center mt-10" style={{ fontSize: 14, color: '#6B7A72' }}>
          All plans include the Karta Card feature. It&apos;s not an add-on — it&apos;s standard.{' '}
          <Link href="/pricing" style={{ color: '#1F4D3A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Compare all features →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 8 — TESTIMONIAL
───────────────────────────────────────────────────────── */
function Testimonial() {
  return (
    <section
      style={{
        borderTop: '1px solid #E5E0D4',
        borderBottom: '1px solid #E5E0D4',
        background: 'rgba(250,246,238,0.4)',
        paddingTop: 72,
        paddingBottom: 72,
      }}
    >
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 860 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#1F4D3A',
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          From organizers who&apos;ve run real events on Karta
        </div>
        <Quote size={38} strokeWidth={1.5} style={{ color: '#E8C57E', margin: '0 auto 20px', display: 'block' }} />
        <blockquote
          className="font-display"
          style={{
            fontSize: 'clamp(20px, 2.8vw, 30px)',
            color: '#0F1F18',
            lineHeight: 1.4,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            marginBottom: 28,
          }}
        >
          &ldquo;We ran registration, check-in and the agenda on Karta — but the cards are what people remember. 600 attendees, 740 cards shared. The reach was 10x what our email kit ever did.&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              background: '#E8EFEB',
              border: '2px solid #1F4D3A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              color: '#1F4D3A',
              fontFamily: 'var(--font-display)',
            }}
          >
            AY
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1F18', fontFamily: 'var(--font-display)' }}>Amara Yusuf</div>
            <div style={{ fontSize: 12, color: '#6B7A72', fontFamily: 'var(--font-sans)' }}>Comms Lead · Pan-African Climate Summit</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 9 — FAQ
───────────────────────────────────────────────────────── */
const LANDING_FAQS: FAQItem[] = [
  {
    q: 'Is Karta a full event platform, or just cards?',
    a: 'A full platform. Karta runs your event end to end — registration, ticketing, event pages, QR check-in, agenda builder, speaker directory, attendee networking, live Q&A, sponsor tools, and analytics. The Karta Card is the feature that makes it unique, but it sits inside a complete event management product.',
  },
  {
    q: 'How is Karta different from Eventbrite or Whova?',
    a: 'Same core toolkit — registration, check-in, agenda, networking. Plus the part they can\'t do: every attendee automatically gets a personalized, branded share card at registration. No Canva, no designer, no manual work. It ships with your event, not as a separate campaign.',
  },
  {
    q: 'Do attendees need to download an app?',
    a: 'No. Attendees register, get their card, network, and check in entirely from a web link — on any phone. No app download, no account creation required.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'Card payments via Stripe, plus Flutterwave, Paystack, M-Pesa, and MTN MoMo for African markets. You can accept both free and paid registrations on the same event.',
  },
  {
    q: 'Does every plan include the Karta Card?',
    a: 'Yes. The Karta Card is standard on every plan — Free, Pro, and Studio. Free tier cards include a small Karta watermark. Pro and Studio remove it.',
  },
  {
    q: 'Can I check attendees in without internet at the door?',
    a: 'Yes. QR check-in works offline — the app caches your guest list locally and syncs when connectivity is restored. This is especially useful for venues with patchy Wi-Fi.',
  },
  {
    q: 'What\'s included in AI matchmaking and networking?',
    a: 'Pro includes attendee profiles, 1:1 messaging, and manual browsing. Studio adds AI-powered matchmaking — the system suggests relevant connections based on attendee profiles, interests, and session choices. Fully opt-in for attendees.',
  },
  {
    q: 'Can I move from a spreadsheet or another platform?',
    a: 'Yes. Import your registrant list by CSV and we\'ll map your columns to Karta fields. Supports Eventbrite CSV exports, Google Sheets, and any standard format with Name, Email, and custom fields.',
  },
];

function FAQSection() {
  return (
    <section id="faq" style={{ paddingTop: 80, paddingBottom: 96, background: '#FAF6EE' }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 920 }}>
        <div className="text-center mb-12">
          <div
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#1F4D3A',
              marginBottom: 14,
            }}
          >
            FAQ
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#0F1F18', letterSpacing: '-0.03em' }}
          >
            Questions we get every week.
          </h2>
        </div>
        <FAQAccordion items={LANDING_FAQS} defaultOpen={0} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 10 — FINAL CTA
───────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section
      style={{
        background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 55%, #235741 100%)',
        paddingTop: 88,
        paddingBottom: 96,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Gold radial glow bottom-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,197,126,0.22) 0%, transparent 65%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative mx-auto px-5 lg:px-10 text-center" style={{ maxWidth: 760 }}>
        <h2
          className="font-title font-bold"
          style={{
            fontSize: 'clamp(30px, 5vw, 54px)',
            color: '#FAF6EE',
            letterSpacing: '-0.035em',
            lineHeight: 1.05,
            marginBottom: 18,
          }}
        >
          Your next event deserves better than a spreadsheet and a Canva template.
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(250,246,238,0.8)', lineHeight: 1.6, marginBottom: 32 }}>
          Set up your event in 10 minutes. Everything else follows.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#E8C57E',
              color: '#163828',
              borderRadius: 100,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Start free <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1.5px solid rgba(250,246,238,0.3)',
              color: '#FAF6EE',
              borderRadius: 100,
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Talk to us
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE ASSEMBLY
───────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <PlatformFeatures />
      <KartaDifference />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Testimonial />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
