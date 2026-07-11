import { createAdminClient, createClient } from '@/lib/supabase/server';
import { ownedSponsor } from '@/lib/rbac/ownership';
import { timingSafeEqual } from 'crypto';

/** Constant-time string compare that tolerates length mismatch. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Authorize a caller to manage a sponsor record (logos, resources, profile).
 *
 * Allowed when ANY of:
 *  - a valid sponsor `invite_token` is presented (token-gated portal), OR
 *  - the authenticated user owns the event the sponsor belongs to, OR
 *  - the authenticated user owns the sponsor account (email/role match).
 *
 * Returns false for everyone else.
 */
export async function canManageSponsor(
  sponsorId: string,
  token: string | null | undefined,
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: sponsor } = await admin
    .from('sponsors')
    .select('id, event_id, invite_token')
    .eq('id', sponsorId)
    .maybeSingle();
  if (!sponsor) return false;

  // 1) Token path (sponsor self-service portal).
  if (token && sponsor.invite_token && safeEqual(token, sponsor.invite_token as string)) {
    return true;
  }

  // 2) Authenticated organizer / sponsor-account path.
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Event owner?
    const { data: ev } = await admin
      .from('events')
      .select('id')
      .eq('id', sponsor.event_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ev) return true;

    // Sponsor's own account?
    if (await ownedSponsor(user.id, sponsorId)) return true;
  } catch {
    return false;
  }

  return false;
}
