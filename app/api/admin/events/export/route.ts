import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { toCsv, csvResponse, csvDateStamp } from '@/lib/csv';

export const dynamic = 'force-dynamic';

interface ExportEventRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  moderation_status: string;
  view_count: number;
  download_count: number;
  created_at: string;
  profiles: { email: string | null; full_name: string | null } | null;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (createAdminClient() as any)
    .from('events')
    .select(
      'id, name, slug, status, moderation_status, view_count, download_count, created_at, profiles!events_user_id_fkey(email, full_name)',
    );

  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (status) query = query.eq('status', status);
  if (moderation) query = query.eq('moderation_status', moderation);
  query = query.order('created_at', { ascending: false }).limit(10_000);

  const { data } = await query;
  const rows = (data ?? []) as ExportEventRow[];

  const csv = toCsv(rows, [
    { header: 'ID',          value: e => e.id },
    { header: 'Name',        value: e => e.name },
    { header: 'Slug',        value: e => e.slug },
    { header: 'Status',      value: e => e.status },
    { header: 'Moderation',  value: e => e.moderation_status },
    { header: 'Owner name',  value: e => e.profiles?.full_name ?? '' },
    { header: 'Owner email', value: e => e.profiles?.email ?? '' },
    { header: 'Views',       value: e => e.view_count },
    { header: 'Cards',       value: e => e.download_count },
    { header: 'Created',     value: e => e.created_at },
  ]);

  return csvResponse(csv, `eventera-events-${csvDateStamp()}.csv`);
}
