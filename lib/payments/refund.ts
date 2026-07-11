import { createAdminClient } from '@/lib/supabase/server';

export type RefundResult =
  | { ok: true; registrationId: string; ticketReturned: boolean }
  | { ok: false; reason: 'not_found' | 'already_refunded' };

/**
 * Flip a registration to `refunded` and return its ticket to inventory.
 *
 * Use for payments that CANNOT be refunded through Stripe's API (WaafiPay,
 * Flutterwave) — the actual money movement is done in the provider's dashboard;
 * this reflects that state in our system.
 *
 * Idempotent: the `.in(status,...)` guard means a replayed/duplicate call finds
 * no row to flip and returns `already_refunded` WITHOUT decrementing inventory
 * a second time — same pattern as the Stripe `charge.refunded` webhook.
 */
export async function markRegistrationRefunded(registrationId: string): Promise<RefundResult> {
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (admin as any)
    .from('registrations')
    .update({ status: 'refunded', payment_status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', registrationId)
    .in('status', ['confirmed', 'checked_in', 'pending'])
    .select('id, ticket_type_id');

  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return { ok: false, reason: 'already_refunded' };

  let ticketReturned = false;
  if (row.ticket_type_id) {
    await admin.rpc('increment_ticket_quantity_sold', { ticket_id: row.ticket_type_id, qty: -1 });
    ticketReturned = true;
  }
  return { ok: true, registrationId: row.id, ticketReturned };
}
