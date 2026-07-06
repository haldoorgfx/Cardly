import { requirePermission } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { BillingAdminClient } from './BillingAdminClient';
import type { Plan } from '@/types/database';

export const metadata = { title: 'Revenue — Eventera Admin' };
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

  if (searchParams.q?.trim()) {
    query = query.or(`email.ilike.%${searchParams.q.trim()}%,full_name.ilike.%${searchParams.q.trim()}%`);
  }
  if (searchParams.plan) {
    query = query.eq('plan', searchParams.plan as Plan);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data: users, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Ticket-fee take-rate: what Eventera earned and what's owed to organizers.
  // Best-effort — the fee columns exist after migration 040; before that this
  // select returns nothing and the section simply shows no data.
  const byCurrency: Record<string, { gross: number; fees: number; owed: number; count: number }> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: paidRegs } = await (adminClient as any)
    .from('registrations')
    .select('amount_paid, platform_fee, organizer_net, currency')
    .eq('payment_status', 'paid');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (paidRegs ?? []) as any[]) {
    if (!(r.amount_paid > 0)) continue;
    const c = r.currency ?? 'USD';
    byCurrency[c] ??= { gross: 0, fees: 0, owed: 0, count: 0 };
    byCurrency[c].gross += Number(r.amount_paid ?? 0);
    byCurrency[c].fees  += Number(r.platform_fee ?? 0);
    byCurrency[c].owed  += Number(r.organizer_net ?? (Number(r.amount_paid ?? 0) - Number(r.platform_fee ?? 0)));
    byCurrency[c].count += 1;
  }
  const feeCurrencies = Object.entries(byCurrency).sort((a, b) => b[1].gross - a[1].gross);
  const fmtCur = (n: number, c: string) => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: c, minimumFractionDigits: 0 }).format(n); }
    catch { return `${c} ${Math.round(n).toLocaleString()}`; }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Billing
        </div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          Revenue
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          View subscriptions, comp plans (Stripe-bypassing), view invoices, and issue refunds.
          All billing mutations are audited.
        </p>
      </div>

      {/* Ticket-fee take-rate — Eventera's cut + what's owed to organizers */}
      {feeCurrencies.length > 0 && (
        <div className="mb-8">
          <div className="text-[10px] tracking-[0.18em] uppercase text-[#6B7A72] mb-3">Ticket fees · take-rate revenue</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {feeCurrencies.map(([cur, v]) => (
              <div key={cur} className="rounded-2xl bg-white border p-5" style={{ borderColor: '#E5E0D4' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-semibold text-[14px] text-[#0F1F18]">{cur}</span>
                  <span className="text-[11px] text-[#6B7A72]">{v.count} paid ticket{v.count !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[13px]"><span className="text-[#6B7A72]">Gross processed</span><span className="font-medium text-[#0F1F18]">{fmtCur(v.gross, cur)}</span></div>
                  <div className="flex items-center justify-between text-[13px]"><span className="text-[#6B7A72]">Eventera fees earned</span><span className="font-semibold text-[#1F4D3A]">{fmtCur(v.fees, cur)}</span></div>
                  <div className="flex items-center justify-between text-[13px] pt-1.5" style={{ borderTop: '1px solid #F0EDE7' }}><span className="text-[#6B7A72]">Owed to organizers</span><span className="font-medium text-[#0F1F18]">{fmtCur(v.owed, cur)}</span></div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[12px] text-[#6B7A72]">Payouts are settled manually — pay each organizer their net (see each event&apos;s Revenue page for the per-event breakdown).</p>
        </div>
      )}

      <BillingAdminClient
        users={(users ?? []) as BillingUserRow[]}
        total={count ?? 0}
        page={page}
        totalPages={totalPages}
        defaultFilters={{
          q:    searchParams.q    ?? '',
          plan: searchParams.plan ?? '',
        }}
      />
    </div>
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
