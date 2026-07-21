import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { upsertEventRole } from '@/lib/rbac/assign';
import { escapeLikePattern } from '@/lib/search/filter';

/**
 * Claim sponsor access for the AUTHENTICATED user.
 *
 * Finds every `sponsors` row whose `contact_email` matches the caller's verified
 * account email (auth email, falling back to profiles.email) and upserts an
 * event-scoped 'sponsor' role for each. This closes the gap where an organizer
 * added a sponsor by email before that person had (or linked) an account.
 *
 * Self-only, idempotent, and safe: it can only ever grant roles to the caller's
 * own account, keyed off an email the caller has already authenticated against.
 */
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  // Prefer the verified auth email; fall back to profiles.email.
  let email = (user.email ?? '').trim().toLowerCase();
  if (!email) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .maybeSingle();
    email = ((profile?.email as string | undefined) ?? '').trim().toLowerCase();
  }

  if (!email) return NextResponse.json({ claimed: 0, events: [] });

  // Sponsor rows whose contact_email matches the caller's email (case-insensitive).
  // The email is escaped because it is used as an ILIKE PATTERN — an unescaped
  // `_` (common in addresses) matches any character, so this route would grant
  // the 'sponsor' role for a look-alike stranger's booth.
  const { data: sponsors, error } = await admin
    .from('sponsors')
    .select('id, event_id')
    .ilike('contact_email', escapeLikePattern(email));

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (sponsors ?? []) as Array<{ id: string; event_id: string }>;
  const eventIds = Array.from(new Set(rows.map((s) => s.event_id).filter(Boolean)));

  // Upsert the 'sponsor' role for each distinct event (best-effort, never throws).
  await Promise.all(
    eventIds.map((eventId) => upsertEventRole({ userId: user.id, eventId, role: 'sponsor' })),
  );

  return NextResponse.json({ claimed: eventIds.length, events: eventIds });
}
