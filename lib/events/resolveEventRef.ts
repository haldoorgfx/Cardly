import { createAdminClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export interface EventRef {
  id: string;
  slug: string;
  name: string;
}

/**
 * Resolves an admin route param that may be either an event UUID (legacy links)
 * or an event slug (new canonical links) to the real event row.
 *
 * Keeps old `/events/<uuid>/...` links working while the admin moves to
 * `/events/<slug>/...`. Callers use the returned `id` (always the real UUID)
 * for DB queries and `/api/...` calls, and `slug` for building page links.
 */
export async function resolveEventRef(idOrSlug: string): Promise<EventRef | null> {
  const admin = createAdminClient();
  const column = isUuid(idOrSlug) ? 'id' : 'slug';
  const { data } = await admin
    .from('events')
    .select('id, slug, name')
    .eq(column, idOrSlug)
    .maybeSingle();
  return data ?? null;
}
