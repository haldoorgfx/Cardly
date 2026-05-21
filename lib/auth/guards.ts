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
import { createClient } from '@/lib/supabase/server';
import {
  ROLE_PERMISSIONS,
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
