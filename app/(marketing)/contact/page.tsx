import { ContactFormClient } from './ContactFormClient';

export const metadata = {
  title: 'Contact — Cardly',
  description:
    'Get in touch with the Cardly team. Support, partnerships, press — we read every message.',
};

/* ── Hero ────────────────────────────────────────────────── */
function ContactHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(65% 55% at 10% 0%, rgba(31,77,58,0.09), transparent 65%)',
            'radial-gradient(50% 45% at 90% 100%, rgba(232,197,126,0.11), transparent 65%)',
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
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Contact
        </div>
        <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.95] tracking-[-0.035em] max-w-[700px]">
          We read every message.
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Support, partnerships, press — drop us a line. We reply within one business day, usually faster.
        </p>
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactFormClient />
    </>
  );
}
