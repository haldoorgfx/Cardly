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

  const recorded = await recordUnsubscribe(parsed.email, parsed.eventId);

  // Only claim success when the opt-out was actually written. Reporting ok
  // regardless would tell the recipient "you're unsubscribed" while nothing
  // was recorded — the exact broken promise this feature exists to avoid, and
  // it would keep mailing someone who believes they opted out. A 503 is also
  // the honest signal to Gmail/Yahoo, which retry it rather than treating the
  // opt-out as done.
  if (!recorded) {
    return NextResponse.json(
      { error: 'We could not record that right now. Please try again shortly.' },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
