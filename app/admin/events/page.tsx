import { requirePermission } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { PageShell, PageHeader } from '@/components/dash';
import { orIlikeAcross } from '@/lib/search/filter';
import { EventsOversightClient } from './EventsOversightClient';
import type { EventStatus, ModerationStatus } from '@/types/database';

export const metadata = { title: 'Event Oversight — Eventera Admin' };
export const dynamic = 'force-dynamic';

interface SearchParams {
  q?: string;
  status?: string;
  moderation?: string;
  page?: string;
}

const PAGE_SIZE = 50;

export default async function EventsOversightPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requirePermission(EVENT_VIEW_ALL);

  const page   = Math.max(1, parseInt(searchParams.page ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const adminClient = createAdminClient();
  // events is the legacy digital-card record (view_count/download_count are
  // card stats) — the modern event (venue, dates, public visibility) lives on
  // event_pages, a 0-or-1 child keyed by event_id. Left join it in so this
  // oversight tool can actually show what the event IS, not just its card
  // stats, and so an admin can tell whether it's even publicly live.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (adminClient as any)
    .from('events')
    .select(
      'id, name, slug, status, moderation_status, user_id, created_at, profiles!events_user_id_fkey(email, full_name), event_pages(title, venue_name, city, starts_at, is_public)',
      { count: 'exact' }
    );

  // Shared helper quotes the value; the old strip-blacklist silently deleted
  // characters from the admin's query.
  const q = searchParams.q?.trim();
  const qFilter = q ? orIlikeAcross(['name', 'slug'], q) : null;
  if (qFilter) {
    query = query.or(qFilter);
  }
  if (searchParams.status) {
    query = query.eq('status', searchParams.status as EventStatus);
  }
  if (searchParams.moderation) {
    query = query.eq('moderation_status', searchParams.moderation as ModerationStatus);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1);

  const { data: events, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  // Real registration counts, replacing the legacy card view_count/
  // download_count — one query for the whole page, tallied in memory,
  // rather than a per-row count query.
  const eventIds = (events ?? []).map((e: { id: string }) => e.id);
  const regCounts: Record<string, number> = {};
  if (eventIds.length > 0) {
    const { data: regRows } = await adminClient
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds);
    for (const r of (regRows ?? []) as { event_id: string }[]) {
      regCounts[r.event_id] = (regCounts[r.event_id] ?? 0) + 1;
    }
  }

  const rows: EventRow[] = (events ?? []).map((e: EventRow) => ({
    ...e,
    registration_count: regCounts[e.id] ?? 0,
  }));

  return (
    <PageShell width="screen">
      <PageHeader
        eyebrow="Admin · Event Oversight"
        title="Event Oversight"
        subtitle="View all events across users. Flag or remove abusive content — removed events are immediately inaccessible to attendees."
      />

      <EventsOversightClient
        key={`${searchParams.q ?? ''}|${searchParams.status ?? ''}|${searchParams.moderation ?? ''}|${page}`}
        events={rows}
        total={count ?? 0}
        page={page}
        totalPages={totalPages}
        defaultFilters={{
          q:          searchParams.q          ?? '',
          status:     searchParams.status     ?? '',
          moderation: searchParams.moderation ?? '',
        }}
      />
    </PageShell>
  );
}

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  moderation_status: string;
  user_id: string;
  created_at: string;
  profiles: { email: string | null; full_name: string | null } | null;
  event_pages: { title: string | null; venue_name: string | null; city: string | null; starts_at: string | null; is_public: boolean } | null;
  /** Not selected from the DB — filled in below from a separate count query. */
  registration_count?: number;
}
