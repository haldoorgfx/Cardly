'use client';

/* Eventera — Pricing section.
   Self-contained: <Pricing> = header + <BillingToggle> + <PlanCard>×3 + footer note.
   Plans are driven by a data array; the monthly⇄annual toggle is the one interaction,
   held in a single `billing` state and derived into each card (no DOM manipulation).
   Styling lives in Pricing.module.css (ported pixel-accurately from the handoff). */

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign, Zap, Building2, Check, ArrowRight, CreditCard, Star,
  type LucideIcon,
} from 'lucide-react';
import s from './Pricing.module.css';

type Billing = 'monthly' | 'annual';

interface Plan {
  id: 'free' | 'pro' | 'studio';
  name: string;
  icon: LucideIcon;
  desc: string;
  /** Displayed price amount per billing mode (Free is $0 either way). */
  price: Record<Billing, string>;
  /** Sub-price note per billing mode. */
  note: Record<Billing, string>;
  featHead: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: DollarSign,
    desc: 'For your first event and testing the waters.',
    price: { monthly: '$0', annual: '$0' },
    note: { monthly: 'Free forever', annual: 'Free forever' },
    featHead: "What's included",
    features: [
      '1 active event',
      '50 registrations',
      'Basic event page',
      'QR check-in',
      'Eventera Card for every attendee',
      'Eventera watermark on cards',
    ],
    cta: 'Start free',
    href: '/signup',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Zap,
    desc: 'Where most organizers start — everything to run great events.',
    price: { monthly: '$19', annual: '$15' },
    note: { monthly: 'Billed monthly', annual: '$180 billed annually' },
    featHead: 'Everything in Free, plus',
    features: [
      'Unlimited events',
      '500 registrations / month',
      'Full agenda builder',
      'Speaker directory & networking',
      '1:1 messaging',
      'Remove Eventera watermark',
      'Email notifications & basic analytics',
    ],
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    icon: Building2,
    desc: 'For teams and conferences that need scale & sponsors.',
    price: { monthly: '$49', annual: '$39' },
    note: { monthly: 'Billed monthly', annual: '$468 billed annually' },
    featHead: 'Everything in Pro, plus',
    features: [
      'Unlimited registrations',
      'AI matchmaking',
      'Live Q&A & polls',
      'Gamification & leaderboard',
      'Sponsor tools & lead retrieval',
      'Multiple brand kits · 3 team seats',
      'API access & priority support',
    ],
    cta: 'Start Studio',
    href: '/signup?plan=studio',
  },
];

/* ── Billing toggle (accessible switch) ──────────────────────────────── */
function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  const annual = billing === 'annual';
  const toggle = () => onChange(annual ? 'monthly' : 'annual');

  return (
    <div className={s.billing}>
      <span className={`${s.bl} ${!annual ? s.blOn : ''}`}>Monthly</span>
      <button
        type="button"
        role="switch"
        aria-checked={annual}
        aria-label="Toggle annual billing — save 20%"
        className={s.switch}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span className={s.knob} style={{ transform: annual ? 'translateX(22px)' : 'translateX(0)' }} />
      </button>
      <span className={`${s.bl} ${annual ? s.blOn : ''}`}>Annual</span>
      <span className={s.save}>Save 20%</span>
    </div>
  );
}

/* ── Plan card ───────────────────────────────────────────────────────── */
function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const Icon = plan.icon;
  return (
    <div className={`${s.card} ${plan.popular ? s.pop : ''}`}>
      {plan.popular && (
        <div className={s.ribbon}>
          <Star size={11} strokeWidth={0} fill="currentColor" /> Most Popular
        </div>
      )}

      <div className={s.planTop}>
        <span className={s.planIc}><Icon size={19} strokeWidth={1.8} /></span>
        <span className={s.planName}>{plan.name}</span>
      </div>

      <div className={s.planDesc}>{plan.desc}</div>

      <div className={s.price}>
        <span className={s.amt}>{plan.price[billing]}</span>
        <span className={s.per}>/mo</span>
      </div>
      <div className={s.priceNote} aria-live="polite">{plan.note[billing]}</div>

      <div className={s.divider} />

      <div className={s.featHead}>{plan.featHead}</div>
      <ul className={s.feats}>
        {plan.features.map((f) => (
          <li key={f} className={s.feat}>
            <span className={s.tick}><Check size={12} strokeWidth={2.6} /></span>
            {f}
          </li>
        ))}
      </ul>

      <Link href={plan.href} className={`${s.btn} ${plan.popular ? s.btnGold : ''}`}>
        {plan.cta}
        {plan.popular && <ArrowRight size={17} strokeWidth={2} />}
      </Link>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────── */
export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <section id="pricing" className={s.section}>
      <div className={s.wrap}>
        <div className={s.eyebrow}>Pricing</div>
        <h2 className={s.h1}>Start free. Pay as you grow.</h2>
        <p className={s.lede}>
          Every plan ships with the Eventera Card and QR check-in. Upgrade only when your events do.
        </p>

        <BillingToggle billing={billing} onChange={setBilling} />

        <div className={s.grid}>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} billing={billing} />
          ))}
        </div>

        <div className={s.foot}>
          <span className={s.cardChip}>
            <CreditCard size={14} strokeWidth={1.9} /> Eventera Card
          </span>
          <span>is standard on every plan — never an add-on.</span>
          <Link href="/pricing" className={s.footLink}>
            Compare all features <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export { BillingToggle, PlanCard };
