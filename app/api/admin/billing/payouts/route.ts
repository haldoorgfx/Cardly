import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';

// POST /api/admin/billing/payouts — record that an organizer was paid out
// manually (Stripe is not a payout rail here — organizers are paid outside
// the platform). Writes one payout_issued ledger row (migration 124) so
// "owed to organizer" nets down instead of accumulating forever with no way
// to tell whether they'd already been paid.
export async function POST(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { organizer_id?: string; amount?: number; currency?: string; note?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { organizer_id, amount, currency, note } = body;
  if (!organizer_id || !currency) {
    return NextResponse.json({ error: 'organizer_id and currency are required' }, { status: 400 });
  }
  if (typeof amount !== 'number' || !(amount > 0) || amount > 10_000_000) {
    return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: organizer } = await admin.from('profiles').select('id, email').eq('id', organizer_id).maybeSingle();
  if (!organizer) return NextResponse.json({ error: 'Organizer not found' }, { status: 404 });

  // Stored negative — "owed to organizer" is SUM(organizer_net + refund_net +
  // payout_issued), and a payout must reduce that running total, not add to it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from('financial_transactions').insert({
    entry_type: 'payout_issued',
    organizer_id,
    amount: -Math.abs(amount),
    currency: currency.toUpperCase(),
    provider: 'manual',
    created_by: user.id,
    note: note?.trim() || null,
  });

  if (error) {
    return NextResponse.json(
      { error: 'Could not record the payout (is migration 124 applied?)', detail: error.message },
      { status: 503 },
    );
  }

  await logAudit(user, 'billing.payout_recorded', 'profile', organizer_id, {
    after: { amount, currency: currency.toUpperCase(), note: note?.trim() || null, organizer_email: organizer.email },
  });

  return NextResponse.json({ ok: true });
}
