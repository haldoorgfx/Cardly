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
 */
export async function resolvePublicSlug(slug: string): Promise<ResolvedPublicEvent | null> {
  const admin = createAdminClient();

  // 1. Try custom_slug on event_pages
  const { data: byCustom } = await admin
    .from('event_pages')
    .select('event_id, title, events!inner(id, slug, name)')
    .eq('custom_slug', slug)
    .eq('is_public', true)
    .single();

  if (byCustom) {
    const event = byCustom.events as unknown as { id: string; slug: string; name: string };
    return { eventId: byCustom.event_id, eventPageTitle: byCustom.title, event };
  }

  // 2. Fallback: find event by slug, then its event_pages row
  const { data: eventRow } = await admin
    .from('events')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();

  if (!eventRow) return null;

  const { data: page } = await admin
    .from('event_pages')
    .select('event_id, title')
    .eq('event_id', eventRow.id)
    .eq('is_public', true)
    .single();

  if (!page) return null;

  return {
    eventId: page.event_id,
    eventPageTitle: page.title,
    event: eventRow,
  };
}
