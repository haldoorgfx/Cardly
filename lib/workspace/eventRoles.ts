import { createAdminClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/rbac/roles';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';

/**
 * Every hat one account wears at ONE event, resolved in a single call.
 *
 * The product's problem was never that a person couldn't reach their speaker
 * or sponsor tools — it was that being an attendee AND a speaker at the same
 * event meant two unrelated destinations, each unaware the other existed. You
 * had to remember which sidebar entry held which half of your own event.
 *
 * This is the join that makes one workspace possible: given a user and an
 * event, what can they actually do here.
 *
 * The matching rules deliberately mirror lib/rbac/ownership.ts and
 * lib/registration/ownership.ts exactly. If they drifted, the role band would
 * offer a tab that the destination page then refuses to open — worse than not
 * offering it at all.
 *
 * SERVER-ONLY (service-role admin client).
 */
export interface EventRoles {
  /** Holds a live registration — the "I have a ticket" hat. */
  registrationId: string | null;
  /** speakers.id when this account owns a speaker record at this event. */
  speakerId: string | null;
  /** sponsors.id when this account owns a sponsor/exhibitor record. */
  sponsorId: string | null;
  /** Owns the event outright. */
  isOrganizer: boolean;
}

export async function resolveEventRoles(
  userId: string | null,
  eventId: string,
): Promise<EventRoles> {
  const empty: EventRoles = {
    registrationId: null, speakerId: null, sponsorId: null, isOrganizer: false,
  };
  if (!userId) return empty;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: profile } = await admin
    .from('profiles').select('email').eq('id', userId).maybeSingle();
  const email = (profile?.email as string | undefined)?.toLowerCase() ?? null;

  const [regRes, speakerRes, sponsorRes, eventRes] = await Promise.all([
    admin
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .or(registrationOwnershipFilter(userId, email))
      .not('status', 'in', '("cancelled","refunded")')
      .limit(1)
      .maybeSingle(),
    admin
      .from('speakers')
      .select('id, email')
      .eq('event_id', eventId),
    admin
      .from('sponsors')
      .select('id, contact_email')
      .eq('event_id', eventId),
    admin
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  // Email match is the strong signal. A record carrying NO email falls back to
  // an active event-scoped role, same as ownedSpeaker/ownedSponsor.
  const pick = async (
    rows: { id: string; email?: string | null; contact_email?: string | null }[] | null,
    field: 'email' | 'contact_email',
    role: 'speaker' | 'sponsor',
  ): Promise<string | null> => {
    const list = rows ?? [];
    const byEmail = email
      ? list.find(r => (r[field] as string | undefined)?.toLowerCase() === email)
      : undefined;
    if (byEmail) return byEmail.id;

    const emailless = list.filter(r => !r[field]);
    if (emailless.length && (await hasRole(userId, eventId, role))) return emailless[0].id;
    return null;
  };

  const [speakerId, sponsorId] = await Promise.all([
    pick(speakerRes.data, 'email', 'speaker'),
    pick(sponsorRes.data, 'contact_email', 'sponsor'),
  ]);

  return {
    registrationId: (regRes.data?.id as string | undefined) ?? null,
    speakerId,
    sponsorId,
    isOrganizer: !!eventRes.data,
  };
}

/** Roles that give this account a workspace at the event, in reading order. */
export interface RoleLink {
  key: 'attending' | 'speaking' | 'sponsoring' | 'organizing';
  label: string;
  href: string;
}

export function roleLinks(roles: EventRoles, slug: string, eventId: string): RoleLink[] {
  const out: RoleLink[] = [];
  if (roles.registrationId) {
    out.push({ key: 'attending', label: 'Attending', href: `/attending/${slug}` });
  }
  if (roles.speakerId) {
    out.push({ key: 'speaking', label: 'Speaking', href: `/speaking/${roles.speakerId}` });
  }
  if (roles.sponsorId) {
    out.push({ key: 'sponsoring', label: 'Sponsoring', href: `/sponsoring/${roles.sponsorId}` });
  }
  if (roles.isOrganizer) {
    out.push({ key: 'organizing', label: 'Organizing', href: `/events/${eventId}` });
  }
  return out;
}
