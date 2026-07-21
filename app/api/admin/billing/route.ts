import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { orIlikeAcross } from '@/lib/search/filter';

// GET /api/admin/billing — list users with active subscriptions
export async function GET(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;

  const url = new URL(request.url);
  // See admin/events: quote the value with the shared helper rather than
  // stripping characters out of the admin's search term.
  const search = url.searchParams.get('q')?.trim() ?? '';
  const plan   = url.searchParams.get('plan') ?? '';
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 50;
  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const adminClient = createAdminClient();
  let query = adminClient
    .from('profiles')
    .select(
      'id, email, full_name, plan, subscription_status, billing_cycle, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id, cards_this_month, created_at',
      { count: 'exact' }
    );

  const searchFilter = search ? orIlikeAcross(['email', 'full_name'], search) : null;
  if (searchFilter) {
    query = query.or(searchFilter);
  }
  if (plan) {
    query = query.eq('plan', plan as 'free' | 'pro' | 'studio');
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
