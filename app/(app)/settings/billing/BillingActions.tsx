'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/billing/plans';

const UPGRADE_PLANS: { plan: Exclude<Plan, 'free'>; label: string; monthly: number; annual: number; yearlyTotal: number }[] = [
  { plan: 'pro',    label: 'Pro',    monthly: 19, annual: 15, yearlyTotal: 180 },
  { plan: 'studio', label: 'Studio', monthly: 49, annual: 39, yearlyTotal: 468 },
];

export default function BillingActions({ plan, hasPortal }: { plan: Plan; hasPortal: boolean }) {
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
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, billingCycle }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    });
  }

  if (plan !== 'free') {
    return (
      <div className="mt-4">
        {hasPortal && (
          <button
            onClick={openPortal}
            disabled={isPending}
            className="h-9 px-4 rounded-xl border text-[13px] font-medium text-[#0f0f1a] hover:bg-[#fafafa] transition disabled:opacity-60"
            style={{ borderColor: '#e5e5ea' }}
          >
            {isPending ? 'Loading…' : 'Manage billing →'}
          </button>
        )}
        <p className="mt-2 text-[12px] text-[#0f0f1a]/40">
          Change plan, update payment method, or download invoices via the Stripe portal.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-3">UPGRADE</div>
      {UPGRADE_PLANS.map(p => (
        <div key={p.plan} className="rounded-2xl border p-5" style={{ borderColor: '#e5e5ea' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-semibold text-[16px]">{p.label}</div>
              <div className="text-[12px] text-[#0f0f1a]/50 mt-0.5">
                ${p.monthly}/mo · or ${p.annual}/mo billed annually (${p.yearlyTotal}/yr)
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => checkout(p.plan, 'monthly')}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-[13px] font-medium border hover:bg-[#fafafa] transition disabled:opacity-60"
              style={{ borderColor: '#e5e5ea' }}
            >
              Monthly
            </button>
            <button
              onClick={() => checkout(p.plan, 'annual')}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-[13px] font-medium text-white transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
            >
              Annual — save 20%
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
