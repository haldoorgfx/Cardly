import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'Privacy Policy — Cardly',
  description:
    'How Cardly collects, uses, and protects your data. We keep it simple and honest.',
};

const LAST_UPDATED = 'May 2026';

const SECTIONS = [
  {
    id: 'collect',
    title: 'Information we collect',
    body: [
      'When you create an account, we collect your email address and optional full name. We use these to identify your account and communicate with you.',
      'When you use the editor, we store the event designs you create — including background images, zone configurations, and publish settings. These are stored on our servers to let you access and share your campaigns.',
      'When an attendee fills out a personalized card, we temporarily process the information they enter (name, photo) to generate the final PNG. This data is not stored beyond the card generation unless you explicitly enable analytics.',
      'We collect usage data (pages visited, buttons clicked, errors encountered) to improve the product. This is collected via standard server logs and a minimal analytics setup. No third-party ad tracking.',
    ],
  },
  {
    id: 'use',
    title: 'How we use your information',
    body: [
      'To operate the service — sign you in, save your events, render personalized cards.',
      'To communicate with you — respond to support requests, send product updates (you can opt out of marketing emails at any time).',
      'To improve the product — aggregate usage data helps us understand which features matter most.',
      'We do not sell your data. We do not use your event designs or attendee data for advertising purposes.',
    ],
  },
  {
    id: 'sharing',
    title: 'Data sharing',
    body: [
      'We use a small number of sub-processors to run Cardly: Supabase (database and file storage), Vercel (hosting and CDN), and Resend (transactional email). Each is under a data processing agreement.',
      'We do not share your data with any other third party without your explicit consent — except where required by law.',
      'If you publish a campaign, the event data needed to display the attendee page (background image, zone layout) becomes publicly accessible via the campaign link. Attendee-entered data is not publicly exposed.',
    ],
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: [
      'You can export all data we hold about your account by emailing privacy@cardly.app.',
      'You can delete your account at any time from the Settings page. Deletion removes your profile, all events, and all generated cards within 30 days.',
      'If you are in the European Economic Area, you have rights under GDPR including access, rectification, erasure, and data portability. Contact us to exercise them.',
      'We retain account data for as long as your account is active. We retain anonymized aggregate analytics data indefinitely.',
    ],
  },
  {
    id: 'security',
    title: 'Security',
    body: [
      'All data is transmitted over TLS. Files are stored in encrypted object storage. Access to production systems is limited to essential personnel.',
      'We do not store payment card numbers. Payments are processed by Stripe, which is PCI-DSS compliant.',
      'If we become aware of a breach that affects your personal data, we will notify you within 72 hours.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      'Questions about this policy? Email privacy@cardly.app. We respond within 2 business days.',
      'For general support, use hello@cardly.app.',
    ],
  },
];

/* ── Hero ────────────────────────────────────────────────── */
function PrivacyHero() {
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
          Privacy Policy
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px]">
          We keep this honest and readable. Last updated{' '}
          <span className="text-ink font-medium">{LAST_UPDATED}</span>.
        </p>

        {/* Jump links */}
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
function PrivacyContent() {
  return (
    <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-[220px_1fr] gap-12 lg:gap-20 items-start">
      {/* Sidebar TOC */}
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

      {/* Sections */}
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

        {/* Divider */}
        <div className="h-px" style={{ background: '#E5E0D4' }} />

        {/* Footer note */}
        <Reveal>
          <div
            className="rounded-2xl p-6 lg:p-7"
            style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.12)' }}
          >
            <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary mb-3">Questions?</div>
            <p className="text-ink-soft text-[15px] leading-[1.6] mb-4">
              If anything in this policy is unclear, email us. We prefer plain-language questions to legal posturing.
            </p>
            <a
              href="mailto:privacy@cardly.app"
              className="inline-flex items-center gap-2 text-primary font-medium text-[14px] hover:underline"
            >
              privacy@cardly.app <ArrowRight size={14} strokeWidth={2} />
            </a>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <PrivacyHero />
      <PrivacyContent />
    </>
  );
}
