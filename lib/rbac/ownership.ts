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
