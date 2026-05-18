import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/billing/plans';
import BillingActions from './BillingActions';

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
    .select('plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, cards_this_month, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  const limits = PLANS[plan];
  const cardsUsed = profile?.cards_this_month ?? 0;
  const cardPct = Math.min((cardsUsed / limits.cardsPerMonth) * 100, 100);
  const status = profile?.subscription_status ?? 'none';
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || isTrialing;
  const hasPortal = !!profile?.stripe_customer_id;

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const cycle = profile?.billing_cycle;
  const PLAN_PRICES: Record<string, string> = {
    pro:    cycle === 'annual' ? '$15/mo' : '$19/mo',
    studio: cycle === 'annual' ? '$39/mo' : '$49/mo',
    free: '$0',
  };

  return (
    <div className="min-h-full p-8 lg:p-10" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[640px]">

        {/* Header */}
        <div className="mb-8">
          <div className="font-mono text-[11px] tracking-[0.18em] text-[#1F4D3A] uppercase mb-1">Workspace</div>
          <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">Billing</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Manage your plan, usage, and subscription.</p>
        </div>

        {/* Success banner */}
        {checkout === 'success' && (
          <div className="mb-6 rounded-2xl border border-[#A8D5B5] bg-[#F0FAF4] px-5 py-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#2D7A4F] shrink-0" />
            <p className="text-[14px] text-[#1F4D3A] font-medium">Payment successful — your plan has been updated.</p>
          </div>
        )}

        {/* Current plan card */}
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

                {/* Status pill */}
                <div className="mt-2.5 flex items-center gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#F0FAF4', color: '#1F4D3A', border: '1px solid #A8D5B5' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]" />
                      {isTrialing ? '14-day trial' : 'Active'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#F5F5F4', color: '#6B7A72', border: '1px solid #E5E0D4' }}>
                      Free plan
                    </span>
                  )}
                  {profile?.billing_cycle && profile.billing_cycle !== 'none' && (
                    <span className="text-[12px] text-[#6B7A72] font-mono">
                      {profile.billing_cycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
                    </span>
                  )}
                </div>
              </div>

              {/* Renewal date */}
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
              <span className="text-[#3A4A42]">Cards generated</span>
              <span className="font-mono font-medium text-[#0F1F18]">{cardsUsed} <span className="text-[#6B7A72] font-normal">/ {limits.cardsPerMonth}</span></span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${cardPct}%`,
                  background: cardPct >= 90 ? '#DC2626' : 'linear-gradient(90deg, #1F4D3A, #2D7A4F)',
                }}
              />
            </div>
            {cardPct >= 90 && (
              <p className="mt-2 text-[12px] font-mono" style={{ color: cardPct >= 100 ? '#DC2626' : '#B45309' }}>
                {cardPct >= 100 ? 'Limit reached — upgrade to generate more cards.' : 'Approaching monthly limit.'}
              </p>
            )}
          </div>

          {/* Features */}
          <div className="px-6 py-5">
            <div className="font-mono text-[10px] tracking-[0.18em] text-[#6B7A72] uppercase mb-3">Included in your plan</div>
            <ul className="space-y-2">
              {[
                limits.events === null ? 'Unlimited active events' : `${limits.events} active event`,
                `${limits.cardsPerMonth} cards / month`,
                limits.watermark ? 'Cardly watermark on cards' : 'No Cardly watermark',
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
        </div>

        {/* Actions */}
        <BillingActions plan={plan} hasPortal={hasPortal} isTrialing={isTrialing} />

      </div>
    </div>
  );
}
