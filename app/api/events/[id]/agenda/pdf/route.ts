export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateAgendaPDF } from '@/lib/pdf/agenda-pdf';

interface Params { params: Promise<{ id: string }> }

function groupByDay(sessions: {
  id: string;
  title: string;
  session_type: string | null;
  starts_at: string | null;
  ends_at: string | null;
  room: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session_speakers?: any[];
}[]) {
  const sorted = [...sessions].sort((a, b) => {
    if (!a.starts_at) return 1;
    if (!b.starts_at) return -1;
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
  });

  const map = new Map<string, typeof sorted>();
  for (const s of sorted) {
    if (!s.starts_at) continue;
    const key = new Date(s.starts_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }

  return Array.from(map.entries()).map(([dateStr, daySessions]) => ({
    date: dateStr,
    label: new Date(dateStr).toLocaleDateString(undefined, {
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
    const [{ data: event }, { data: sessions }] = await Promise.all([
      admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
      admin.from('sessions')
           .select('id, title, session_type, starts_at, ends_at, room, session_speakers(speakers(name))')
           .eq('event_id', id)
           .order('starts_at', { ascending: true }),
    ]);

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const days = groupByDay((sessions ?? []) as any[]);
    const pdfBuffer = await generateAgendaPDF(event.name, days);

    const slug = event.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    const filename = `karta-agenda-${slug}.pdf`;

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
