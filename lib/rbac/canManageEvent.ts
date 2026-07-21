/**
 * "May this account manage this event?" — the single answer to a question the
 * codebase previously answered inline in 118 places.
 *
 * Every one of those places wrote the same filter:
 *
 *     admin.from('events').select(…).eq('id', eventId).eq('user_id', user.id)
 *
 * which encodes "manage" as "is literally the row's owner". That is why Teams
 * granted nothing: an invited teammate is not `events.user_id`, and no amount of
 * team_members rows could change a filter that never reads them. The roster, the
 * seat billing and the invite emails all worked; the access did not exist.
 *
 * ACCESS RULE
 *   You may manage an event if you own it, OR if you are a member of a team
 *   whose owner owns it. Team role ('admin' | 'member') governs administering
 *   the TEAM — inviting, revoking, removing — which is enforced separately in
 *   the /api/teams routes. It deliberately does not subdivide event access:
 *   the Teams UI promises "EVENT ACCESS: All events", and a second, finer
 *   permission axis nobody asked for is how this kind of thing rots.
 *
 * SERVER-ONLY. Uses the service-role client (bypasses RLS), like the rest of
 * lib/rbac — never import this into a client component.
 *
 * NOTE ON THE DATABASE HALF: routes that use the SESSION client are gated by
 * RLS, and the RPCs by the SQL function `can_manage_event()`. Those are a
 * separate enforcement path from this file, and migration 116 widens them the
 * same way. Changing only this module would leave team members able to act
 * through the API but not through anything RLS-gated — the two must move
 * together.
 */

import { createAdminClient } from '@/lib/supabase/server';

export interface ManageableEvent {
  id: string;
  user_id: string;
  /** True when the caller is the literal owner rather than a teammate. */
  isOwner: boolean;
}

/**
 * Returns the event when `userId` may manage it, otherwise null.
 *
 * Shaped to drop into the call sites it replaces: they treated a null/absent
 * row as "404 / not yours", and so should callers of this.
 */
export async function manageableEvent(
  userId: string,
  eventId: string,
): Promise<ManageableEvent | null> {
  if (!userId || !eventId) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: event } = await admin
    .from('events')
    .select('id, user_id')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return null;

  const ownerId = event.user_id as string;
  if (ownerId === userId) return { id: event.id, user_id: ownerId, isOwner: true };

  return (await sharesTeamWithOwner(userId, ownerId))
    ? { id: event.id, user_id: ownerId, isOwner: false }
    : null;
}

/** Boolean form, for call sites that only need the decision. */
export async function canManageEvent(userId: string, eventId: string): Promise<boolean> {
  return (await manageableEvent(userId, eventId)) !== null;
}

/**
 * Is `userId` on a team owned by `ownerId`?
 *
 * Two queries rather than an embedded join: PostgREST resolves embeds by
 * foreign-key name, and a rename would turn this into a silent `null` — which
 * here means "access denied for everyone on a team", a failure that looks like
 * a permissions bug rather than a broken query. Plain filters cannot do that.
 */
async function sharesTeamWithOwner(userId: string, ownerId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: teams } = await admin
    .from('teams')
    .select('id')
    .eq('owner_id', ownerId);

  const teamIds = (teams ?? []).map((t: { id: string }) => t.id);
  if (teamIds.length === 0) return false;

  const { data: membership } = await admin
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .in('team_id', teamIds)
    .limit(1);

  return Boolean(membership && membership.length > 0);
}

/**
 * The set of `events.user_id` values this account may manage: itself, plus the
 * owner of every team it belongs to.
 *
 * THIS IS THE ONE TO REACH FOR when converting an existing ownership check.
 * The 118 call sites all had the same shape —
 *
 *     .from('events').select(<whatever they needed>).eq('user_id', user.id)
 *
 * — so the conversion is a single token:
 *
 *     .eq('user_id', user.id)  ->  .in('user_id', await manageableOwnerIds(user.id))
 *
 * Nothing else about the query moves: the same columns, the same `.single()` or
 * `.maybeSingle()`, the same null-means-denied handling downstream. That matters
 * more than elegance here — restructuring a hundred authorization checks by hand
 * is exactly the kind of change that quietly leaves one of them open, and a
 * substitution a reviewer can grep for cannot hide a mistake that way.
 *
 * Always contains `userId`, so an account with no team behaves precisely as
 * before: `.in('user_id', [me])` is `.eq('user_id', me)`.
 */
export async function manageableOwnerIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: memberships } = await admin
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId);

  const teamIds = (memberships ?? []).map((m: { team_id: string }) => m.team_id);
  if (teamIds.length === 0) return [userId];

  const { data: teams } = await admin
    .from('teams')
    .select('owner_id')
    .in('id', teamIds);

  const ownerIds = new Set<string>([userId]);
  for (const t of teams ?? []) ownerIds.add((t as { owner_id: string }).owner_id);
  return Array.from(ownerIds);
}

/**
 * Event ids this account can manage THROUGH A TEAM only — excluding its own.
 *
 * Separate from `manageableEventIds` because the nav resolver already knows the
 * account's own events from `user_event_roles` and only needs the delta. Returns
 * [] after one cheap query for the overwhelming majority of accounts, which are
 * on no team at all.
 */
export async function teamSharedEventIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const ownerIds = (await manageableOwnerIds(userId)).filter(id => id !== userId);
  if (ownerIds.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: events } = await admin
    .from('events')
    .select('id')
    .in('user_id', ownerIds);

  return (events ?? []).map((e: { id: string }) => e.id);
}

/**
 * Every event id this account may manage — owned plus team-shared.
 * For list pages that would otherwise need an N+1 of per-event checks.
 */
export async function manageableEventIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: events } = await admin
    .from('events')
    .select('id')
    .in('user_id', await manageableOwnerIds(userId));

  return (events ?? []).map((e: { id: string }) => e.id);
}
