'use client';

import { useMemo, useState, useRef } from 'react';
import type { Session, Track } from '@/types/database';

interface Props {
  sessions: Session[];
  tracks: Track[];
  onSlotClick?: (startsAt: string, trackId: string | null) => void;
}

const TONE_COLORS = [
  { bg: '#1F4D3A', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.75)' },
  { bg: '#2A6A50', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.8)' },
  { bg: '#E8C57E', fg: '#163828', sub: 'rgba(22,56,40,0.7)' },
  { bg: '#163828', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.75)' },
  { bg: '#3A6B8C', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.8)' },
  { bg: '#C97A2D', fg: '#FAF6EE', sub: 'rgba(250,246,238,0.8)' },
];

const ROW_HEIGHT = 52; // px per hour

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}

function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function groupByDate(sessions: Session[]): [string, Session[]][] {
  const map = new Map<string, Session[]>();
  for (const s of [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())) {
    const key = new Date(s.starts_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries());
}

interface DayGridProps {
  daySessions: Session[];
  tracks: Track[];
  dateKey: string;
  onSlotClick?: (startsAt: string, trackId: string | null) => void;
}

function DayGrid({ daySessions, tracks, dateKey, onSlotClick }: DayGridProps) {
  // Determine hour range
  const times = daySessions.flatMap(s => [
    s.starts_at ? new Date(s.starts_at).getHours() + new Date(s.starts_at).getMinutes() / 60 : null,
    s.ends_at   ? new Date(s.ends_at).getHours()   + new Date(s.ends_at).getMinutes()   / 60 : null,
  ]).filter((t): t is number => t !== null);

  const minHour = times.length ? Math.floor(Math.min(...times)) : 9;
  const maxHour = times.length ? Math.ceil(Math.max(...times))  : 18;
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  // Untracked sessions go in a virtual "General" column
  const usedTrackIds = new Set(daySessions.map(s => s.track_id ?? '__none__'));
  const visibleTracks = tracks.filter(t => usedTrackIds.has(t.id));
  const hasUntracked = daySessions.some(s => !s.track_id);
  const columns: { id: string; name: string; color: string }[] = [
    ...visibleTracks.map(t => ({ id: t.id, name: t.name, color: t.color })),
    ...(hasUntracked ? [{ id: '__none__', name: 'General', color: '#9BA8A1' }] : []),
  ];

  const gridHeight = hours.length * ROW_HEIGHT;

  // Per-column hover state
  const [hoverInfo, setHoverInfo] = useState<{ colId: string; y: number; h: number; m: number } | null>(null);
  const colRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function getSessionStyle(session: Session, colIndex: number) {
    if (!session.starts_at) return null;
    const start = new Date(session.starts_at);
    const end   = session.ends_at ? new Date(session.ends_at) : new Date(start.getTime() + 3600000);
    const startFrac = (start.getHours() + start.getMinutes() / 60) - minHour;
    const lenFrac   = (end.getTime() - start.getTime()) / 3600000;
    const tone = TONE_COLORS[colIndex % TONE_COLORS.length];
    return { top: startFrac * ROW_HEIGHT + 3, height: Math.max(lenFrac * ROW_HEIGHT - 6, 20), tone };
  }

  function snapToHalfHour(rawY: number): { h: number; m: number; y: number } {
    const fracHour = rawY / ROW_HEIGHT + minHour;
    const totalMins = fracHour * 60;
    const snapped = Math.round(totalMins / 30) * 30;
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;
    const y = (h + m / 60 - minHour) * ROW_HEIGHT;
    return { h, m, y };
  }

  function buildIsoFromDateAndTime(dateKeyStr: string, h: number, m: number): string {
    const base = new Date(dateKeyStr);
    base.setHours(h, m, 0, 0);
    return base.toISOString();
  }

  function handleColClick(e: React.MouseEvent<HTMLDivElement>, colId: string) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    const { h, m } = snapToHalfHour(rawY);
    const iso = buildIsoFromDateAndTime(dateKey, h, m);
    onSlotClick(iso, colId === '__none__' ? null : colId);
  }

  function handleColMouseMove(e: React.MouseEvent<HTMLDivElement>, colId: string) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawY = e.clientY - rect.top;
    const { h, m, y } = snapToHalfHour(rawY);
    setHoverInfo({ colId, y, h, m });
  }

  function handleColMouseLeave() {
    setHoverInfo(null);
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(520, columns.length * 160 + 60) }}>
        {/* Column headers */}
        <div className="grid mb-2" style={{ gridTemplateColumns: `56px repeat(${columns.length}, 1fr)`, gap: 10 }}>
          <div />
          {columns.map(col => (
            <div key={col.id} className="text-center pb-2" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#9BA8A1' }}>
                {col.name}
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid" style={{ gridTemplateColumns: `56px repeat(${columns.length}, 1fr)`, gap: 10 }}>
          {/* Time column */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-1 font-mono text-[10px] -translate-y-1/2" style={{ top: i * ROW_HEIGHT, color: '#9BA8A1' }}>
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Track columns */}
          {columns.map((col, ci) => {
            const colSessions = daySessions.filter(s => (s.track_id ?? '__none__') === col.id);
            const isHovered = hoverInfo?.colId === col.id;
            return (
              <div
                key={col.id}
                ref={el => { if (el) colRefs.current.set(col.id, el); else colRefs.current.delete(col.id); }}
                className="relative rounded-lg"
                style={{
                  height: gridHeight,
                  background: '#FAF6EE',
                  border: '1px solid #E5E0D4',
                  cursor: onSlotClick ? 'crosshair' : 'default',
                }}
                onClick={e => handleColClick(e, col.id)}
                onMouseMove={e => handleColMouseMove(e, col.id)}
                onMouseLeave={handleColMouseLeave}
              >
                {/* Hour lines */}
                {hours.map((_, i) => (
                  <div key={i} className="absolute left-0 right-0" style={{ top: i * ROW_HEIGHT, borderTop: '1px solid rgba(229,224,212,0.5)' }} />
                ))}

                {/* Ghost hover indicator */}
                {onSlotClick && isHovered && hoverInfo && (
                  <div
                    className="absolute left-1.5 right-1.5 pointer-events-none flex items-center px-2"
                    style={{
                      top: hoverInfo.y,
                      height: ROW_HEIGHT / 2 - 2,
                      border: '1.5px dashed #1F4D3A',
                      borderRadius: 6,
                      background: 'rgba(31,77,58,0.06)',
                    }}
                  >
                    <span className="font-mono text-[10px] font-semibold" style={{ color: '#1F4D3A' }}>
                      {formatTime(hoverInfo.h, hoverInfo.m)}
                    </span>
                  </div>
                )}

                {/* Sessions */}
                {colSessions.map(session => {
                  const style = getSessionStyle(session, ci);
                  if (!style) return null;
                  const speakerNames = session.session_speakers
                    ?.map(ss => ss.speakers?.name)
                    .filter(Boolean)
                    .join(', ') ?? '';
                  return (
                    <div
                      key={session.id}
                      className="absolute left-1.5 right-1.5 rounded-md px-2 py-1.5 overflow-hidden cursor-pointer"
                      style={{
                        top: style.top,
                        height: style.height,
                        background: style.tone.bg,
                        color: style.tone.fg,
                        zIndex: 1,
                      }}
                      title={session.title}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="font-display text-[11.5px] font-semibold leading-tight tracking-tight line-clamp-2">
                        {session.title}
                      </div>
                      {speakerNames && style.height > 40 && (
                        <div className="text-[10px] mt-0.5 truncate" style={{ color: style.tone.sub }}>
                          {speakerNames}
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
  );
}

export function AgendaTimeline({ sessions, tracks, onSlotClick }: Props) {
  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  if (sessions.length === 0) {
    return (
      <div className="bg-white border rounded-2xl p-12 text-center" style={{ borderColor: '#E5E0D4' }}>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>No sessions with time data yet. Add sessions with start/end times to see the timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map(([dateKey, daySessions]) => {
        const d = new Date(dateKey);
        const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        return (
          <div key={dateKey}>
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase mb-3" style={{ color: '#9BA8A1' }}>{label}</div>
            <div className="bg-white border rounded-2xl p-5 overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
              <DayGrid
                daySessions={daySessions}
                tracks={tracks}
                dateKey={dateKey}
                onSlotClick={onSlotClick}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
