import { ContactFormClient } from './ContactFormClient';

export const metadata = { title: 'Contact' };

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
      <section className="mx-auto max-w-[1100px] px-5 lg:px-10 pt-20 pb-20">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="h-px w-8 bg-[#1F4D3A]/30" />
          <span className=" text-[11px] tracking-[0.22em] uppercase text-[#1F4D3A]">Contact</span>
        </div>

        {/* Headline */}
        <h1 className="font-title font-bold text-[52px] sm:text-[68px] leading-[0.95] text-[#0F1F18] mb-4">
          Let&apos;s talk.
        </h1>
        <p className="text-[17px] text-[#6B7A72] max-w-[480px] leading-relaxed mb-14">
          We&apos;re here to help. Send a message and we&apos;ll get back to you — usually within a few hours.
        </p>

        {/* Form + sidebar */}
        <ContactFormClient />

        {/* Good reasons — below the fold, extra info */}
        <div className="mt-16 pt-12" style={{ borderTop: '1px solid #E5E0D4' }}>
          <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-5">
            Good reasons to reach out
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {REASONS.map(r => (
              <li key={r}
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-[13px] text-[#3A4A42] leading-snug"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
              >
                <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[#1F4D3A]/40 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

      </section>
    </div>
  );
}
