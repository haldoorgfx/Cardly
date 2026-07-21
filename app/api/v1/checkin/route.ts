import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/v1/checkin — check an attendee in by QR token or registration id.
// Body: { qr_code_token?: string, registration_id?: string }
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req, 'checkin:write');
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const token = typeof body.qr_code_token === 'string' ? body.qr_code_token.trim() : '';
  const regId = typeof body.registration_id === 'string' ? body.registration_id.trim() : '';
  if (!token && !regId) {
    return NextResponse.json({ error: 'Provide qr_code_token or registration_id.' }, { status: 400 });
  }

  const db = createAdminClient();
  let q = db
    .from('registrations')
    .select('id, status, payment_status, amount_paid, checked_in_at, attendee_name, event_id, events!inner(user_id)');
  q = token ? q.eq('qr_code_token', token) : q.eq('id', regId);
  const { data: reg } = await q.maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!reg || (reg as any).events?.user_id !== auth.userId) {
    return NextResponse.json({ error: 'Registration not found.' }, { status: 404 });
  }

  if (reg.checked_in_at) {
    return NextResponse.json({
      ok: true, already_checked_in: true,
      registration_id: reg.id, attendee_name: reg.attendee_name, checked_in_at: reg.checked_in_at,
    });
  }

  // Same guards the web check-in route enforces — without them this endpoint is
  // a clean bypass: a cancelled/refunded attendee could be admitted (and their
  // status silently overwritten), as could an unpaid holder of a paid ticket.
  if (reg.status === 'cancelled' || reg.status === 'refunded') {
    return NextResponse.json(
      { error: `This registration was ${reg.status} and cannot be checked in.` },
      { status: 409 },
    );
  }
  const owesPayment =
    (reg.amount_paid ?? 0) > 0 &&
    (reg.payment_status === 'pending' || reg.payment_status === 'failed');
  if (owesPayment) {
    return NextResponse.json(
      { error: 'This ticket has not been paid for yet.' },
      { status: 409 },
    );
  }

  const now = new Date().toISOString();
  // Guarded transition (same idiom as /api/events/[id]/checkin): the read above
  // is not a lock, so an API integration polling this endpoint alongside the
  // door scanner would otherwise report a second successful check-in for one
  // ticket — and stamp its own timestamp over the door's.
  const { data: updated, error } = await db
    .from('registrations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'checked_in', checked_in_at: now } as any)
    .eq('id', reg.id)
    .neq('status', 'checked_in')
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!updated) {
    return NextResponse.json({
      ok: true, already_checked_in: true,
      registration_id: reg.id, attendee_name: reg.attendee_name, checked_in_at: reg.checked_in_at,
    });
  }

  return NextResponse.json({
    ok: true, already_checked_in: false,
    registration_id: reg.id, attendee_name: reg.attendee_name, checked_in_at: now,
  });
}
