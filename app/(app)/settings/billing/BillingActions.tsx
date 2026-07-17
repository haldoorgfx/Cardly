'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/billing/plans';

type Cycle = 'monthly' | 'annual';

type UpgradePlan = {
  plan: Exclude<Plan, 'free'>;
  label: string;
  tagline: string;
  monthly: number;
  annual: number;
  annualTotal: number;
  recommended: boolean;
  /** When set, the feature list is shown under this heading (e.g. "Everything in Pro, plus"). */
  inherits: string | null;
  features: string[];
};

// Pro and Studio are framed to be *distinct*, not two near-identical lists:
// Pro shows its own inclusions; Studio is shown as an additive step up
// ("Everything in Pro, plus …") with the premium differentiators that
// actually justify the jump — so an organizer can tell in one glance which
// one is for them instead of comparing two lookalike green checklists.
const UPGRADE_PLANS: UpgradePlan[] = [
  {
    plan: 'pro',
    label: 'Pro',
    tagline: 'For solo organizers and designers running events regularly.',
    monthly: 19,
    annual: 15,
    annualTotal: 180,
    recommended: true,
    inherits: null,
    features: [
      'Unlimited events',
      '500 registrations / month',
      'No Eventera watermark',
      '5 card designs per event',
    ],
  },
  {
    plan: 'studio',
    label: 'Studio',
    tagline: 'For agencies and teams running events for many clients.',
    monthly: 49,
    annual: 39,
    annualTotal: 468,
    recommended: false,
    inherits: 'Everything in Pro, plus',
    features: [
      '5,000 registrations / month',
      'Unlimited card designs',
      'ERA AI assistant',
      'API access',
      'White-label branding',
    ],
  },
];

