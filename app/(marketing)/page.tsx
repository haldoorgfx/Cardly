import Link from 'next/link';
import {
  Sparkles, Check, Ticket, BarChart2,
  LayoutGrid, Network, Briefcase, Sun, Users,
  ArrowRight, Quote,
} from 'lucide-react';
import { FAQAccordion, type FAQItem } from '@/components/marketing/FAQAccordion';
import HeroDashboardMock from '@/components/marketing/HeroDashboardMock';

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
      {/* Atmospheric focal glow — light source behind the headline */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1100,
          height: 640,
          background:
            'radial-gradient(ellipse 55% 60% at 50% 0%, rgba(31,77,58,0.13) 0%, rgba(232,197,126,0.05) 45%, transparent 70%)',
          filter: 'blur(48px)',
        }}
      />
      {/* Subtle accent warmth bottom-left */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          bottom: '15%', left: '-4%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(232,197,126,0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

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
        <HeroDashboardMock />
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
              'Stripe, Flutterwave, M-Pesa & Paystack payments',
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

        {/* RIGHT — phone mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 260, background: '#0A1610',
            border: '2px solid rgba(232,197,126,0.15)',
            borderRadius: 36, overflow: 'hidden',
            boxShadow: '0 32px 80px rgba(15,31,24,0.6)', flexShrink: 0,
          }}>
            {/* Status bar */}
            <div style={{ padding: '12px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: 'rgba(250,246,238,0.4)', fontFamily: 'var(--font-sans)' }}>9:41</span>
              <div style={{ width: 22, height: 3, background: 'rgba(250,246,238,0.15)', borderRadius: 100 }} />
              <div style={{ display: 'flex', gap: 2 }}>
                {[9, 6, 3].map((h) => <div key={h} style={{ width: 3, height: h, background: 'rgba(250,246,238,0.3)', borderRadius: 1 }} />)}
              </div>
            </div>

            {/* Event header */}
            <div style={{ margin: '10px 12px', borderRadius: 12, background: 'linear-gradient(135deg, #163828, #2A6A50)', padding: '14px' }}>
              <div style={{ fontSize: 8, color: 'rgba(250,246,238,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)', marginBottom: 3 }}>
                Pan-African Climate Summit
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FAF6EE', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Register for this event
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{ fontSize: 7, background: 'rgba(250,246,238,0.12)', color: 'rgba(250,246,238,0.7)', borderRadius: 100, padding: '2px 7px', fontFamily: 'var(--font-sans)' }}>Mar 15 · Nairobi</span>
                <span style={{ fontSize: 7, background: 'rgba(232,197,126,0.18)', color: '#E8C57E', borderRadius: 100, padding: '2px 7px', fontFamily: 'var(--font-sans)' }}>General · $25</span>
              </div>
            </div>

            {/* Form */}
            <div style={{ padding: '0 12px 16px' }}>
              {[
                { label: 'Full name', val: 'Amara Yusuf' },
                { label: 'Email', val: 'amara@example.com' },
                { label: 'Job title', val: 'Policy Lead' },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 7 }}>
                  <div style={{ fontSize: 7.5, color: 'rgba(250,246,238,0.35)', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                  <div style={{ height: 28, background: 'rgba(250,246,238,0.05)', border: '1px solid rgba(250,246,238,0.09)', borderRadius: 7, display: 'flex', alignItems: 'center', padding: '0 9px' }}>
                    <span style={{ fontSize: 9, color: 'rgba(250,246,238,0.65)', fontFamily: 'var(--font-sans)' }}>{f.val}</span>
                  </div>
                </div>
              ))}

              <div style={{ height: 34, background: '#1F4D3A', borderRadius: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: '#FAF6EE', fontFamily: 'var(--font-sans)' }}>Register & get your Eventera Card →</span>
              </div>

              {/* Card preview hint */}
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(232,197,126,0.07)', border: '1px solid rgba(232,197,126,0.18)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #163828, #1F4D3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: '#E8C57E', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>E</span>
                </div>
                <div>
                  <div style={{ fontSize: 7.5, fontWeight: 600, color: '#E8C57E', fontFamily: 'var(--font-sans)', lineHeight: 1.3 }}>Your Eventera Card is generated</div>
                  <div style={{ fontSize: 6.5, color: 'rgba(250,246,238,0.4)', fontFamily: 'var(--font-sans)' }}>Ready to share in 2 seconds</div>
                </div>
              </div>
            </div>
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
              { label: 'Avg. card-share rate per event', val: '71%', color: '#1F4D3A' },
              { label: 'Avg. check-in rate on Eventera events', val: '87%', color: '#2D7A4F' },
              { label: 'Cards shared per attendee (avg)', val: '1.42×', color: '#C9A45E' },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#3A4A42', fontFamily: 'var(--font-sans)' }}>{s.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', flexShrink: 0 }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wide browser frame — bleeds off the bottom */}
        <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid #E5E0D4', borderBottom: 'none', boxShadow: '0 -8px 40px rgba(15,31,24,0.07)' }}>
          {/* Chrome bar */}
          <div style={{ background: '#F0EDE5', padding: '9px 14px', borderBottom: '1px solid #E5E0D4', display: 'flex', alignItems: 'center', gap: 6 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
            ))}
            <div style={{ flex: 1, height: 16, background: '#E5E0D4', borderRadius: 4, marginLeft: 10 }} />
            <div style={{ width: 20, height: 16, background: '#E5E0D4', borderRadius: 3 }} />
          </div>

          {/* Dashboard */}
          <div style={{ background: '#FAF6EE', display: 'flex' }}>
            {/* Sidebar */}
            <div style={{ width: 160, borderRight: '1px solid #E5E0D4', padding: '18px 12px', flexShrink: 0, background: '#FFFFFF' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1F4D3A', fontFamily: 'var(--font-display)', marginBottom: 14 }}>Analytics</div>
              {['Overview', 'Registrations', 'Sessions', 'Networking', 'Revenue', 'Cards'].map((item, i) => (
                <div key={item} style={{ padding: '7px 10px', borderRadius: 6, background: i === 0 ? '#E8EFEB' : 'transparent', color: i === 0 ? '#1F4D3A' : '#6B7A72', fontSize: 11, fontFamily: 'var(--font-sans)', marginBottom: 2, fontWeight: i === 0 ? 600 : 400 }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Main */}
            <div style={{ flex: 1, padding: '18px 20px 0', minWidth: 0 }}>
              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Registrations', val: '847', change: '+12%' },
                  { label: 'Revenue', val: '$8,940', change: '+24%' },
                  { label: 'Cards Shared', val: '1,204', change: '+31%' },
                  { label: 'Check-in Rate', val: '87%', change: '+5 pts' },
                ].map((s) => (
                  <div key={s.label} style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 8, color: '#6B7A72', fontFamily: 'var(--font-sans)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>{s.label}</div>
                    <div style={{ fontSize: 19, fontWeight: 700, color: '#0F1F18', fontFamily: 'var(--font-display)', letterSpacing: '-0.025em', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 9, color: '#2D7A4F', marginTop: 3, fontFamily: 'var(--font-sans)' }}>↑ {s.change}</div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: 8, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0F1F18', fontFamily: 'var(--font-display)' }}>Registrations over time</div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['7D', '30D', '90D'].map((t, i) => (
                      <div key={t} style={{ fontSize: 9, padding: '3px 8px', borderRadius: 4, background: i === 1 ? '#E8EFEB' : 'transparent', color: i === 1 ? '#1F4D3A' : '#6B7A72', fontFamily: 'var(--font-sans)', fontWeight: i === 1 ? 600 : 400, border: '1px solid ' + (i === 1 ? 'transparent' : '#E5E0D4') }}>{t}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 64 }}>
                  {[22, 36, 28, 52, 40, 66, 55, 76, 62, 90, 72, 82].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: 4, background: i === 9 ? '#1F4D3A' : (i >= 7 ? '#C8DDD2' : '#E8EFEB') }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  {['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'].map((w) => (
                    <div key={w} style={{ fontSize: 8, color: '#6B7A72', fontFamily: 'var(--font-sans)' }}>{w}</div>
                  ))}
                </div>
              </div>

              {/* Session table */}
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E0D4', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8 }}>
                  {['Session', 'Registrations', 'Attendance', 'Engagement'].map((h) => (
                    <div key={h} style={{ fontSize: 8, color: '#6B7A72', fontFamily: 'var(--font-sans)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
                {[
                  { session: 'Opening Keynote', reg: '847', att: '724', eng: '91%' },
                  { session: 'Panel: Climate Policy', reg: '612', att: '538', eng: '88%' },
                  { session: 'Workshop: Green Infra', reg: '380', att: '342', eng: '90%' },
                ].map((row, i) => (
                  <div key={i} style={{ padding: '9px 14px', borderBottom: i < 2 ? '1px solid #F0EDE5' : 'none', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#0F1F18', fontFamily: 'var(--font-display)' }}>{row.session}</div>
                    <div style={{ fontSize: 10, color: '#3A4A42', fontFamily: 'var(--font-sans)' }}>{row.reg}</div>
                    <div style={{ fontSize: 10, color: '#3A4A42', fontFamily: 'var(--font-sans)' }}>{row.att}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#2D7A4F', fontFamily: 'var(--font-sans)' }}>{row.eng}</div>
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
          From organizers who&apos;ve run real events on Eventera
        </div>
        <Quote size={38} strokeWidth={1.5} style={{ color: '#E8C57E', margin: '0 auto 20px', display: 'block' }} />
        <blockquote
          className="font-display"
          style={{ fontSize: 'clamp(20px, 2.8vw, 30px)', color: '#0F1F18', lineHeight: 1.4, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 28 }}
        >
          &ldquo;We ran registration, check-in and the agenda on Eventera — but the cards are what people remember. 600 attendees, 740 cards shared. The reach was 10x what our email kit ever did.&rdquo;
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
    a: 'Card payments via Stripe, plus Flutterwave, Paystack, M-Pesa, and MTN MoMo for African markets. You can accept both free and paid registrations on the same event.',
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
      <div
        aria-hidden
        style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,197,126,0.22) 0%, transparent 65%)',
          filter: 'blur(60px)', pointerEvents: 'none',
        }}
      />

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
export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <PlatformOverview />
      <ShowcaseRegistration />
      <ShowcaseAnalytics />
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
