import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { buildIcs, icsFilename, uidForSlug, type CalendarEvent } from '@/lib/calendar/ics';

export const dynamic = 'force-dynamic';

/**
 * Public `.ics` download for an event's calendar entry (G7 / K01).
 *
 * SCOPE: public events only. The file carries nothing private — event title,
 * time, venue and the public event URL, all of which are already visible on the
 * public event page. Keeping it public (rather than registration-scoped) lets
 * reminder + confirmation emails link to it directly (emails can't authenticate),
 * and the row is gated by `is_public = true` so unpublished events never leak.
 *
 * `[pageId]` accepts an `event_pages.id` first, then falls back to matching by
 * `event_id`, so callers that only hold the event id (emails) can reach it too.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { pageId: string } },
) {
  const admin = createAdminClient();

  const columns =
    'id, title, description, starts_at, ends_at, timezone, venue_name, venue_address, city, country, is_online, online_url, custom_slug, events!inner(slug)';

  // Try by page id; if nothing matches, treat the param as an event id.
  let { data: page } = await admin
    .from('event_pages')
    .select(columns)
    .eq('id', params.pageId)
    .eq('is_public', true)
    .maybeSingle();

  if (!page) {
    ({ data: page } = await admin
      .from('event_pages')
      .select(columns)
      .eq('event_id', params.pageId)
      .eq('is_public', true)
      .maybeSingle());
  }

  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!page.starts_at) {
    return NextResponse.json({ error: 'Event has no date' }, { status: 400 });
  }

  const location = page.is_online
    ? (page.online_url ?? 'Online event')
    : [page.venue_name, page.venue_address, page.city, page.country].filter(Boolean).join(', ');

  const slug =
    (page as { custom_slug?: string | null }).custom_slug ??
    (page as { events?: { slug: string } | null }).events?.slug ??
    page.id;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/e/${slug}`;

  const event: CalendarEvent = {
    title: page.title,
    description: page.description ? page.description.slice(0, 800) : null,
    location,
    start: page.starts_at,
    end: page.ends_at ?? null,
    url,
    uid: uidForSlug(slug),
    timezone: page.timezone ?? null,
  };

  return new NextResponse(buildIcs(event), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${icsFilename(page.title)}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
