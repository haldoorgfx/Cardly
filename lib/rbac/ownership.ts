/**
 * Ownership checks — "is this logged-in account THIS speaker / THIS sponsor?"
 *
 * Used by the dashboard workspaces (/speaking/*, /sponsoring/*) and by the
 * write APIs (/api/speakers/[id]/profile, /api/sponsors/[id]/profile) so the
 * page gate and the API gate can never drift apart.
 *
 * Identity model (same as the resolver/backfill):
 *  - speakers.email / sponsors.contact_email matched case-insensitively to the
 *    account's profile email is the strong signal.
 *  - If the record carries NO email, an active event-scoped role
 *    (speaker/sponsor) for that event is accepted as the fallback signal.
 *
 * SERVER-ONLY (service-role admin client).
 */

import { createAdminClient } from '@/lib/supabase/server';
import { hasRole } from '@/lib/rbac/roles';

async function profileEmail(userId: string): Promise<string | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('profiles').select('email').eq('id', userId).single();
  return (data?.email as string | undefined)?.toLowerCase() ?? null;
}

/** Does this account own this speaker record? Returns the speaker row (any) or null. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ownedSpeaker(userId: string, speakerId: string): Promise<any | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: speaker } = await admin
    .from('speakers')
    .select('*')
    .eq('id', speakerId)
    .maybeSingle();
  if (!speaker) return null;

  const email = await profileEmail(userId);
  const speakerEmail = (speaker.email as string | undefined)?.toLowerCase() ?? null;

  if (speakerEmail && email && speakerEmail === email) return speaker;
  if (!speakerEmail && (await hasRole(userId, speaker.event_id as string, 'speaker'))) return speaker;
  return null;
}

/** Does this account own this sponsor record? Returns the sponsor row (any) or null. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ownedSponsor(userId: string, sponsorId: string): Promise<any | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: sponsor } = await admin
    .from('sponsors')
    .select('*')
    .eq('id', sponsorId)
    .maybeSingle();
  if (!sponsor) return null;

  const email = await profileEmail(userId);
  const contactEmail = (sponsor.contact_email as string | undefined)?.toLowerCase() ?? null;

  if (contactEmail && email && contactEmail === email) return sponsor;
  if (!contactEmail && (await hasRole(userId, sponsor.event_id as string, 'sponsor'))) return sponsor;
  return null;
}

/**
 * Does this account have check-in access for this event? True for the event
 * owner, or for an account whose email matches an active `event_staff` row
 * with role 'check_in' or 'manager' (the two roles the Staff roles UI
 * describes as including "Scan QR codes, add walk-ins").
 *
 * Invites are granted by email (see app/api/events/[id]/staff/route.ts),
 * mirroring the speaker/sponsor ownership pattern above — no separate
 * "accept invite" step required.
 */
export async function hasCheckInAccess(userId: string, eventId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (event) return true;

  const email = await profileEmail(userId);
  if (!email) return false;

  const { data: staff } = await admin
    .from('event_staff')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .in('role', ['check_in', 'manager'])
    .neq('status', 'removed')
    .maybeSingle();
  return Boolean(staff);
}

/**
 * Does this account have Q&A / polls moderation access for this event? True for
 * the event owner, or for an account whose email matches an active `event_staff`
 * row with role 'moderator' or 'manager' (the Staff roles UI describes 'moderator'
 * as including "Moderate Q&A, polls, photo wall, live display").
 */
export async function hasModeratorAccess(userId: string, eventId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: event } = await admin
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  if (event) return true;

  const email = await profileEmail(userId);
  if (!email) return false;

  const { data: staff } = await admin
    .from('event_staff')
    .select('id')
    .eq('event_id', eventId)
    .eq('email', email)
    .in('role', ['moderator', 'manager'])
    .neq('status', 'removed')
    .maybeSingle();
  return Boolean(staff);
}
