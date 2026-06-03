'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Session, Track } from '@/types/database';

interface Props {
  eventId: string;
  initialSessions: Session[];
  initialTracks: Track[];
}

const ROW_PX = 52; // pixels per hour

// Session block tones cycling through tracks
const TONES = [
  { bg: '#1F4D3A', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.75)' },
  { bg: '#2A6A50', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.80)' },
  { bg: '#E8C57E', fg: '#163828', sub: 'rgba(22,56,40,0.70)'    },
  { bg: '#3A6B8C', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.75)' },
];

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

function groupByDate(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const s of sessions) {
    if (!s.starts_at) continue;
    const key = new Date(s.starts_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}

export default function AgendaGrid({ eventId, initialSessions, initialTracks }: Props) {
  const [sessions] = useState<Session[]>(initialSessions);

  // Build day list
  const byDate = groupByDate(sessions);
  const days = Array.from(byDate.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );
  const [activeDay, setActiveDay] = useState(days[0] ?? '');

  const daySessions = byDate.get(activeDay) ?? [];

  // Build tracks for this day — use initialTracks if defined, else derive from sessions
  const trackMap = new Map(initialTracks.map(t => [t.id, t]));
  const dayTrackIds = Array.from(new Set(
    daySessions.map(s => (s as unknown as { track_id?: string }).track_id ?? '__general__'),
  ));

  // Fallback: sessions without a track go to "General"
  const tracks: { id: string; name: string; color: string }[] = dayTrackIds.map(id => {
    if (id === '__general__') return { id: '__general__', name: 'General', color: '#1F4D3A' };
    const t = trackMap.get(id);
    return t ? { id: t.id, name: t.name, color: t.color ?? '#1F4D3A' } : { id, name: 'Track', color: '#1F4D3A' };
  });

  // Determine time range
  let firstHour = 8, lastHour = 18;
  if (daySessions.length > 0) {
    firstHour = Math.min(...daySessions.map(s => new Date(s.starts_at).getHours()));
    lastHour  = Math.max(...daySessions.map(s => new Date(s.ends_at ?? s.starts_at).getHours() + 1));
    firstHour = Math.max(0, firstHour - 1);
    lastHour  = Math.min(24, lastHour + 1);
  }
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const gridHeight = hours.length * ROW_PX;

  function sessionTop(s: Session): number {
    const d = new Date(s.starts_at);
    return (d.getHours() - firstHour + d.getMinutes() / 60) * ROW_PX;
  }
  function sessionHeight(s: Session): number {
    const start = new Date(s.starts_at).getTime();
    const end   = new Date(s.ends_at ?? s.starts_at).getTime();
    const hrs   = Math.max(0.25, (end - start) / 3_600_000);
    return hrs * ROW_PX;
  }

  // Empty state
  if (sessions.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <div
          className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-5"
          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
        >
          <Plus size={26} strokeWidth={1.6} />
        </div>
        <h2
          className="font-display text-[18px] font-semibold tracking-tight mb-1"
          style={{ color: '#1F4D3A' }}
        >
          No sessions yet
        </h2>
        <p className="text-[13.5px] mb-5" style={{ color: '#6B7A72' }}>
          Add your first session to start building the agenda.
        </p>
        <a
          href={`/events/${eventId}/sessions`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[13px]"
          style={{ background: '#1F4D3A', color: '#FAF6EE', textDecoration: 'none' }}
        >
          <Plus size={14} strokeWidth={2.2} /> Add session
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* ── Day tabs ─────────────────────────────────── */}
      {days.length > 1 && (
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {days.map((d, i) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className="px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors"
              style={d === activeDay
                ? { background: '#1F4D3A', color: '#FAF6EE' }
                : { border: '1px solid #E5E0D4', color: '#6B7A72', background: 'white' }}
            >
              Day {i + 1} · {formatDay(new Date(d))}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ─────────────────────────────────────── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <div className="p-5 overflow-x-auto">
          <div className="min-w-[480px]">
            {/* Track headers */}
            <div
              className="grid mb-2"
              style={{ gridTemplateColumns: `56px repeat(${Math.max(1, tracks.length)}, 1fr)`, gap: 10 }}
            >
              <div />
              {tracks.map(t => (
                <div
                  key={t.id}
                  className="font-mono text-[10px] tracking-[0.12em] uppercase text-center pb-2"
                  style={{ color: '#6B7A72', borderBottom: '1px solid #E5E0D4' }}
                >
                  {t.name}
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(${Math.max(1, tracks.length)}, 1fr)`, gap: 10 }}
            >
              {/* Hour labels */}
              <div className="relative" style={{ height: gridHeight }}>
                {hours.map((h, i) => (
                  <div
                    key={h}
                    className="absolute left-0 right-1 font-mono text-[10px] -translate-y-1/2"
                    style={{ top: i * ROW_PX, color: '#6B7A72' }}
                  >
                    {formatHour(h)}
                  </div>
                ))}
              </div>

              {/* Track columns */}
              {tracks.map((track, ci) => {
                const colSessions = daySessions.filter(s => {
                  const tid = (s as unknown as { track_id?: string }).track_id;
                  return track.id === '__general__' ? !tid : tid === track.id;
                });
                const tone = TONES[ci % TONES.length];

                return (
                  <div
                    key={track.id}
                    className="relative rounded-lg"
                    style={{
                      height: gridHeight,
                      background: 'rgba(250,246,238,0.5)',
                      border: '1px solid #E5E0D4',
                    }}
                  >
                    {/* Hour grid lines */}
                    {hours.map((_, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0"
                        style={{ top: i * ROW_PX, borderTop: '1px solid rgba(229,224,212,0.5)' }}
                      />
                    ))}

                    {/* Session blocks */}
                    {colSessions.map(s => {
                      const top    = sessionTop(s);
                      const height = Math.max(24, sessionHeight(s) - 6);
                      return (
                        <div
                          key={s.id}
                          className="absolute left-1.5 right-1.5 rounded-md px-2 py-1.5 overflow-hidden"
                          style={{ top: top + 3, height, background: tone.bg, color: tone.fg }}
                          title={s.title}
                        >
                          <div
                            className="font-display text-[11.5px] font-semibold leading-tight tracking-tight line-clamp-2"
                          >
                            {s.title}
                          </div>
                          {height > 36 && (
                            <div className="text-[10px] mt-0.5" style={{ color: tone.sub }}>
                              {new Date(s.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              {s.ends_at && ` – ${new Date(s.ends_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
