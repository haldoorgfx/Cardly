/**
 * getUserContext — the ONE role-resolution entry point for the unified dashboard.
 *
 * Wraps getUserRoles()/getVisibleSections() and enriches each event-scoped role
 * with the event row itself, returning the account's full picture grouped by
 * hat: asOrganizer / asAttendee / asSpeaker / asSponsor. Server pages and the
 * shell consume this single call instead of re-implementing role lookups.
 *
 * SERVER-ONLY (service-role admin client, bypasses RLS). Callers must have
 * already authenticated the request. Never import into a client component.
 *
 * Type note: `user_event_roles` isn't in types/database.ts (frozen) — the admin
 * client is cast to `any` at the query boundary, same as lib/rbac/roles.ts.
 */

import { createAdminClient } from '@/lib/supabase/server';
import {
  getUserRoles,
  eventsWithRole,
  type UserRoles,
  type PlatformRole,
} from '@/lib/rbac/roles';
import { getVisibleSections, type VisibleSections } from '@/lib/rbac/sections';

/** Minimal event shape shared by every role-scoped list.
 *  Schedule/venue fields come from the event's `event_pages` row (nullable —
 *  an unpublished event may not have one yet). */
export interface ContextEvent {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue_name: string | null;
  city: string | null;
  is_online: boolean | null;
  cover_image_url: string | null;
}

export interface UserContext {
  userId: string;
  platformRole: PlatformRole;
  /** Raw resolved roles (all active event-scoped rows). */
  roles: UserRoles;
  /** Nav-section flags — same object AppShell consumes via /api/me/roles. */
  sections: VisibleSections;
  /** Events grouped by the hat the account wears there. */
  asOrganizer: ContextEvent[];
  asAttendee: ContextEvent[];
  asSpeaker: ContextEvent[];
  asSponsor: ContextEvent[];
}

/**
 * Resolve the account's complete dashboard context in one call.
 *
 * - Roles come from `user_event_roles` (+ the email fallbacks inside
 *   getVisibleSections for pre-055 accounts).
 * - Attendee events additionally include registrations matched by user_id or
 *   profile email (same fallback as /my-tickets), so pre-backfill attendees
 *   see their events.
 * - Never throws on missing rows; an unknown account resolves to empty lists.
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [roles, sections] = await Promise.all([
    getUserRoles(userId),
    getVisibleSections(userId),
  ]);

  const organizerIds = eventsWithRole(roles, 'organizer');
  const speakerIds = eventsWithRole(roles, 'speaker');
  const sponsorIds = eventsWithRole(roles, 'sponsor');
  const attendeeIds = new Set(eventsWithRole(roles, 'attendee'));

  // Email/user_id fallback for attendee events (mirrors /my-tickets matching).
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();
    const email = (profile?.email as string | undefined)?.toLowerCase();
    const filter = email
      ? `attendee_email.eq.${email},user_id.eq.${userId}`
      : `user_id.eq.${userId}`;
    const { data: regs } = await admin
      .from('registrations')
      .select('event_id')
      .or(filter)
      .in('status', ['confirmed', 'checked_in', 'pending'])
      .limit(500);
    for (const r of regs ?? []) {
      if (r?.event_id) attendeeIds.add(r.event_id as string);
    }
  } catch {
    // best-effort — role rows alone still work
  }

  const allIds = Array.from(
    new Set(
      organizerIds.concat(speakerIds, sponsorIds, Array.from(attendeeIds)),
    ),
  );

  const eventById = new Map<string, ContextEvent>();
  if (allIds.length > 0) {
    const [{ data: events }, { data: pages }] = await Promise.all([
      admin.from('events').select('id, name, slug, status').in('id', allIds),
      admin
        .from('event_pages')
        .select('event_id, starts_at, ends_at, venue_name, city, is_online, cover_image_url')
        .in('event_id', allIds),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageByEvent = new Map<string, any>(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((pages ?? []) as any[]).map((p) => [p.event_id as string, p]),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const e of (events ?? []) as any[]) {
      const p = pageByEvent.get(e.id as string);
      eventById.set(e.id as string, {
        id: e.id,
        name: e.name,
        slug: e.slug,
        status: e.status ?? null,
        starts_at: p?.starts_at ?? null,
        ends_at: p?.ends_at ?? null,
        venue_name: p?.venue_name ?? null,
        city: p?.city ?? null,
        is_online: p?.is_online ?? null,
        cover_image_url: p?.cover_image_url ?? null,
      });
    }
  }

  const pick = (ids: Iterable<string>): ContextEvent[] => {
    const out: ContextEvent[] = [];
    for (const id of Array.from(ids)) {
      const ev = eventById.get(id);
      if (ev) out.push(ev);
    }
    // Most-recent start first; undated events sink to the end.
    return out.sort((a, b) => (b.starts_at ?? '').localeCompare(a.starts_at ?? ''));
  };

  return {
    userId,
    platformRole: roles.platformRole,
    roles,
    sections,
    asOrganizer: pick(organizerIds),
    asAttendee: pick(attendeeIds),
    asSpeaker: pick(speakerIds),
    asSponsor: pick(sponsorIds),
  };
}
