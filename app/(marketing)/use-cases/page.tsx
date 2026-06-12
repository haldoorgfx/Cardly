import type { Metadata } from 'next';
import type { LucideProps } from 'lucide-react';
import Link from 'next/link';
import {
  LayoutGrid,
  Network,
  Users,
  Briefcase,
  Sun,
  ArrowRight,
  Check,
} from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';

export const metadata: Metadata = {
  title: 'Use Cases',
  description:
    'From tech conferences to NGO campaigns, political rallies to African summits — Karta handles every type of event with full registration, agenda, networking, and the Karta Card.',
};

/* ─── Topo SVG lines ─────────────────────────────────────────────── */

function TopoLines({ stroke = '#E8C57E', opacity = 0.12 }) {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 320 150"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <path d="M-20 120 Q60 95 130 105 Q200 115 260 90 Q300 75 340 80" stroke={stroke} strokeWidth="1" opacity={opacity} />
      <path d="M-20 100 Q50 75 120 88 Q190 100 255 72 Q295 55 340 62" stroke={stroke} strokeWidth="1" opacity={opacity} />
      <path d="M-20 80 Q40 58 110 70 Q180 82 250 52 Q292 35 340 44" stroke={stroke} strokeWidth="1" opacity={opacity} />
      <path d="M-20 60 Q35 40 105 52 Q170 64 245 34 Q288 16 340 26" stroke={stroke} strokeWidth="1" opacity={opacity} />
      <path d="M-20 140 Q70 118 140 126 Q210 134 270 108 Q308 94 340 98" stroke={stroke} strokeWidth="1" opacity={opacity} />
    </svg>
  );
}

/* ─── Use case cards ─────────────────────────────────────────────── */

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

type UseCase = {
  id: string;
  title: string;
  Icon: LucideIcon;
  gradient: string;
  glow: string;
  body: string;
  features: string[];
};

const USE_CASES: UseCase[] = [
  {
    id: 'tech-conferences',
    title: 'Tech Conferences',
    Icon: LayoutGrid,
    gradient: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)',
    glow: 'radial-gradient(60% 80% at 90% 10%, rgba(232,197,126,0.3), transparent 60%)',
    body: 'Multi-track agendas, speaker directories, startup networking.',
    features: [
      'Multi-track agenda builder',
      'Speaker directory & portals',
      'Attendee networking + AI matching',
      'Live Q&A during sessions',
      'Real-time analytics',
    ],
  },
  {
    id: 'ngo-campaigns',
    title: 'NGO Campaigns',
    Icon: Network,
    gradient: 'linear-gradient(150deg, #1F4D3A 0%, #2A6A50 60%, #3E7E5E 100%)',
    glow: 'radial-gradient(70% 70% at 10% 90%, rgba(232,197,126,0.26), transparent 60%)',
    body: 'Supporter cards, awareness drives, fundraising registration.',
    features: [
      'Free + donation-based registration',
      'Personalized supporter Karta Cards',
      'Volunteer coordination',
      'Email notifications',
      '40% NGO discount on Pro/Studio',
    ],
  },
  {
    id: 'political-events',
    title: 'Political Events',
    Icon: Users,
    gradient: 'linear-gradient(120deg, #163828 0%, #1F4D3A 60%, #1F4D3A 100%)',
    glow: 'radial-gradient(60% 90% at 80% 100%, rgba(201,164,94,0.3), transparent 55%)',
    body: 'Rally registration, volunteer coordination, endorsement cards.',
    features: [
      'Rally & town hall registration',
      'Endorsement Karta Cards for supporters',
      'Volunteer sign-up flows',
      'QR check-in at venue gates',
      'Card sharing drives organic reach',
    ],
  },
  {
    id: 'corporate-events',
    title: 'Corporate Events',
    Icon: Briefcase,
    gradient: 'linear-gradient(130deg, #1F4D3A 0%, #2A6A50 55%, #C9A45E 100%)',
    glow: 'radial-gradient(55% 80% at 95% 50%, rgba(232,197,126,0.34), transparent 55%)',
    body: 'Brand activations, product launches, lead retrieval for sponsors.',
    features: [
      'Paid + complimentary ticket tiers',
      'Sponsor booths & lead retrieval',
      'Branded Karta Cards per product line',
      'Executive speaker directory',
      'Revenue & attendance analytics',
    ],
  },
  {
    id: 'religious-organizations',
    title: 'Religious Organizations',
    Icon: Sun,
    gradient: 'linear-gradient(160deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
    glow: 'radial-gradient(70% 70% at 30% 20%, rgba(232,197,126,0.28), transparent 60%)',
    body: 'Community conferences, Ramadan iftar events, charity drives.',
    features: [
      'Free community registration',
      'Charity drive fundraising',
      'Session scheduling for multi-day programs',
      'Community networking directory',
      'Personalized attendee cards',
    ],
  },
];

