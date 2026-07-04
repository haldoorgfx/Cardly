import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (i === 0) { chunks.push(line.slice(0, 75)); i = 75; }
    else { chunks.push(' ' + line.slice(i, i + 74)); i += 74; }
  }
  return chunks.join('\r\n');
}

function toIcsDate(iso: string, tz?: string | null): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (!tz || tz === 'UTC') {
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
  }
  // Local time with TZID
  const local = new Date(d.toLocaleString(undefined, { timeZone: tz }));
  return (
    `${local.getFullYear()}${pad(local.getMonth() + 1)}${pad(local.getDate())}` +
    `T${pad(local.getHours())}${pad(local.getMinutes())}${pad(local.getSeconds())}`
  );
}

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

  const tz = page.timezone || 'UTC';
  const location = page.is_online
    ? (page.online_url ?? 'Online event')
    : [page.venue_name, page.venue_address, page.city, page.country].filter(Boolean).join(', ');

  const slug = (page as { custom_slug?: string | null; events?: { slug: string } | null }).custom_slug
    ?? (page as { events?: { slug: string } | null }).events?.slug
    ?? page.id;
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/e/${slug}`;

  const dtstart = page.starts_at ? toIcsDate(page.starts_at, tz) : null;
  const dtend = page.ends_at
    ? toIcsDate(page.ends_at, tz)
    : page.starts_at
    ? toIcsDate(new Date(new Date(page.starts_at).getTime() + 2 * 3600000).toISOString(), tz)
    : null;

  if (!dtstart || !dtend) return NextResponse.json({ error: 'Event has no date' }, { status: 400 });

  const tzProp = tz !== 'UTC' ? `DTSTART;TZID=${tz}:${dtstart}` : `DTSTART:${dtstart}`;
  const tzPropEnd = tz !== 'UTC' ? `DTEND;TZID=${tz}:${dtend}` : `DTEND:${dtend}`;

  const uid = `event-${page.id}@eventera`;
  const now = toIcsDate(new Date().toISOString());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventera//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    foldLine(`DTSTAMP:${now}`),
    foldLine(tzProp),
    foldLine(tzPropEnd),
    foldLine(`SUMMARY:${escapeIcs(page.title)}`),
    ...(page.description ? [foldLine(`DESCRIPTION:${escapeIcs(page.description.slice(0, 800))}`)] : []),
    ...(location ? [foldLine(`LOCATION:${escapeIcs(location)}`)] : []),
    foldLine(`URL:${url}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const filename = page.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60) + '.ics';
  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=300',
    },
  });
}
