import { requirePermission } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { BillingAdminClient } from './BillingAdminClient';
import type { Plan } from '@/types/database';

export const metadata = { title: 'Billing — Karta Admin' };
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

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Billing
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Billing Management
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          View subscriptions, comp plans (Stripe-bypassing), view invoices, and issue refunds.
          All billing mutations are audited.
        </p>
      </div>

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
