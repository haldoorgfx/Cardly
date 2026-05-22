/**
 * Permission constants and role → permission map.
 *
 * ALL server-side permission checks reference these string constants.
 * Never hardcode role names in business logic — use hasPermission() instead.
 *
 * Phase enforcement key:
 *   [1] = enforced in Phase 1 (now)
 *   [2] = defined now, enforced Phase 2
 *   [3] = defined now, enforced Phase 3
 *   [4] = defined now, enforced Phase 4
 */

// ── Theme / Brand ────────────────────────────────────────────────────────────
export const THEME_VIEW = 'theme:view';    // [1]
export const THEME_EDIT = 'theme:edit';    // [1]

// ── Changelog ────────────────────────────────────────────────────────────────
export const CHANGELOG_VIEW = 'changelog:view';  // [1]
export const CHANGELOG_EDIT = 'changelog:edit';  // [1]

// ── Audit log ────────────────────────────────────────────────────────────────
export const AUDIT_VIEW = 'audit:view';    // [1]

// ── User management ──────────────────────────────────────────────────────────
export const USER_VIEW        = 'user:view';         // [1]
export const USER_ROLE_CHANGE = 'user:role_change';  // [1] — admin is further constrained in API
export const USER_SUSPEND     = 'user:suspend';      // [2]
export const USER_DELETE      = 'user:delete';       // [2]

// ── Event management (admin-level, not owner-level) ──────────────────────────
export const EVENT_VIEW_ALL = 'event:view_all';  // [2]
export const EVENT_EDIT_ALL = 'event:edit_all';  // [2]

// ── Other capabilities ───────────────────────────────────────────────────────
export const TEMPLATE_MANAGE = 'template:manage';  // [2]
export const BILLING_MANAGE  = 'billing:manage';   // [2]
export const TEAM_MANAGE     = 'team:manage';      // [4]
export const CONTENT_EDIT    = 'content:edit';     // [3]
export const IMPERSONATE     = 'impersonate';      // [4]

// ── Types ────────────────────────────────────────────────────────────────────
export type Permission = string;
export type UserRole = 'user' | 'studio' | 'admin' | 'super_admin';

// ── Role → permission sets ───────────────────────────────────────────────────

/** Permissions shared by admin and super_admin */
const ADMIN_PERMISSIONS: Permission[] = [
  THEME_VIEW,
  THEME_EDIT,
  CHANGELOG_VIEW,
  CHANGELOG_EDIT,
  AUDIT_VIEW,
  USER_VIEW,
  USER_ROLE_CHANGE, // admin: only user↔studio (enforced at API route level)
  CONTENT_EDIT,    // [3] — CMS page/block/navigation/media editing
];

/** super_admin gets everything admin has, plus destructive/elevated ops */
const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  USER_SUSPEND,
  USER_DELETE,
  EVENT_VIEW_ALL,
  EVENT_EDIT_ALL,
  TEMPLATE_MANAGE,
  BILLING_MANAGE,
  TEAM_MANAGE,
  CONTENT_EDIT,
  IMPERSONATE,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user:        [],
  studio:      [],       // studio = user-level admin access (none); product privileges in Phase 4
  admin:       ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
};
