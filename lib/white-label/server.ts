/**
 * White-label resolution (server-only).
 *
 * White-label branding is a Studio-plan feature. These helpers return the
 * organizer's active branding, or `null` when the owner isn't on Studio (so a
 * downgrade cleanly reverts every attendee surface back to Eventera).
 */

import { createAdminClient } from '@/lib/supabase/server';

export interface WhiteLabel {
  brandName: string | null;
  primaryColor: string;
  logoUrl: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  fromName: string | null;
  replyToEmail: string | null;
  hidePoweredBy: boolean;
}

const LEGACY_COLORS = ['#7300ff', '#6c63ff', '#6366f1', '#8b5cf6', '#7c3aed'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(row: any): WhiteLabel {
  let primary = (row.primary_color as string) || '#1F4D3A';
  if (LEGACY_COLORS.includes(primary.toLowerCase())) primary = '#1F4D3A';
  return {
    brandName: row.brand_name || null,
    primaryColor: primary,
    logoUrl: row.logo_url || null,
    customDomain: row.custom_domain || null,
    domainVerified: Boolean(row.domain_verified),
    fromName: row.from_name || null,
    replyToEmail: row.reply_to_email || null,
    hidePoweredBy: Boolean(row.hide_powered_by),
  };
}

/**
 * Active white-label for a user, or null when they aren't on Studio / have no
 * settings row.
 */
export async function getWhiteLabelByUser(userId: string): Promise<WhiteLabel | null> {
  if (!userId) return null;
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  if (!profile || profile.plan !== 'studio') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('white_label_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!data) return null;
  return normalize(data);
}

/** Active white-label for the organizer that owns `eventId`. */
export async function getWhiteLabelByEvent(eventId: string): Promise<WhiteLabel | null> {
  if (!eventId) return null;
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('user_id')
    .eq('id', eventId)
    .single();

  if (!event?.user_id) return null;
  return getWhiteLabelByUser(event.user_id as string);
}
