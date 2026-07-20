import { notFound, redirect } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';

/**
 * Single entry point for the attendee's event workspace under
 * /attending/[slug]/*.
 *
 * These pages used to live on the public /e/[slug]/* routes, which meant an
 * attendee doing something that is entirely about THEM — their agenda, their
 * messages, the room only ticket-holders can enter — got the marketing nav,
 * the marketing footer and a document-style layout. The deciding question is
 * not "does this need login" but "whose identity is this page about": the
 * event's own pages stay public, anything personalised belongs in the
 * dashboard shell.
 *
 * Three things every one of those pages has to get right, gathered here so
 * they cannot drift apart again:
 *
 *  1. The slug resolves to a real event (custom slug or events.slug).
 *  2. The organizer hasn't switched the section off. The old /attending
 *     duplicates skipped this check, which is exactly why they were collapsed
 *     into the public routes last time — reinstating them without the gate
 *     would reintroduce that bug.
 *  3. The viewer actually holds an active registration. `reg` is still honoured
 *     so the links already sitting in people's inboxes keep working.
 */
export interface AttendeeWorkspace {
  eventId: string;
  eventName: string;
  slug: string;
  registrationId: string;
}

export async function resolveAttendeeWorkspace(opts: {
  slug: string;
  /** The `?reg=` param, if present — a registration UUID or a qr_code_token. */
  reg?: string;
  /** Section key to gate on. Omit for pages with no organizer toggle. */
  section?: string;
  /**
   * When the viewer holds no registration. 'event' sends them to the public
   * event page (where they can register); 'notFound' hides the page entirely.
   */
  onNoRegistration?: 'event' | 'notFound';
}): Promise<AttendeeWorkspace> {
  const resolved = await resolvePublicSlug(opts.slug);
  if (!resolved) notFound();
  const { event, eventPageTitle } = resolved;

  if (opts.section) {
    const features = await getEventFeatures(event.id);
    if (!isSectionEnabled(features, opts.section)) notFound();
  }

  const registrationId = await resolveViewerRegistrationId(event.id, opts.reg);
  if (!registrationId) {
    if (opts.onNoRegistration === 'notFound') notFound();
    // Not an error — they're simply not registered yet, and the event page is
    // where they can fix that.
    redirect(`/e/${opts.slug}`);
  }

  return {
    eventId: event.id,
    eventName: eventPageTitle ?? event.name,
    slug: opts.slug,
    registrationId,
  };
}
