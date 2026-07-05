import { createAdminClient } from '@/lib/supabase/server';

/**
 * Notification preference gate.
 *
 * The unified Notifications center (app/(app)/notifications/NotificationsCenter.tsx)
 * writes BARE category keys to profiles.notification_prefs:
 *
 *   { tickets, reminders, agenda_changes, organizer_follows, waitlist, recommendations }
 *
 * That bare-key scheme is the canonical one. Migration 010 seeded a legacy
 * channel-suffixed default ("reminders_email", "reminders_whatsapp", …). Because
 * this gate defaults to ON when a bare key is absent, those legacy defaults are
 * harmless — a user who has never touched settings is never suppressed. For extra
 * safety we also honour an explicit legacy `<key>_email` value when the bare key
 * is absent, so an old explicit opt-out is still respected.
 *
 * Opt-out model: a category is allowed UNLESS the user has EXPLICITLY set it to
 * false. Missing / null / unset → allowed. Any read error → allowed (fail-open,
 * so a bug can never silently drop a wanted notification).
 */

export type NotifKey =
  | 'tickets'
  | 'reminders'
  | 'agenda_changes'
  | 'organizer_follows'
  | 'waitlist'
  | 'recommendations';

/**
 * Returns whether the given notification category is enabled for this user.
 *
 * @param userId  profiles.id of the recipient
 * @param key     the canonical bare category key
 * @param channel reserved for future per-channel gating; the current UI is a
 *                single toggle per category, so this is informational only.
 *                When absent (bare key unset) we fall back to the legacy
 *                `<key>_email` value for the 'email' channel.
 */
export async function isNotifAllowed(
  userId: string,
  key: NotifKey,
  channel: 'email' | 'inapp' = 'inapp',
): Promise<boolean> {
  if (!userId) return true;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('profiles')
      .select('notification_prefs')
      .eq('id', userId)
      .maybeSingle();

    // Any error, or no row → fail open (never suppress).
    if (error || !data) return true;

    const prefs = (data.notification_prefs ?? null) as Record<string, boolean> | null;
    if (!prefs || typeof prefs !== 'object') return true;

    // 1. Canonical bare key wins.
    if (typeof prefs[key] === 'boolean') return prefs[key];

    // 2. Fall back to the legacy channel-suffixed key, if the user set one.
    const legacyKey = `${key}_${channel === 'email' ? 'email' : 'inapp'}`;
    if (typeof prefs[legacyKey] === 'boolean') return prefs[legacyKey];
    // Legacy scheme only ever had `_email` / `_whatsapp`; for in-app fall back
    // to the email flavour so an explicit legacy opt-out still counts.
    const legacyEmailKey = `${key}_email`;
    if (typeof prefs[legacyEmailKey] === 'boolean') return prefs[legacyEmailKey];

    // 3. Never explicitly set → allowed (opt-out model).
    return true;
  } catch {
    // Fail open — a bug must never suppress a notification.
    return true;
  }
}
