import { NextResponse } from 'next/server';
import { getAuthorizedUser } from '@/lib/auth/guards';
import { EVENT_VIEW_ALL } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import type { EventStatus, ModerationStatus } from '@/types/database';

// GET /api/admin/events — list all events across all users
export async function GET(request: Request) {
  const result = await getAuthorizedUser(EVENT_VIEW_ALL);
  if ('error' in result) return result.error;

  const url = new URL(request.url);
  const search = url.searchParams.get('q')?.trim() ?? '';
  const status = url.searchParams.get('status') ?? '';
  const moderation = url.searchParams.get('moderation') ?? '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const PAGE_SIZE = 50;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const adminClient = createAdminClient();
  let query = adminClient
    .from('events')
    .select('id, name, slug, status, moderation_status, user_id, view_count, download_count, created_at, updated_at, profiles!events_user_id_fkey(email, full_name)', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status as EventStatus);
  }
  if (moderation) {
    query = query.eq('moderation_status', moderation as ModerationStatus);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ events: data ?? [], total: count ?? 0, page, pageSize: PAGE_SIZE });
}
