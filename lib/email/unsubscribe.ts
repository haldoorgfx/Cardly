import { createHmac, timingSafeEqual } from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

// Unsubscribe support for organizer broadcast email.
//
// Recipients are attendee email addresses, and most have no Eventera account,
// so profiles.notification_prefs can't gate them. Opting out is therefore
// keyed by email address (see supabase/102_email_unsubscribes.sql).
//
// The link carries a signed token rather than a raw ?email= parameter. Without
// a signature, anyone could unsubscribe anyone else — including an organizer
// quietly suppressing a rival's address — just by editing the URL.

// No new env var required: falls back to the service-role key, which is
// server-only and always present. Set EMAIL_UNSUBSCRIBE_SECRET to rotate all
// outstanding links at once without touching Supabase credentials.
function secret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ''
  );
}

const b64url = (b: Buffer) => b.toString('base64url');

function sign(payload: string): string {
  return b64url(createHmac('sha256', secret()).update(payload).digest());
}

/** Signed, self-verifying token for one email address. */
export function makeUnsubscribeToken(email: string, eventId?: string | null): string {
  const payload = b64url(Buffer.from(`${email.trim().toLowerCase()}|${eventId ?? ''}`));
  return `${payload}.${sign(payload)}`;
}

/** Returns the email + event the token was issued for, or null if invalid. */
export function readUnsubscribeToken(
  token: string,
): { email: string; eventId: string | null } | null {
  if (!secret()) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  // Constant-time compare — a plain === leaks signature bytes through timing,
  // which is enough to forge a token given enough attempts.
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const [email, eventId] = Buffer.from(payload, 'base64url').toString().split('|');
    if (!email) return null;
    return { email, eventId: eventId || null };
  } catch {
    return null;
  }
}

export function unsubscribeUrl(email: string, eventId?: string | null): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  return `${base}/unsubscribe?token=${encodeURIComponent(makeUnsubscribeToken(email, eventId))}`;
}

/**
 * Whether the suppression table exists yet.
 *
 * The migration is applied by hand, so the code ships before the table does.
 * Rather than advertise an opt-out we cannot record, the broadcast path stays
 * exactly as it is today until this returns true — then the whole feature
 * switches itself on. Cached per process; a serverless instance is short-lived
 * enough that this self-heals after the migration lands.
 */
let tableReady: boolean | null = null;
export async function unsubscribeTableExists(): Promise<boolean> {
  if (tableReady !== null) return tableReady;
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('email_unsubscribes')
      .select('email', { head: true, count: 'exact' })
      .limit(1);
    // 42P01 = undefined_table
    tableReady = !error || error.code !== '42P01';
  } catch {
    tableReady = false;
  }
  return tableReady;
}

/** Lowercased set of addresses that have opted out, from the given candidates. */
export async function filterUnsubscribed(emails: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (emails.length === 0 || !(await unsubscribeTableExists())) return out;
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin as any)
      .from('email_unsubscribes')
      .select('email')
      .in('email', emails.map(e => e.trim().toLowerCase()));
    for (const r of (data ?? []) as { email: string }[]) out.add(r.email);
  } catch {
    // Fail OPEN deliberately: a lookup outage must not silently swallow an
    // organizer's broadcast to their whole attendee list. The opposite failure
    // (one extra email to someone who opted out) is the lesser harm, and the
    // recipient still has a working unsubscribe link in that mail.
  }
  return out;
}

/** Records an opt-out. Idempotent — unsubscribing twice is not an error. */
export async function recordUnsubscribe(
  email: string,
  eventId: string | null,
): Promise<boolean> {
  if (!(await unsubscribeTableExists())) return false;
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (admin as any)
      .from('email_unsubscribes')
      .upsert(
        { email: email.trim().toLowerCase(), event_id: eventId },
        { onConflict: 'email' },
      );
    return !error;
  } catch {
    return false;
  }
}
