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
      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e5e5ea] bg-white text-[11px] font-mono tracking-wider text-[#0f0f1a]/60 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6c63ff]" />
          NO HIDDEN FEES &middot; CANCEL ANYTIME
        </div>
        <h1 className="font-display font-bold text-[52px] sm:text-[64px] leading-[1.02] tracking-tight max-w-[820px] mx-auto">
          One event free.{' '}
          <span className="grad-text">Upgrade when you outgrow it.</span>
        </h1>
        <p className="mt-5 text-[17px] text-[#0f0f1a]/65 max-w-[560px] mx-auto leading-relaxed">
          Start free. Upgrade when you need more events running at once or want to remove the Cardly watermark.
        </p>

        {/* Billing toggle */}
        <div className="mt-9 inline-flex items-center gap-1 p-1 rounded-full bg-white border border-[#e5e5ea]">
          <button
            onClick={() => setYearly(false)}
            className={`px-5 h-9 rounded-full text-[13px] font-medium transition ${!yearly ? 'bg-[#0f0f1a] text-white' : 'text-[#0f0f1a]/60 hover:text-[#0f0f1a]'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`px-5 h-9 rounded-full text-[13px] font-medium transition inline-flex items-center gap-2 ${yearly ? 'bg-[#0f0f1a] text-white' : 'text-[#0f0f1a]/60 hover:text-[#0f0f1a]'}`}
          >
            Yearly
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#6c63ff]/20 text-[#f8a4d8]">&minus;20%</span>
          </button>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="max-w-[1240px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Free */}
          <div className="bg-white rounded-3xl shadow-soft p-8 border border-[#e5e5ea]/60 flex flex-col">
            <div className="text-[13px] font-mono tracking-widest text-[#0f0f1a]/50 mb-1">FREE</div>
            <div className="font-display font-bold text-[24px]">Sketch</div>
            <p className="text-[13.5px] text-[#0f0f1a]/60 mt-1">For one-off meetups and trying out the editor.</p>
            <div className="my-6">
              <div className="flex items-end gap-1.5">
                <span className="font-display font-bold text-[44px] leading-none">$0</span>
                <span className="text-[#0f0f1a]/50 text-[14px] mb-1.5">/forever</span>
              </div>
            </div>
            <Link href="/signup" className="block text-center py-3 rounded-xl border border-[#e5e5ea] font-medium text-[14px] hover:bg-[#fafafa] transition">
              Start free
            </Link>
            <ul className="mt-7 space-y-3 text-[14px] text-[#0f0f1a]/80">
              <li className="flex gap-2.5"><Chk />1 active event</li>
              <li className="flex gap-2.5"><Chk />Up to 100 attendee cards</li>
              <li className="flex gap-2.5"><Chk />PNG export</li>
              <li className="flex gap-2.5"><Chk />Basic analytics</li>
              <li className="flex gap-2.5 text-[#0f0f1a]/45"><span className="mt-0.5">&bull;</span>Cardly watermark on cards</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="relative rounded-3xl p-[1.5px] grad-bg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full grad-bg text-white text-[11px] font-mono tracking-widest shadow-sm whitespace-nowrap">
              MOST POPULAR
            </div>
            <div className="bg-white rounded-[22px] p-8 flex flex-col h-full">
              <div className="text-[13px] font-mono tracking-widest grad-text mb-1">PRO</div>
              <div className="font-display font-bold text-[24px]">Studio</div>
              <p className="text-[13.5px] text-[#0f0f1a]/60 mt-1">For designers and organizers running regular events.</p>
              <div className="my-6">
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-[44px] leading-none">${prices.pro}</span>
                  <span className="text-[#0f0f1a]/50 text-[14px] mb-1.5">/month</span>
                </div>
                {yearly && <div className="text-[12px] font-mono text-[#0f0f1a]/45 mt-1.5">Billed annually &middot; ${prices.pro * 12}/yr</div>}
              </div>
              <Link href="/signup" className="block text-center py-3 rounded-xl grad-bg text-white font-medium text-[14px] hover:opacity-95 transition">
                Start 14-day trial
              </Link>
              <ul className="mt-7 space-y-3 text-[14px] text-[#0f0f1a]/80">
                <li className="flex gap-2.5"><Chk />10 active events</li>
                <li className="flex gap-2.5"><Chk />Up to 5,000 cards / event</li>
                <li className="flex gap-2.5"><Chk /><b>No watermark</b></li>
                <li className="flex gap-2.5"><Chk />Custom event URL</li>
                <li className="flex gap-2.5"><Chk />Download analytics</li>
              </ul>
            </div>
          </div>

          {/* Studio/Agency */}
          <div className="bg-[#0f0f1a] text-white rounded-3xl shadow-soft p-8 flex flex-col relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-30" style={{ background: 'radial-gradient(closest-side,#f8a4d8,transparent)' }} />
            <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-25" style={{ background: 'radial-gradient(closest-side,#6c63ff,transparent)' }} />
            <div className="relative flex flex-col flex-1">
              <div className="text-[13px] font-mono tracking-widest text-[#f8a4d8] mb-1">STUDIO</div>
              <div className="font-display font-bold text-[24px]">Agency</div>
              <p className="text-[13.5px] text-white/65 mt-1">For agencies running events for many clients.</p>
              <div className="my-6">
                <div className="flex items-end gap-1.5">
                  <span className="font-display font-bold text-[44px] leading-none">${prices.studio}</span>
                  <span className="text-white/50 text-[14px] mb-1.5">/month</span>
                </div>
                {yearly && <div className="text-[12px] font-mono text-white/40 mt-1.5">Billed annually &middot; ${prices.studio * 12}/yr</div>}
              </div>
              <a href="mailto:hello@cardly.app" className="block text-center py-3 rounded-xl bg-white text-[#0f0f1a] font-medium text-[14px] hover:bg-white/90 transition">
                Talk to sales
              </a>
              <ul className="mt-7 space-y-3 text-[14px] text-white/85">
                <li className="flex gap-2.5"><Chk pink />Unlimited events</li>
                <li className="flex gap-2.5"><Chk pink />Unlimited attendee cards</li>
                <li className="flex gap-2.5"><Chk pink /><b>No watermark</b></li>
                <li className="flex gap-2.5"><Chk pink />Advanced analytics</li>
                <li className="flex gap-2.5"><Chk pink />Priority support + onboarding</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#0f0f1a]/50 mt-8">
          All plans include unlimited preview cards while editing. Cancel anytime &mdash; no questions.
        </p>
      </section>

      {/* Comparison table */}
      <section className="max-w-[1100px] mx-auto px-6 pb-24">
        <div className="text-center mb-10">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">COMPARE</div>
          <h2 className="font-display font-bold text-[36px] leading-tight">Everything in detail.</h2>
        </div>
        <div className="bg-white rounded-3xl border border-[#e5e5ea] overflow-hidden shadow-soft">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#e5e5ea]">
                <th className="text-left p-5 w-[40%] font-display text-[#0f0f1a]/60 font-medium">Feature</th>
                <th className="text-center p-5 font-display">Sketch</th>
                <th className="text-center p-5 font-display grad-text">Studio</th>
                <th className="text-center p-5 font-display">Agency</th>
              </tr>
            </thead>
            <tbody>
              <CompRow label="Active events"    free="1"      pro="10"       studio="Unlimited" last={false} />
              <CompRow label="Cards per event"  free="100"    pro="5,000"    studio="Unlimited" last={false} />
              <CompRow label="Watermark removed" free=""      pro="check"    studio="check"     last={false} />
              <CompRow label="Custom event URL" free=""       pro="check"    studio="check"     last={false} />
              <CompRow label="Analytics"        free="Basic"  pro="Advanced" studio="Advanced"  last={false} />
              <CompRow label="Priority support" free=""       pro=""         studio="check"     last />
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-[820px] mx-auto px-6 pb-28">
        <div className="text-center mb-10">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">FAQ</div>
          <h2 className="font-display font-bold text-[36px] leading-tight">Questions, briefly answered.</h2>
        </div>
        <div className="space-y-3">
          <FaqItem q='What counts as one "event"?' a="One event = one design + one public link. You can keep an event open indefinitely — cards generated by attendees don't count as new events." />
          <FaqItem q="Do attendees need an account?" a="No. The link is the product — attendees open it on their phone, fill in their info, and download. No login, no friction." />
          <FaqItem q="Can I change plans later?" a="Anytime. Upgrades take effect immediately, downgrades at the end of the billing cycle." />
          <FaqItem q="When does billing start?" a="We're finalizing payment setup. For now, email hello@cardly.app to arrange Pro or Studio access early. We'll notify all signups when self-serve billing is ready." />
          <FaqItem q="Is there an education or NGO discount?" a="Yes — 50% off any paid plan. Email us with proof of your organization and we'll set it up." />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="grad-bg rounded-3xl p-14 text-center text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-30" style={{ background: 'radial-gradient(closest-side, white, transparent)' }} />
          <h3 className="font-display font-bold text-[40px] leading-tight relative">Set up your first event this afternoon.</h3>
          <p className="text-white/85 mt-3 max-w-[480px] mx-auto relative">Free forever for one event. Upgrade when you outgrow it.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 mt-7 h-12 px-7 rounded-full bg-white text-[#0f0f1a] font-display font-semibold hover:bg-white/90 transition relative">
            Get started &mdash; it&apos;s free &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}

function Chk({ pink }: { pink?: boolean }) {
  return <span className={`mt-0.5 ${pink ? 'text-[#f8a4d8]' : 'text-[#6c63ff]'}`}>&#10003;</span>;
}

function CompRow({ label, free, pro, studio, last }: { label: string; free: string; pro: string; studio: string; last: boolean }) {
  const cell = (val: string) => {
    if (val === 'check') return <td className="text-center text-[#6c63ff]">&#10003;</td>;
    if (!val)           return <td className="text-center text-[#0f0f1a]/30">&mdash;</td>;
    return <td className="text-center text-[#0f0f1a]/70">{val}</td>;
  };
  return (
    <tr className={last ? '' : 'border-b border-[#e5e5ea]/50'}>
      <td className="p-4 pl-5 text-[#0f0f1a]/75">{label}</td>
      {cell(free)}
      {cell(pro)}
      {cell(studio)}
    </tr>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white rounded-2xl border border-[#e5e5ea] group">
      <summary className="cursor-pointer list-none flex items-center justify-between p-5 font-display font-semibold text-[16px]">
        {q}
        <span className="text-[#0f0f1a]/40 group-open:rotate-45 transition-transform duration-200">+</span>
      </summary>
      <p className="px-5 pb-5 text-[14px] text-[#0f0f1a]/65 leading-relaxed">{a}</p>
    </details>
  );
}
