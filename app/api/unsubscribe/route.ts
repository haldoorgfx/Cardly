import { NextRequest, NextResponse } from 'next/server';
import { readUnsubscribeToken, recordUnsubscribe } from '@/lib/email/unsubscribe';

// RFC 8058 one-click unsubscribe target.
//
// Gmail and Yahoo POST here directly when the recipient hits their built-in
// "Unsubscribe" button — no page load, no confirmation click. The spec requires
// that this succeed on the POST alone, so there is deliberately no auth and no
// interstitial: the signed token in the URL IS the authorization.
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const parsed = readUnsubscribeToken(token);
  if (!parsed) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });

  await recordUnsubscribe(parsed.email, parsed.eventId);

  // Always 200 to the mail provider. A provider that sees an error may keep
  // showing the unsubscribe affordance, or count it against sender reputation.
  return NextResponse.json({ ok: true });
}
