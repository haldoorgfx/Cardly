export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agenda — Print' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { AgendaPrintTrigger } from '@/components/events/AgendaPrintTrigger';
import { formatZonedTime, formatZonedDayLabel, groupSessionsByZonedDay } from '@/lib/events/format';

interface Props { params: Promise<{ id: string }> }

const SESSION_TYPE_COLORS: Record<string, string> = {
  keynote: '#1F4D3A',
  talk: '#2A6A50',
  workshop: '#3A6B8C',
  panel: '#C97A2D',
  fireside: '#C97A2D',
  lightning: '#65736B',
  break: '#9BA8A1',
};

export default async function AgendaPrintPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }, { data: sessions }, { data: tracks }] = await Promise.all([
    admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('timezone').eq('event_id', id).maybeSingle(),
    admin.from('sessions').select('id, title, starts_at, ends_at, session_type, room, track_id, session_speakers(speakers(name))').eq('event_id', id).order('starts_at', { ascending: true }),
    admin.from('tracks').select('id, name').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  // The printed programme is handed out AT the venue — it must read in the
  // event's own zone. This page runs on the server, where the process zone is
  // UTC on Vercel, so every time here was previously off by the event's offset.
  const tz = eventPage?.timezone || 'UTC';

  const trackMap = new Map((tracks ?? []).map(t => [t.id, t.name]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allSessions = ((sessions ?? []) as any[]).filter((s: any) => s.starts_at);
  const grouped = groupSessionsByZonedDay(allSessions, tz);
  const today = formatZonedDayLabel(new Date().toISOString(), tz, { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: white; color: #0F1F18; font-size: 13px; line-height: 1.5; }
        @media print {
          @page { margin: 1cm; }
          .no-print { display: none !important; }
          body { font-size: 11px; }
        }
      ` }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>

        {/* Event name */}
        <div style={{ marginBottom: 32, borderBottom: '2px solid #0F1F18', paddingBottom: 16 }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: '#0F1F18' }}>
            {event.name}
          </h1>
          <p style={{ marginTop: 4, color: '#65736B', fontSize: 12 }}>Agenda</p>
        </div>

        {/* Days */}
        {grouped.map(({ key: dateStr, firstStartsAt, sessions: daySessions }) => (
          <div key={dateStr} style={{ marginBottom: 40 }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, color: '#65736B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
              {formatZonedDayLabel(firstStartsAt, tz, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E0D4' }}>
                  {['Time', 'Title', 'Type', 'Speakers', 'Room'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 8px', fontSize: 10, fontFamily: 'Inter, system-ui, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9BA8A1', fontWeight: 500 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(daySessions as any[]).map((s: any, i: number) => {
                  const speakerNames = (s.session_speakers ?? [])
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map((ss: any) => ss.speakers?.name ?? '')
                    .filter(Boolean)
                    .join(', ');
                  const typeColor = SESSION_TYPE_COLORS[s.session_type] ?? '#65736B';
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(229,224,212,0.5)', background: i % 2 === 0 ? 'transparent' : 'rgba(250,246,238,0.4)' }}>
                      <td style={{ padding: '8px 8px', fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: '#3A4A42', whiteSpace: 'nowrap' }}>
                        {formatZonedTime(s.starts_at, tz)}{s.ends_at ? ` – ${formatZonedTime(s.ends_at, tz)}` : ''}
                      </td>
                      <td style={{ padding: '8px 8px', fontWeight: 500, color: '#0F1F18' }}>
                        {s.title}
                        {s.track_id && <span style={{ display: 'block', fontSize: 10, color: '#9BA8A1', marginTop: 1 }}>{trackMap.get(s.track_id) ?? ''}</span>}
                      </td>
                      <td style={{ padding: '8px 8px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, color: typeColor, border: `1px solid ${typeColor}`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {s.session_type}
                        </span>
                      </td>
                      <td style={{ padding: '8px 8px', fontSize: 11, color: '#65736B' }}>{speakerNames || '—'}</td>
                      <td style={{ padding: '8px 8px', fontSize: 11, color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.room || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {allSessions.length === 0 && (
          <p style={{ color: '#9BA8A1', textAlign: 'center', padding: '48px 0' }}>No sessions with time data yet.</p>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #E5E0D4', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9BA8A1', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <span>Generated with Eventera</span>
          <span>{today}</span>
        </div>
      </div>

      <AgendaPrintTrigger backHref={`/events/${_ev.slug}/agenda`} />
    </>
  );
}
