import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles, LayoutGrid, CreditCard, Globe } from 'lucide-react';
import LogoStrip from '@/components/marketing/LogoStrip';
import Pricing from '@/components/marketing/Pricing';
import { Scene1DashboardHero } from '@/components/marketing/home-visuals';

/* Standalone conversion landing page (for paid ad campaigns). No site nav or
   footer mega-menu — a single path to "Start free". Kept out of the (marketing)
   group so it inherits only the root layout. noindex so it doesn't compete with
   the real home page in search. */
export const metadata: Metadata = {
  title: 'Eventera — Run events people are proud to share',
  description:
    'Registration, tickets, check-in, and a personalized card for every attendee — one platform, set up in 10 minutes.',
  robots: { index: false, follow: false },
};

const BENEFITS = [
  {
    icon: LayoutGrid,
    title: 'One platform, every phase',
    body: 'Registration, tickets, event pages, QR check-in, agenda and analytics — no more stitching five tools and a spreadsheet together.',
  },
  {
    icon: CreditCard,
    title: 'The Eventera Card',
    body: 'Every attendee gets a personalized, branded card the moment they register — ready to share. No Canva, no designer. Only on Eventera.',
    gold: true,
  },
  {
    icon: Globe,
    title: 'Built for how you run events',
    body: 'Mobile-first, offline check-in at the door, and mobile-money payments (WaafiPay, Flutterwave) alongside cards. Made for real venues.',
  },
];

export default function AdLandingPage() {
  return (
    <div style={{ background: '#FAF6EE', color: '#0F1F18' }}>
      {/* ── Minimal header ─────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(250,246,238,0.85)', backdropFilter: 'blur(12px)', borderColor: 'rgba(229,224,212,0.6)' }}
      >
        <div className="mx-auto max-w-[1120px] px-5 lg:px-8 h-[62px] flex items-center justify-between">
          <Link href="/lp" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/eventera-logo.png" alt="Eventera" style={{ height: 28, objectFit: 'contain' }} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:inline text-[14px]" style={{ color: '#3A4A42' }}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: '#1F4D3A', color: '#FAF6EE', fontSize: 14, padding: '9px 18px' }}
            >
              Start free <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto px-5 lg:px-8 pt-14 lg:pt-20 text-center" style={{ maxWidth: 760 }}>
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5"
            style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.2)', color: '#1F4D3A', fontSize: 12, fontFamily: 'var(--font-sans)', letterSpacing: '0.04em' }}
          >
            <Sparkles size={13} strokeWidth={2} />
            The complete event platform
          </div>
          <h1 className="font-title font-bold leading-[1.0]" style={{ fontSize: 'clamp(36px, 4.6vw, 60px)', color: '#1F4D3A', letterSpacing: '-0.035em' }}>
            Run events people are proud to share.
          </h1>
          <p className="mt-5 leading-[1.65] mx-auto" style={{ fontSize: 17, color: '#3A4A42', maxWidth: 500 }}>
            Registration, tickets, check-in, and a personalized card for every attendee — one platform, set up in 10 minutes.
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: '#1F4D3A', color: '#FAF6EE', padding: '14px 30px', fontSize: 15 }}
            >
              Start free <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2" style={{ fontSize: 12.5, color: '#6B7A72' }}>
            {['Free for 1 event', 'No credit card', 'Setup in 10 minutes'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={13} strokeWidth={2.5} style={{ color: '#1F4D3A' }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard mock — teases below the fold */}
        <div className="relative hidden sm:block mx-auto w-full px-5 sm:px-8 lg:px-12 mt-10 overflow-hidden" style={{ maxWidth: 1180 }}>
          <Scene1DashboardHero float />
        </div>
      </section>

      {/* ── Trust logos ────────────────────────────────────── */}
      <LogoStrip />

      {/* ── Benefits ───────────────────────────────────────── */}
      <section style={{ padding: 'clamp(56px,8vw,88px) clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="grid sm:grid-cols-3 gap-5">
            {BENEFITS.map(({ icon: Icon, title, body, gold }) => (
              <div
                key={title}
                className="rounded-2xl transition-transform duration-200 hover:-translate-y-1"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', padding: 26, boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
              >
                <div
                  className="grid place-items-center mb-4"
                  style={{ width: 44, height: 44, borderRadius: 12, background: gold ? '#F6EDDA' : '#E8EFEB', color: gold ? '#C9A45E' : '#1F4D3A' }}
                >
                  <Icon size={20} strokeWidth={1.9} />
                </div>
                <h3 className="font-title font-bold" style={{ fontSize: 18, color: '#0F1F18', letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14.5, color: '#3A4A42', lineHeight: 1.6, fontFamily: 'var(--font-sans)' }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Eventera Card highlight ────────────────────────── */}
      <section style={{ padding: '0 clamp(20px,5vw,64px) clamp(56px,8vw,88px)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
              border: '1px solid rgba(232,197,126,0.3)',
              borderRadius: 20,
              padding: 'clamp(32px,4vw,56px)',
              textAlign: 'center',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.35)', color: '#E8C57E', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontFamily: 'var(--font-sans)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>
              <Sparkles size={11} strokeWidth={2} /> Only on Eventera
            </span>
            <h2 className="font-title font-bold" style={{ fontSize: 'clamp(24px,3.2vw,40px)', color: '#E8C57E', letterSpacing: '-0.025em', lineHeight: 1.12, marginBottom: 14, maxWidth: 640, marginInline: 'auto' }}>
              Every attendee leaves with a card worth sharing.
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, color: 'rgba(250,246,238,0.78)', lineHeight: 1.65, maxWidth: 520, margin: '0 auto 26px' }}>
              On every other platform, registration ends with a confirmation email. On Eventera it ends with a moment — a personalized card that says &ldquo;I was there,&rdquo; ready to post.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
              style={{ background: '#E8C57E', color: '#163828', padding: '13px 26px', fontSize: 15 }}
            >
              Start free <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────── */}
      <Pricing />

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(150deg, #163828 0%, #1F4D3A 55%, #235741 100%)', padding: 'clamp(72px,9vw,104px) clamp(20px,5vw,64px)' }}>
        <div className="text-center mx-auto" style={{ maxWidth: 720 }}>
          <h2 className="font-title font-bold" style={{ fontSize: 'clamp(30px, 5vw, 52px)', color: '#FAF6EE', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: 18 }}>
            Set up your first event in 10 minutes.
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(250,246,238,0.8)', lineHeight: 1.6, marginBottom: 30 }}>
            Free for your first event. No credit card. Everything else follows.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full font-bold transition-transform hover:-translate-y-0.5"
            style={{ background: '#E8C57E', color: '#163828', padding: '15px 30px', fontSize: 16 }}
          >
            Start free <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── Minimal legal footer ───────────────────────────── */}
      <footer style={{ background: '#0F1F18' }}>
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div style={{ fontSize: 13, color: 'rgba(250,246,238,0.55)', fontFamily: 'var(--font-sans)' }}>
            © 2026 Eventera. Built for organizers everywhere.
          </div>
          <div className="flex items-center gap-5" style={{ fontSize: 13 }}>
            <Link href="/privacy" style={{ color: 'rgba(250,246,238,0.7)' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'rgba(250,246,238,0.7)' }}>Terms</Link>
            <Link href="/" style={{ color: 'rgba(250,246,238,0.7)' }}>Full site</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
