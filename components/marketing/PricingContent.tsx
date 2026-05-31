'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, ArrowRight } from 'lucide-react';
import { FAQAccordion, FAQItem } from '@/components/marketing/FAQAccordion';
import Reveal from '@/components/marketing/Reveal';

/* ── Data ────────────────────────────────────────────────── */
interface Plan {
  id: string;
  name: string;
  price: { monthly: number; yearly: number };
  blurb: string;
  headline: string;
  features: string[];
  cta: string;
  style: 'default' | 'primary';
  badge?: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    blurb: 'For small campaigns and trials.',
    headline: 'Get a feel for it.',
    features: [
      '1 active event',
      'Up to 50 cards generated',
      'Karta watermark on attendee cards',
      'Standard photo crop shapes',
      'Email support',
    ],
    cta: 'Start free',
    style: 'default',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: { monthly: 29, yearly: 23 },
    blurb: 'For most organizers running real campaigns.',
    headline: 'When your campaign goes public.',
    features: [
      'Unlimited active events',
      '500 cards/month',
      'No Karta watermark',
      'Up to 5 variants per event',
      'Custom share captions',
      'Multi-language form (coming soon)',
      'Basic analytics dashboard',
    ],
    cta: 'Start 14-day free trial',
    style: 'primary',
    badge: 'Most popular',
  },
  {
    id: 'studio',
    name: 'Studio',
    price: { monthly: 99, yearly: 79 },
    blurb: 'For agencies, large campaigns and brand teams.',
    headline: 'When the campaign is the brand.',
    features: [
      'Unlimited events',
      '5,000 cards/month',
      'Unlimited variants per event',
      'Brand kit (fonts, colors, logos)',
      'Custom domain (coming soon)',
      'Team accounts · up to 10 seats',
      'CSV exports + webhook events',
      'Priority support · 99.9% SLA',
    ],
    cta: 'Start 14-day free trial',
    style: 'default',
  },
];

type ComparisonCell = string | boolean;
interface ComparisonGroup {
  title: string;
  rows: [string, ComparisonCell, ComparisonCell, ComparisonCell][];
}

const COMPARISON_GROUPS: ComparisonGroup[] = [
  {
    title: 'Campaigns',
    rows: [
      ['Active events', '1', 'Unlimited', 'Unlimited'],
      ['Cards per month', '50', '500', '5,000'],
      ['Variants per event', '1', '5', 'Unlimited'],
      ['Watermark removed', false, true, true],
    ],
  },
  {
    title: 'Design & brand',
    rows: [
      ['Any aspect ratio (1:1, 4:5, 16:9)', true, true, true],
      ['Smart photo crop shapes', true, true, true],
      ['Brand kit (fonts, colors, logos)', false, false, true],
      ['Custom domain (coming soon)', false, false, false],
      ['White-labeled attendee page', false, false, true],
    ],
  },
  {
    title: 'Attendee experience',
    rows: [
      ['Live preview as they type', true, true, true],
      ['Pinch-zoom & reposition photo', true, true, true],
      ['One-tap share to IG / WhatsApp / X', true, true, true],
      ['Custom share captions', false, true, true],
      ['Multi-language form (coming soon)', false, false, false],
      ['Card download as PNG', true, true, true],
      ['Card download as video — coming soon', false, false, false],
    ],
  },
  {
    title: 'Analytics',
    rows: [
      ['Total cards generated', true, true, true],
      ['Share platform breakdown', false, true, true],
      ['Top sharers', false, true, true],
      ['Time-of-day patterns', false, true, true],
      ['CSV export', false, false, true],
      ['Webhook events', false, false, true],
    ],
  },
  {
    title: 'Team & support',
    rows: [
      ['Team members', '1', '1', '10'],
      ['Roles & permissions', false, false, true],
      ['Audit log', false, false, true],
      ['Email support', true, true, true],
      ['Priority support · 99.9% SLA', false, false, true],
      ['Onboarding call with our team', false, false, true],
    ],
  },
];

