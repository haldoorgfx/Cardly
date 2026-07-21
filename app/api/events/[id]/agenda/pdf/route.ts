export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateAgendaPDF } from '@/lib/pdf/agenda-pdf';
import { formatZonedDayLabel, groupSessionsByZonedDay } from '@/lib/events/format';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Params { params: Promise<{ id: string }> }

// Day buckets and labels are computed in the EVENT's zone. This route runs on
// the server (UTC on Vercel), so bucketing on the process zone could push an
// early-morning session into the previous day and split one conference day
// across two PDF sections.
function groupByDay(sessions: {
  id: string;
  title: string;
  session_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  room: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session_speakers?: any[];
}[], timezone: string) {
  return groupSessionsByZonedDay(sessions, timezone).map(({ key, firstStartsAt, sessions: daySessions }) => ({
    date: key,
    label: formatZonedDayLabel(firstStartsAt, timezone, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }),
    sessions: daySessions.map(s => ({
      id: s.id,
      title: s.title,
      session_type: s.session_type,
      start_time: s.starts_at,
      end_time: s.ends_at,
      location: s.room,
      speakers: (s.session_speakers ?? []).map((ss: { speakers: { name: string } | null }) => ({
        name: ss.speakers?.name ?? '',
      })).filter((sp: { name: string }) => sp.name),
    })),
  }));
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const [{ data: event }, { data: eventPage }, { data: sessions }] = await Promise.all([
      admin.from('events').select('id, name').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
      admin.from('event_pages').select('timezone').eq('event_id', id).maybeSingle(),
      admin.from('sessions')
           .select('id, title, session_type, starts_at, ends_at, room, session_speakers(speakers(name))')
           .eq('event_id', id)
           .order('starts_at', { ascending: true }),
    ]);

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const tz = eventPage?.timezone || 'UTC';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days = groupByDay((sessions ?? []) as any[], tz);
    const pdfBuffer = await generateAgendaPDF(event.name, days, tz);

    const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const filename = `eventera-agenda-${slug}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[agenda/pdf]', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
