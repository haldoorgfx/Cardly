import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Billing' };
}

import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { PLANS } from '@/lib/billing/plans';
import { getUserPlan } from '@/lib/billing/can';
import { fromStripeMinorUnits } from '@/lib/payments/currency';
import BillingActions from './BillingActions';
import { BillingPortalButton } from './BillingPortalButton';
import { UpgradeStudioButton } from './UpgradeStudioButton';

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
      const month = d.toLocaleString(undefined, { month: 'short' });
      const year = d.getFullYear();
      const planNickname = inv.lines.data[0]?.description ?? 'Subscription';
      // Invoice amounts are in Stripe minor units, which are NOT always 1/100 —
      // DJF/RWF/UGX/XOF etc. are zero-decimal, so a flat /100 under-reported the
      // invoice by 100x. Format from the invoice's own currency, not a hardcoded $.
      const major = fromStripeMinorUnits(inv.amount_paid, inv.currency);
      const amount = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: (inv.currency ?? 'usd').toUpperCase(),
      }).format(major);
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

  const [profileResult, eventsResult, effectivePlan] = await Promise.all([
    admin
      .from('profiles')
      .select('plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, cards_this_month, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    admin
      .from('events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // getUserPlan() is the canonical resolver — it applies the cancelled/
    // past_due/incomplete downgrade AND the webhook-loss backstop (a Stripe
    // subscription whose period ended >7d ago). Reading profiles.plan raw made
    // this page disagree with what the rest of the product actually enforces:
    // a user whose renewal webhook never landed saw "Pro — renews <past date>"
    // here while every gate treated them as Free, with nothing explaining why.
    getUserPlan(user.id),
  ]);

  const profile = profileResult.data;
  const eventsCount = eventsResult.count ?? 0;

  const plan = effectivePlan;
  const storedPlan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'studio';
  // Stored tier says paid, the resolver says free → the backstop tripped.
  const lapsedSilently = storedPlan !== 'free' && plan === 'free';
  const limits = PLANS[plan];
  const cardsUsed = profile?.cards_this_month ?? 0;
  // Guard against division by zero and NaN
  const cardPct = limits.cardsPerMonth > 0
    ? Math.min((cardsUsed / limits.cardsPerMonth) * 100, 100)
    : 0;
  // For unlimited plans (events === null) hide the bar entirely by passing null
  const eventPct = limits.events === null ? null : Math.min((eventsCount / limits.events) * 100, 100);
  const status = profile?.subscription_status ?? 'none';
  const isTrialing = status === 'trialing';
  const hasPortal = !!profile?.stripe_customer_id;

  // When Stripe isn't wired up (no secret key), the plan/checkout/portal actions
  // can't work — say so intentionally instead of letting the buttons look broken.
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY;
  const stripeBanner = !stripeConfigured ? (
    <div
      className="mb-6 rounded-2xl border px-5 py-4 flex items-start gap-3"
      style={{ borderColor: 'rgba(31,77,58,0.18)', background: 'rgba(31,77,58,0.05)' }}
      role="status"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden>
        <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
      </svg>
      <div>
        <p className="text-[14px] font-semibold text-[#1F4D3A]">Billing isn’t switched on yet</p>
        <p className="text-[13px] text-[#3A4A42] mt-0.5 leading-relaxed">
          Payment features are still being set up for this workspace. Plan changes, cards and invoices
          will be available here once billing is connected.
        </p>
      </div>
    </div>
  ) : null;

  const periodEnd = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const cycle = profile?.billing_cycle;
  const PLAN_PRICES: Record<string, string> = {
    pro:    cycle === 'annual' ? '$15' : '$19',
    studio: cycle === 'annual' ? '$39' : '$49',
    free: '$0',
  };

  // Stripe data (payment method + invoices) for anyone who has ever had a
  // Stripe customer. Previously gated on `plan !== 'free' && isActive`, which
  // meant the two people who most need this screen could not use it:
  //   • past_due — card declined, wanted to see and replace the failing card,
  //     and instead got a page with no card shown at all;
  //   • cancelled/lapsed — dropped to the upgrade-cards view with no route to
  //     their own paid invoices (receipts they need for tax/expenses).
  let paymentMethod: PaymentMethod = null;
  let invoices: Invoice[] = [];
  if (profile?.stripe_customer_id) {
    const stripeData = await getStripeData(profile.stripe_customer_id);
    paymentMethod = stripeData.paymentMethod;
    invoices = stripeData.invoices;
  }

  // Dunning. `past_due` means Stripe's retries are failing and the
  // subscription is heading for cancellation; `incomplete` means the very
  // first payment never cleared. Neither produced a single word on this page
  // before, so a subscriber's only signal that they were about to lose their
  // plan was the features quietly disappearing.
  const paymentProblem =
    status === 'past_due' ? 'past_due' :
    status === 'incomplete' ? 'incomplete' :
    null;

  const alertBanner = (paymentProblem || lapsedSilently) ? (
    <div
      className="mb-6 rounded-2xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
      style={{ borderColor: 'rgba(184,66,60,0.25)', background: 'rgba(184,66,60,0.06)' }}
      role="alert"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8423C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 sm:mt-0 mt-0.5" aria-hidden>
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: '#B8423C' }}>
          {paymentProblem === 'incomplete'
            ? 'Your first payment didn’t go through'
            : paymentProblem === 'past_due'
            ? 'We couldn’t take your last payment'
            : 'Your subscription has lapsed'}
        </p>
        <p className="text-[13px] text-[#3A4A42] mt-0.5 leading-relaxed">
          {paymentProblem === 'incomplete'
            ? 'Your subscription hasn’t started, so your workspace is on the Free plan. Add a working card to activate it.'
            : paymentProblem === 'past_due'
            ? 'Stripe will keep retrying for a few days. Update your card to avoid losing your paid features.'
            : 'We haven’t seen a renewal for this subscription, so your workspace is on the Free plan for now. Open billing to check its status or restart it.'}
        </p>
      </div>
      {hasPortal && <div className="shrink-0"><BillingPortalButton label="Update payment method" /></div>}
    </div>
  ) : null;

  // One invoices table, rendered on both the paid and the free/lapsed view.
  const invoicesSection = invoices.length > 0 ? (
    <div className="bg-white rounded-2xl border border-border shadow-soft">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-[14px] text-[#0F1F18]">Invoices</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: 360 }}>
          <thead>
            <tr className="border-b border-border">
              {['DATE', 'DESCRIPTION', 'AMOUNT', 'STATUS', ''].map(col => (
                <th key={col} className="px-6 py-3 text-left text-[12px] tracking-widest text-[#65736B]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-cream/40 transition-colors">
                <td className="px-6 py-4 text-[13px] text-[#3A4A42] whitespace-nowrap">{inv.date}</td>
                <td className="px-6 py-4 text-[13px] text-[#3A4A42]">{inv.description}</td>
                <td className="px-6 py-4 text-[13px] text-[#0F1F18] whitespace-nowrap">{inv.amount}</td>
                <td className="px-6 py-4">
                  {inv.status === 'paid' && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: '#F0FAF4', color: '#1F4D3A', border: '1px solid #A8D5B5' }}
                    >
                      Paid
                    </span>
                  )}
                  {inv.status === 'free' && <span className="text-[12px] text-[#65736B]">—</span>}
                  {inv.status === 'open' && (
                    <span
                      className="inline-flex items-center text-[13px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(201,122,45,0.10)', color: '#C97A2D', border: '1px solid rgba(201,122,45,0.30)' }}
                    >
                      Due
                    </span>
                  )}
                  {inv.status === 'void' && <span className="text-[12px] text-[#65736B]">Void</span>}
                  {inv.status === 'uncollectible' && (
                    <span
                      className="inline-flex items-center text-[13px] font-medium px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(184,66,60,0.10)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.30)' }}
                    >
                      Uncollectible
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {inv.url && (
                    <a
                      href={inv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open the ${inv.date} invoice on Stripe`}
                      className="inline-flex text-[#65736B] hover:text-[#0F1F18] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
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
  ) : (
    <div className="bg-white rounded-2xl border border-border shadow-soft p-8 text-center">
      <div className="text-[13px] text-[#65736B]">No invoices yet.</div>
    </div>
  );

  // Free users (or lapsed subscriptions on free) → show upgrade cards
  if (plan === 'free') {
    return (
      <>
          <div className="max-w-[760px] mx-auto">
          <div className="mb-8">
            <h1 className="font-display font-semibold text-[24px] text-[#0F1F18] tracking-tight">Billing</h1>
            <p className="text-[14px] text-[#65736B] mt-1">Manage your plan and payment method</p>
          </div>
          {stripeBanner}
          {alertBanner}
          {checkout === 'success' && (
            <div className="mb-6 rounded-2xl border border-[#A8D5B5] bg-[#F0FAF4] px-5 py-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#2D7A4F] shrink-0" />
              <p className="text-[14px] text-[#1F4D3A] font-medium">Payment successful — your plan has been updated.</p>
            </div>
          )}
          {/* create-checkout's cancel_url uses the American 'canceled'; this
              branch only tested for 'cancelled' and so never rendered. */}
          {(checkout === 'cancelled' || checkout === 'canceled') && (
            <div className="mb-6 rounded-2xl border border-[#E5E0D4] bg-[#FAF6EE] px-5 py-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-[#65736B] shrink-0" />
              <p className="text-[14px] text-[#3A4A42]">Checkout cancelled — no charge was made.</p>
            </div>
          )}
          <BillingActions />

          {/* A previously-subscribed user keeps access to their receipts and to
              the Stripe portal after cancelling — both were unreachable before. */}
          {hasPortal && (
            <div className="mt-10">
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div>
                  <h2 className="font-display font-semibold text-[16px] text-[#0F1F18] tracking-tight">
                    Billing history
                  </h2>
                  <p className="text-[13px] text-[#65736B] mt-0.5">
                    Invoices and receipts from your previous subscription.
                  </p>
                </div>
                <BillingPortalButton label="Manage billing →" />
              </div>
              {invoicesSection}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
            <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px] text-[#0F1F18] tracking-tight">Billing</h1>
          <p className="text-[14px] text-[#65736B] mt-1">Manage your plan and payment method</p>
        </div>
        {plan !== 'studio' && <UpgradeStudioButton />}
      </div>

      {stripeBanner}
      {alertBanner}
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
          style={{ background: '#163828' }}
        >
          {/* Plan header */}
          <div className="flex items-start justify-between">
            <div>
              <div
                className="text-[12px] tracking-[0.18em] uppercase mb-2"
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
                className="text-[12.5px] px-2.5 py-1 rounded-full"
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
                <span className="text-[12px]" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  Events
                </span>
                <span className="text-[12px]" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  {eventsCount} / {limits.events === null ? 'Unlimited' : limits.events}
                </span>
              </div>
              {/* No progress bar on unlimited plans — a bar toward ∞ is meaningless. */}
              {eventPct !== null && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(250,246,238,0.12)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${eventPct}%`, background: '#E8C57E' }}
                  />
                </div>
              )}
            </div>

            {/* Registrations (cards this month) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px]" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  Registrations this month
                </span>
                <span className="text-[12px]" style={{ color: 'rgba(250,246,238,0.65)' }}>
                  {cardsUsed} / {limits.cardsPerMonth}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(250,246,238,0.12)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cardPct}%`,
                    // Brand danger token, not a raw Tailwind red.
                    background: cardPct >= 90 ? '#B8423C' : '#E8C57E',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Renewal */}
          {periodEnd && (
            <div
              className="text-[12px]"
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
                style={{ background: '#0F1F18' }}
              >
                <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                  <rect width="20" height="14" rx="2" fill="#0F1F18"/>
                  <rect x="0" y="4" width="20" height="3" fill="rgba(232,197,126,0.4)"/>
                  <rect x="2" y="9" width="6" height="2" rx="0.5" fill="rgba(250,246,238,0.5)"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#0F1F18]">
                  •••• {paymentMethod.last4}
                </div>
                <div className="text-[12px] text-[#65736B]">
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
                  <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke="#65736B"/>
                  <rect x="0" y="3" width="16" height="2.5" fill="#65736B" opacity="0.3"/>
                </svg>
              </div>
              <div className="text-[13px] text-[#65736B]">No card on file</div>
              {hasPortal && (
                <BillingPortalButton label="Add" />
              )}
            </div>
          )}

          <p className="text-[12px] text-[#65736B] leading-relaxed">
            Billed {cycle === 'annual' ? 'annually' : 'monthly'} in USD. African mobile money and bank transfer available on annual plans.
          </p>

          {hasPortal && (
            <BillingPortalButton label="Manage billing →" fullWidth />
          )}
        </div>
      </div>

      {/* Invoices table - shared with the free/lapsed view */}
      {invoicesSection}

    </div>
    </>
  );
}

