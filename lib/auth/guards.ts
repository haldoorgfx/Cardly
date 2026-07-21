/**
 * Server-side auth enforcement utilities.
 *
 * Usage in server components:
 *   const user = await requirePermission(THEME_EDIT);
 *
 * Usage in API routes:
 *   const user = await requirePermission(CHANGELOG_EDIT);
 *   // ... proceed knowing user has the permission
 *
 * These functions are SERVER-ONLY. Never import in client components.
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  ROLE_PERMISSIONS,
  IMPERSONATE,
  type Permission,
  type UserRole,
} from './permissions';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

// ── Core utilities ───────────────────────────────────────────────────────────

/**
 * Returns the currently authenticated user with their role from the database.
 * Returns null if not authenticated.
 *
 * Always reads role from the DB (not the JWT) so role changes take effect
 * without requiring re-authentication.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: profile.email ?? user.email ?? '',
    role: (profile.role as UserRole) ?? 'user',
  };
}

/**
 * Returns true if the user has the given permission.
 * Pure function — no async, no side effects.
 */
export function hasPermission(user: SessionUser, permission: Permission): boolean {
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
}

/**
 * Requires a specific permission. Redirects if missing.
 *
 * - Not authenticated → /login
 * - Authenticated but lacks permission → /dashboard
 * - Has permission → returns the SessionUser
 */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!hasPermission(user, permission)) redirect('/dashboard');
  return user;
}

/**
 * Coarse admin gate — redirects non-admins to /dashboard.
 * Use at the top of admin page server components and API routes
 * where any admin-level access is sufficient (fine-grained checks
 * use requirePermission for specific capabilities).
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    redirect('/dashboard');
  }
  return user;
}

/** True if this role is allowed to impersonate another account. Shared so
 * the impersonate API route and resolveEffectiveUserId() can never drift. */
export function canImpersonate(role: UserRole): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(IMPERSONATE);
}

export interface EffectiveUser {
  /** The id whose data a READ should be scoped to. */
  id: string;
  /** True when `id` is an impersonation target, not the real signed-in account. */
  isImpersonating: boolean;
  /** The real, signed-in account's id — always present, even while impersonating. */
  realUserId: string;
}

/**
 * Resolves the id whose data an organizer-dashboard PAGE should read, honoring
 * an active admin impersonation session (see app/api/admin/impersonate/route.ts).
 *
 * READ-ONLY BY DESIGN — call this only from page-level data fetches (event
 * lists, dashboard stats, settings views). Never use it to decide whether a
 * WRITE is allowed: every mutation route keeps checking the real caller via
 * `supabase.auth.getUser()` directly and is completely untouched by this
 * function, so a write attempted while impersonating fails exactly as if the
 * admin tried to edit a stranger's event — a safe default-closed outcome —
 * rather than silently executing as the impersonated account. Widening this
 * to writes would be a deliberate, separate decision, not a side effect of
 * calling this helper somewhere new.
 *
 * Re-verifies the impersonate permission and the target's existence on every
 * call (never trusts the cookie alone) — the cookie is httpOnly:false so
 * AppShell can read it client-side, but that also means it's just a hint;
 * the actual authorization is this function re-checking the real session's
 * role every time, exactly like the API route already does.
 */
export async function resolveEffectiveUserId(realUserId: string): Promise<EffectiveUser> {
  const notImpersonating: EffectiveUser = { id: realUserId, isImpersonating: false, realUserId };

  const targetId = cookies().get('eventera_impersonating')?.value;
  if (!targetId || targetId === realUserId) return notImpersonating;

  const sessionUser = await getSessionUser();
  if (!sessionUser || !canImpersonate(sessionUser.role)) return notImpersonating;

  // A stale cookie pointing at a deleted/renamed account must fall back to the
  // real user rather than resolve every query against a dangling id.
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: target } = await (admin as any).from('profiles').select('id').eq('id', targetId).maybeSingle();
  if (!target) return notImpersonating;

  return { id: targetId, isImpersonating: true, realUserId };
}

/**
 * API-route helper: returns a 403 Response instead of redirecting.
 * Use this in Next.js API routes (route.ts) where redirect() doesn't apply.
 */
export async function getAuthorizedUser(
  permission: Permission
): Promise<{ user: SessionUser } | { error: Response }> {
  const user = await getSessionUser();
  if (!user) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  if (!hasPermission(user, permission)) {
    return {
      error: new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { user };
}
