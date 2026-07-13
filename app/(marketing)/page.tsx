import Link from 'next/link';
import {
  Sparkles, Check, Ticket, BarChart2,
  LayoutGrid, Network, Briefcase, Sun, Users,
  ArrowRight, Quote,
} from 'lucide-react';
import { FAQAccordion, type FAQItem } from '@/components/marketing/FAQAccordion';
import {
  Scene1DashboardHero, Scene2Registration, Scene3Analytics,
  Scene4Card, Scene5LiveQA, Scene6HowItWorks,
} from '@/components/marketing/home-visuals';

export const metadata = {
  title: { absolute: 'Eventera — The complete event platform' },
  description:
    'Registration, tickets, agenda, check-in, networking, and a personalized Eventera Card for every attendee. The complete event platform built for organizers everywhere.',
};


/* ─────────────────────────────────────────────────────────
   SECTION 1 — HERO
───────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section
      className="relative overflow-hidden flex flex-col"
      style={{ background: '#FAF6EE', minHeight: '100svh' }}
    >

      {/* TOP — centered copy */}
      <div
        className="relative mx-auto px-5 lg:px-10 pt-12 pb-0 lg:pt-16 text-center"
        style={{ maxWidth: 760 }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
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
            fontSize: 'clamp(36px, 4.5vw, 60px)',
            color: '#1F4D3A',
            letterSpacing: '-0.035em',
          }}
        >
          The event platform that makes every attendee want to share.
        </h1>

        <p
          className="mt-5 leading-[1.65] mx-auto"
          style={{ fontSize: 16, color: '#3A4A42', maxWidth: 500 }}
        >
          Registration, tickets, agenda, check-in, networking — and the only
          event platform where every registrant gets a personalized card to
          share on social.
        </p>

        <div className="mt-7 flex flex-wrap justify-center items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full font-medium transition-colors"
            style={{
              background: '#1F4D3A',
              color: '#FAF6EE',
              padding: '12px 26px',
              fontSize: 14,
            }}
          >
            Start free <ArrowRight size={14} strokeWidth={2} />
          </Link>
          <Link
            href="/#platform"
            className="inline-flex items-center gap-2 rounded-full font-medium transition-colors"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(31,77,58,0.25)',
              color: '#1F4D3A',
              padding: '12px 26px',
              fontSize: 14,
            }}
          >
            See the platform <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        <div
          className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2"
          style={{ fontSize: 12, color: '#6B7A72' }}
        >
          {['Free for 1 event', 'No credit card', 'Setup in 10 minutes'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check size={12} strokeWidth={2.5} style={{ color: '#1F4D3A' }} />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* BOTTOM — mockup bleeds to viewport edge (hidden on small phones) */}
      {/* overflow-hidden clips bottom so screens tease below the fold */}
      <div
        className="relative hidden sm:block flex-1 mx-auto w-full px-5 sm:px-8 lg:px-12 mt-8 overflow-hidden"
        style={{ maxWidth: 1280 }}
      >
        <Scene1DashboardHero float />
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
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ fontSize: 12, color: '#6B7A72', fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}>
              Built for every kind of event:
            </span>
            {[
              { initials: 'CF', name: 'Conferences' },
              { initials: 'FS', name: 'Festivals' },
              { initials: 'NGO', name: 'NGOs' },
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

          <div
            style={{
              fontSize: 12,
              color: '#6B7A72',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            Registration, check-in, agenda, networking — and a personalized card for every attendee
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 3 — PLATFORM OVERVIEW (feature pills)
───────────────────────────────────────────────────────── */
const ALL_FEATURES = [
  'Registration & Tickets', 'Event Pages', 'QR Check-in', 'Agenda Builder',
  'Speaker Directory', 'Attendee Networking', 'Live Q&A & Polls',
  'Sponsor Tools', 'Analytics', 'Eventera Card',
];

function PlatformOverview() {
  return (
    <section id="platform" style={{ background: '#FAF6EE', padding: 'clamp(60px,8vw,96px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#1F4D3A', marginBottom: 14 }}>
            Everything for your event
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px,4vw,48px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            One platform. Every phase.
          </h2>
          <p style={{ marginTop: 14, fontSize: 17, color: '#3A4A42', maxWidth: 480, margin: '14px auto 0', lineHeight: 1.65 }}>
            From the first ticket sale to the last card shared.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {ALL_FEATURES.map((f) => (
            <div
              key={f}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 18px',
                background: '#FFFFFF',
                border: '1px solid #E5E0D4',
                borderRadius: 100,
                fontSize: 14, color: '#0F1F18',
                fontFamily: 'var(--font-sans)', fontWeight: 500,
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F4D3A', flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 4 — SHOWCASE: REGISTRATION & TICKETS
───────────────────────────────────────────────────────── */
function ShowcaseRegistration() {
  return (
    <section style={{ background: '#0F1F18', padding: 'clamp(72px,10vw,112px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }}>

        {/* LEFT — copy */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,197,126,0.1)', border: '1px solid rgba(232,197,126,0.22)', borderRadius: 100, padding: '5px 12px', marginBottom: 22 }}>
            <Ticket size={12} strokeWidth={2} style={{ color: '#E8C57E' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#E8C57E', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Registration & Tickets</span>
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(26px,3.5vw,44px)', color: '#FAF6EE', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 18 }}
          >
            Registration that feels like the event itself.
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'rgba(250,246,238,0.7)', lineHeight: 1.65, marginBottom: 26, maxWidth: 440 }}>
            Free, paid, or mixed. Custom forms that capture exactly what you need. Every registrant walks away with a personal card before they even arrive.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Multiple ticket types — Free, General, VIP, Early Bird',
              'Custom registration fields with conditional logic',
              'Card, mobile money (WaafiPay) & Flutterwave payments',
              'Eventera Card auto-generated at the moment of registration',
            ].map((item) => (
              <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, color: 'rgba(250,246,238,0.75)', fontFamily: 'var(--font-sans)' }}>
                <Check size={14} strokeWidth={2.5} style={{ color: '#4CAF7D', marginTop: 2, flexShrink: 0 }} />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/features/registration"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#E8C57E', fontFamily: 'var(--font-sans)', textDecoration: 'none' }}
          >
            Explore registration <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>

        {/* RIGHT — registration → Card (Scene 2) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <Scene2Registration />
          </div>
        </div>

      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 5 — SHOWCASE: ANALYTICS
───────────────────────────────────────────────────────── */
function ShowcaseAnalytics() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(72px,10vw,112px) clamp(20px,5vw,64px) 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Top: text left + stat pills right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: 40, alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.15)', borderRadius: 100, padding: '5px 12px', marginBottom: 22 }}>
              <BarChart2 size={12} strokeWidth={2} style={{ color: '#1F4D3A' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1F4D3A', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analytics</span>
            </div>
            <h2
              className="font-title font-bold"
              style={{ fontSize: 'clamp(26px,3.5vw,44px)', color: '#0F1F18', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}
            >
              Know exactly how your event is performing — live.
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: '#3A4A42', lineHeight: 1.65, maxWidth: 440 }}>
              Registration funnel, revenue, session attendance, card virality — in one dashboard. No spreadsheet pivot tables required.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Registration funnel & revenue', val: 'Live', color: '#1F4D3A' },
              { label: 'Check-ins vs. registered', val: 'Real-time', color: '#1F4D3A' },
              { label: 'Cards generated & shared', val: 'Tracked', color: '#C9A45E' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#3A4A42', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', flexShrink: 0 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wide analytics browser — bleeds off the bottom */}
        <div style={{ overflow: 'hidden' }}>
          <Scene3Analytics />
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 6 — EVENTERA CARD BANNER
───────────────────────────────────────────────────────── */
function EventeraCardBanner() {
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(48px,6vw,72px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
          border: '1px solid rgba(232,197,126,0.3)',
          borderRadius: 20,
          padding: 'clamp(32px,4vw,52px)',
          display: 'flex', gap: 'clamp(24px,4vw,48px)', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.35)', color: '#E8C57E', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
              <Sparkles size={11} strokeWidth={2} />
              Only on Eventera
            </span>
            <h2
              className="font-title font-bold"
              style={{ fontSize: 'clamp(22px,3vw,36px)', color: '#E8C57E', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 14 }}
            >
              The Eventera Card — a first in event tech.
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, color: 'rgba(250,246,238,0.78)', lineHeight: 1.65, maxWidth: 480 }}>
              Every attendee gets a personalized, branded card the moment they register. No Canva. No designer. No manual work. It ships with your event — automatically.
            </p>
          </div>
          <div className="hidden lg:flex" style={{ gap: 12, flexShrink: 0 }}>
            {[
              { name: 'Amara Yusuf', role: 'Policy Lead', accent: 'rgba(232,197,126,0.55)' },
              { name: 'Kofi Mensah', role: 'Speaker', accent: 'rgba(232,197,126,0.3)' },
              { name: 'Zara Ahmed', role: 'Investor', accent: 'rgba(232,197,126,0.18)' },
            ].map((p) => (
              <div key={p.name} style={{ background: 'rgba(250,246,238,0.05)', border: `1px solid ${p.accent}`, borderRadius: 12, padding: '14px 12px', minWidth: 100 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(232,197,126,0.25)', border: `1px solid ${p.accent}`, marginBottom: 8 }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FAF6EE', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', marginBottom: 3 }}>{p.name}</div>
                <div style={{ fontSize: 8, color: 'rgba(250,246,238,0.5)', fontFamily: 'var(--font-sans)' }}>{p.role}</div>
                <div style={{ marginTop: 10, display: 'flex', gap: 3 }}>
                  {['IG', 'WA', 'X'].map((s) => (
                    <div key={s} style={{ flex: 1, background: 'rgba(250,246,238,0.08)', borderRadius: 100, padding: '2px 0', textAlign: 'center', fontSize: 6, color: 'rgba(250,246,238,0.4)', fontFamily: 'var(--font-sans)' }}>{s}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 7 — EVENTERA DIFFERENCE
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

function EventeraDifference() {
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
              The Eventera difference
            </span>
            <h2
              className="font-title font-bold"
              style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18 }}
            >
              Every attendee leaves with a card worth sharing.
            </h2>
            <p style={{ fontSize: 16, color: '#3A4A42', lineHeight: 1.65, marginBottom: 20, maxWidth: 500 }}>
              On every other platform, registration ends with a confirmation email. On Eventera, it ends with a moment — a card that says &ldquo;I was there,&rdquo; personalized and ready to post.
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
   SECTION 8 — HOW IT WORKS
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
        {[1, 2, 3].map((_, i) => (
          <div key={i} style={{ height: 18, background: '#FAF6EE', border: '1px solid #E5E0D4', borderRadius: 4, marginBottom: 5 }} />
        ))}
        <div style={{ height: 20, background: '#1F4D3A', borderRadius: 100, marginTop: 6 }} />
        <div style={{ marginTop: 8, height: 28, background: 'linear-gradient(135deg, #163828, #1F4D3A)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 7, color: '#E8C57E', fontFamily: 'var(--font-sans)', letterSpacing: '0.1em' }}>EVENTERA CARD READY</div>
        </div>
      </div>
    );
  }
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
  { n: '4', title: 'Attendees register', desc: 'They fill a form, pay if needed, and get their Eventera Card.', mock: 'register' },
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
            How Eventera works
          </div>
          <h2
            className="font-title font-bold"
            style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            From first ticket to last card shared.
          </h2>
        </div>

        <div className="relative">
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
   SECTION 9 — USE CASES
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
            Whatever you&apos;re organizing, Eventera handles it.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
   SECTION 10 — PRICING
───────────────────────────────────────────────────────── */
const FREE_FEATURES = [
  '1 active event',
  '50 registrations',
  'Basic event page',
  'QR check-in',
  'Eventera Card for every attendee',
  'Eventera watermark on cards',
];
const PRO_FEATURES = [
  'Unlimited events',
  '500 registrations/month',
  'Full agenda builder',
  'Speaker directory',
  'Attendee networking',
  '1:1 messaging',
  'Remove Eventera watermark',
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
  name, price, period, features, cta, href, popular, everythingInPro,
}: {
  name: string; price: string; period: string; features: string[];
  cta: string; href: string; popular?: boolean; everythingInPro?: boolean;
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
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            background: '#E8C57E', color: '#163828', fontSize: 10, fontFamily: 'var(--font-sans)',
            fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            borderRadius: 100, padding: '4px 14px', whiteSpace: 'nowrap',
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

      <div className="font-display font-semibold" style={{ fontSize: 15, color: popular ? '#E8C57E' : '#1F4D3A', marginBottom: 10 }}>
        {name}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
        <span className="font-display font-bold" style={{ fontSize: 42, color: popular ? '#FAF6EE' : '#0F1F18', letterSpacing: '-0.03em', lineHeight: 1 }}>
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
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderRadius: 100, fontWeight: 600, fontSize: 14, padding: '11px 20px',
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
          <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#1F4D3A', marginBottom: 14 }}>
            Pricing
          </div>
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(28px, 4vw, 48px)', color: '#0F1F18', letterSpacing: '-0.03em' }}>
            Start free. Pay as you grow.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          <PricingCard name="Free" price="$0" period="/mo" features={FREE_FEATURES} cta="Start free" href="/signup" />
          <PricingCard name="Pro" price="$19" period="/mo" features={PRO_FEATURES} cta="Start Pro" href="/signup?plan=pro" popular />
          <PricingCard name="Studio" price="$49" period="/mo" features={STUDIO_FEATURES} cta="Start Studio" href="/signup?plan=studio" everythingInPro />
        </div>

        <div className="text-center mt-10" style={{ fontSize: 14, color: '#6B7A72' }}>
          All plans include the Eventera Card feature. It&apos;s not an add-on — it&apos;s standard.{' '}
          <Link href="/pricing" style={{ color: '#1F4D3A', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Compare all features →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 11 — TESTIMONIAL
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
        <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#1F4D3A', textAlign: 'center', marginBottom: 28 }}>
          Why we built Eventera
        </div>
        <Quote size={38} strokeWidth={1.5} style={{ color: '#E8C57E', margin: '0 auto 20px', display: 'block' }} />
        <blockquote
          className="font-display"
          style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', color: '#0F1F18', lineHeight: 1.4, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 28 }}
        >
          &ldquo;On every other platform, registration ends with a confirmation email. We wanted it to end with something an attendee is proud to share — so every Eventera event ships with a personalized card, automatically.&rdquo;
        </blockquote>
        <div className="flex items-center justify-center gap-3">
          <div
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#E8EFEB', border: '2px solid #1F4D3A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#1F4D3A', fontFamily: 'var(--font-display)',
            }}
          >
            E
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1F18', fontFamily: 'var(--font-display)' }}>The Eventera team</div>
            <div style={{ fontSize: 12, color: '#6B7A72', fontFamily: 'var(--font-sans)' }}>Made in Djibouti · Built for organizers everywhere</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 12 — FAQ
───────────────────────────────────────────────────────── */
const LANDING_FAQS: FAQItem[] = [
  {
    q: 'Is Eventera a full event platform, or just cards?',
    a: 'A full platform. Eventera runs your event end to end — registration, ticketing, event pages, QR check-in, agenda builder, speaker directory, attendee networking, live Q&A, sponsor tools, and analytics. The Eventera Card is the feature that makes it unique, but it sits inside a complete event management product.',
  },
  {
    q: 'How is Eventera different from Eventbrite or Whova?',
    a: 'Same core toolkit — registration, check-in, agenda, networking. Plus the part they can\'t do: every attendee automatically gets a personalized, branded share card at registration. No Canva, no designer, no manual work. It ships with your event, not as a separate campaign.',
  },
  {
    q: 'Do attendees need to download an app?',
    a: 'No. Attendees register, get their card, network, and check in entirely from a web link — on any phone. No app download, no account creation required.',
  },
  {
    q: 'What payment methods do you support?',
    a: 'Card payments (Stripe), mobile money via WaafiPay, and Flutterwave — with more African methods rolling out. You can accept both free and paid registrations on the same event.',
  },
  {
    q: 'Does every plan include the Eventera Card?',
    a: 'Yes. The Eventera Card is standard on every plan — Free, Pro, and Studio. Free tier cards include a small Eventera watermark. Pro and Studio remove it.',
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
    a: 'Yes. Import your registrant list by CSV and we\'ll map your columns to Eventera fields. Supports Eventbrite CSV exports, Google Sheets, and any standard format with Name, Email, and custom fields.',
  },
];

function FAQSection() {
  return (
    <section id="faq" style={{ paddingTop: 80, paddingBottom: 96, background: '#FAF6EE' }}>
      <div className="mx-auto px-5 lg:px-10" style={{ maxWidth: 920 }}>
        <div className="text-center mb-12">
          <div style={{ fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#1F4D3A', marginBottom: 14 }}>
            FAQ
          </div>
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: '#0F1F18', letterSpacing: '-0.03em' }}>
            Questions we get every week.
          </h2>
        </div>
        <FAQAccordion items={LANDING_FAQS} defaultOpen={0} />
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   SECTION 13 — FINAL CTA
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

      <div className="relative mx-auto px-5 lg:px-10 text-center" style={{ maxWidth: 760 }}>
        <h2
          className="font-title font-bold"
          style={{ fontSize: 'clamp(30px, 5vw, 54px)', color: '#FAF6EE', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 18 }}
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
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#E8C57E', color: '#163828',
              borderRadius: 100, padding: '14px 28px', fontSize: 15, fontWeight: 700, textDecoration: 'none',
            }}
          >
            Start free <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <Link
            href="/contact"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1.5px solid rgba(250,246,238,0.3)', color: '#FAF6EE',
              borderRadius: 100, padding: '14px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none',
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
/* ─────────────────────────────────────────────────────────
   HOME VISUALS SHOWCASE — the Card, live Q&A, and the flow
───────────────────────────────────────────────────────── */
function HomeVisualsShowcase() {
  const eyebrow = (label: string, color = '#1F4D3A') => (
    <div style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'var(--font-sans)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>{label}</div>
  );
  return (
    <section style={{ background: '#FAF6EE', padding: 'clamp(56px,8vw,96px) clamp(20px,5vw,64px)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(56px,8vw,88px)' }}>
        {/* The Card */}
        <div style={{ textAlign: 'center' }}>
          {eyebrow('The Eventera Card', '#C9A45E')}
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(24px,3vw,38px)', color: '#0F1F18', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 34 }}>
            A branded card for every attendee — generated instantly.
          </h2>
          <div style={{ maxWidth: 820, margin: '0 auto' }}><Scene4Card /></div>
        </div>

        {/* Live Q&A */}
        <div>
          {eyebrow('Live engagement')}
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(24px,3vw,38px)', color: '#0F1F18', letterSpacing: '-0.025em', lineHeight: 1.15, marginBottom: 34, maxWidth: 640 }}>
            Live Q&amp;A and polls that fill the room.
          </h2>
          <Scene5LiveQA float />
        </div>

        {/* How it works strip */}
        <div>
          {eyebrow('From idea to live in minutes')}
          <div style={{ overflowX: 'auto' }}><Scene6HowItWorks /></div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <PlatformOverview />
      <ShowcaseRegistration />
      <ShowcaseAnalytics />
      <HomeVisualsShowcase />
      <EventeraCardBanner />
      <EventeraDifference />
      <HowItWorks />
      <UseCases />
      <Pricing />
      <Testimonial />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