function Check({ strong }: { strong?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={strong ? '#1F4D3A' : '#2D7A4F'}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-[1px]"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function BillingActions() {
  const [isPending, startTransition] = useTransition();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const [cycle, setCycle] = useState<Cycle>('annual');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function checkout(targetPlan: Exclude<Plan, 'free'>) {
    setError(null);
    setPendingPlan(targetPlan);
    startTransition(async () => {
      try {
        const res = await fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: targetPlan, billingCycle: cycle }),
        });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError(
          data.error === 'Price not configured'
            ? 'Checkout isn’t available yet — billing is still being set up. Please try again shortly.'
            : (data.error ?? 'We couldn’t start checkout. Please try again.'),
        );
        setPendingPlan(null);
      } catch {
        setError('We couldn’t reach the payment page. Check your connection and try again.');
        setPendingPlan(null);
      }
    });
  }

  return (
    <div className="mt-6">
      {/* Where you are + what to do */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E0D4] bg-white px-3 py-1 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#65736B]" />
            <span className="text-[12px] font-medium text-[#65736B]">You’re on the Free plan</span>
          </div>
          <h2 className="font-display font-bold text-[19px] text-[#0F1F18] tracking-tight">
            Pick a plan to grow past the free limits
          </h2>
          <p className="text-[13.5px] text-[#65736B] mt-1 max-w-[440px]">
            Free covers 1 event and 50 registrations with a watermark. Upgrade for unlimited
            events, more registrations, and a clean, branded card.
          </p>
        </div>

        {/* Billing-cycle toggle — one control instead of two buttons per card */}
        <div
          className="inline-flex items-center rounded-full border border-[#E5E0D4] bg-white p-1 self-start"
          role="group"
          aria-label="Billing cycle"
        >
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            aria-pressed={cycle === 'monthly'}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors"
            style={
              cycle === 'monthly'
                ? { background: '#1F4D3A', color: '#FAF6EE' }
                : { color: '#65736B' }
            }
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            aria-pressed={cycle === 'annual'}
            className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors flex items-center gap-1.5"
            style={
              cycle === 'annual'
                ? { background: '#1F4D3A', color: '#FAF6EE' }
                : { color: '#65736B' }
            }
          >
            Yearly
            <span
              className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full leading-none"
              style={
                cycle === 'annual'
                  ? { background: '#E8C57E', color: '#0F1F18' }
                  : { background: '#E8EFEB', color: '#1F4D3A' }
              }
            >
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-[13px] mb-5 flex items-start gap-2.5"
          style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.22)', color: '#B8423C' }}
          role="alert"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-[1px]" aria-hidden>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Plan cards — side by side, clearly differentiated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        {UPGRADE_PLANS.map(p => {
          const price = cycle === 'annual' ? p.annual : p.monthly;
          const loading = isPending && pendingPlan === p.plan;
          const disabled = isPending;

          return (
            <div
              key={p.plan}
              className="relative rounded-2xl bg-white flex flex-col"
              style={
                p.recommended
                  ? { border: '1.5px solid #1F4D3A', boxShadow: '0 12px 30px -18px rgba(31,77,58,0.45)' }
                  : { border: '1px solid #E5E0D4' }
              }
            >
              {p.recommended && (
                <div
                  className="absolute -top-3 left-6 text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                >
                  MOST POPULAR
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Name + who it's for */}
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display font-bold text-[20px] text-[#0F1F18]">{p.label}</h3>
                  {p.recommended && (
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                    >
                      Best for most
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[#65736B] mt-1 min-h-[38px]">{p.tagline}</p>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-[34px] text-[#0F1F18] leading-none">${price}</span>
                  <span className="text-[14px] text-[#65736B]">/mo</span>
                </div>
                <div className="text-[12.5px] text-[#65736B] mt-1.5 h-[18px]">
                  {cycle === 'annual'
                    ? `Billed yearly — $${p.annualTotal}/yr`
                    : `Billed monthly · or $${p.annual}/mo yearly`}
                </div>

                {/* Divider */}
                <div className="my-5 h-px" style={{ background: '#EFEBE0' }} />

                {/* Features */}
                {p.inherits && (
                  <div className="text-[12px] font-semibold text-[#3A4A42] mb-2.5">{p.inherits}</div>
                )}
                <ul className="space-y-2.5 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-[#3A4A42]">
                      <Check strong={p.recommended} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Single, clear CTA */}
                <button
                  onClick={() => checkout(p.plan)}
                  disabled={disabled}
                  className="mt-6 w-full py-3 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={
                    p.recommended
                      ? { background: '#1F4D3A', color: '#FAF6EE' }
                      : { background: '#fff', color: '#1F4D3A', border: '1.5px solid #1F4D3A' }
                  }
                  onMouseEnter={e => {
                    if (disabled) return;
                    e.currentTarget.style.background = p.recommended ? '#163828' : '#F3F7F4';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = p.recommended ? '#1F4D3A' : '#fff';
                  }}
                >
                  {loading ? (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Starting…
                    </>
                  ) : (
                    `Start 14-day free trial`
                  )}
                </button>
                <div className="text-center text-[12px] text-[#65736B] mt-2.5">
                  Then ${price}/mo, {cycle === 'annual' ? 'billed yearly' : 'billed monthly'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reassurance — the three things that lower the barrier to starting */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { t: '14 days free', s: 'Full access, no charge today', icon: 'clock' },
          { t: 'No card required', s: 'Add payment later, or not at all', icon: 'card' },
          { t: 'Cancel anytime', s: 'One click, before the trial ends', icon: 'x' },
        ].map(item => (
          <div
            key={item.t}
            className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E0D4] px-4 py-3"
          >
            <div className="h-8 w-8 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {item.icon === 'clock' && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
                {item.icon === 'card' && <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>}
                {item.icon === 'x' && <><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></>}
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#0F1F18]">{item.t}</div>
              <div className="text-[12px] text-[#65736B]">{item.s}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-[12px] text-[#65736B] mt-5">
        Prices in USD. African mobile money and bank transfer available on annual plans.
      </p>
    </div>
  );
}
