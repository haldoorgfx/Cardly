/**
 * Authorization for organizer/contributor writes to an event's content
 * (sponsor logos, speaker slides, etc.). SERVER-ONLY.
 *
 * A caller may manage an event's content if they are authenticated AND either:
 *  - they own the event (events.user_id === user.id), OR
 *  - they hold an active role on the event in user_event_roles (organizer,
 *    staff, speaker, sponsor — the unified-dashboard contributor roles).
 *
 * Returns a discriminated result so route handlers can map straight to a
 * Response with the right status.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';

export type EventAuth =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 404; error: string };

const CONTRIBUTOR_ROLES = ['organizer', 'staff', 'speaker', 'sponsor'];

export async function authorizeEventContent(eventId: string): Promise<EventAuth> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' };

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('user_id')
    .eq('id', eventId)
    .maybeSingle();
  if (!event) return { ok: false, status: 404, error: 'Event not found' };

  if ((event as { user_id?: string }).user_id === user.id) {
    return { ok: true, userId: user.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (admin as any)
    .from('user_event_roles')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .in('role', CONTRIBUTOR_ROLES)
    .limit(1)
    .maybeSingle();

  if (role) return { ok: true, userId: user.id };
  return { ok: false, status: 403, error: 'Forbidden' };
}

/** Resolve the event a sponsor belongs to. Null if the sponsor doesn't exist. */
export async function eventIdForSponsor(sponsorId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('sponsors')
    .select('event_id')
    .eq('id', sponsorId)
    .maybeSingle();
  return (data as { event_id?: string } | null)?.event_id ?? null;
}

/** Resolve the event a session belongs to. Null if the session doesn't exist. */
export async function eventIdForSession(sessionId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('sessions')
    .select('event_id')
    .eq('id', sessionId)
    .maybeSingle();
  return (data as { event_id?: string } | null)?.event_id ?? null;
}

/**
 * Validate an uploaded file by sniffing its magic bytes — never trust the
 * client-declared Content-Type. Returns the detected MIME, or null if it's not
 * one of the allowed image types.
 */
export function sniffImageMime(
  buf: ArrayBuffer,
): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | null {
  const b = new Uint8Array(buf);
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) return 'image/png';
  const ascii = (i: number, s: string) => {
    for (let k = 0; k < s.length; k++) {
      if (b[i + k] !== s.charCodeAt(k)) return false;
    }
    return true;
  };
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return 'image/webp';
  if (ascii(0, 'GIF8')) return 'image/gif';
  return null;
}
