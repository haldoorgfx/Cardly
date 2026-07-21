import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { escapeCsvCell } from '@/lib/csv';
import { orIlikeAcross } from '@/lib/search/filter';

// GET /api/admin/registrations/export — stream all rows matching the current
// filters as a CSV download. Admin-guarded (same view permission as the page).
export async function GET(request: Request) {
  const result = await getAuthorizedUser(EVENT_VIEW_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  const url = new URL(request.url);
  const q              = url.searchParams.get('q')?.trim() ?? '';
  const status         = url.searchParams.get('status') ?? '';
  const paymentStatus  = url.searchParams.get('payment_status') ?? '';
  const eventId        = url.searchParams.get('event_id') ?? '';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  let query = adminClient
    .from('registrations')
    .select(
      'id, attendee_name, attendee_email, attendee_phone, status, payment_status, amount_paid, currency, created_at, events(name, slug), ticket_types(name)',
    );

  // `q` went into the .or() string raw. A comma is what separates conditions
  // there, so searching `Doe, John` silently widened the OR to match every row
  // and produced a full-table PII export the admin believed was filtered.
  const qFilter = q ? orIlikeAcross(['attendee_name', 'attendee_email'], q) : null;
  if (qFilter)       query = query.or(qFilter);
  if (status)        query = query.eq('status', status);
  if (paymentStatus) query = query.eq('payment_status', paymentStatus);
  if (eventId)       query = query.eq('event_id', eventId);

  // Cap the export so a runaway table can't exhaust memory. 50k rows is well
  // beyond any realistic filtered admin export.
  query = query.order('created_at', { ascending: false }).limit(50_000);

  const { data, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = [
    'Registration ID',
    'Attendee Name',
    'Attendee Email',
    'Attendee Phone',
    'Event',
    'Event Slug',
    'Ticket',
    'Status',
    'Payment Status',
    'Amount Paid',
    'Currency',
    'Created At',
  ];

  // Shared escaper — quotes commas/quotes/newlines AND defuses spreadsheet
  // formula injection from attacker-controlled attendee names/emails.
  const escape = (value: unknown): string => escapeCsvCell(value as string | number | null | undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lines = ((data ?? []) as any[]).map((r) =>
    [
      r.id,
      r.attendee_name,
      r.attendee_email,
      r.attendee_phone ?? '',
      r.events?.name ?? '',
      r.events?.slug ?? '',
      r.ticket_types?.name ?? '',
      r.status,
      r.payment_status,
      r.amount_paid ?? 0,
      r.currency ?? '',
      r.created_at,
    ].map(escape).join(','),
  );

  // Prepend a UTF-8 BOM so Excel opens accented names correctly.
  const csv = '﻿' + [headers.join(','), ...lines].join('\r\n');

  await logAudit(user, 'registration.exported', 'registration', undefined, {
    after: { count: lines.length, filters: { q, status, payment_status: paymentStatus, event_id: eventId } },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registrations-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
