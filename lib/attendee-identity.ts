import { createAdminClient, createClient } from '@/lib/supabase/server';

/**
 * Result of an attendee-identity ownership check.
 * - ok=true  → the supplied registration is valid for this event and, if the
 *   caller is authenticated, belongs to that caller.
 * - ok=false → `status` / `error` describe why (403 forbidden or 404 unknown).
 */
export type IdentityCheck =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 404; error: string };

const ACTIVE_STATUSES = ['confirmed', 'checked_in'];

/**
 * Verify that a client-supplied `registrationId` legitimately belongs to the
 * caller for the given event.
 *
 * Rules (guests are first-class — the attendee flows allow no-auth participation):
 *  - If there is an authenticated user, resolve THAT user's own confirmed /
 *    checked-in registrations for this event and require the supplied
 *    registration to be one of them → otherwise 403.
 *  - If there is NO auth session (guest), simply verify the supplied
 *    registration exists and is confirmed / checked-in for THIS event → 404 if not.
 *
 * This lets legitimate guests keep working while blocking an authenticated
 * user from acting as someone else's registration.
 */
export async function assertOwnsRegistration(
  eventId: string,
  registrationId: string | null | undefined,
): Promise<IdentityCheck> {
  if (!registrationId) {
    return { ok: false, status: 404, error: 'Registration not found' };
  }

  const admin = createAdminClient();

  // Load the supplied registration and confirm it belongs to this event and is active.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, status, user_id')
    .eq('id', registrationId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (!reg || !ACTIVE_STATUSES.includes(reg.status)) {
    return { ok: false, status: 404, error: 'Registration not found' };
  }

  // Is there an authenticated caller? If so, the supplied registration must be theirs.
  let authUserId: string | null = null;
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) authUserId = user.id;
  } catch {
    // Not authenticated — treat as guest.
  }

  if (authUserId) {
    // The registration must be linked to this user. If it's linked to a
    // *different* user, reject. If it's unlinked (guest reg), also require a
    // matching owned registration to exist — an authenticated user must act
    // through their own registration.
    if (reg.user_id === authUserId) return { ok: true };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: owned } = await (admin as any)
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', authUserId)
      .in('status', ACTIVE_STATUSES);

    const ownsAny = Array.isArray(owned) && owned.length > 0;
    if (ownsAny) {
      // They have their own registration(s) but supplied a different one → forbidden.
      return { ok: false, status: 403, error: 'Forbidden' };
    }
    // Authenticated but no linked registration for this event — the supplied
    // registration is an unclaimed guest registration. Allow it (they may have
    // registered as a guest before logging in) but only for unlinked rows.
    if (reg.user_id == null) return { ok: true };
    return { ok: false, status: 403, error: 'Forbidden' };
  }

  // Guest caller: the registration exists and is active for this event → allow.
  return { ok: true };
}
