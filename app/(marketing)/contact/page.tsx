import { ContactFormClient } from './ContactFormClient';

export const metadata = { title: 'Contact — Karta' };

const REASONS = [
  "You're setting up a Pro or Studio account",
  "You have an event coming up and want to make sure Karta can handle it",
  "Something broke and you need help urgently",
  "You have feedback on the product — we read every message",
  "You're an NGO or educational org and want to discuss pricing",
  "You want to collaborate — design, engineering, or growth",
];

export default function ContactPage() {
  return (
    <div style={{ background: '#FAF6EE' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1100px] px-5 lg:px-10 pt-20 pb-14">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="h-px w-8 bg-[#1F4D3A]/30" />
          <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#1F4D3A]">Contact</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
          <div>
            <h1 className="font-display font-bold text-[52px] sm:text-[64px] leading-[0.95] tracking-[-0.03em] text-[#0F1F18]">
              Let&apos;s talk.
            </h1>
            <p className="mt-5 text-[17px] text-[#6B7A72] max-w-[440px] leading-relaxed">
              We&apos;re here to help. Send a message and we&apos;ll get back to you — usually within a few hours.
            </p>
          </div>

          {/* Good reasons strip */}
          <div
            className="lg:max-w-[340px] rounded-2xl px-5 py-4 shrink-0"
            style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.10)' }}
          >
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#1F4D3A]/60 mb-3">
              Good reasons to reach out
            </div>
            <ul className="space-y-2">
              {REASONS.map(r => (
                <li key={r} className="flex items-start gap-2.5 text-[13px] text-[#3A4A42] leading-snug">
                  <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#1F4D3A]/40 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Form + sidebar ── */}
        <ContactFormClient />

      </section>
    </div>
  );
}
