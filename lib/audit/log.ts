/**
 * Audit logging utility.
 *
 * Writes to audit_log via the service-role client (bypasses RLS).
 * Call this after every successful admin mutation.
 *
 * Usage:
 *   await logAudit(user, 'theme.update', 'site_settings', '1', { before, after });
 *   await logAudit(user, 'changelog.create', 'changelog_entry', entry.id);
 */

import { createAdminClient } from '@/lib/supabase/server';
import type { SessionUser } from '@/lib/auth/guards';

/**
 * Log an admin action to the audit_log table.
 *
 * @param actor   - The authenticated user performing the action
 * @param action  - Dot-namespaced action string, e.g. "theme.update"
 * @param entityType - The affected table/resource, e.g. "site_settings"
 * @param entityId   - The primary key of the affected row (string-cast)
 * @param changes    - Optional before/after snapshot: { before: {...}, after: {...} }
 */
export async function logAudit(
  actor: SessionUser,
  action: string,
  entityType?: string,
  entityId?: string,
  changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null
): Promise<void> {
  try {
    const adminClient = createAdminClient();
    await adminClient.from('audit_log').insert({
      actor_id:    actor.id,
      actor_email: actor.email,
      action,
      entity_type: entityType ?? null,
      entity_id:   entityId ?? null,
      changes:     (changes ?? null) as import('@/types/database').Json | null,
    });
  } catch (err) {
    // Audit failures must never crash the main operation.
    // Log to console for visibility but swallow the error.
    console.error('[audit] Failed to write audit log entry:', err);
  }
}
