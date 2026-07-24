import { getAuthorizedUser } from '@/lib/auth/guards';
import { BILLING_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { toCsv, csvResponse, csvDateStamp } from '@/lib/csv';

interface LedgerExportRow {
  id: string;
  created_at: string;
  entry_type: string;
  amount: number;
  currency: string;
  provider: string | null;
  provider_ref: string | null;
  note: string | null;
  events: { name: string; slug: string } | null;
  registrations: { attendee_name: string; attendee_email: string } | null;
}

// GET /api/admin/finance/export?event_id=&from=&to= — one row per ledger
// entry (financial_transactions, migration 124), joined to registrations and
// events for human-readable columns. This is the file an external bookkeeper
// can actually reconcile against — the existing registrations/revenue
// exports omit platform_fee/organizer_net entirely.
export async function GET(request: Request) {
  const result = await getAuthorizedUser(BILLING_MANAGE);
  if ('error' in result) return result.error;
  const { user } = result;

  const url = new URL(request.url);
  const eventId = url.searchParams.get('event_id') ?? '';
  const from = url.searchParams.get('from') ?? '';
  const to = url.searchParams.get('to') ?? '';

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('financial_transactions')
    .select('id, created_at, entry_type, amount, currency, provider, provider_ref, note, events(name, slug), registrations(attendee_name, attendee_email)');

  if (eventId) query = query.eq('event_id', eventId);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  query = query.order('created_at', { ascending: false }).limit(50_000);

  const { data, error } = await query;
  if (error) {
    // Migration 124 not applied yet — a clean, explainable error rather than
    // a raw Postgres one.
    return new Response(JSON.stringify({ error: 'The financial ledger is not available yet (migration 124 not applied).', detail: error.message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = (data ?? []) as LedgerExportRow[];

  const ENTRY_LABELS: Record<string, string> = {
    platform_fee: 'Platform fee (earned)',
    organizer_net: 'Organizer net (owed)',
    refund_fee: 'Platform fee (reversed)',
    refund_net: 'Organizer net (reversed)',
    payout_issued: 'Payout issued',
  };

  const csv = toCsv(rows, [
    { header: 'Date', value: r => r.created_at },
    { header: 'Entry Type', value: r => ENTRY_LABELS[r.entry_type] ?? r.entry_type },
    { header: 'Event', value: r => r.events?.name ?? '' },
    { header: 'Event Slug', value: r => r.events?.slug ?? '' },
    { header: 'Attendee Name', value: r => r.registrations?.attendee_name ?? '' },
    { header: 'Attendee Email', value: r => r.registrations?.attendee_email ?? '' },
    { header: 'Amount', value: r => r.amount },
    { header: 'Currency', value: r => r.currency },
    { header: 'Provider', value: r => r.provider ?? '' },
    { header: 'Provider Reference', value: r => r.provider_ref ?? '' },
    { header: 'Note', value: r => r.note ?? '' },
  ]);

  await logAudit(user, 'finance.exported', 'financial_transactions', undefined, {
    after: { count: rows.length, filters: { event_id: eventId, from, to } },
  });

  return csvResponse(csv, `eventera-finance-ledger-${csvDateStamp()}.csv`);
}
