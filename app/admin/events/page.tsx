import { requirePermission } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { EventsOversightClient } from './EventsOversightClient';
import type { EventStatus, ModerationStatus } from '@/types/database';

export const metadata = { title: 'Event Oversight — Karta Admin' };
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
  let query = adminClient
    .from('events')
    .select(
      'id, name, slug, status, moderation_status, user_id, view_count, download_count, created_at, profiles!events_user_id_fkey(email, full_name)',
      { count: 'exact' }
    );

  if (searchParams.q?.trim()) {
    query = query.or(`name.ilike.%${searchParams.q.trim()}%,slug.ilike.%${searchParams.q.trim()}%`);
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

  return (
    <div className="p-6 lg:p-10 max-w-[1200px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Event Oversight
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Event Oversight
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          View all events across users. Flag or remove abusive content — removed events are immediately inaccessible to attendees.
        </p>
      </div>

      <EventsOversightClient
        events={(events ?? []) as EventRow[]}
        total={count ?? 0}
        page={page}
        totalPages={totalPages}
        defaultFilters={{
          q:          searchParams.q          ?? '',
          status:     searchParams.status     ?? '',
          moderation: searchParams.moderation ?? '',
        }}
      />
    </div>
  );
}

export interface EventRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  moderation_status: string;
  user_id: string;
  view_count: number;
  download_count: number;
  created_at: string;
  profiles: { email: string | null; full_name: string | null } | null;
}
