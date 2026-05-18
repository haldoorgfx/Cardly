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
    .select('plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, cards_this_month, cards_month_start, stripe_subscription_id, stripe_customer_id')
    .eq('id', user.id)
    .single();

  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  const limits = PLANS[plan];
  const cardsUsed = profile?.cards_this_month ?? 0;
  const cardPct = Math.min((cardsUsed / limits.cardsPerMonth) * 100, 100);
  const isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing';
  const hasPortal = !!profile?.stripe_customer_id;

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const planLabel: Record<string, string> = { free: 'Free', pro: 'Pro', studio: 'Studio' };
  const statusLabel: Record<string, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    none: '—',
  };

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display font-bold text-[24px] text-[#0f0f1a]">Billing</h1>
      <p className="text-[13px] text-[#0f0f1a]/60 mt-0.5">Manage your plan and subscription.</p>

      {checkout === 'success' && (
        <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-[14px]">
          Payment successful — your plan has been updated.
        </div>
      )}

      {/* Current plan */}
      <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: '#e5e5ea' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/40 mb-1">CURRENT PLAN</div>
            <div className="font-display font-bold text-[28px] text-[#0f0f1a]">{planLabel[plan]}</div>
            {isActive && profile?.subscription_status && (
              <div className="mt-1 inline-flex items-center gap-1.5 text-[12px] font-mono text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {statusLabel[profile.subscription_status]}
                {profile.billing_cycle && profile.billing_cycle !== 'none' && (
                  <span className="text-[#0f0f1a]/40"> · {profile.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}</span>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            {plan !== 'free' && periodEnd && (
              <div className="text-[12px] text-[#0f0f1a]/50">
                {profile?.cancel_at_period_end ? 'Cancels' : 'Renews'} {periodEnd}
              </div>
            )}
          </div>
        </div>

        {/* Card usage */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[12px] text-[#0f0f1a]/60 mb-1.5">
            <span>Cards this month</span>
            <span className="font-mono">{cardsUsed} / {limits.cardsPerMonth}</span>
          </div>
          <div className="h-2 rounded-full bg-[#f0f0f4] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${cardPct}%`,
                background: cardPct >= 90 ? '#ef4444' : 'linear-gradient(90deg,#6c63ff,#f8a4d8)',
              }}
            />
          </div>
          {cardPct >= 90 && (
            <p className="mt-1.5 text-[11px] text-red-600 font-mono">
              {cardPct >= 100 ? 'Limit reached — upgrade to generate more cards.' : 'Approaching limit.'}
            </p>
          )}
        </div>

        {/* Plan features */}
        <ul className="mt-5 space-y-1.5 text-[13px] text-[#0f0f1a]/70">
          <li>· {limits.events === null ? 'Unlimited events' : `${limits.events} active event${limits.events !== 1 ? 's' : ''}`}</li>
          <li>· {limits.cardsPerMonth} cards / month</li>
          <li>· {limits.watermark ? 'Cardly watermark on cards' : 'No watermark'}</li>
        </ul>
      </div>

      {/* Actions */}
      <BillingActions plan={plan} hasPortal={hasPortal} />

      {plan === 'free' && (
        <p className="mt-4 text-[12px] text-[#0f0f1a]/40 text-center">
          14-day free trial on Pro and Studio. Cancel anytime.
        </p>
      )}
    </div>
  );
}
