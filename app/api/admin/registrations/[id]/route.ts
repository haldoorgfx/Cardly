import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_EDIT_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit/log';
import { refundStripeTicketIfNeeded } from '@/lib/payments/refund';
import type { RegistrationStatus } from '@/types/database';

const VALID_STATUSES: RegistrationStatus[] = [
  'pending', 'confirmed', 'checked_in', 'cancelled', 'refunded', 'pending_approval',
];

// PATCH /api/admin/registrations/[id] — update a registration's status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  let body: { status?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status as RegistrationStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  const { data: before } = await adminClient
    .from('registrations')
    .select('id, event_id, attendee_email, status, ticket_type_id, stripe_payment_intent_id, payment_status')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  // Refund the attendee's card BEFORE writing 'refunded'. Flutterwave/WaafiPay
  // registrations have no reversal API yet and fall through untouched
  // (refundStripeTicketIfNeeded no-ops for them), but a Stripe registration
  // whose refund call fails must not have the DB record it as refunded anyway.
  if (status === 'refunded') {
    const refund = await refundStripeTicketIfNeeded(before);
    if (!refund.ok) {
      return NextResponse.json({ error: `Refund failed: ${refund.error}` }, { status: 502 });
    }
  }

  // Keep checked_in_at coherent when moving in/out of the checked_in state.
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === 'checked_in') patch.checked_in_at = new Date().toISOString();
  if (before.status === 'checked_in' && status !== 'checked_in') patch.checked_in_at = null;

  // Does this transition release a held seat? (Only confirmed/checked_in ever
  // incremented quantity_sold — a pending registration never did.)
  const releasesSeat =
    (status === 'cancelled' || status === 'refunded') &&
    (before.status === 'confirmed' || before.status === 'checked_in');

  let updateQuery = adminClient
    .from('registrations')
    .update(patch)
    .eq('id', params.id);

  // Race guard: the prior status has to live in the WHERE clause, not just in
  // the pre-read above. Two concurrent cancels would otherwise both decrement
  // quantity_sold for one seat, undercounting the ticket type into an oversell.
  if (releasesSeat) updateQuery = updateQuery.in('status', ['confirmed', 'checked_in']);

  const { data: after, error } = await updateQuery
    .select('id, event_id, attendee_email, status')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!after) {
    return releasesSeat
      ? NextResponse.json({ error: 'This registration was already updated.' }, { status: 409 })
      : NextResponse.json({ error: 'Registration not found' }, { status: 404 });
  }

  // Cancelling/refunding releases the ticket-type slot this registration was
  // holding, now that the guarded update above has actually landed.
  if (releasesSeat && before.ticket_type_id) {
    await adminClient.rpc('decrement_ticket_quantity_sold', { ticket_id: before.ticket_type_id, qty: 1 });
  }

  await logAudit(user, `registration.status.${status}`, 'registration', params.id, {
    before: { status: before.status, attendee_email: before.attendee_email },
    after:  { status: after.status },
  });

  return NextResponse.json({ ok: true, registration: after });
}

// DELETE /api/admin/registrations/[id] — permanently delete a registration
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const result = await getAuthorizedUser(EVENT_EDIT_ALL);
  if ('error' in result) return result.error;
  const { user } = result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  const { data: before } = await adminClient
    .from('registrations')
    .select('id, event_id, attendee_email, attendee_name, status, ticket_type_id')
    .eq('id', params.id)
    .single();

  if (!before) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

  // .select() reports the rows actually removed, so two concurrent deletes of
  // the same registration can't both decrement quantity_sold for one seat.
  const { data: deleted, error } = await adminClient
    .from('registrations')
    .delete()
    .eq('id', params.id)
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if ((deleted?.length ?? 0) > 0 && (before.status === 'confirmed' || before.status === 'checked_in') && before.ticket_type_id) {
    await adminClient.rpc('decrement_ticket_quantity_sold', { ticket_id: before.ticket_type_id, qty: 1 });
  }

  await logAudit(user, 'registration.deleted', 'registration', params.id, {
    before: {
      event_id:       before.event_id,
      attendee_email: before.attendee_email,
      attendee_name:  before.attendee_name,
      status:         before.status,
    },
  });

  return NextResponse.json({ ok: true });
}
