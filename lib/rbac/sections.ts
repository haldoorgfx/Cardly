/**
 * Section resolver — turns an account's roles into the set of top-level nav
 * sections that should light up in the unified dashboard shell.
 *
 * This is the single source of truth for "which hats does this account wear?".
 * The client shell fetches it via `/api/me/roles`; server pages (/home,
 * /speaking, /sponsoring) call `getVisibleSections()` directly.
 *
 * SERVER-ONLY. Composes `getUserRoles()` (which uses the service-role admin
 * client) plus a registration-by-email fallback for the "tickets" section, so
 * an account that registered for an event before migration 055 backfilled its
 * roles still sees "My tickets & agenda". Never import into a client component.
 *
 * Type note: like roles.ts, we cast the admin client to `any` at the query
 * boundary because the new tables aren't in types/database.ts (which we must
 * not edit).
 */

import { createAdminClient } from '@/lib/supabase/server';
import { getUserRoles, roleKinds, eventsWithRole, type UserRoles } from '@/lib/rbac/roles';

export interface VisibleSections {
  /** Attendee surface — "My tickets & agenda". */
  tickets: boolean;
  /** Speaker surface — "Speaking". */
  speaking: boolean;
  /** Sponsor / exhibitor surface — "Sponsoring". */
  sponsoring: boolean;
  /** Organizer surface — the full events workspace. */
  organizing: boolean;
  /** Platform admin surface. */
  admin: boolean;
  /** Event ids the account speaks at. */
  speakingEventIds: string[];
  /** Event ids the account sponsors. */
  sponsoringEventIds: string[];
  /** Event ids the account organizes. */
  organizingEventIds: string[];
}

/**
 * Resolve the full set of visible sections for an account.
 *
 * "tickets" is true if the account holds any ACTIVE `attendee` event role OR has
 * any registration matched by the profile's email — the email fallback matches
 * the my-tickets page, so pre-055 registrations still surface.
 *
 * Never throws on missing rows; an unknown account resolves to all-false.
 */
export async function getVisibleSections(userId: string): Promise<VisibleSections> {
  const roles: UserRoles = await getUserRoles(userId);
  const kinds = roleKinds(roles);

  const speakingEventIds = eventsWithRole(roles, 'speaker');
  const sponsoringEventIds = eventsWithRole(roles, 'sponsor');
  const organizingEventIds = eventsWithRole(roles, 'organizer');

  // Admin gate: the canonical signal is profiles.platform_role, but some
  // accounts predate that column and only carry the legacy profiles.role. Read
  // the legacy role directly (admin client, same pattern as this file) and OR
  // it in so the gate can't silently drift between the two columns.
  const legacyRole = await legacyProfileRole(userId);
  const admin =
    roles.platformRole === 'admin' ||
    roles.platformRole === 'super_admin' ||
    legacyRole === 'admin' ||
    legacyRole === 'super_admin';

  // "tickets" — attendee role OR a registration matched by email (fallback).
  let tickets = kinds.has('attendee');
  if (!tickets) {
    tickets = await hasRegistrationByEmail(userId);
  }

  return {
    tickets,
    speaking: kinds.has('speaker'),
    sponsoring: kinds.has('sponsor'),
    organizing: kinds.has('organizer'),
    admin,
    speakingEventIds,
    sponsoringEventIds,
    organizingEventIds,
  };
}

/**
 * Read the account's legacy `profiles.role` (admin client, bypasses RLS). This
 * predates `platform_role`; we OR it into the admin gate so an account that was
 * only ever marked admin via the legacy column still resolves as admin.
 */
async function legacyProfileRole(userId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const { data } = await db
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return (data?.role as string | undefined) ?? null;
}

/**
 * Fallback for the "tickets" section: does this account have any registration
 * under its profile email? Mirrors the email match used by /my-tickets so an
 * account that registered before roles were backfilled still sees the section.
 */
async function hasRegistrationByEmail(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: profile } = await db
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  const email = (profile?.email as string | undefined)?.toLowerCase();

  // Match by user_id OR (if we have one) the profile email — same shape as
  // /my-tickets. Registrations are keyed by attendee_email / user_id.
  const filter = email
    ? `attendee_email.eq.${email},user_id.eq.${userId}`
    : `user_id.eq.${userId}`;

  const { data } = await db
    .from('registrations')
    .select('id', { head: false })
    .or(filter)
    .limit(1);

  return Boolean(data && data.length > 0);
}
