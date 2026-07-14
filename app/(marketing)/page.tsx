import Link from 'next/link';
import { Sparkles, Check, ArrowRight, Quote } from 'lucide-react';
import { GetTheAppSection } from '@/components/marketing/GetTheAppSection';
import Pricing from '@/components/marketing/Pricing';
import LogoStrip from '@/components/marketing/LogoStrip';
import Reveal from '@/components/marketing/Reveal';
import MouseParallax from '@/components/marketing/MouseParallax';
import {
  Scene1DashboardHero, Scene4Card, Scene5LiveQA,
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
        <MouseParallax strength={12}>
          <Scene1DashboardHero float />
        </MouseParallax>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────
   PLATFORM OVERVIEW (feature pills)
───────────────────────────────────────────────────────── */
const ALL_FEATURES = [
  'Registration & Tickets', 'Event Pages', 'QR Check-in', 'Agenda Builder',
  'Speaker Directory', 'Attendee Networking', 'Live Q&A & Polls',
  'Sponsor Tools', 'Analytics', 'Eventera Card',
];

function PlatformOverview() {
  return (
    <section id="platform" style={{ background: '#FAF6EE', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(15,31,24,0.045) 1px, transparent 1px)', backgroundSize: '22px 22px', padding: 'clamp(60px,8vw,96px) clamp(20px,5vw,64px)' }}>
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
          {ALL_FEATURES.map((f, i) => {
            const t = i % 2 === 0
              ? { bg: '#E8EFEB', border: '#D3E2D9', dot: '#1F4D3A' }   // forest-soft
              : { bg: '#F6EDDA', border: '#EBDDC0', dot: '#C9A45E' };  // gold-soft
            return (
              <div
                key={f}
                className="transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px',
                  background: t.bg,
                  border: `1px solid ${t.border}`,
                  borderRadius: 100,
                  fontSize: 14, color: '#0F1F18',
                  fontFamily: 'var(--font-sans)', fontWeight: 500,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot, flexShrink: 0 }} />
                {f}
              </div>
            );
          })}
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
              <div key={p.name} className="transition-transform duration-200 hover:-translate-y-1" style={{ background: 'rgba(250,246,238,0.05)', border: `1px solid ${p.accent}`, borderRadius: 12, padding: '14px 12px', minWidth: 100 }}>
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
    <section id="how" style={{ paddingTop: 80, paddingBottom: 96, background: '#FFFFFF', borderTop: '1px solid #E5E0D4', borderBottom: '1px solid #E5E0D4' }}>
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
                    border: '4px solid #FFFFFF',
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
   SECTION 10 — PRICING
   Self-contained, data-driven section lives in
   components/marketing/Pricing.tsx (Pricing + PlanCard + BillingToggle).
───────────────────────────────────────────────────────── */

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
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <LogoStrip />
      <Reveal><PlatformOverview /></Reveal>
      <Reveal><EventeraCardBanner /></Reveal>
      <Reveal><HomeVisualsShowcase /></Reveal>
      <Reveal><HowItWorks /></Reveal>
      <Reveal><GetTheAppSection /></Reveal>
      <Reveal><Pricing /></Reveal>
      <Reveal><Testimonial /></Reveal>
      <Reveal><FinalCTA /></Reveal>
    </>
  );
}
