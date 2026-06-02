import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/billing/plans';
import { Download } from 'lucide-react';
import BillingActions from './BillingActions';
import BillingInvoices from './BillingInvoices';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, cards_this_month, stripe_customer_id, email')
    .eq('id', user.id)
    .single();

  const plan        = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  const limits      = PLANS[plan];
  const cardsUsed   = profile?.cards_this_month ?? 0;
  const cardPct     = Math.min((cardsUsed / limits.cardsPerMonth) * 100, 100);
  const status      = profile?.subscription_status ?? 'none';
  const isTrialing  = status === 'trialing';
  const isActive    = status === 'active' || isTrialing;
  const hasPortal   = !!profile?.stripe_customer_id;

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const cycle = profile?.billing_cycle;
  const PLAN_PRICES: Record<string, string> = {
    pro:    cycle === 'annual' ? '$15/mo' : '$19/mo',
    studio: cycle === 'annual' ? '$39/mo' : '$49/mo',
    free:   '$0',
  };

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b px-6 pt-7 pb-6" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        <div className="max-w-[760px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">Billing</h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>Manage your plan and payment method</p>
          </div>
          {plan !== 'studio' && (
            <a href="/pricing"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold transition"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              + Upgrade to Studio
            </a>
          )}
        </div>
      </div>

      <div className="max-w-[760px] mx-auto px-6 py-8 space-y-6">

        {/* Success banner */}
        {checkout === 'success' && (
          <div className="rounded-2xl border border-[#A8D5B5] bg-[#F0FAF4] px-5 py-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#2D7A4F] shrink-0" />
            <p className="text-[14px] text-[#1F4D3A] font-medium">Payment successful — your plan has been updated.</p>
          </div>
        )}

        {/* Current plan + payment method */}
        <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>

          {/* Plan header */}
          <div className="p-6 border-b" style={{ borderColor: '#E5E0D4' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase mb-2">Current plan</div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-[32px] text-[#0F1F18] leading-none tracking-tight">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </span>
                  {plan !== 'free' && (
                    <span className="text-[13px] text-[#6B7A72]">{PLAN_PRICES[plan]}</span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#F0FAF4', color: '#1F4D3A', border: '1px solid #A8D5B5' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]" />
                      {isTrialing ? '14-day trial' : 'Active'}
                    </span>
                  ) : plan === 'free' ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#F5F5F4', color: '#6B7A72', border: '1px solid #E5E0D4' }}>
                      Free plan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#FFF7ED', color: '#C97A2D', border: '1px solid #FBD5A0' }}>
                      Subscription inactive
                    </span>
                  )}
                  {profile?.billing_cycle && profile.billing_cycle !== 'none' && (
                    <span className="text-[12px] text-[#6B7A72] font-mono">
                      {profile.billing_cycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
                    </span>
                  )}
                </div>
              </div>
              {plan !== 'free' && periodEnd && (
                <div className="text-right shrink-0">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-[#6B7A72] uppercase mb-1">
                    {isTrialing ? 'Trial ends' : profile?.cancel_at_period_end ? 'Cancels' : 'Renews'}
                  </div>
                  <div className="text-[13px] font-medium text-[#0F1F18]">{periodEnd}</div>
                </div>
              )}
            </div>
          </div>

          {/* Usage */}
          <div className="p-6 border-b" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase mb-4">Usage this month</div>
            <div className="flex items-center justify-between text-[13px] mb-2">
              <span className="text-[#3A4A42]">Registrations this month</span>
              <span className="font-mono font-medium text-[#0F1F18]">
                {cardsUsed} <span className="text-[#6B7A72] font-normal">/ {limits.cardsPerMonth}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${cardPct}%`, background: cardPct >= 90 ? '#DC2626' : 'linear-gradient(90deg,#1F4D3A,#2D7A4F)' }} />
            </div>
            {cardPct >= 90 && (
              <p className="mt-2 text-[12px] font-mono" style={{ color: cardPct >= 100 ? '#DC2626' : '#B45309' }}>
                {cardPct >= 100 ? 'Limit reached — upgrade to generate more.' : 'Approaching monthly limit.'}
              </p>
            )}
          </div>

          {/* Features list */}
          <div className="px-6 py-5 border-b" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase mb-3">Included in your plan</div>
            <ul className="space-y-2">
              {[
                limits.events === null ? 'Unlimited active events' : `${limits.events} active event`,
                `${limits.cardsPerMonth} cards / month`,
                limits.watermark ? 'Karta watermark on cards' : 'No Karta watermark',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-[#3A4A42]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Payment method */}
          {hasPortal && (
            <div className="px-6 py-5">
              <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase mb-3">Payment method</div>
              <BillingActions plan={plan} hasPortal={hasPortal} isTrialing={isTrialing} compact />
            </div>
          )}
        </div>

        {/* Actions (upgrade/manage) */}
        {!hasPortal && (
          <BillingActions plan={plan} hasPortal={hasPortal} isTrialing={isTrialing} />
        )}

        {/* Invoices */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase">Invoices</div>
            {hasPortal && (
              <a href="/api/billing/portal" className="text-[12px] font-medium hover:underline" style={{ color: '#1F4D3A' }}>
                <Download size={12} strokeWidth={2} className="inline mr-1" />
                Download all
              </a>
            )}
          </div>
          <BillingInvoices hasPortal={hasPortal} plan={plan} />
        </div>

      </div>
    </div>
  );
}
