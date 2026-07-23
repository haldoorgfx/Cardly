import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';
import type { EventStatus } from '@/types/database';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

// GET /api/v1/events — list the API key owner's events.
// Query: ?status=published&limit=50&offset=0
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
}

export async function GET(req: NextRequest) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const auth = await authenticateApiKey(req, 'events:read');
  if (!auth.ok) return auth.response;

  const url = req.nextUrl;
  const status = url.searchParams.get('status');
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

  const db = createAdminClient();
  let query = db
    .from('events')
    .select('id, name, slug, status, view_count, download_count, created_at, event_pages(title, starts_at, ends_at, timezone, venue_name, is_online)', { count: 'exact' })
    .eq('user_id', auth.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status as EventStatus);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events = (data ?? []).map((e: any) => {
    const page = Array.isArray(e.event_pages) ? e.event_pages[0] : e.event_pages;
    return {
      id: e.id,
      name: e.name,
      slug: e.slug,
      status: e.status,
      title: page?.title ?? e.name,
      starts_at: page?.starts_at ?? null,
      ends_at: page?.ends_at ?? null,
      timezone: page?.timezone ?? null,
      venue_name: page?.venue_name ?? null,
      is_online: page?.is_online ?? null,
      view_count: e.view_count ?? 0,
      download_count: e.download_count ?? 0,
      created_at: e.created_at,
    };
  });

  return NextResponse.json({ data: events, pagination: { limit, offset, total: count ?? events.length } });
}
