export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cash overview' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { CashReconciliationClient } from '@/components/payments/CashReconciliationClient';
import type { StaffCash } from '@/components/payments/CashReconciliationClient';

interface Props { params: Promise<{ id: string }> }

export default async function CashPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  // Representative display currency for this event (cash takings share one).
  const { data: ttRow } = await admin
    .from('ticket_types')
    .select('currency')
    .eq('event_id', id)
    .limit(1)
    .maybeSingle();
  const currency: string = ttRow?.currency || 'USD';

  // cash_reconciliation authorises on auth.uid() → call with the SESSION client,
  // and catch its NOT_AUTHORISED (P0001) instead of surfacing a 500.
  let grandTotal = 0;
  let staff: StaffCash[] | null = null;
  let loadError: 'auth' | 'generic' | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = createClient() as any;
    const { data, error } = await sessionDb.rpc('cash_reconciliation', { p_event_id: id });
    if (error) {
      loadError = error.code === 'P0001' && /NOT_AUTHORISED/.test(error.message ?? '') ? 'auth' : 'generic';
    } else {
      grandTotal = Number(data?.grand_total ?? 0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawStaff = ((data?.staff ?? []) as any[]);
      staff = rawStaff.map((s) => ({
        staff_user_id: String(s.staff_user_id ?? ''),
        staff_name: s.staff_name ?? 'Staff',
        transactions: Number(s.transactions ?? 0),
        collected: Number(s.collected ?? 0),
        open_shifts: Number(s.open_shifts ?? 0),
        reconciled_shifts: Number(s.reconciled_shifts ?? 0),
        counted_total: Number(s.counted_total ?? 0),
      }));
    }
  } catch {
    loadError = 'generic';
  }

  return (
    <CashReconciliationClient
      eventSlug={event.slug}
      currency={currency}
      grandTotal={grandTotal}
      staff={staff}
      loadError={loadError}
    />
  );
}
