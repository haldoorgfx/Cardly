import { createAdminClient, createClient } from '@/lib/supabase/server';

/**
 * Registration statuses that count as an "active" attendee — only these may
 * post, vote, book, or submit in the attendee engagement flows.
 */
const ACTIVE_STATUSES = ['confirmed', 'checked_in'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve the viewer's registration UUID for a given event.
 *
 * The attendee engagement write APIs validate `registration_id` as a UUID and
 * check ownership via `assertOwnsRegistration`. Section-nav links from the event
 * hub do NOT carry `?reg=`, so a logged-in attendee arriving from the hub has no
 * registration id. This helper recovers the correct UUID from, in order:
 *
 *  1. A `reg` param that is already a valid registration UUID for this event.
 *  2. A `reg` param that is a `qr_code_token` (guest link) → its registration id.
 *  3. The authenticated user's own active registration for this event
 *     (matched by user_id, or case-insensitively by attendee_email).
 *
 * Returns the registration UUID, or null when none can be resolved.
 * Any failure returns null — this never throws.
 */
export async function resolveViewerRegistrationId(
  eventId: string,
  regParam?: string | null,
): Promise<string | null> {
  try {
    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminAny = admin as any;

    const param = typeof regParam === 'string' ? regParam.trim() : '';

    // 1. Direct UUID → verify it's a valid, active registration for this event.
    if (param && UUID_RE.test(param)) {
      const { data: reg } = await adminAny
        .from('registrations')
        .select('id, status, event_id')
        .eq('id', param)
        .eq('event_id', eventId)
        .maybeSingle();
      if (reg && ACTIVE_STATUSES.includes(reg.status) && reg.event_id === eventId) {
        return reg.id as string;
      }
      // else fall through
    } else if (param) {
      // 2. Non-UUID token → treat as a qr_code_token guest link.
      const { data: reg } = await adminAny
        .from('registrations')
        .select('id, status, event_id')
        .eq('qr_code_token', param)
        .eq('event_id', eventId)
        .in('status', ACTIVE_STATUSES)
        .maybeSingle();
      if (reg && reg.event_id === eventId) {
        return reg.id as string;
      }
      // else fall through
    }

    // 3. Fall back to the authenticated user's own registration for this event.
    let user: { id: string; email?: string | null } | null = null;
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user ?? null;
    } catch {
      user = null;
    }

    if (user) {
      const { data: byUser } = await adminAny
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .in('status', ACTIVE_STATUSES)
        .limit(1)
        .maybeSingle();
      if (byUser?.id) return byUser.id as string;

      if (user.email) {
        const { data: byEmail } = await adminAny
          .from('registrations')
          .select('id')
          .eq('event_id', eventId)
          .ilike('attendee_email', user.email)
          .in('status', ACTIVE_STATUSES)
          .limit(1)
          .maybeSingle();
        if (byEmail?.id) return byEmail.id as string;
      }
    }

    return null;
  } catch {
    return null;
  }
}
