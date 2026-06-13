'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/billing/plans';

const UPGRADE_PLANS: {
  plan: Exclude<Plan, 'free'>;
  label: string;
  blurb: string;
  monthly: number;
  annual: number;
  yearlyTotal: number;
  features: string[];
}[] = [
  {
    plan: 'pro',
    label: 'Pro',
    blurb: 'For designers and organizers running regular events.',
    monthly: 19,
    annual: 15,
    yearlyTotal: 180,
    features: ['Unlimited events', '500 cards / month', 'No watermark', '5 card variants'],
  },
  {
    plan: 'studio',
    label: 'Studio',
    blurb: 'For agencies running events for many clients.',
    monthly: 49,
    annual: 39,
    yearlyTotal: 468,
    features: ['Unlimited events', '5,000 cards / month', 'No watermark', 'Unlimited variants'],
  },
];

export default function BillingActions({
  plan,
  hasPortal,
  isTrialing,
}: {
  plan: Plan;
  hasPortal: boolean;
  isTrialing: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function openPortal() {
    startTransition(async () => {
      const res = await fetch('/api/billing/create-portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    });
  }

  function checkout(targetPlan: Exclude<Plan, 'free'>, billingCycle: 'monthly' | 'annual') {
    startTransition(async () => {
      try {
        const res = await fetch('/api/billing/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: targetPlan, billingCycle }),
        });
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      } catch {
        // silently fail
      }
    });
  }

  if (plan !== 'free') {
    return (
      <div className="mt-4">
        {hasPortal && (
          <button
            onClick={openPortal}
            disabled={isPending}
            className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-medium transition-colors disabled:opacity-50"
            style={{ background: '#fff', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          >
            {isPending ? 'Loading…' : 'Manage billing →'}
          </button>
        )}
        {isTrialing && (
          <p className="mt-3 text-[12px] text-[#6B7A72]">
            Your trial ends soon. Add a payment method to keep access.
          </p>
        )}
        <p className="mt-2 text-[12px] text-[#6B7A72]">
          Change plan, update payment method, or download invoices via the Stripe portal.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">

      {/* Trial callout */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)', color: '#FAF6EE' }}>
        <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
          style={{ background: 'rgba(250,246,238,0.15)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8C57E" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-[15px] text-[#FAF6EE]">14 days free on Pro or Studio</div>
          <div className="text-[13px] mt-0.5" style={{ color: 'rgba(250,246,238,0.75)' }}>
            No payment needed today. Cancel anytime before the trial ends.
          </div>
        </div>
      </div>

      {/* Plan cards */}
      {UPGRADE_PLANS.map(p => (
        <div key={p.plan} className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
          <div className="p-5 border-b" style={{ borderColor: '#E5E0D4' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-bold text-[18px] text-[#0F1F18]">{p.label}</div>
                <div className="text-[13px] text-[#6B7A72] mt-0.5">{p.blurb}</div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="font-display font-bold text-[22px] text-[#0F1F18] leading-none">${p.monthly}<span className="text-[13px] font-normal text-[#6B7A72]">/mo</span></div>
                <div className=" text-[11px] text-[#6B7A72] mt-0.5">or ${p.annual}/mo billed yearly</div>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-y-1.5 gap-x-3">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-1.5 text-[12px] text-[#3A4A42]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4 flex gap-3" style={{ background: '#FAFAF8' }}>
            <button
              onClick={() => checkout(p.plan, 'monthly')}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border transition-colors disabled:opacity-50 hover:bg-white"
              style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#fff' }}
            >
              Try free — monthly
            </button>
            <button
              onClick={() => checkout(p.plan, 'annual')}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-opacity disabled:opacity-50 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #1F4D3A, #2D7A4F)', color: '#FAF6EE' }}
            >
              Try free — save 20%
            </button>
          </div>
        </div>
      ))}

      <p className="text-center text-[12px] text-[#6B7A72]">
        No credit card required to start the trial. Cancel anytime.
      </p>
    </div>
  );
}
