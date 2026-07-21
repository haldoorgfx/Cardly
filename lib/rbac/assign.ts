/**
 * Role WRITE path — keeps `user_event_roles` (migration 055) live going forward.
 *
 * The resolver (lib/rbac/roles.ts) READS `user_event_roles`. This module is its
 * write-side twin: the four account-touching flows (registration confirmed,
 * organizer creates an event, speaker added with an email, sponsor linked by
 * email) call `upsertEventRole` AFTER their primary action has succeeded so the
 * roles table stays authoritative without depending on the one-time backfill.
 *
 * SERVER-ONLY. Uses the service-role admin client (bypasses RLS), same as
 * lib/rbac/roles.ts — never import this into a client component.
 *
 * BEST-EFFORT + NON-THROWING. A failed role write must NEVER break the calling
 * flow (registration, checkout, speaker add, …). Every function here swallows
 * its own errors and logs a warning; callers can safely `await` without a
 * try/catch and without risking the user-facing response.
 *
 * Type note: `user_event_roles` is not yet in types/database.ts (frozen), so we
 * cast the admin client to `any` at the query boundary — same pattern as the
 * resolver.
 */

import { createAdminClient } from '@/lib/supabase/server';
// Emails are used as ILIKE PATTERNS below, and _ is a wildcard, so john_doe@x.com
// would otherwise match a different person's johnXdoe@x.com row. One escaper for
// the whole codebase; do not add a second.
import { escapeLikePattern } from '@/lib/search/filter';

export type EventRole = 'attendee' | 'speaker' | 'sponsor' | 'organizer' | 'staff';

/**
 * Upsert an event-scoped role for an account. Idempotent on the
 * (user_id, event_id, role) unique constraint from migration 055 — a repeat
 * call re-affirms the row and refreshes `status`.
 *
 * Never throws: on any failure it logs a warning and returns. The primary flow
 * that called it is unaffected.
 */
export async function upsertEventRole(params: {
  userId: string;
  eventId: string;
  role: EventRole;
  status?: 'active' | 'pending';
}): Promise<void> {
  const { userId, eventId, role } = params;
  const status = params.status ?? 'active';

  if (!userId || !eventId) return; // nothing to write — silently skip

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin
      .from('user_event_roles')
      .upsert(
        { user_id: userId, event_id: eventId, role, status },
        { onConflict: 'user_id,event_id,role' },
      );
    if (error) {
      console.warn(
        `[rbac/assign] upsertEventRole failed (user=${userId} event=${eventId} role=${role}): ${error.message}`,
      );
    }
  } catch (err) {
    console.warn(
      `[rbac/assign] upsertEventRole threw (user=${userId} event=${eventId} role=${role}):`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Resolve an account id (profiles.id) from an email address, case-insensitively.
 * For flows that only know an attendee/speaker/sponsor email and need to find
 * the linked account before upserting a role. Returns null if no account matches
 * (or on any error) — callers should only upsert when this returns a string.
 */
export async function resolveAccountIdByEmail(email: string | null | undefined): Promise<string | null> {
  if (!email || !email.trim()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', escapeLikePattern(email.trim()))
      .maybeSingle();
    if (error) {
      console.warn(`[rbac/assign] resolveAccountIdByEmail failed for ${email}: ${error.message}`);
      return null;
    }
    return (data?.id as string | undefined) ?? null;
  } catch (err) {
    console.warn(
      `[rbac/assign] resolveAccountIdByEmail threw for ${email}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
