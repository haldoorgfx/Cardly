/**
 * One honest state machine for a ticket, shared by the wallet list and the
 * ticket detail page so they can never disagree about what a ticket is.
 *
 * The rule that matters: **only a `live` ticket may render a scannable QR.**
 * Before this existed, both surfaces derived "is it live?" as
 * `!checked_in && !pendingPayment` — which quietly said yes to a FREE ticket
 * that was still awaiting organizer approval, and (on the detail page, which
 * has no status filter on its query) to a cancelled or refunded one. Those all
 * showed a crisp "Confirmed" badge over a live QR. The gate scanner refuses
 * them server-side, so nobody got in — but the attendee only found that out at
 * the door.
 */

export type TicketState =
  | 'live'                // confirmed + paid (or free) → scannable
  | 'checked_in'          // already admitted
  | 'pending_payment'     // owes money
  | 'awaiting_approval'   // organizer hasn't approved yet
  | 'cancelled';          // cancelled or refunded — dead ticket

export interface TicketStateInput {
  status: string;
  payment_status?: string | null;
  amount_paid?: number | string | null;
}

export function ticketState(reg: TicketStateInput): TicketState {
  if (reg.status === 'cancelled' || reg.status === 'refunded') return 'cancelled';
  if (reg.status === 'checked_in') return 'checked_in';
  if (reg.status === 'pending_approval') return 'awaiting_approval';

  const owed = Number(reg.amount_paid ?? 0);
  if (owed > 0 && (reg.payment_status === 'pending' || reg.payment_status === 'failed')) return 'pending_payment';

  // A free registration left in 'pending' was never confirmed either.
  if (reg.status === 'pending') return 'pending_payment';

  return 'live';
}

/** Only a live ticket may show a scannable QR. Everything else gets a locked state. */
export function isScannable(state: TicketState): boolean {
  return state === 'live';
}

/** Transfer is only offered for a ticket that is actually yours to give away. */
export function isTransferable(state: TicketState): boolean {
  return state === 'live';
}

const LABELS: Record<TicketState, string> = {
  live: 'Confirmed',
  checked_in: 'Checked in',
  pending_payment: 'Payment pending',
  awaiting_approval: 'Awaiting approval',
  cancelled: 'Cancelled',
};

export function ticketStateLabel(state: TicketState): string {
  return LABELS[state];
}