function UseCaseCard({ uc }: { uc: UseCase }) {
  const { Icon } = uc;
  return (
    <div className="bg-white border border-[#E5E0D4] rounded-2xl overflow-hidden flex flex-col">
      {/* Cover */}
      <div
        className="relative h-[150px] overflow-hidden flex items-end p-4"
        style={{ background: uc.gradient }}
      >
        <TopoLines />
        {/* Gold glow overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: uc.glow }}
        />
        {/* Icon bottom-right */}
        <div className="absolute bottom-3 right-3 pointer-events-none opacity-[0.28]">
          <Icon size={48} strokeWidth={1} className="text-[#FAF6EE]" />
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col flex-1 gap-3">
        <h3 className="font-display text-[18px] font-semibold text-[#1F4D3A] tracking-tight">
          {uc.title}
        </h3>
        <p className="text-[#3A4A42] text-[14px] leading-[1.55]">{uc.body}</p>

        {/* Feature list */}
        <ul className="mt-1 flex flex-col gap-1.5">
          {uc.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-[#3A4A42]">
              <Check size={13} strokeWidth={2.5} className="text-[#1F4D3A] mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function AfricanSummitsCard() {
  return (
    <div
      className="group rounded-2xl overflow-hidden flex flex-col relative"
      style={{ background: 'linear-gradient(160deg, #163828 0%, #1F4D3A 100%)' }}
    >
      {/* Gold radial overlay */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(65% 75% at 85% 15%, rgba(232,197,126,0.28), transparent 60%)',
        }}
      />

      {/* Cover area */}
      <div className="relative h-[150px] overflow-hidden flex items-end p-6">
        <TopoLines stroke="#E8C57E" opacity={0.14} />
        {/* "Built for Africa" badge */}
        <div
          className="relative z-10 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] uppercase px-2.5 py-1 rounded-full"
          style={{ background: '#E8C57E', color: '#163828' }}
        >
          {/* Djibouti flag — simplified inline */}
          <span className="inline-flex overflow-hidden rounded-sm" style={{ width: 14, height: 10 }}>
            <span style={{ width: 7, background: '#12aef5', display: 'inline-block', height: '100%' }} />
            <span
              style={{
                width: 7,
                display: 'inline-block',
                height: '100%',
                background: 'linear-gradient(to bottom, #12aef5 50%, #6ab23e 50%)',
              }}
            />
          </span>
          Built for Africa
        </div>
      </div>

      {/* Body */}
      <div className="relative p-6 pt-0 flex flex-col flex-1 gap-3">
        <h3
          className="font-display text-[18px] font-semibold tracking-tight"
          style={{ color: '#E8C57E' }}
        >
          African Summits
        </h3>
        <p className="text-[#FAF6EE]/80 text-[14px] leading-[1.55]">
          Mobile-first, WhatsApp-native, Flutterwave payments. Built for how Africa events run.
        </p>
        <ul className="mt-1 flex flex-col gap-1.5">
          {[
            'Flutterwave + M-Pesa payments',
            'WhatsApp-native card sharing',
            'Offline QR check-in',
            'Swahili, French, Arabic form support',
            'Local pricing and discounts',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2 text-[13px] text-[#FAF6EE]/75">
              <Check
                size={13}
                strokeWidth={2.5}
                style={{ color: '#E8C57E', marginTop: 2, flexShrink: 0 }}
              />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function UseCasesPage() {
  return (
    <>
      {/* ── SECTION 1 · Hero ── */}
      <section className="relative overflow-hidden border-b border-[#E5E0D4]">
        {/* Mesh background */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 10% 50%, rgba(31,77,58,0.07) 0%, transparent 70%), radial-gradient(ellipse 55% 55% at 90% 20%, rgba(232,197,126,0.10) 0%, transparent 65%)',
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[#1F4D3A] mb-5">
            Use cases
          </div>

          <h1
            className="font-title font-bold text-[#1F4D3A] leading-[1.02] max-w-[820px]"
            style={{ fontSize: 'clamp(36px, 5.5vw, 56px)' }}
          >
            Whatever you&apos;re organizing, Karta handles it.
          </h1>

          <p className="mt-5 text-[#3A4A42] text-[16px] lg:text-[18px] leading-[1.55] max-w-[600px]">
            One platform for every type of event — with full registration, agenda, check-in,
            networking, and the Karta Card for every attendee.
          </p>
        </div>
      </section>

      {/* ── SECTION 2 · 6-card grid ── */}
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {USE_CASES.map((uc) => (
            <UseCaseCard key={uc.id} uc={uc} />
          ))}
          {/* Card 6 — African Summits */}
          <AfricanSummitsCard />
        </div>
      </section>

      {/* ── SECTION 3 · Platform callout strip ── */}
      <section className="border-y border-[#E5E0D4] bg-white">
        <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start lg:items-center">
            {/* Left */}
            <div className="lg:w-[300px] shrink-0">
              <h2
                className="font-title font-bold text-[#0F1F18] leading-tight"
                style={{ fontSize: 'clamp(26px, 3.5vw, 36px)' }}
              >
                Every use case. One platform.
              </h2>
              <Link
                href="/pricing"
                className="mt-5 inline-flex items-center gap-2 text-[#1F4D3A] font-medium text-[14px] hover:underline"
              >
                See the full platform <ArrowRight size={14} />
              </Link>
            </div>

            {/* Right: 3 pillars */}
            <div className="flex-1 grid sm:grid-cols-3 gap-5">
              {[
                {
                  Icon: LayoutGrid,
                  label: 'Registration',
                  desc: 'Ticket tiers, forms, payments, and instant confirmation.',
                },
                {
                  Icon: Users,
                  label: 'Agenda + Check-in',
                  desc: 'Multi-track schedules, QR check-in, live session tracking.',
                },
                {
                  Icon: Network,
                  label: 'Karta Card',
                  desc: 'Every attendee gets a personalized card, ready to share.',
                },
              ].map(({ Icon, label, desc }) => (
                <div key={label} className="flex flex-col gap-2.5">
                  <div
                    className="w-9 h-9 rounded-lg grid place-items-center"
                    style={{ background: '#E8EFEB' }}
                  >
                    <Icon size={17} strokeWidth={1.8} className="text-[#1F4D3A]" />
                  </div>
                  <div className="font-display font-semibold text-[15px] text-[#0F1F18]">
                    {label}
                  </div>
                  <p className="text-[#6B7A72] text-[13px] leading-[1.5]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 · Final CTA ── */}
      <section
        style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 60%, #2A6A50 100%)' }}
      >
        <div className="mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-28 text-center">
          <h2
            className="font-title font-bold leading-[1.0] text-[#FAF6EE]"
            style={{ fontSize: 'clamp(30px, 5vw, 48px)' }}
          >
            Start with your next event.
          </h2>
          <p className="mt-5 text-[#FAF6EE]/70 text-[16px] lg:text-[18px] leading-[1.55] max-w-[460px] mx-auto">
            Everything you need, nothing you don&apos;t. Set up in 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-opacity hover:opacity-90"
              style={{ background: '#E8C57E', color: '#163828' }}
            >
              Start free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
