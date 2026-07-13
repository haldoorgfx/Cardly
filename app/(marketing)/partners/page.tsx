import Link from 'next/link';
import { ArrowRight, Globe, Zap, Users, BarChart3 } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';

export const metadata = {
  title: 'Partners',
  description:
    'Grow your event business with Eventera. Reseller, integration, and co-marketing programs for agencies and platforms.',
};

const PROGRAMS = [
  {
    icon: <Users size={22} strokeWidth={1.8} />,
    tag: '01 · Reseller',
    title: 'Reseller program',
    desc: 'Sell Eventera to your event clients under your own brand. You manage the relationship; we power the product. Revenue share from day one.',
    points: [
      'White-label attendee pages (Studio tier)',
      'Dedicated account manager',
      '30% recurring commission',
      'Priority support queue',
    ],
  },
  {
    icon: <Zap size={22} strokeWidth={1.8} />,
    tag: '02 · Integration',
    title: 'Integration partner',
    desc: 'Connect Eventera to your event platform, ticketing system, or CRM. We provide API access and co-marketing support to reach shared audiences.',
    points: [
      'Full API access on Pro/Studio',
      'Webhook support for real-time card events',
      'Listed in the Eventera integrations directory',
      'Joint launch announcement',
    ],
  },
  {
    icon: <Globe size={22} strokeWidth={1.8} />,
    tag: '03 · Co-marketing',
    title: 'Co-marketing',
    desc: 'Partner on content, webinars, or campaigns targeting event organizers in Africa and the Middle East. We bring the audience; you bring the value.',
    points: [
      'Access to our community of 1,200+ organizers',
      'Featured in our newsletter (14K subscribers)',
      'Cross-promotion on social channels',
      'Co-branded case studies',
    ],
  },
];

const LOGOS = [
  'Tech events Lagos',
  'Nairobi Summit',
  'Gulf Media Week',
  'EventPro Africa',
  'Kigali Founders',
  'Cairo Startups',
];

