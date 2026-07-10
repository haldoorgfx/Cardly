/**
 * requireSponsorWorkspace — shared guard for the dashboard-native sponsor
 * workspace at /sponsoring/[sponsorId]/*.
 *
 * The logged-in twin of the token-gated /exhibitor/[token] portal (which stays
 * for account-less tokenholders). Here the viewer MUST be authenticated and
 * own the sponsor record (contact-email match, or the sponsor role for the
 * event when the record has no email). SERVER-ONLY.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { ownedSponsor } from '@/lib/rbac/ownership';

export interface SponsorWorkspace {
  userId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sponsor: any;
  event: { id: string; name: string; slug: string };
}

export async function requireSponsorWorkspace(
  sponsorId: string,
  currentPath: string,
): Promise<SponsorWorkspace> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(currentPath)}`);

  const sponsor = await ownedSponsor(user.id, sponsorId);
  if (!sponsor) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', sponsor.event_id)
    .single();
  if (!event) notFound();

  return { userId: user.id, sponsor, event };
}
