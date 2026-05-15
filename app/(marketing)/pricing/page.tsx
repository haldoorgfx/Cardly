'use client';

import { useState } from 'react';
import Link from 'next/link';

const MONTHLY = { pro: 24, studio: 59 };
const YEARLY  = { pro: 19, studio: 49 };

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const prices = yearly ? YEARLY : MONTHLY;

  return (
    <>
      {/* ── Header ── */}
      <section className="relative overflow-hidden" style={{ background: '#FAF6EE' }}>
        {/* Radial fade */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 100%, transparent 50%, #FAF6EE 100%)',
          }} />
        {/* Mesh blob */}
        <div className="absolute pointer-events-none"
          style={{
            top: '-30%', right: '-5%',
            width: '500px', height: '500px',
            background: 'radial-gradient(ellipse, rgba(232,197,126,0.22) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }} />
        <div className="absolute pointer-events-none"
          style={{
            bottom: '-10%', left: '-5%',
            width: '400px', height: '400px',
            background: 'radial-gradient(ellipse, rgba(31,77,58,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }} />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 transition mb-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
            Back to home
          </Link>

          <div className="text-[11px] font-mono text-[#1F4D3A]/60 tracking-widest uppercase mb-4">
            Pricing
          </div>
          <h1 className="text-[36px] md:text-[48px] font-bold text-[#0F1F18] tracking-tight leading-tight">
            Simple, transparent pricing.
          </h1>
          <p className="mt-3 text-[15px] text-neutral-500 leading-relaxed max-w-[420px]">
            Start free. Upgrade when you need it. No surprise charges.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-0.5 p-1 rounded-lg bg-white border border-neutral-200"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <button
              onClick={() => setYearly(false)}
              className={`px-4 h-8 rounded-md text-[13px] font-medium transition ${
                !yearly ? 'bg-[#0F1F18] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 h-8 rounded-md text-[13px] font-medium transition inline-flex items-center gap-2 ${
                yearly ? 'bg-[#0F1F18] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Yearly
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                yearly ? 'bg-[#E8C57E]/20 text-[#E8C57E]' : 'bg-[#1F4D3A]/10 text-[#1F4D3A]'
              }`}>
                −20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Pricing columns ── */}
      <section className="bg-white py-0 pb-24">
        <div className="max-w-5xl mx-auto px-6 -mt-4">
          <div className="grid md:grid-cols-3 gap-px rounded-xl overflow-hidden"
            style={{ border: '1px solid #E5E0D4', boxShadow: '0 4px 24px rgba(15,31,24,0.06)' }}>

            {/* ── Free ── */}
            <div className="bg-white p-8 flex flex-col">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                Free
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-[40px] font-bold text-neutral-900 tracking-tight leading-none">$0</span>
                <span className="text-[14px] text-neutral-400 mb-1">/forever</span>
              </div>
              <p className="mt-3 text-[13px] text-neutral-500 leading-relaxed">
                Try the full editor. Ship one event with a small Cardly watermark.
              </p>
              <Link
                href="/signup"
                className="mt-6 h-10 px-5 border border-neutral-200 text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition flex items-center justify-center text-neutral-700"
              >
                Get started free
              </Link>
              <ul className="mt-8 space-y-3 flex-1">
                {[
                  '1 active event',
                  'Up to 100 attendee cards',
                  'PNG export',
                  'Basic analytics',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-neutral-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-[13px] text-neutral-400">
                  <span className="mt-0.5 text-neutral-300 text-[12px]">—</span>
                  Cardly watermark on cards
                </li>
              </ul>
            </div>

            {/* ── Pro ── dark treatment ── */}
            <div className="relative flex flex-col p-8 overflow-hidden" style={{ background: '#0F1F18' }}>
              {/* Dot grid */}
              <div className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }} />

              {/* Top edge glow */}
              <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(232,197,126,0.5), transparent)',
                }} />

              <div className="relative flex items-center justify-between">
                <div className="text-[11px] font-mono text-white/40 uppercase tracking-widest">
                  Pro
                </div>
                <span className="text-[10px] font-semibold text-[#0F1F18] bg-[#E8C57E] px-2.5 py-1 rounded-md">
                  Most popular
                </span>
              </div>
              <div className="relative mt-4 flex items-end gap-1">
                <span className="text-[40px] font-bold text-white tracking-tight leading-none">${prices.pro}</span>
                <span className="text-[14px] text-white/40 mb-1">/mo</span>
              </div>
              {yearly && (
                <p className="relative mt-1 text-[12px] text-white/30">
                  Billed annually · ${prices.pro * 12}/yr
                </p>
              )}
              <p className="relative mt-3 text-[13px] text-white/55 leading-relaxed">
                For organizers running real campaigns. No watermark. Analytics.
              </p>
              <Link
                href="/signup"
                className="relative mt-6 h-10 px-5 text-[13px] font-semibold rounded-lg flex items-center justify-center transition hover:opacity-90"
                style={{ background: '#E8C57E', color: '#0F1F18' }}
              >
                Start Pro trial
              </Link>
              <ul className="relative mt-8 space-y-3 flex-1">
                {[
                  '10 active events',
                  'Up to 5,000 cards / event',
                  'No watermark',
                  'Custom subdomain',
                  'Advanced analytics',
                  'Embed snippet',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-white/70">
                    <CheckIconLight />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Studio ── */}
            <div className="bg-white p-8 flex flex-col">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-widest">
                Studio
              </div>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-[40px] font-bold text-neutral-900 tracking-tight leading-none">${prices.studio}</span>
                <span className="text-[14px] text-neutral-400 mb-1">/mo</span>
              </div>
              {yearly && (
                <p className="mt-1 text-[12px] text-neutral-400">
                  Billed annually · ${prices.studio * 12}/yr
                </p>
              )}
              <p className="mt-3 text-[13px] text-neutral-500 leading-relaxed">
                For agencies and brand teams running concurrent client events.
              </p>
              <a
                href="mailto:hello@cardly.app"
                className="mt-6 h-10 px-5 border border-neutral-200 text-[13px] font-medium rounded-lg hover:bg-neutral-50 transition flex items-center justify-center text-neutral-700"
              >
                Contact sales
              </a>
              <ul className="mt-8 space-y-3 flex-1">
                {[
                  'Unlimited events',
                  'Unlimited attendee cards',
                  'Team workspace (10 seats)',
                  'White-label (your domain)',
                  'API access + webhooks',
                  'Priority support + onboarding',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-neutral-600">
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-5 text-center text-[13px] text-neutral-400">
            All plans include unlimited preview cards while editing · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-[20px] font-bold text-[#0a0a0a] tracking-tight mb-8">
          Everything in detail
        </h2>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                <th className="text-left px-5 py-3.5 font-medium text-neutral-500 w-[40%]">Feature</th>
                <th className="text-center px-5 py-3.5 font-medium text-neutral-700">Free</th>
                <th className="text-center px-5 py-3.5 font-semibold text-[#0F1F18]">Pro</th>
                <th className="text-center px-5 py-3.5 font-medium text-neutral-700">Studio</th>
              </tr>
            </thead>
            <tbody>
              <CompRow label="Active events"      free="1"       pro="10"        studio="Unlimited" />
              <CompRow label="Cards per event"    free="100"     pro="5,000"     studio="Unlimited" />
              <CompRow label="Watermark removed"  free={false}   pro={true}      studio={true} />
              <CompRow label="Custom subdomain"   free={false}   pro={true}      studio={true} />
              <CompRow label="White-label"        free={false}   pro={false}     studio={true} />
              <CompRow label="Team seats"         free="1"       pro="3"         studio="10" />
              <CompRow label="Analytics"          free="Basic"   pro="Advanced"  studio="Advanced + API" />
              <CompRow label="Embed snippet"      free={false}   pro={true}      studio={true} />
              <CompRow label="Priority support"   free={false}   pro={false}     studio={true} last />
            </tbody>
          </table>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-[20px] font-bold text-[#0a0a0a] tracking-tight mb-8">
          Questions
        </h2>
        <div className="divide-y" style={{ borderTop: '1px solid #E5E0D4', borderBottom: '1px solid #E5E0D4' }}>
          {FAQS.map(faq => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                <span className="text-[15px] font-medium text-[#0a0a0a]">{faq.q}</span>
                <span className="text-neutral-400 group-open:rotate-45 transition-transform duration-150 shrink-0 text-[20px] font-light leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14px] text-neutral-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA band ── */}
      <section
        className="relative py-28 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0F1F18 0%, #1a3828 60%, #0F2A1C 100%)',
        }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(15,31,24,0.8) 100%)',
          }} />

        <div className="relative max-w-2xl mx-auto px-6">
          <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-6">
            Get started
          </div>
          <h2 className="text-[36px] md:text-[48px] font-bold text-white tracking-tight leading-tight">
            Ready to ship your first card?
          </h2>
          <p className="mt-4 text-[15px] text-white/45 leading-relaxed">
            Free forever for one event. Upgrade when you outgrow it.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="h-11 px-6 bg-white text-[#0F1F18] text-[14px] font-semibold rounded-lg hover:bg-neutral-100 transition inline-flex items-center gap-2"
            >
              Get started free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
          <p className="mt-6 text-[12px] text-white/25">No credit card required</p>
        </div>
      </section>
    </>
  );
}

/* ─── HELPERS ─────────────────────────────────────────────────────────── */

const FAQS = [
  {
    q: 'What counts as one "event"?',
    a: "One event = one design + one public link. You can keep an event open indefinitely — cards generated by attendees don't count as new events.",
  },
  {
    q: 'Do attendees need an account?',
    a: 'No. The link is the product — attendees open it on their phone, fill in their info, and download. No login, no friction.',
  },
  {
    q: 'Can I change plans later?',
    a: 'Anytime. Upgrades are prorated, downgrades take effect at the next billing cycle.',
  },
  {
    q: 'Is there an education / NGO discount?',
    a: "Yes — 50% off any paid plan. Email us with proof and we'll set it up the same day.",
  },
];

function CheckIcon() {
  return (
    <svg className="mt-0.5 shrink-0 text-[#1F4D3A]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckIconLight() {
  return (
    <svg className="mt-0.5 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(232,197,126,0.7)" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CompRow({
  label, free, pro, studio, last,
}: {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  studio: string | boolean;
  last?: boolean;
}) {
  const cell = (val: string | boolean) => {
    if (val === true)
      return (
        <td className="text-center px-5 py-3.5">
          <span className="text-[#1F4D3A] font-bold text-[14px]">✓</span>
        </td>
      );
    if (val === false)
      return (
        <td className="text-center px-5 py-3.5 text-neutral-300 text-[14px]">—</td>
      );
    return <td className="text-center px-5 py-3.5 text-neutral-600">{val}</td>;
  };

  return (
    <tr className={last ? '' : ''} style={{ borderBottom: last ? 'none' : '1px solid #F0EDE8' }}>
      <td className="px-5 py-3.5 text-neutral-700">{label}</td>
      {cell(free)}
      {cell(pro)}
      {cell(studio)}
    </tr>
  );
}
