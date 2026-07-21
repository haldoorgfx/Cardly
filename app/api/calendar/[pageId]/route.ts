import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { buildEventIcs, icsContentDisposition } from '@/lib/ics/build';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } },
) {
  const admin = createAdminClient();
  const { data: page } = await admin
    .from('event_pages')
    .select('id, title, description, starts_at, ends_at, timezone, venue_name, venue_address, city, country, is_online, online_url, custom_slug, events!inner(slug)')
    .eq('id', params.pageId)
    .eq('is_public', true)
    .single();

  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!page.starts_at) return NextResponse.json({ error: 'Event has no date' }, { status: 400 });

  const location = page.is_online
    ? (page.online_url ?? 'Online event')
    : [page.venue_name, page.venue_address, page.city, page.country].filter(Boolean).join(', ');

  const slug = (page as { custom_slug?: string | null; events?: { slug: string } | null }).custom_slug
    ?? (page as { events?: { slug: string } | null }).events?.slug
    ?? page.id;

  // Title can be null on a draft page that was later published; fall back
  // rather than throwing on .replace() and returning a 500 for the download.
  const title = page.title || 'Event';

  const ics = buildEventIcs({
    id: page.id,
    title,
    description: page.description,
    startsAt: page.starts_at,
    endsAt: page.ends_at,
    location: location || null,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${slug}`,
  });

  if (!ics) return NextResponse.json({ error: 'Event has no valid date' }, { status: 400 });

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': icsContentDisposition(title),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
