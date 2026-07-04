/**
 * Role resolver — the single source of truth for "what can this account do,
 * and where?".
 *
 * A Eventera account holds ONE global platform role (user / admin / super_admin)
 * plus MANY event-scoped roles (attendee / speaker / sponsor / organizer / staff)
 * stored in `user_event_roles` (migration 055). The unified dashboard nav is
 * driven entirely by `getUserRoles()` — each surface lights up when the account
 * holds the matching role.
 *
 * SERVER-ONLY. These helpers use the service-role admin client, which bypasses
 * RLS, so never import this into a client component. Callers are responsible for
 * having already authenticated the request (e.g. createClient().auth.getUser()).
 *
 * Type note: `user_event_roles` is a new table not yet in types/database.ts
 * (which we must not edit). We cast the admin client to `any` at the query
 * boundary and re-narrow into the exported interfaces below, so the rest of the
 * codebase stays type-safe.
 */

import { createAdminClient } from '@/lib/supabase/server';

// ── Types ────────────────────────────────────────────────────────────────────

export type EventRole = 'attendee' | 'speaker' | 'sponsor' | 'organizer' | 'staff';
export type EventRoleStatus = 'active' | 'pending' | 'revoked';
export type PlatformRole = 'user' | 'admin' | 'super_admin';

export interface EventRoleRow {
  event_id: string;
  role: EventRole;
  status: EventRoleStatus;
}

export interface UserRoles {
  userId: string;
  platformRole: PlatformRole;
  /** Only rows with status = 'active'. */
  eventRoles: EventRoleRow[];
}

// ── Core resolver ──────────────────────────────────────────────────────────────

/**
 * Returns the account's global platform role plus all ACTIVE event-scoped roles.
 * Safe to call for any authenticated user id. Never throws on missing rows —
 * an unknown/empty account resolves to platformRole 'user' with no event roles.
 */
export async function getUserRoles(userId: string): Promise<UserRoles> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [profileRes, rolesRes] = await Promise.all([
    admin.from('profiles').select('platform_role').eq('id', userId).single(),
    admin
      .from('user_event_roles')
      .select('event_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active'),
  ]);

  const platformRole: PlatformRole =
    (profileRes?.data?.platform_role as PlatformRole | undefined) ?? 'user';

  const eventRoles: EventRoleRow[] = ((rolesRes?.data ?? []) as EventRoleRow[]).map((r) => ({
    event_id: r.event_id,
    role: r.role,
    status: r.status,
  }));

  return { userId, platformRole, eventRoles };
}

// ── Scoped helpers ──────────────────────────────────────────────────────────────

/**
 * Does this account hold a given ACTIVE role at a given event?
 */
export async function hasRole(
  userId: string,
  eventId: string,
  role: EventRole,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('user_event_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .eq('role', role)
    .eq('status', 'active')
    .maybeSingle();
  return Boolean(data);
}

export function isOrganizerOf(userId: string, eventId: string): Promise<boolean> {
  return hasRole(userId, eventId, 'organizer');
}

export function isSpeakerAt(userId: string, eventId: string): Promise<boolean> {
  return hasRole(userId, eventId, 'speaker');
}

export function isSponsorAt(userId: string, eventId: string): Promise<boolean> {
  return hasRole(userId, eventId, 'sponsor');
}

/**
 * Global platform admin check (admin OR super_admin). Independent of any event.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('profiles')
    .select('platform_role')
    .eq('id', userId)
    .single();
  const role = (data?.platform_role as PlatformRole | undefined) ?? 'user';
  return role === 'admin' || role === 'super_admin';
}

// ── Convenience derivations (no extra queries) ─────────────────────────────────

/** Distinct set of role kinds the account holds anywhere — drives which top-level
 *  nav sections ("Speaking", "Sponsoring", "Organizing", …) are visible. */
export function roleKinds(roles: UserRoles): Set<EventRole> {
  return new Set(roles.eventRoles.map((r) => r.role));
}

/** Event ids where the account holds a given role — for building per-section lists. */
export function eventsWithRole(roles: UserRoles, role: EventRole): string[] {
  return roles.eventRoles.filter((r) => r.role === role).map((r) => r.event_id);
}
