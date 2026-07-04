/**
 * Exhibitor portal viewer helper — PURELY ADDITIVE to the token flow.
 *
 * The exhibitor portal (`app/exhibitor/[token]/*`) is token-gated: an exhibitor
 * with only an `invite_token` and NO account must keep full access. This helper
 * NEVER gates or redirects — it only answers "is the current visitor a logged-in
 * user who holds the `sponsor` role for THIS event?" so the shell can show a
 * small, optional "Back to your dashboard" link. Anonymous token visitors resolve
 * to `false` and see nothing new.
 *
 * SERVER-ONLY (reads the auth cookie + the service-role role table).
 */

import { createClient } from '@/lib/supabase/server';
import { isSponsorAt } from '@/lib/rbac/roles';

/**
 * True when the visitor is authenticated AND holds an active `sponsor` role at
 * `eventId`. Never throws; any failure resolves to `false` (link simply hidden),
 * so it can never break the token experience.
 */
export async function isLoggedInSponsorFor(eventId: string): Promise<boolean> {
  try {
    if (!eventId) return false;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    return await isSponsorAt(user.id, eventId);
  } catch {
    return false;
  }
}
