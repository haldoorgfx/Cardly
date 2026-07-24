import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { toCsv, csvResponse, csvDateStamp } from '@/lib/csv';
import { orIlikeAcross } from '@/lib/search/filter';

export const dynamic = 'force-dynamic';

interface ExportEventRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  moderation_status: string;
  created_at: string;
  profiles: { email: string | null; full_name: string | null } | null;
  event_pages: { title: string | null; venue_name: string | null; city: string | null; starts_at: string | null; is_public: boolean } | null;
  registration_count: number;
}

// GET /api/admin/events/export?q=&status=&moderation= — CSV of all events
// matching the current filters.
export async function GET(request: Request) {
  const result = await getAuthorizedUser(EVENT_VIEW_ALL);
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const status = searchParams.get('status');
  const moderation = searchParams.get('moderation');

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('events')
    .select(
      'id, name, slug, status, moderation_status, created_at, profiles!events_user_id_fkey(email, full_name), event_pages(title, venue_name, city, starts_at, is_public)',
    );

  // Raw interpolation into .or() let a comma in the query add conditions and
  // widen the export past the filter the admin actually applied.
  const qFilter = q ? orIlikeAcross(['name', 'slug'], q) : null;
  if (qFilter) query = query.or(qFilter);
  if (status) query = query.eq('status', status);
  if (moderation) query = query.eq('moderation_status', moderation);
  query = query.order('created_at', { ascending: false }).limit(10_000);

  const { data } = await query;
  const eventRows = (data ?? []) as Omit<ExportEventRow, 'registration_count'>[];

  const regCounts: Record<string, number> = {};
  if (eventRows.length > 0) {
    const { data: regRows } = await admin
      .from('registrations')
      .select('event_id')
      .in('event_id', eventRows.map(e => e.id));
    for (const r of (regRows ?? []) as { event_id: string }[]) {
      regCounts[r.event_id] = (regCounts[r.event_id] ?? 0) + 1;
    }
  }
  const rows: ExportEventRow[] = eventRows.map(e => ({ ...e, registration_count: regCounts[e.id] ?? 0 }));

  const csv = toCsv(rows, [
    { header: 'ID',           value: e => e.id },
    { header: 'Name',         value: e => e.event_pages?.title ?? e.name },
    { header: 'Slug',         value: e => e.slug },
    { header: 'Status',       value: e => e.status },
    { header: 'Moderation',   value: e => e.moderation_status },
    { header: 'Public',       value: e => (e.event_pages ? String(e.event_pages.is_public) : '') },
    { header: 'Venue',        value: e => e.event_pages?.venue_name ?? '' },
    { header: 'City',         value: e => e.event_pages?.city ?? '' },
    { header: 'Starts',       value: e => e.event_pages?.starts_at ?? '' },
    { header: 'Registrations', value: e => e.registration_count },
    { header: 'Owner name',   value: e => e.profiles?.full_name ?? '' },
    { header: 'Owner email',  value: e => e.profiles?.email ?? '' },
    { header: 'Created',      value: e => e.created_at },
  ]);

  return csvResponse(csv, `eventera-events-${csvDateStamp()}.csv`);
}
