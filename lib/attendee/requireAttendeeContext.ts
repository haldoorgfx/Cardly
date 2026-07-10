/**
 * requireAttendeeContext — shared guard for the dashboard-native attendee event
 * tools under /attending/[slug]/*.
 *
 * These are the logged-in twins of the public /e/[slug]/* engagement pages
 * (which stay reachable for guest-token holders). Here the viewer MUST be an
 * authenticated user with an active registration for the event — no ?reg=
 * guest tokens. Resolution reuses resolveViewerRegistrationId's session path,
 * so both surfaces stay behaviourally identical.
 *
 * SERVER-ONLY.
 */

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolvePublicSlug, type ResolvedPublicEvent } from '@/lib/events/resolvePublicSlug';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

export interface AttendeeContext {
  userId: string;
  registrationId: string;
  event: ResolvedPublicEvent['event'];
  eventPageTitle: string | null;
}

/**
 * Resolve (or refuse) the attendee context for a dashboard event-tools page.
 * - Not logged in → redirect to login with a next back to this page.
 * - Unknown slug → 404.
 * - Logged in but no active registration → redirect to /my-tickets (their
 *   tickets hub — the honest "you're not registered for this one" surface).
 */
export async function requireAttendeeContext(
  slug: string,
  currentPath: string,
): Promise<AttendeeContext> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(currentPath)}`);

  const resolved = await resolvePublicSlug(slug);
  if (!resolved) notFound();

  // Session-only resolution — no reg param on the dashboard surface.
  const registrationId = await resolveViewerRegistrationId(resolved.event.id, null);
  if (!registrationId) redirect('/my-tickets');

  return {
    userId: user.id,
    registrationId,
    event: resolved.event,
    eventPageTitle: resolved.eventPageTitle,
  };
}
