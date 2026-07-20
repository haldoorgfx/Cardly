import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { verifyFlutterwaveTransaction } from '@/lib/payments/flutterwave';
import { createAdminClient } from '@/lib/supabase/server';
import { createNotification, notifyOrganizerNewRegistration } from '@/lib/notifications';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

export async function POST(req: NextRequest) {
  // Verify Flutterwave webhook hash (constant-time to prevent timing oracle)
  const hash = req.headers.get('verif-hash');
  const expectedHash = process.env.FLUTTERWAVE_WEBHOOK_HASH;
  if (!expectedHash || !hash) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  try {
    const a = Buffer.from(hash);
    const b = Buffer.from(expectedHash);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: { event: string; data: { id: number; tx_ref: string; status: string; amount: number; currency: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.event !== 'charge.completed') {
    return NextResponse.json({ received: true }); // ignore other events
  }

  const { tx_ref, status, id: txId } = body.data;
  if (!tx_ref) return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });

  const admin = createAdminClient();

  if (status === 'successful') {
    // Verify the transaction independently (don't trust webhook body alone)
    let verifiedAmount: number | null = null;
    let verifiedCurrency: string | null = null;
    try {
      const verification = await verifyFlutterwaveTransaction(String(txId));
      if (verification.data?.status !== 'successful') {
        console.warn('[FW webhook] verification failed for tx', txId);
        return NextResponse.json({ received: true });
      }
      verifiedAmount = verification.data.amount ?? null;
      verifiedCurrency = verification.data.currency ?? null;
    } catch (err) {
      console.error('[FW webhook] verification error:', err);
      return NextResponse.json({ received: true });
    }

    // Amount check — confirm the paid amount/currency matches what we expected.
    // A status-only confirmation would let an underpayment or wrong-currency
    // callback mark a paid ticket as confirmed. Compare to the registration's
    // amount_paid (the discounted amount we charged), 1-unit tolerance for rounding.
    const { data: expected } = await admin
      .from('registrations')
      .select('amount_paid, currency')
      .eq('qr_code_token', tx_ref)
      .eq('payment_status', 'pending')
      .maybeSingle();
    if (expected && (expected.amount_paid ?? 0) > 0) {
      if (verifiedAmount == null || verifiedAmount < (expected.amount_paid as number) - 1) {
        console.error(`[FW webhook] amount mismatch for ${tx_ref}: got ${verifiedAmount}, expected ${expected.amount_paid}`);
        return NextResponse.json({ received: true });
      }
      if (expected.currency && verifiedCurrency && verifiedCurrency !== expected.currency) {
        console.error(`[FW webhook] currency mismatch for ${tx_ref}: got ${verifiedCurrency}, expected ${expected.currency}`);
        return NextResponse.json({ received: true });
      }
    }

    // tx_ref = qr_code_token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (admin as any)
      .from('registrations')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('qr_code_token', tx_ref)
      .eq('payment_status', 'pending') // idempotent guard
      .select('ticket_type_id, event_id, user_id, attendee_email, attendee_name')
      .maybeSingle();

    if (error) console.error('[FW webhook] DB update failed:', error.message);
    // First pending→paid transition only — increment sold count once.
    if (updated?.ticket_type_id) {
      await admin.rpc('increment_ticket_quantity_sold', { ticket_id: updated.ticket_type_id, qty: 1 });
    }
    // In-app notification for the attendee — only on the first flip, only if they have an account.
    if (updated?.user_id) {
      const { data: ep } = await admin.from('event_pages').select('title').eq('event_id', updated.event_id).maybeSingle();
      await createNotification({
        userId: updated.user_id,
        eventId: updated.event_id,
        type: 'ticket_confirmed',
        title: "You're in — ticket confirmed",
        body: `Your ticket for ${ep?.title ?? 'the event'} is ready.`,
        actionUrl: '/my-tickets',
      });
    }
    // Roles write-path: paid registration confirmed → 'attendee' role (best-effort).
    if (updated) {
      const attendeeAccountId = updated.user_id
        ?? (await resolveAccountIdByEmail(updated.attendee_email));
      if (attendeeAccountId && updated.event_id) {
        await upsertEventRole({ userId: attendeeAccountId, eventId: updated.event_id, role: 'attendee' });
      }

      // Notify the organizer of the new (paid) registration. Guarded by the
      // pending→paid flip above, so it fires exactly once per ticket.
      const { data: ev } = await admin.from('events').select('user_id').eq('id', updated.event_id).maybeSingle();
      const { data: page } = await admin.from('event_pages').select('title').eq('event_id', updated.event_id).maybeSingle();
      void notifyOrganizerNewRegistration({
        organizerId: ev?.user_id,
        eventId: updated.event_id,
        eventName: page?.title ?? 'your event',
        attendeeName: updated.attendee_name,
      });
    }
  } else if (status === 'failed') {
    await admin
      .from('registrations')
      .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
      .eq('qr_code_token', tx_ref)
      .eq('payment_status', 'pending');
  }

  return NextResponse.json({ received: true });
}
