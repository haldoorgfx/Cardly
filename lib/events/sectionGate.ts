import { createAdminClient } from '@/lib/supabase/server';

/**
 * Attendee-app section flags live on `event_pages.features` (migration 038) as a
 * JSON record of `{ [key]: boolean }`. The canonical keys are defined by the
 * organizer's Features toggle (components/events/EventFeaturesManager.tsx):
 *   schedule · speakers · sponsors · networking · qa · polls · community · gamification
 *
 * Sections default ON — a section is disabled ONLY when its flag is explicitly
 * `false`. This mirrors the main public event page's `featureOn` logic
 * (components/events/PublicEventPageClient.tsx) so the standalone section routes
 * agree with the tab bar.
 */
export function isSectionEnabled(
  features: Record<string, boolean> | null | undefined,
  key: string,
): boolean {
  return features?.[key] !== false;
}

/**
 * Loads the `features` record for an event. Returns `{}` when the row/column is
 * absent (pre-038), which — combined with the default-ON rule above — keeps
 * every section visible. `features` isn't in the generated types yet, so cast.
 */
export async function getEventFeatures(eventId: string): Promise<Record<string, boolean>> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('event_pages')
    .select('features')
    .eq('event_id', eventId)
    .maybeSingle();
  return (data?.features ?? {}) as Record<string, boolean>;
}
