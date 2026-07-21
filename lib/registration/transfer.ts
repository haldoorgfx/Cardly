import { createAdminClient } from '@/lib/supabase/server';
import { registrationOwnershipFilter } from './ownership';
import { sendTransferEmail } from './email';

/**
 * Ticket transfer — the single implementation behind BOTH transfer routes
 * (`/api/tickets/[id]/transfer` and `/api/registrations/[id]/transfer`).
 *
 * There used to be two hand-written copies of this logic. They had already
 * drifted apart once (only one of them refused a no-op self-transfer), and a
 * drift here is not cosmetic: `qr_code_token` is a bearer credential, so a path
 * that forgets to rotate it leaves the previous holder with a working ticket.
 * The routes are now thin adapters over this function.
 *
 * Guarantees, in order:
 *  1. Only the current holder may transfer (user_id OR attendee_email match).
 *  2. Only a transferable status may move (never checked_in / cancelled /
 *     refunded — those simply don't match the filter and read as "not found").
 *  3. An unpaid paid-ticket may not be transferred (you can't gift a hold).
 *  4. The ownership change is a CONDITIONAL update: the WHERE clause re-asserts
 *     the status AND the exact token we read. Since every transfer rotates the
 *     token, two concurrent transfers of the same ticket cannot both apply —
 *     the loser matches zero rows and gets a 409 instead of silently clobbering
 *     the winner's recipient.
 *  5. `qr_code_token` is rotated, so the sender's saved QR, `?reg=` links and
 *     `/api/qr/<token>` all die the instant the transfer lands.
 *  6. The audit row is written only AFTER a real transition, so a losing racer
 *     never fabricates a transfer that didn't happen.
 *  7. The recipient email is AWAITED — an un-awaited send is dropped when the
 *     serverless invocation ends, and the new holder never gets their ticket.
 */

/** Statuses a ticket may be transferred out of. */
const TRANSFERABLE_STATUSES = ['confirmed', 'pending_approval'] as const;

export type TransferResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

export interface TransferInput {
  registrationId: string;
  /** Authenticated user performing the transfer. */
  userId: string;
  userEmail: string | null | undefined;
  toName: string;
  /** Already lowercased/trimmed by the route's zod schema. */
  toEmail: string;
}

export async function transferRegistration(input: TransferInput): Promise<TransferResult> {
  const { registrationId, userId, userEmail, toName, toEmail } = input;
  const admin = createAdminClient();

  // Ownership + transferability proof in one query. A registration the caller
  // doesn't hold, or one that is checked in / cancelled / refunded, is "not
  // found" — we don't distinguish, so this can't be used to probe other
  // people's ticket states.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, event_id, attendee_name, attendee_email, qr_code_token, status, payment_status, amount_paid, events!inner(slug, event_pages(title, starts_at))')
    .eq('id', registrationId)
    .or(registrationOwnershipFilter(userId, userEmail))
    .in('status', TRANSFERABLE_STATUSES as unknown as string[])
    .maybeSingle();

  if (!reg) return { ok: false, status: 404, error: 'Ticket not found or not transferable.' };

  // No-op guard: transferring to yourself would still rotate the token and
  // strip the user_id link — i.e. it would lock you out of your own ticket.
  if ((reg.attendee_email ?? '').toLowerCase() === toEmail) {
    return { ok: false, status: 400, error: 'This ticket already belongs to that email.' };
  }

  // An unpaid paid ticket is a reservation, not a ticket. Handing it on would
  // move the seat to someone who owes nothing and leave the payer's card on
  // file pointed at a registration they no longer control.
  const owed = Number(reg.amount_paid ?? 0);
  if (owed > 0 && (reg.payment_status === 'pending' || reg.payment_status === 'failed')) {
    return { ok: false, status: 400, error: 'Pay for this ticket before transferring it.' };
  }

  // Rotate the bearer credential. Same minting as everywhere else in the app.
  const newToken = crypto.randomUUID().replace(/-/g, '');

  // Conditional update = the concurrency guard. `qr_code_token` is unique per
  // registration and changes on every transfer, so re-asserting the value we
  // read makes this a compare-and-swap. `.select()` tells us whether we won.
  // `eventera_card_url` is cleared: the existing card carries the SENDER's name
  // and photo — leaving it would show the new holder someone else's card and
  // suppress their own "Get my Eventera Card" offer.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updated, error: updateError } = await (admin as any)
    .from('registrations')
    .update({
      attendee_name: toName,
      attendee_email: toEmail,
      qr_code_token: newToken,
      eventera_card_url: null,
      user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', registrationId)
    .eq('qr_code_token', reg.qr_code_token)
    .in('status', TRANSFERABLE_STATUSES as unknown as string[])
    .select('id');

  if (updateError) return { ok: false, status: 500, error: 'Failed to transfer ticket.' };
  if (!updated || updated.length === 0) {
    // Someone else transferred this ticket between our read and our write.
    return { ok: false, status: 409, error: 'This ticket was just transferred. Refresh and try again.' };
  }

  // Audit trail — after the fact, so it only ever records transfers that landed.
  // A failure here must not fail the request: the ownership change is already
  // committed and reporting an error would tell the sender a lie.
  const { error: logError } = await admin.from('ticket_transfers').insert({
    registration_id: registrationId,
    from_name: reg.attendee_name ?? '',
    from_email: reg.attendee_email ?? '',
    to_name: toName,
    to_email: toEmail,
  });
  if (logError) console.error('[transfer] audit log failed for registration', registrationId, logError);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ep = (reg.events?.event_pages as any[])?.[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  // Awaited — a dropped send means the new holder never receives the ticket.
  await sendTransferEmail({
    to: toEmail,
    name: toName,
    eventTitle: ep?.title ?? '',
    eventSlug: reg.events?.slug ?? '',
    qrCodeUrl: `${appUrl}/api/qr/${newToken}`,
    eventId: reg.event_id ?? undefined,
  }).catch(() => { /* transfer already committed; never fail it on email */ });

  return { ok: true };
}