const PRICING_FAQS: FAQItem[] = [
  { q: 'Can I switch plans anytime?', a: 'Yes. Upgrade and the change takes effect immediately, prorated for the rest of your billing cycle. Downgrade and the change takes effect at the end of your current cycle.' },
  { q: 'What happens to my cards if I downgrade?', a: 'Cards already generated stay live forever — your attendees can always re-download what they made. New cards generated after a downgrade follow the limits of the new plan.' },
  { q: 'Do you offer discounts for nonprofits, students, or political campaigns?', a: 'Yes. Registered nonprofits get 40% off Pro and Studio. Verified educational institutions get 30% off. Email us with a letterhead or domain proof and we\'ll set you up within 24 hours.' },
  { q: "What's a 'card'? Does each download count?", a: 'One card = one attendee submitting the form and downloading their personalized version. If the same attendee re-downloads, that\'s still one card. We count unique generations, not file taps.' },
  { q: 'Can I pay annually by bank transfer or mobile money?', a: 'Yes. Studio annual plans accept SWIFT bank transfer (USD/EUR/GBP), M-Pesa, MTN MoMo, and Paystack. Email billing@cre8so.com to set it up.' },
  { q: 'Do you have an enterprise plan?', a: 'Studio is our top tier and works for almost everyone. If you need volume seat licensing, custom MSA, or SSO via SAML, email us and we\'ll cut a custom Studio agreement — but the feature surface is the same.' },
  { q: 'Can I get a refund?', a: 'Yes — within the first 14 days of a paid plan, no questions asked. After that, we\'ll prorate any unused billing cycle if you cancel mid-cycle.' },
];

/* ── Cell value helper ───────────────────────────────────── */
function CellValue({ value, isProCol }: { value: ComparisonCell; isProCol?: boolean }) {
  if (value === true) {
    return (
      <span style={{ color: isProCol ? '#1F4D3A' : '#2D7A4F' }}>
        <Check size={18} strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return <span style={{ color: 'rgba(107,122,114,0.4)' }}>—</span>;
  }
  return (
    <span className="font-display font-medium text-[14px] tracking-tight text-ink">
      {value}
    </span>
  );
}

/* ── Plan card ───────────────────────────────────────────── */
function PlanCard({ plan, billing }: { plan: Plan; billing: 'monthly' | 'yearly' }) {
  const isPrimary = plan.style === 'primary';
  const price = plan.price[billing];
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleCheckout() {
    if (plan.id === 'free') { router.push('/signup'); return; }
    startTransition(async () => {
      try {
        const res = await fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: plan.id, billingCycle: billing === 'yearly' ? 'annual' : 'monthly' }),
        });
        if (res.status === 401) { router.push(`/signup?redirect=/pricing`); return; }
        if (!res.ok) { router.push('/signup'); return; }
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } catch {
        router.push('/signup');
      }
    });
  }

  return (
    <div
      className="relative rounded-3xl p-7 lg:p-8 flex flex-col"
      style={
        isPrimary
          ? { background: '#1F4D3A', color: '#FAF6EE', boxShadow: '0 20px 60px rgba(31,77,58,0.25), 0 6px 16px rgba(31,77,58,0.15)' }
          : { background: '#FFFFFF', border: '1px solid #E5E0D4' }
      }
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute -top-3 right-7 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 rounded-full font-semibold"
          style={{ background: '#E8C57E', color: '#163828' }}
        >
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <div
        className="font-display text-[14px] font-medium tracking-tight"
        style={{ color: isPrimary ? '#E8C57E' : '#1F4D3A' }}
      >
        {plan.name}
      </div>

      {/* Headline */}
      <div
        className="mt-1 font-display text-[16px] tracking-tight"
        style={{ color: isPrimary ? 'rgba(250,246,238,0.85)' : '#0F1F18' }}
      >
        {plan.headline}
      </div>

      {/* Price */}
      <div className="mt-5 flex items-baseline gap-1.5">
        <span
          className="font-display font-bold tracking-[-0.03em] text-[48px] leading-none"
          style={{ color: isPrimary ? '#FAF6EE' : '#0F1F18' }}
        >
          ${price}
        </span>
        <span
          className="text-[14px]"
          style={{ color: isPrimary ? 'rgba(250,246,238,0.65)' : '#6B7A72' }}
        >
          /month
        </span>
      </div>

      {/* Billing note */}
      <div
        className="mt-1.5 font-mono text-[10px] tracking-[0.16em] uppercase"
        style={{ color: isPrimary ? 'rgba(250,246,238,0.55)' : '#6B7A72' }}
      >
        {billing === 'yearly' ? `Billed $${price * 12} yearly` : 'Billed monthly'}
        {plan.id !== 'free' && billing === 'yearly' && ' · save 20%'}
      </div>

      {/* Blurb */}
      <div
        className="mt-3 text-[14px]"
        style={{ color: isPrimary ? 'rgba(250,246,238,0.75)' : '#3A4A42' }}
      >
        {plan.blurb}
      </div>

      {/* Divider */}
      <div
        className="my-6"
        style={{ height: 1, background: isPrimary ? 'rgba(250,246,238,0.12)' : '#E5E0D4' }}
      />

      {/* Features */}
      <ul className="space-y-3 flex-1">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[14px]"
            style={{ color: isPrimary ? 'rgba(250,246,238,0.90)' : '#3A4A42' }}
          >
            <span className="mt-0.5 shrink-0" style={{ color: isPrimary ? '#E8C57E' : '#1F4D3A' }}>
              <Check size={15} strokeWidth={2.5} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={handleCheckout}
        disabled={isPending}
        className="mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors disabled:opacity-60 disabled:cursor-wait"
        style={
          isPrimary
            ? { background: '#E8C57E', color: '#163828' }
            : { background: '#0F1F18', color: '#FAF6EE' }
        }
        onMouseEnter={e => {
          if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = isPrimary ? '#C9A45E' : '#1F4D3A';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = isPrimary ? '#E8C57E' : '#0F1F18';
        }}
      >
        {isPending ? 'Loading…' : <>{plan.cta} <ArrowRight size={14} strokeWidth={2} /></>}
      </button>
    </div>
  );
}

