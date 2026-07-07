import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Public payment-status poll, keyed by the registration's qr_code_token
// (the bearer credential the attendee already holds). Returns only the two
// status fields — no PII — so the mobile app can wait for a hosted checkout
// (Stripe pay page / Flutterwave) to complete. Rate-limited in middleware.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim() ?? '';
  if (token.length < 8 || token.length > 128) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('registrations')
    .select('status, payment_status')
    .eq('qr_code_token', token)
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    status: data.status,
    payment_status: data.payment_status,
  });
}