/* ── Hero ────────────────────────────────────────────────── */
function PartnersHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-14 lg:pb-20">
        <div className="max-w-[820px]">
          <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            Partners
          </div>
          <h1 className="font-title font-bold text-ink text-[44px] sm:text-[60px] lg:text-[78px] leading-[0.95]">
            Grow with Eventera.{' '}
            <span className="text-primary">We grow with you.</span>
          </h1>
          <p className="mt-6 text-ink-soft text-[18px] lg:text-[20px] leading-[1.55] max-w-[620px]">
            Resell, integrate, or co-market with us. We work with event agencies, platforms,
            and organizers who share the goal of making every campaign more shareable.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="mailto:partners@eventera.so"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
            >
              Apply to partner <ArrowRight size={16} strokeWidth={2} />
            </a>
            <a
              href="#programs"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors text-ink"
              style={{ border: '1px solid rgba(15,31,24,0.15)' }}
            >
              See programs <ArrowRight size={15} strokeWidth={2} />
            </a>
          </div>
        </div>

        {/* Stats */}
        <Reveal>
          <div
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E0D4', gap: '1px', background: '#E5E0D4' }}
          >
            {([
              ['18', 'Agency partners'],
              ['8', 'Countries'],
              ['247K', 'Cards generated'],
              ['$0', 'Setup fee'],
            ] as [string, string][]).map(([n, l]) => (
              <div key={l} className="bg-cream p-5 lg:p-6">
                <div className="font-display font-bold text-primary text-[28px] lg:text-[36px] tracking-[-0.03em] leading-none">
                  {n}
                </div>
                <div className="mt-2  text-[10px] tracking-[0.16em] uppercase text-muted">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Partner logos strip ─────────────────────────────────── */
function PartnerLogos() {
  return (
    <section style={{ borderBottom: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.5)' }}>
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-10 lg:py-12">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-muted text-center mb-8">
          Trusted by event teams across Africa and the Middle East
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5">
          {LOGOS.map((logo) => (
            <div
              key={logo}
              className="font-display font-semibold text-[15px] tracking-tight"
              style={{ color: 'rgba(58,74,66,0.55)' }}
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Programs ────────────────────────────────────────────── */
function Programs() {
  return (
    <section id="programs" className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24">
      <Reveal>
        <div className="max-w-[680px] mb-12 lg:mb-16">
          <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Programs
          </div>
          <h2 className="font-title font-bold text-ink text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02]">
            Three ways to work with us.
          </h2>
          <p className="mt-4 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6]">
            Each program is designed for a specific kind of partner. Pick the one that fits your model — or combine them.
          </p>
        </div>
      </Reveal>

      <div className="grid lg:grid-cols-3 gap-5">
        {PROGRAMS.map((prog, i) => (
          <Reveal key={prog.tag} delay={i * 90}>
            <div
              className="flex flex-col bg-surface rounded-2xl p-7 lg:p-8 h-full"
              style={{ border: '1px solid #E5E0D4' }}
            >
              <div className="flex items-center justify-between mb-6">
                <div
                  className="w-11 h-11 rounded-xl grid place-items-center text-primary"
                  style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.12)' }}
                >
                  {prog.icon}
                </div>
                <span className=" text-[10px] tracking-[0.20em] uppercase text-muted">
                  {prog.tag}
                </span>
              </div>
              <h3 className="font-display font-bold text-ink text-[22px] lg:text-[24px] tracking-tight mb-3">
                {prog.title}
              </h3>
              <p className="text-ink-soft text-[14px] lg:text-[15px] leading-[1.6] mb-6">
                {prog.desc}
              </p>
              <ul className="space-y-3 mt-auto">
                {prog.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-[13px] text-ink-soft">
                    <span className="w-4 h-4 rounded-full grid place-items-center shrink-0 mt-0.5" style={{ background: 'rgba(31,77,58,0.10)' }}>
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="#1F4D3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ── Why us ──────────────────────────────────────────────── */
function WhyPartner() {
  const reasons = [
    {
      icon: <BarChart3 size={20} strokeWidth={1.8} />,
      title: 'Real commission, not referral crumbs.',
      body: '30% recurring revenue share on every plan. Paid monthly. No caps.',
    },
    {
      icon: <Zap size={20} strokeWidth={1.8} />,
      title: 'A product that sells itself.',
      body: 'Show a client the attendee flow once. That\'s usually the close.',
    },
    {
      icon: <Globe size={20} strokeWidth={1.8} />,
      title: 'Built for where you work.',
      body: 'We understand African event economics. Our partner support team does too.',
    },
  ];

  return (
    <section className="relative overflow-hidden" style={{ background: '#1F4D3A' }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24">
        <Reveal>
          <div className="max-w-[680px] mb-12">
            <div className=" text-[11px] tracking-[0.22em] uppercase mb-4" style={{ color: '#E8C57E' }}>
              Why Eventera
            </div>
            <h2 className="font-title font-bold text-cream text-[32px] sm:text-[42px] lg:text-[50px] leading-[1.02]">
              Partner with a team that&apos;s serious about this.
            </h2>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-4 lg:gap-5">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i * 80}>
              <div
                className="p-6 lg:p-7 rounded-2xl h-full"
                style={{ background: 'rgba(250,246,238,0.06)', border: '1px solid rgba(250,246,238,0.12)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg grid place-items-center mb-5"
                  style={{ background: 'rgba(250,246,238,0.10)', color: '#E8C57E', border: '1px solid rgba(250,246,238,0.15)' }}
                >
                  {r.icon}
                </div>
                <h3 className="font-display font-semibold text-cream text-[17px] lg:text-[19px] tracking-tight mb-2">
                  {r.title}
                </h3>
                <p className="text-[14px] leading-[1.6]" style={{ color: 'rgba(250,246,238,0.70)' }}>
                  {r.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ─────────────────────────────────────────────────── */
function PartnerCTA() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[860px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <h2 className="font-title font-bold text-ink text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.0]">
          Ready to partner?
        </h2>
        <p className="mt-5 text-ink-soft text-[16px] lg:text-[17px] leading-[1.55] max-w-[520px] mx-auto">
          Email us with a brief intro — what you do, who you serve, and which program interests you. We respond within 2 business days.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:partners@eventera.so"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
          >
            partners@eventera.so <ArrowRight size={16} strokeWidth={2} />
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors text-ink"
            style={{ border: '1px solid rgba(15,31,24,0.15)' }}
          >
            Use the contact form <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function PartnersPage() {
  return (
    <>
      <PartnersHero />
      <PartnerLogos />
      <Programs />
      <WhyPartner />
      <Reveal><PartnerCTA /></Reveal>
    </>
  );
}
