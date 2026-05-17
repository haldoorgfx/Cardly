import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'Terms of Service — Cardly',
  description:
    'The rules for using Cardly. Straightforward, no legalese.',
};

const LAST_UPDATED = 'May 2026';

const SECTIONS = [
  {
    id: 'using',
    title: 'Using Cardly',
    body: [
      'By using Cardly, you agree to these terms. You must be at least 16 years old and capable of entering a binding agreement in your jurisdiction.',
      'You are responsible for maintaining the security of your account credentials. Notify us immediately at hello@cardly.app if you believe your account has been compromised.',
      'You must not use Cardly in a way that violates applicable laws, infringes on others\' intellectual property, or interferes with the operation of the service.',
    ],
  },
  {
    id: 'plans',
    title: 'Plans and billing',
    body: [
      'Cardly offers a Free plan and paid plans (Pro, Studio). Paid plans are billed monthly or annually depending on the option you choose at signup.',
      'Upgrades take effect immediately. Downgrades take effect at the end of the current billing period.',
      'Refunds are available within 7 days of a charge if the service did not perform as described. Contact billing@cardly.app.',
      'We may change pricing with 30 days\' notice. Existing subscribers on annual plans are protected until renewal.',
    ],
  },
  {
    id: 'content',
    title: 'Your content',
    body: [
      'You own the designs, images, and event configurations you upload to Cardly. We don\'t claim ownership of your content.',
      'By uploading content, you grant Cardly a limited license to store, process, and display it solely for the purpose of operating the service for you.',
      'You must have the rights to any content you upload. You may not upload content that is obscene, defamatory, or that infringes third-party intellectual property.',
      'We may remove content that violates these terms without prior notice.',
    ],
  },
  {
    id: 'acceptable',
    title: 'Acceptable use',
    body: [
      'Cardly is for creating legitimate event attendee share cards. Do not use it to generate spam, run phishing campaigns, impersonate other organizations, or distribute harmful content.',
      'Do not attempt to reverse-engineer, scrape, or overload the platform. Do not share API keys or embed the render endpoint in ways that circumvent per-account limits.',
      'Violations may result in immediate account suspension without refund.',
    ],
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    body: [
      'Cardly, the Cardly wordmark, and the product interface are owned by Cardly Labs. You may not use our brand assets without written permission.',
      'Feedback and suggestions you provide may be used to improve the product. We won\'t claim ownership of any IP you develop independently.',
    ],
  },
  {
    id: 'liability',
    title: 'Liability and disclaimers',
    body: [
      'Cardly is provided "as is." We do not warrant that the service will be error-free or always available.',
      'To the maximum extent permitted by law, Cardly\'s liability is limited to the amount you paid in the 12 months prior to the claim.',
      'We are not responsible for losses caused by attendee-submitted content, third-party platform changes (e.g., social media algorithm shifts), or events outside our control.',
    ],
  },
  {
    id: 'termination',
    title: 'Termination',
    body: [
      'You may cancel your account at any time from Settings. Your data will be retained for 30 days before deletion, giving you time to export.',
      'We may suspend or terminate accounts that violate these terms. We will provide notice except in cases of serious or repeated violations.',
      'On termination, your license to use the service ends. Our rights to anonymized aggregate data survive termination.',
    ],
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    body: [
      'We may update these terms. If changes are material, we will notify you via email or a prominent notice in the app at least 14 days before they take effect.',
      'Continued use after changes take effect constitutes acceptance.',
    ],
  },
];

/* ── Hero ────────────────────────────────────────────────── */
function TermsHero() {
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
            'radial-gradient(60% 55% at 10% 0%, rgba(31,77,58,0.08), transparent 65%)',
            'radial-gradient(50% 45% at 90% 100%, rgba(232,197,126,0.10), transparent 65%)',
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
          Legal
        </div>
        <h1 className="font-display font-bold text-ink text-[42px] sm:text-[56px] lg:text-[68px] leading-[0.95] tracking-[-0.035em] max-w-[760px]">
          Terms of Service
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px]">
          Plain language. No surprises. Last updated{' '}
          <span className="text-ink font-medium">{LAST_UPDATED}</span>.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors hover:bg-primary hover:text-cream"
              style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Content ─────────────────────────────────────────────── */
function TermsContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-[220px_1fr] gap-12 lg:gap-20 items-start">
      <aside className="hidden lg:block sticky top-24">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">Contents</div>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="block text-[13px] text-ink-soft hover:text-primary transition-colors py-1 border-l-2 pl-3"
              style={{ borderColor: 'rgba(229,224,212,0.6)' }}
            >
              {s.title}
            </a>
          ))}
        </nav>
      </aside>

      <div className="space-y-12 lg:space-y-14">
        {SECTIONS.map((s, i) => (
          <Reveal key={s.id} delay={i * 40} distance={16}>
            <section id={s.id} className="scroll-mt-28">
              <h2 className="font-display font-bold text-ink text-[24px] sm:text-[28px] tracking-[-0.025em] mb-5">
                {s.title}
              </h2>
              <div className="space-y-4">
                {s.body.map((para, j) => (
                  <p key={j} className="text-ink-soft text-[15px] lg:text-[16px] leading-[1.7]">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          </Reveal>
        ))}

        <div className="h-px" style={{ background: '#E5E0D4' }} />

        <Reveal>
          <div
            className="rounded-2xl p-6 lg:p-7"
            style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.12)' }}
          >
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary mb-3">Have a question?</div>
            <p className="text-ink-soft text-[15px] leading-[1.6] mb-4">
              If you have questions about these terms, email us. We prefer clarity over fine print.
            </p>
            <a
              href="mailto:hello@cardly.app"
              className="inline-flex items-center gap-2 text-primary font-medium text-[14px] hover:underline"
            >
              hello@cardly.app <ArrowRight size={14} strokeWidth={2} />
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <>
      <TermsHero />
      <TermsContent />
    </>
  );
}
