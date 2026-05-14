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
      {/* Header */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-14">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-neutral-500 hover:text-neutral-800 transition mb-10"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Back to home
        </Link>

        <h1 className="text-[32px] font-bold text-[#0a0a0a] tracking-tight">
          Pricing
        </h1>
        <p className="mt-2 text-[15px] text-neutral-500 leading-relaxed max-w-[420px]">
          Simple, transparent pricing. Start free. Upgrade when you need it.
        </p>

        {/* Billing toggle */}
        <div className="mt-8 inline-flex items-center gap-0.5 p-1 rounded-md bg-neutral-100 border border-neutral-200">
          <button
            onClick={() => setYearly(false)}
            className={`px-4 h-8 rounded text-[13px] font-medium transition ${!yearly ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-4 h-8 rounded text-[13px] font-medium transition inline-flex items-center gap-2 ${yearly ? 'bg-white text-[#0a0a0a] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            Yearly
            <span className="text-[10px] font-medium text-[#1F4D3A] bg-[#1F4D3A]/10 px-1.5 py-0.5 rounded">
              -20%
            </span>
          </button>
        </div>
      </section>

      {/* Pricing columns */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-px bg-neutral-200 rounded-lg overflow-hidden border border-neutral-200">

          {/* Free */}
          <div className="bg-white p-8 flex flex-col">
            <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-widest">
              Free
            </div>
            <div className="mt-4">
              <span className="text-[36px] font-bold text-neutral-900 tracking-tight">$0</span>
              <span className="text-[14px] text-neutral-500 ml-1">/forever</span>
            </div>
            <p className="mt-3 text-[14px] text-neutral-500 leading-relaxed">
              Try the full editor. Ship one event with a small Cardly watermark.
            </p>
            <Link
              href="/signup"
              className="mt-6 h-10 px-5 border border-neutral-300 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition flex items-center justify-center"
            >
              Get started free
            </Link>
            <ul className="mt-8 space-y-3">
              {[
                "1 active event",
                "Up to 100 attendee cards",
                "PNG export",
                "Basic analytics",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-neutral-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-[14px] text-neutral-400">
                <span className="mt-0.5 text-neutral-300">—</span>
                Cardly watermark on cards
              </li>
            </ul>
          </div>

          {/* Pro (recommended) */}
          <div className="bg-white p-8 flex flex-col border-x-2 border-neutral-900">
            <div className="flex items-center justify-between">
              <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-widest">
                Pro
              </div>
              <span className="text-[10px] font-medium text-[#0a0a0a] border border-neutral-900 px-2 py-0.5 rounded">
                Most popular
              </span>
            </div>
            <div className="mt-4">
              <span className="text-[36px] font-bold text-neutral-900 tracking-tight">${prices.pro}</span>
              <span className="text-[14px] text-neutral-500 ml-1">/mo</span>
            </div>
            {yearly && (
              <p className="mt-1 text-[12px] text-neutral-400">
                Billed annually · ${prices.pro * 12}/yr
              </p>
            )}
            <p className="mt-3 text-[14px] text-neutral-500 leading-relaxed">
              For organizers running real campaigns. No watermark. Analytics.
            </p>
            <Link
              href="/signup"
              className="mt-6 h-10 px-5 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-md hover:bg-neutral-800 transition flex items-center justify-center"
            >
              Start Pro trial
            </Link>
            <ul className="mt-8 space-y-3">
              {[
                "10 active events",
                "Up to 5,000 cards / event",
                "No watermark",
                "Custom subdomain",
                "Advanced analytics",
                "Embed snippet",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-neutral-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Studio */}
          <div className="bg-white p-8 flex flex-col">
            <div className="text-[12px] font-medium text-neutral-500 uppercase tracking-widest">
              Studio
            </div>
            <div className="mt-4">
              <span className="text-[36px] font-bold text-neutral-900 tracking-tight">${prices.studio}</span>
              <span className="text-[14px] text-neutral-500 ml-1">/mo</span>
            </div>
            {yearly && (
              <p className="mt-1 text-[12px] text-neutral-400">
                Billed annually · ${prices.studio * 12}/yr
              </p>
            )}
            <p className="mt-3 text-[14px] text-neutral-500 leading-relaxed">
              For agencies and brand teams running concurrent client events.
            </p>
            <a
              href="mailto:hello@cardly.app"
              className="mt-6 h-10 px-5 border border-neutral-300 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition flex items-center justify-center"
            >
              Contact sales
            </a>
            <ul className="mt-8 space-y-3">
              {[
                "Unlimited events",
                "Unlimited attendee cards",
                "Team workspace (10 seats)",
                "White-label (your domain)",
                "API access + webhooks",
                "Priority support + onboarding",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px] text-neutral-700">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-5 text-center text-[13px] text-neutral-400">
          All plans include unlimited preview cards while editing. Cancel anytime.
        </p>
      </section>

      {/* Comparison table */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-[22px] font-bold text-[#0a0a0a] tracking-tight mb-8">
          Everything in detail
        </h2>
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-5 py-3.5 font-medium text-neutral-500 w-[40%]">Feature</th>
                <th className="text-center px-5 py-3.5 font-medium text-neutral-900">Free</th>
                <th className="text-center px-5 py-3.5 font-medium text-neutral-900">Pro</th>
                <th className="text-center px-5 py-3.5 font-medium text-neutral-900">Studio</th>
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

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-[22px] font-bold text-[#0a0a0a] tracking-tight mb-8">
          Questions
        </h2>
        <div className="divide-y divide-neutral-100 border-y border-neutral-100">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                <span className="text-[15px] font-medium text-[#0a0a0a]">
                  {faq.q}
                </span>
                <span className="text-neutral-400 group-open:rotate-45 transition-transform duration-150 shrink-0 text-[20px] font-light leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[14px] text-neutral-500 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#0a0a0a] py-24 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-[32px] font-bold text-white tracking-tight">
            Ready to ship your first card?
          </h2>
          <p className="mt-3 text-[15px] text-neutral-400 leading-relaxed">
            Free forever for one event. Upgrade when you outgrow it.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 h-10 px-6 bg-white text-[#0a0a0a] text-[14px] font-medium rounded-md hover:bg-neutral-100 transition"
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
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
    q: "Do attendees need an account?",
    a: "No. The link is the product — attendees open it on their phone, fill in their info, and download. No login, no friction.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrades are prorated, downgrades take effect at the next billing cycle.",
  },
  {
    q: "Is there an education / NGO discount?",
    a: "Yes — 50% off any paid plan. Email us with proof and we'll set it up the same day.",
  },
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 shrink-0 text-emerald-600"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CompRow({
  label,
  free,
  pro,
  studio,
  last,
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
          <span className="text-emerald-600 font-bold text-[15px]">✓</span>
        </td>
      );
    if (val === false)
      return (
        <td className="text-center px-5 py-3.5 text-neutral-300 text-[15px]">
          —
        </td>
      );
    return (
      <td className="text-center px-5 py-3.5 text-neutral-600">{val}</td>
    );
  };

  return (
    <tr className={last ? "" : "border-b border-neutral-100"}>
      <td className="px-5 py-3.5 text-neutral-700">{label}</td>
      {cell(free)}
      {cell(pro)}
      {cell(studio)}
    </tr>
  );
}