/* ── Comparison table ────────────────────────────────────── */
function ComparisonTable() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section style={{ borderTop: '1px solid #E5E0D4' }}>
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="text-center mb-10 lg:mb-12">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Full comparison
          </div>
          <h2 className="font-display font-bold text-ink text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.02] tracking-[-0.035em]">
            Compare every feature, side by side.
          </h2>
        </div>

        <div
          className="relative bg-surface rounded-2xl overflow-hidden"
          style={{
            border: '1px solid #E5E0D4',
            maxHeight: expanded ? undefined : 480,
          }}
        >
          <table className="w-full text-left">
            <thead
              className="sticky top-0"
              style={{ background: 'rgba(250,246,238,0.9)', borderBottom: '1px solid #E5E0D4', backdropFilter: 'blur(8px)' }}
            >
              <tr>
                <th className="py-4 px-5 lg:px-7 font-mono text-[10px] tracking-[0.22em] uppercase text-muted w-[40%] sm:w-auto">
                  Feature
                </th>
                <th className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-ink">
                  Free
                </th>
                <th
                  className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-primary"
                  style={{ background: 'rgba(232,239,235,0.4)' }}
                >
                  Pro
                </th>
                <th className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-ink">
                  Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_GROUPS.map((g, gi) => (
                <React.Fragment key={`g-${gi}`}>
                  <tr style={{ background: 'rgba(250,246,238,0.4)' }}>
                    <td
                      colSpan={4}
                      className="py-3 px-5 lg:px-7 font-mono text-[10px] tracking-[0.22em] uppercase text-primary"
                      style={{ borderTop: '1px solid #E5E0D4' }}
                    >
                      {g.title}
                    </td>
                  </tr>
                  {g.rows.map(([label, free, pro, studio], ri) => (
                    <tr key={`r-${gi}-${ri}`} style={{ borderTop: '1px solid rgba(229,224,212,0.6)' }}>
                      <td className="py-3.5 px-5 lg:px-7 text-[14px] text-ink-soft leading-tight">
                        {label}
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center">
                        <CellValue value={free} />
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center" style={{ background: 'rgba(232,239,235,0.3)' }}>
                        <CellValue value={pro} isProCol />
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center">
                        <CellValue value={studio} />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Fade mask */}
          {!expanded && (
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), #FFFFFF 85%)' }}
            />
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-[14px] transition-colors bg-surface text-ink hover:text-primary"
            style={{ border: '1px solid #E5E0D4' }}
          >
            {expanded ? 'Collapse comparison' : 'Show all features'}
            <ChevronDown
              size={15}
              strokeWidth={2}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Main export ─────────────────────────────────────────── */
export function PricingContent() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: '#E5E0D4' }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(70% 55% at 15% 0%, rgba(31,77,58,0.09), transparent 65%)',
              'radial-gradient(50% 50% at 85% 95%, rgba(232,197,126,0.13), transparent 65%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-[1100px] px-5 lg:px-10 pt-16 lg:pt-24 pb-10 lg:pb-14 text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            Pricing
          </div>
          <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[76px] leading-[0.95] tracking-[-0.035em] max-w-[880px] mx-auto">
            Simple pricing.{' '}
            <span className="text-primary">Pay only when you grow.</span>
          </h1>
          <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[640px] mx-auto">
            Start free with up to 50 cards. Upgrade the day your campaign goes bigger.
            Cancel anytime. No setup fees, no contract.
          </p>

          {/* Billing toggle */}
          <div
            className="mt-9 inline-flex items-center gap-1 p-1 rounded-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            {(['monthly', 'yearly'] as const).map((id) => {
              const isActive = billing === id;
              return (
                <button
                  key={id}
                  onClick={() => setBilling(id)}
                  className="relative px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors"
                  style={{
                    background: isActive ? '#1F4D3A' : 'transparent',
                    color: isActive ? '#FAF6EE' : '#3A4A42',
                  }}
                >
                  {id === 'monthly' ? 'Monthly' : 'Yearly'}
                  {id === 'yearly' && (
                    <span
                      className="ml-2 text-[10px] font-mono tracking-[0.14em] uppercase px-1.5 py-0.5 rounded"
                      style={
                        isActive
                          ? { background: '#E8C57E', color: '#163828' }
                          : { background: '#E8EFEB', color: '#1F4D3A' }
                      }
                    >
                      −20%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section>
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-10 lg:py-12">

          {/* Trial callout banner */}
          <div
            className="mb-8 rounded-2xl px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
          >
            <div className="flex items-center gap-2 text-[#FAF6EE]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C57E" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              <span className="font-display font-semibold text-[15px]">14 days free on Pro &amp; Studio</span>
            </div>
            <div className="flex items-center gap-x-5 gap-y-1 flex-wrap justify-center font-mono text-[11px] tracking-[0.14em] uppercase" style={{ color: 'rgba(250,246,238,0.7)' }}>
              <span>No card required</span>
              <span style={{ color: 'rgba(250,246,238,0.3)' }}>·</span>
              <span>Cancel anytime</span>
              <span style={{ color: 'rgba(250,246,238,0.3)' }}>·</span>
              <span>Instant access</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 items-stretch">
            {PLANS.map((p, i) => (
              <Reveal key={p.id} delay={i * 100}>
                <PlanCard plan={p} billing={billing} />
              </Reveal>
            ))}
          </div>

          {/* Trust microcopy */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px]" style={{ color: '#6B7A72' }}>
            {[
              { label: 'Cancel anytime, no questions asked', highlight: true },
              { label: 'No credit card during trial', highlight: false },
              { label: 'No setup fees', highlight: false },
              { label: 'Cards live forever even after cancel', highlight: false },
            ].map(({ label, highlight }) => (
              <span key={label} className="inline-flex items-center gap-1.5" style={highlight ? { color: '#1F4D3A', fontWeight: 500 } : {}}>
                <Check size={14} strokeWidth={2.5} style={{ color: '#1F4D3A' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <Reveal>
      <section className="bg-cream">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-16">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden"
            style={{ gap: '1px', background: '#E5E0D4', border: '1px solid #E5E0D4' }}
          >
            {(
              [
                ['14-day refund', 'No questions. Cancel within 14 days for a full refund.'],
                ['Cards live forever', 'Even if you cancel — your attendee links never expire.'],
                ['40% off for NGOs', 'Verified nonprofits and registered campaigns get a discount.'],
                ['Pay how you want', 'Card, M-Pesa, MoMo, Paystack, SWIFT — we accept it.'],
              ] as [string, string][]
            ).map(([t, b]) => (
              <div key={t} className="bg-cream p-5 lg:p-6">
                <div className="font-display font-semibold text-ink text-[18px] lg:text-[20px] tracking-tight">
                  {t}
                </div>
                <div className="mt-2 text-ink-soft text-[13px] lg:text-[14px] leading-[1.5]">
                  {b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </Reveal>

      {/* ── Comparison table ── */}
      <Reveal><ComparisonTable /></Reveal>

      {/* ── Pricing FAQ ── */}
      <Reveal>
      <section style={{ borderTop: '1px solid #E5E0D4' }}>
        <div className="mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-24">
          <div className="mb-10 lg:mb-12">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
              Pricing FAQ
            </div>
            <h2 className="font-display font-bold text-ink text-[28px] sm:text-[36px] lg:text-[42px] leading-[1.05] tracking-[-0.03em]">
              Money questions, answered.
            </h2>
          </div>
          <FAQAccordion items={PRICING_FAQS} />
        </div>
      </section>
      </Reveal>

      {/* ── Final CTA ── */}
      <Reveal>
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid #E5E0D4' }}>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(65% 55% at 50% 110%, rgba(31,77,58,0.09), transparent 65%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(15,31,24,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-24 text-center">
          <h2 className="font-display font-bold text-ink text-[40px] sm:text-[54px] lg:text-[68px] leading-[0.98] tracking-[-0.035em]">
            Start free. 14 days on us when you&rsquo;re ready.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px] mx-auto">
            Start on the Free plan and trial Pro or Studio for 14 days — no credit card required.
            Cancel anytime, no questions asked.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
            >
              Start free <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <a
              href="mailto:hello@cre8so.com"
              className="inline-flex items-center gap-2 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors text-[15px]"
            >
              Talk to sales <ArrowRight size={14} strokeWidth={2} />
            </a>
          </div>
        </div>
      </section>
      </Reveal>
    </>
  );
}
