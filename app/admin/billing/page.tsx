import { requirePermission } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { PageShell, PageHeader } from '@/components/dash';
import { orIlikeAcross } from '@/lib/search/filter';
import { BillingAdminClient } from './BillingAdminClient';
import { getStripe } from '@/lib/billing/stripe';
import type { Plan } from '@/types/database';

export const metadata = { title: 'Billing — Eventera Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  plan?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function BillingAdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(BILLING_MANAGE);

  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const adminClient = createAdminClient();
  let query = adminClient
    .from('profiles')
    .select(
      'id, email, full_name, plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, cards_this_month, created_at',
      { count: 'exact' }
    );

  // Shared helper quotes the value; the old strip-blacklist silently deleted
  // characters from the admin's query.
  const q = searchParams.q?.trim();
  const qFilter = q ? orIlikeAcross(['email', 'full_name'], q) : null;
  if (qFilter) {
    query = query.or(qFilter);
  }
  if (searchParams.plan) {
    query = query.eq('plan', searchParams.plan as Plan);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Subscription revenue (MRR): the OTHER way Eventera makes money, alongside
  // the ticket take-rate below — organizers pay Pro/Studio to unlock features
  // and buy the take-rate down. Priced from Stripe itself (the STRIPE_PRICE_*
  // env vars this app already uses to recognize a subscription — see
  // lib/billing/plans.ts), never hardcoded here, so this can't drift from
  // whatever's actually configured in Stripe.
  const { data: subProfiles } = await adminClient
    .from('profiles')
    .select('plan, billing_cycle, subscription_status')
    .in('plan', ['pro', 'studio']);

  const subCounts: Record<string, Record<string, number>> = { pro: {}, studio: {} };
  for (const p of (subProfiles ?? []) as { plan: string; billing_cycle: string; subscription_status: string }[]) {
    subCounts[p.plan] ??= {};
    subCounts[p.plan][p.subscription_status] = (subCounts[p.plan][p.subscription_status] ?? 0) + 1;
  }

  let mrr = 0;
  let mrrCurrency = 'USD';
  let stripePricingAvailable = true;
  try {
    const priceIds: Record<string, string | undefined> = {
      pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL,
      studio_monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
      studio_annual: process.env.STRIPE_PRICE_STUDIO_ANNUAL,
    };
    if (Object.values(priceIds).every(id => !id)) throw new Error('No STRIPE_PRICE_* env vars configured');
    const stripe = getStripe();
    const prices = await Promise.all(
      Object.entries(priceIds).map(async ([key, id]) => {
        if (!id) return [key, null] as const;
        const price = await stripe.prices.retrieve(id);
        return [key, price] as const;
      }),
    );
    const priceMap = Object.fromEntries(prices);

    // Monthly-equivalent per plan/cycle — an annual subscriber's yearly price
    // divided by 12, so a $190/year Pro plan counts the same toward MRR as a
    // $19/month one, not 12x more.
    const monthlyEquivalent = (plan: 'pro' | 'studio', cycle: 'monthly' | 'annual'): number => {
      const price = priceMap[`${plan}_${cycle}`];
      if (!price?.unit_amount) return 0;
      if (price.currency) mrrCurrency = price.currency.toUpperCase();
      const amount = price.unit_amount / 100;
      return cycle === 'annual' ? amount / 12 : amount;
    };

    // Only 'active' subscriptions count toward current recurring revenue —
    // 'trialing' hasn't been charged yet, 'past_due' is being charged but
    // hasn't succeeded, and both would overstate money actually collected.
    for (const plan of ['pro', 'studio'] as const) {
      const monthlyActive = (subProfiles ?? []).filter(
        (p) => p.plan === plan && p.subscription_status === 'active' && p.billing_cycle !== 'annual',
      ).length;
      const annualActive = (subProfiles ?? []).filter(
        (p) => p.plan === plan && p.subscription_status === 'active' && p.billing_cycle === 'annual',
      ).length;
      mrr += monthlyActive * monthlyEquivalent(plan, 'monthly') + annualActive * monthlyEquivalent(plan, 'annual');
    }
  } catch {
    stripePricingAvailable = false;
  }

  // Ticket-fee take-rate: what Eventera earned and what's owed to organizers.
  // Sourced from the financial_transactions ledger (migration 124) — the one
  // immutable record every paid ticket, refund, and payout writes to. This
  // replaces the old live SUM() over registrations.payment_status='paid',
  // which permanently overstated "fees earned" for any ticket refunded
  // through either manual UI (they never flipped payment_status, only
  // status) and had no way to track whether an organizer had already been
  // paid out.
  //
  // gross    — total ever collected (platform_fee + organizer_net rows), not
  //            netted against refunds — a life-to-date figure.
  // refunded — total reversed (the absolute value of refund_fee + refund_net).
  // fees     — Eventera's actual take: platform_fee + refund_fee (refund_fee
  //            is stored negative, so this nets down correctly on a refund).
  // owed     — what's currently owed to organizers: organizer_net + refund_net
  //            + payout_issued (payout rows are stored negative — see the
  //            payout-recording route).
  const byCurrency: Record<string, { gross: number; refunded: number; fees: number; owed: number; count: number }> = {};
  let ledgerApplied = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ledgerRows, error: ledgerError } = await (adminClient as any)
    .from('financial_transactions')
    .select('entry_type, amount, currency, registration_id');

  if (ledgerError) {
    // Migration 124 not applied yet — fall back to the old registrations scan
    // so this section still shows something instead of going blank.
    ledgerApplied = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paidRegs } = await (adminClient as any)
      .from('registrations')
      .select('amount_paid, platform_fee, organizer_net, currency')
      .eq('payment_status', 'paid');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of (paidRegs ?? []) as any[]) {
      if (!(r.amount_paid > 0)) continue;
      const c = r.currency ?? 'USD';
      byCurrency[c] ??= { gross: 0, refunded: 0, fees: 0, owed: 0, count: 0 };
      byCurrency[c].gross += Number(r.amount_paid ?? 0);
      byCurrency[c].fees  += Number(r.platform_fee ?? 0);
      byCurrency[c].owed  += Number(r.organizer_net ?? (Number(r.amount_paid ?? 0) - Number(r.platform_fee ?? 0)));
      byCurrency[c].count += 1;
    }
  } else {
    for (const r of (ledgerRows ?? []) as { entry_type: string; amount: number; currency: string; registration_id: string | null }[]) {
      const c = r.currency ?? 'USD';
      byCurrency[c] ??= { gross: 0, refunded: 0, fees: 0, owed: 0, count: 0 };
      const amt = Number(r.amount ?? 0);
      switch (r.entry_type) {
        case 'platform_fee':
          byCurrency[c].fees += amt;
          byCurrency[c].gross += amt;
          break;
        case 'organizer_net':
          byCurrency[c].owed += amt;
          byCurrency[c].gross += amt;
          // One organizer_net row per paid registration (see lib/billing/ledger.ts),
          // so counting rows here is equivalent to counting distinct tickets.
          byCurrency[c].count += 1;
          break;
        case 'refund_fee':
          byCurrency[c].fees += amt; // negative — nets the fee down
          byCurrency[c].refunded += -amt;
          break;
        case 'refund_net':
          byCurrency[c].owed += amt; // negative — nets what's owed down
          byCurrency[c].refunded += -amt;
          break;
        case 'payout_issued':
          byCurrency[c].owed += amt; // negative — reduces what's still owed
          break;
      }
    }
  }
  const feeCurrencies = Object.entries(byCurrency).sort((a, b) => b[1].gross - a[1].gross);
  const fmtCur = (n: number, c: string) => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n); }
    catch { return `${c} ${Math.round(n).toLocaleString()}`; }
  };

  return (
    <PageShell width="screen">
      <PageHeader
        eyebrow="Admin · Billing"
        title="Billing"
        subtitle="View subscriptions, comp plans (Stripe-bypassing), view invoices, and issue refunds. All billing mutations are audited."
      />

      {/* Subscription revenue — the other half of the money model: Pro/Studio
          subscriptions, alongside the ticket take-rate below. */}
      <div className="mb-8">
        <div className="text-[12px] tracking-[0.18em] uppercase text-[#65736B] mb-3">Subscription revenue · recurring</div>
        {stripePricingAvailable ? (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div className="rounded-2xl bg-white border p-5" style={{ borderColor: '#E5E0D4' }}>
                <div className="text-[12.5px] text-[#65736B] mb-1">Active MRR</div>
                <div className="font-display font-semibold text-[24px] text-[#0F1F18]">{fmtCur(mrr, mrrCurrency)}</div>
                <div className="text-[12px] text-[#65736B] mt-1">from active Pro/Studio subscriptions only</div>
              </div>
              <div className="rounded-2xl bg-white border p-5" style={{ borderColor: '#E5E0D4' }}>
                <div className="text-[12.5px] text-[#65736B] mb-1">Projected ARR</div>
                <div className="font-display font-semibold text-[24px] text-[#0F1F18]">{fmtCur(mrr * 12, mrrCurrency)}</div>
                <div className="text-[12px] text-[#65736B] mt-1">MRR × 12, not a guarantee</div>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['pro', 'studio'] as const).map((plan) => (
                <div key={plan} className="rounded-xl border p-4" style={{ borderColor: '#E5E0D4' }}>
                  <div className="font-display font-semibold text-[13.5px] uppercase tracking-[0.08em] text-[#1F4D3A] mb-2">{plan}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#65736B]">
                    <span>{subCounts[plan]?.active ?? 0} active</span>
                    <span>{subCounts[plan]?.trialing ?? 0} trialing</span>
                    <span style={subCounts[plan]?.past_due ? { color: '#C97A2D' } : undefined}>{subCounts[plan]?.past_due ?? 0} past due</span>
                    <span>{subCounts[plan]?.canceled ?? 0} canceled</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#65736B]">
            Stripe subscription pricing isn&apos;t configured in this environment (STRIPE_PRICE_* / STRIPE_SECRET_KEY), so MRR can&apos;t be computed here — this only affects this dashboard card, not real billing.
          </p>
        )}
      </div>

      {/* Ticket-fee take-rate — Eventera's cut + what's owed to organizers */}
      {feeCurrencies.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[12px] tracking-[0.18em] uppercase text-[#65736B]">Ticket fees · take-rate revenue</div>
            <a
              href="/api/admin/finance/export"
              className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-[#E5E0D4] text-[#1F4D3A] hover:bg-[#E8EFEB] transition-colors"
            >
              Export ledger CSV
            </a>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feeCurrencies.map(([cur, v]) => (
              <div key={cur} className="rounded-2xl bg-white border p-5" style={{ borderColor: '#E5E0D4' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-semibold text-[14px] text-[#0F1F18]">{cur}</span>
                  <span className="text-[12.5px] text-[#65736B]">{v.count} paid ticket{v.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]"><span className="text-[#65736B]">Gross collected (life-to-date)</span><span className="font-medium text-[#0F1F18]">{fmtCur(v.gross, cur)}</span></div>
                  {v.refunded > 0 && (
                    <div className="flex items-center justify-between text-[13px]"><span className="text-[#65736B]">Refunded</span><span className="font-medium" style={{ color: '#B8423C' }}>−{fmtCur(v.refunded, cur)}</span></div>
                  )}
                  <div className="flex items-center justify-between text-[13px]"><span className="text-[#65736B]">Eventera fees earned (net of refunds)</span><span className="font-semibold text-[#0F1F18]">{fmtCur(v.fees, cur)}</span></div>
                  <div className="flex items-center justify-between text-[13px] pt-1.5" style={{ borderTop: '1px solid #E5E0D4' }}><span className="text-[#65736B]">Owed to organizers right now</span><span className="font-medium text-[#0F1F18]">{fmtCur(v.owed, cur)}</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-[#65736B]">
            Payouts are settled manually — pay each organizer &quot;Owed to organizers right now&quot;, then record it below so this figure nets down (see each event&apos;s Revenue page for the per-event breakdown).
            {!ledgerApplied && ' Showing legacy figures — migration 124 (financial_transactions ledger) has not been applied yet, so refunds are not yet reflected here.'}
          </p>
        </div>
      )}

      <BillingAdminClient
        key={`${searchParams.q ?? ''}|${searchParams.plan ?? ''}|${page}`}
        users={(users ?? []) as BillingUserRow[]}
        total={count ?? 0}
        page={page}
        totalPages={totalPages}
        defaultFilters={{
          q:    searchParams.q    ?? '',
          plan: searchParams.plan ?? '',
        }}
      />
    </PageShell>
  );
}

export interface BillingUserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  subscription_status: string;
  billing_cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cards_this_month: number;
  created_at: string;
}
