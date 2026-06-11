import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Billing' };
}

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/billing/plans';
import BillingActions from './BillingActions';
import { BillingPortalButton } from './BillingPortalButton';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

export const dynamic = 'force-dynamic';

type Invoice = {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'free';
  url: string | null;
};

type PaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
} | null;

async function getStripeData(customerId: string): Promise<{ paymentMethod: PaymentMethod; invoices: Invoice[] }> {
  try {
    const { getStripe } = await import('@/lib/billing/stripe');
    const stripe = getStripe();

    const [customer, invoiceList] = await Promise.all([
      stripe.customers.retrieve(customerId, {
        expand: ['invoice_settings.default_payment_method'],
      }),
      stripe.invoices.list({ customer: customerId, limit: 6 }),
    ]);

    let paymentMethod: PaymentMethod = null;
    if (
      !('deleted' in customer) &&
      customer.invoice_settings?.default_payment_method &&
      typeof customer.invoice_settings.default_payment_method !== 'string'
    ) {
      const pm = customer.invoice_settings.default_payment_method;
      if (pm.card) {
        paymentMethod = {
          brand: pm.card.brand ?? 'card',
          last4: pm.card.last4 ?? '••••',
          expMonth: pm.card.exp_month ?? 0,
          expYear: pm.card.exp_year ?? 0,
        };
      }
    }

    const invoices: Invoice[] = invoiceList.data.map(inv => {
      const d = inv.created ? new Date(inv.created * 1000) : new Date();
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      const planNickname = inv.lines.data[0]?.description ?? 'Subscription';
      const amount = inv.amount_paid === 0
        ? '$0.00'
        : `$${(inv.amount_paid / 100).toFixed(2)}`;
      const status: Invoice['status'] =
        inv.amount_paid === 0 ? 'free'
        : inv.status === 'paid' ? 'paid'
        : (inv.status as Invoice['status']) ?? 'open';
      return {
        id: inv.id,
        date: `${month} ${year}`,
        description: planNickname,
        amount,
        status,
        url: inv.hosted_invoice_url ?? null,
      };
    });

    return { paymentMethod, invoices };
  } catch {
    return { paymentMethod: null, invoices: [] };
  }
}

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

  const [profileResult, eventsResult] = await Promise.all([
    admin
      .from('profiles')
      .select('plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, cards_this_month, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const profile = profileResult.data;
  const eventsCount = eventsResult.count ?? 0;

  const plan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  const limits = PLANS[plan];
  const cardsUsed = profile?.cards_this_month ?? 0;
  const cardPct = Math.min((cardsUsed / limits.cardsPerMonth) * 100, 100);
  const eventPct = limits.events === null ? 50 : Math.min((eventsCount / limits.events) * 100, 100);
  const status = profile?.subscription_status ?? 'none';
  const isTrialing = status === 'trialing';
  const isActive = status === 'active' || isTrialing;
  const hasPortal = !!profile?.stripe_customer_id;

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const cycle = profile?.billing_cycle;
  const PLAN_PRICES: Record<string, string> = {
    pro:    cycle === 'annual' ? '$15' : '$19',
    studio: cycle === 'annual' ? '$39' : '$49',
    free: '$0',
  };

  // Stripe data (payment method + invoices) for paid users
  let paymentMethod: PaymentMethod = null;
  let invoices: Invoice[] = [];
  if (profile?.stripe_customer_id && plan !== 'free' && isActive) {
    const stripeData = await getStripeData(profile.stripe_customer_id);
    paymentMethod = stripeData.paymentMethod;
    invoices = stripeData.invoices;
  }

  // Free users (or lapsed subscriptions on free) → show upgrade cards
  if (plan === 'free') {
    return (
      <>
        <SettingsTabs />
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[760px]">
          <div className="mb-8">
            <h1 className="font-display font-semibold text-[24px] text-[#0F1F18] tracking-tight">Billing</h1>
            <p className="text-[14px] text-[#6B7A72] mt-1">Manage your plan and payment method</p>
          </div>
          {checkout === 'success' && (
            <div className="mb-6 rounded-2xl border border-[#A8D5B5] bg-[#F0FAF4] px-5 py-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#2D7A4F] shrink-0" />
              <p className="text-[14px] text-[#1F4D3A] font-medium">Payment successful — your plan has been updated.</p>
            </div>
          )}
          <BillingActions plan={plan} hasPortal={hasPortal} isTrialing={isTrialing} />
        </div>
      </>
    );
  }

  return (
    <>
      <SettingsTabs />
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-[960px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px] text-[#0F1F18] tracking-tight">Billing</h1>
          <p className="text-[14px] text-[#6B7A72] mt-1">Manage your plan and payment method</p>
        </div>
        {plan !== 'studio' && (
          <a
            href="/settings/billing/upgrade"
            className="inline-flex items-center gap-1.5 h-9 px-5 rounded-xl text-[13.5px] font-semibold text-[#0F1F18] transition hover:opacity-90 shrink-0 mt-1"
            style={{ background: '#E8C57E' }}
          >
            + Upgrade to Studio
          </a>
        )}
      </div>

      {checkout === 'success' && (
        <div className="mb-6 rounded-2xl border border-[#A8D5B5] bg-[#F0FAF4] px-5 py-4 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-[#2D7A4F] shrink-0" />
          <p className="text-[14px] text-[#1F4D3A] font-medium">Payment successful — your plan has been updated.</p>
        </div>
      )}

      {/* Two-column: plan card + payment method */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mb-5">

        {/* Plan card — dark green */}
        <div
          className="rounded-2xl p-6 flex flex-col gap-5"
          style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 100%)' }}
        >
          {/* Plan header */}
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-[10px] font-mono tracking-[0.18em] uppercase mb-2"
                style={{ color: 'rgba(250,246,238,0.55)' }}
              >
                CURRENT PLAN
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display font-bold text-[36px] text-[#FAF6EE] leading-none">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
                <span style={{ color: 'rgba(250,246,238,0.65)' }} className="text-[15px]">
                  {PLAN_PRICES[plan]}/month
                </span>
              </div>
            </div>
            {isTrialing && (
              <span
                className="text-[11px] font-mono px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(232,197,126,0.18)', color: '#E8C57E', border: '1px solid rgba(232,197,126,0.3)' }}
              >
                TRIAL
              </span>
            )}
          </div>

          {/* Usage bars */}
          <div className="space-y-4">
            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-mono" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  Events
                </span>
                <span className="text-[12px] font-mono" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  {eventsCount} / {limits.events === null ? '∞' : limits.events}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(250,246,238,0.12)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${eventPct}%`, background: '#E8C57E' }}
                />
              </div>
            </div>

            {/* Registrations (cards this month) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-mono" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  Registrations this month
                </span>
                <span className="text-[12px] font-mono" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  {cardsUsed} / {limits.cardsPerMonth}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(250,246,238,0.12)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cardPct}%`,
                    background: cardPct >= 90 ? '#ef4444' : '#E8C57E',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Renewal */}
          {periodEnd && (
            <div
              className="text-[12px] font-mono"
              style={{ color: 'rgba(250,246,238,0.45)' }}
            >
              {profile?.cancel_at_period_end ? 'Cancels' : isTrialing ? 'Trial ends' : 'Renews'} {periodEnd}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="rounded-2xl bg-white border border-border p-6 shadow-soft flex flex-col gap-4">
          <h3 className="font-semibold text-[14px] text-[#0F1F18]">Payment method</h3>

          {paymentMethod ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <div
                className="h-9 w-12 rounded-lg grid place-items-center shrink-0"
                style={{ background: '#1F4D3A' }}
              >
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <rect width="20" height="14" rx="2" fill="#1F4D3A"/>
                  <rect x="0" y="4" width="20" height="3" fill="rgba(232,197,126,0.4)"/>
                  <rect x="2" y="9" width="6" height="2" rx="0.5" fill="rgba(250,246,238,0.5)"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#0F1F18]">
                  •••• {paymentMethod.last4}
                </div>
                <div className="text-[12px] text-[#6B7A72]">
                  Expires {String(paymentMethod.expMonth).padStart(2, '0')}/{String(paymentMethod.expYear).slice(-2)}
                </div>
              </div>
              {hasPortal && (
                <BillingPortalButton label="Update" />
              )}
            </div>
          ) : (
            <div
              className="flex items-center gap-3 p-3 rounded-xl border border-dashed"
              style={{ borderColor: '#C9C3B1' }}
            >
              <div
                className="h-9 w-12 rounded-lg grid place-items-center shrink-0"
                style={{ background: '#E8EFEB' }}
              >
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                  <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke="#6B7A72"/>
                  <rect x="0" y="3" width="16" height="2.5" fill="#6B7A72" opacity="0.3"/>
                </svg>
              </div>
              <div className="text-[13px] text-[#6B7A72]">No card on file</div>
              {hasPortal && (
                <BillingPortalButton label="Add" />
              )}
            </div>
          )}

          <p className="text-[12px] text-[#6B7A72] leading-relaxed">
            Billed {cycle === 'annual' ? 'annually' : 'monthly'} in USD. African mobile money and bank transfer available on annual plans.
          </p>

          {hasPortal && (
            <BillingPortalButton label="Manage billing →" fullWidth />
          )}
        </div>
      </div>

      {/* Invoices table */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-soft">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-semibold text-[14px] text-[#0F1F18]">Invoices</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-border">
                {['DATE', 'DESCRIPTION', 'AMOUNT', 'STATUS', ''].map(col => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-[10.5px] font-mono tracking-widest text-[#6B7A72]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                  <td className="px-6 py-4 text-[13px] text-[#3A4A42] whitespace-nowrap">
                    {inv.date}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#3A4A42]">
                    {inv.description}
                  </td>
                  <td className="px-6 py-4 text-[13px] font-mono text-[#0F1F18] whitespace-nowrap">
                    {inv.amount}
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'paid' && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: '#F0FAF4', color: '#1F4D3A', border: '1px solid #A8D5B5' }}
                      >
                        Paid
                      </span>
                    )}
                    {inv.status === 'free' && (
                      <span className="text-[12px] text-[#6B7A72]">—</span>
                    )}
                    {inv.status === 'open' && (
                      <span
                        className="inline-flex items-center text-[11.5px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: '#FFF7ED', color: '#C97A2D', border: '1px solid #FBD5A0' }}
                      >
                        Due
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {inv.url && (
                      <a
                        href={inv.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#6B7A72] hover:text-[#0F1F18] transition"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-soft p-8 text-center">
          <div className="text-[13px] text-[#6B7A72]">No invoices yet.</div>
        </div>
      )}
    </div>
    </>
  );
}

