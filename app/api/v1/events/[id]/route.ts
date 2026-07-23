import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-keys/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

// GET /api/v1/events/{id} — a single event with its ticket types.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const auth = await authenticateApiKey(req, 'events:read');
  if (!auth.ok) return auth.response;

  const db = createAdminClient();
  const { data: e } = await db
    .from('events')
    .select('id, name, slug, status, view_count, download_count, created_at, event_pages(title, description, starts_at, ends_at, timezone, venue_name, venue_address, is_online)')
    .eq('id', params.id)
    .eq('user_id', auth.userId)
    .maybeSingle();

  if (!e) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

  const { data: tickets } = await db
    .from('ticket_types')
    .select('id, name, price, currency, quantity, quantity_sold')
    .eq('event_id', params.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = Array.isArray((e as any).event_pages) ? (e as any).event_pages[0] : (e as any).event_pages;

  return NextResponse.json({
    id: e.id,
    name: e.name,
    slug: e.slug,
    status: e.status,
    title: page?.title ?? e.name,
    description: page?.description ?? null,
    starts_at: page?.starts_at ?? null,
    ends_at: page?.ends_at ?? null,
    timezone: page?.timezone ?? null,
    venue_name: page?.venue_name ?? null,
    venue_address: page?.venue_address ?? null,
    is_online: page?.is_online ?? null,
    view_count: e.view_count ?? 0,
    download_count: e.download_count ?? 0,
    created_at: e.created_at,
    ticket_types: (tickets ?? []).map(t => ({
      id: t.id, name: t.name, price: t.price, currency: t.currency,
      quantity_total: t.quantity, quantity_sold: t.quantity_sold,
    })),
  });
}
