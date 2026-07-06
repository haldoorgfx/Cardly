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
    .select('id, status, checked_in_at, attendee_name, event_id, events!inner(user_id)');
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

  const now = new Date().toISOString();
  const { error } = await db
    .from('registrations')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status: 'checked_in', checked_in_at: now } as any)
    .eq('id', reg.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true, already_checked_in: false,
    registration_id: reg.id, attendee_name: reg.attendee_name, checked_in_at: now,
  });
}
