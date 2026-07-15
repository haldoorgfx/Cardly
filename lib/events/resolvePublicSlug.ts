import { createAdminClient } from '@/lib/supabase/server';

export interface ResolvedPublicEvent {
  eventId: string;
  eventPageTitle: string | null;
  event: { id: string; slug: string; name: string };
}

/**
 * Resolves a public slug to an event page.
 * Tries custom_slug first, then falls back to events.slug.
 * The broken .or() cross-table query pattern cannot be used in PostgREST.
 *
 * Gated on event_pages.is_public — IDENTICAL to how the public event page
 * itself (`resolveEventPage` in app/(public)/e/[slug]/page.tsx) resolves. The
 * two MUST agree: if the event page is viewable, its "Get tickets" button must
 * lead to a working register page, never a 404. (Previously this also required
 * events.status='published', which the event page does not — so a public-but-
 * not-"published" event rendered fine yet 404'd on register.) is_public is the
 * organizer's real visibility switch; unpublishing the page closes both.
 */
export async function resolvePublicSlug(slug: string): Promise<ResolvedPublicEvent | null> {
  const admin = createAdminClient();

  // 1. Try custom_slug on event_pages
  const { data: byCustom } = await admin
    .from('event_pages')
    .select('event_id, title, events!inner(id, slug, name, status)')
    .eq('custom_slug', slug)
    .eq('is_public', true)
    .single();

  if (byCustom) {
    const event = byCustom.events as unknown as { id: string; slug: string; name: string };
    return { eventId: byCustom.event_id, eventPageTitle: byCustom.title, event };
  }

  // 2. Fallback: find event by slug, then its public event_pages row
  const { data: eventRow } = await admin
    .from('events')
    .select('id, slug, name, status')
    .eq('slug', slug)
    .maybeSingle();

  if (!eventRow) return null;

  {
    const { data: page } = await admin
      .from('event_pages')
      .select('event_id, title')
      .eq('event_id', eventRow.id)
      .eq('is_public', true)
      .maybeSingle();

    if (page) {
      return { eventId: page.event_id, eventPageTitle: page.title, event: eventRow };
    }
  }

  // 2b. Self-heal: the event is published but has no public page row (e.g. created
  // outside the normal flow). Ensure a public page exists so the link doesn't 404.
  if (eventRow.status === 'published') {
    const healed = await ensurePublicEventPage(eventRow.id, eventRow.name);
    if (healed) return { eventId: eventRow.id, eventPageTitle: healed.title, event: eventRow };
  }

  return null;
}

/**
 * Ensure a published event has a public event_pages row. If a (draft) row exists,
 * flip it public; otherwise create a minimal one. Returns the row, or null on failure.
 * Idempotent — safe to call concurrently (event_id is unique).
 */
export async function ensurePublicEventPage(eventId: string, eventName: string): Promise<{ title: string } | null> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('event_pages')
    .select('id, title, is_public')
    .eq('event_id', eventId)
    .maybeSingle();

  if (existing) {
    if (existing.is_public) return { title: existing.title };
    const { data: updated } = await admin
      .from('event_pages')
      .update({ is_public: true })
      .eq('id', existing.id)
      .select('title')
      .maybeSingle();
    return updated ?? { title: existing.title };
  }

  // No row at all — create a minimal public page (placeholder dates; organizer edits later)
  const start = new Date(Date.now() + 30 * 86_400_000);
  const end = new Date(start.getTime() + 2 * 3_600_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: created } = await (admin as any)
    .from('event_pages')
    .insert({ event_id: eventId, title: eventName, starts_at: start.toISOString(), ends_at: end.toISOString(), is_public: true })
    .select('title')
    .maybeSingle();
  return created ?? null;
}
