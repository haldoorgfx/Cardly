'use client';

import { useMemo, useState } from 'react';
import type { Session, Track } from '@/types/database';

interface Props {
  sessions: Session[];
  tracks: Track[];
  onSlotClick?: (startsAt: string, trackId: string | null) => void;
}

const ROW_HEIGHT = 68; // px per hour — generous breathing room

function formatHour(h: number) {
  return `${String(h).padStart(2, '0')}:00`;
}
function formatTime(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Session type visual config ────────────────────────────────────────────────
// Each type gets its own visual identity: color, border style, typography

interface TypeCfg {
  solid: boolean;           // full fill vs card with accent border
  bg: string;
  borderColor: string;      // left accent border color
  titleColor: string;
  metaColor: string;
  dotColor: string;
  dashed?: boolean;         // for break/utility sessions
}

const TYPE_CONFIG: Record<string, TypeCfg> = {
  keynote: {
    solid: true,
    bg: '#1F4D3A',
    borderColor: '#E8C57E',   // gold accent — only keynotes get this
    titleColor: '#FAF6EE',
    metaColor: 'rgba(250,246,238,0.65)',
    dotColor: '#E8C57E',
  },
  talk: {
    solid: false,
    bg: '#FFFFFF',
    borderColor: '#1F4D3A',   // forest green
    titleColor: '#0F1F18',
    metaColor: '#6B7A72',
    dotColor: '#1F4D3A',
  },
  workshop: {
    solid: false,
    bg: '#FFFFFF',
    borderColor: '#3A6B8C',   // info blue
    titleColor: '#0F1F18',
    metaColor: '#6B7A72',
    dotColor: '#3A6B8C',
  },
  panel: {
    solid: false,
    bg: '#FFFFFF',
    borderColor: '#C97A2D',   // amber
    titleColor: '#0F1F18',
    metaColor: '#6B7A72',
    dotColor: '#C97A2D',
  },
  fireside: {
    solid: false,
    bg: 'rgba(201,122,45,0.04)',
    borderColor: '#C97A2D',
    titleColor: '#0F1F18',
    metaColor: '#6B7A72',
    dotColor: '#C97A2D',
  },
  lightning: {
    solid: false,
    bg: '#FFFFFF',
    borderColor: '#6B7A72',
    titleColor: '#0F1F18',
    metaColor: '#9BA8A1',
    dotColor: '#6B7A72',
  },
  break: {
    solid: false,
    bg: '#F5F3EE',
    borderColor: '#C9C3B1',
    titleColor: '#9BA8A1',
    metaColor: '#C9C3B1',
    dotColor: '#C9C3B1',
    dashed: true,
  },
};

function getTypeCfg(t: string | null | undefined): TypeCfg {
  return TYPE_CONFIG[t ?? 'talk'] ?? TYPE_CONFIG.talk;
}

function groupByDate(sessions: Session[]): [string, Session[]][] {
  const map = new Map<string, Session[]>();
  for (const s of [...sessions].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )) {
    const key = new Date(s.starts_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries());
}

function fmtTimeRange(session: Session): string {
  if (!session.starts_at) return '';
  const s = new Date(session.starts_at);
  const e = session.ends_at ? new Date(session.ends_at) : null;
  const fmt = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}

// ── Day grid ──────────────────────────────────────────────────────────────────

interface DayGridProps {
  daySessions: Session[];
  tracks: Track[];
  dateKey: string;
  onSlotClick?: (startsAt: string, trackId: string | null) => void;
}

function DayGrid({ daySessions, tracks, dateKey, onSlotClick }: DayGridProps) {
  const times = daySessions
    .flatMap(s => [
      s.starts_at ? new Date(s.starts_at).getHours() + new Date(s.starts_at).getMinutes() / 60 : null,
      s.ends_at   ? new Date(s.ends_at).getHours()   + new Date(s.ends_at).getMinutes()   / 60 : null,
    ])
    .filter((t): t is number => t !== null);

  const minHour = times.length ? Math.floor(Math.min(...times)) : 9;
  const maxHour = times.length ? Math.ceil(Math.max(...times))  : 18;
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);

  const usedTrackIds = new Set(daySessions.map(s => s.track_id ?? '__none__'));
  const visibleTracks = tracks.filter(t => usedTrackIds.has(t.id));
  const hasUntracked = daySessions.some(s => !s.track_id);
  const columns: { id: string; name: string; color: string }[] = [
    ...visibleTracks.map(t => ({ id: t.id, name: t.name, color: t.color || '#1F4D3A' })),
    ...(hasUntracked ? [{ id: '__none__', name: 'General', color: '#1F4D3A' }] : []),
  ];

  const gridHeight = hours.length * ROW_HEIGHT;

  const [hoverInfo, setHoverInfo] = useState<{
    colId: string; y: number; h: number; m: number;
  } | null>(null);

  function getSessionStyle(session: Session) {
    if (!session.starts_at) return null;
    const start = new Date(session.starts_at);
    const end   = session.ends_at
      ? new Date(session.ends_at)
      : new Date(start.getTime() + 3_600_000);
    const startFrac = (start.getHours() + start.getMinutes() / 60) - minHour;
    const lenFrac   = (end.getTime() - start.getTime()) / 3_600_000;
    return {
      top:    startFrac * ROW_HEIGHT + 2,
      height: Math.max(lenFrac * ROW_HEIGHT - 4, 26),
      cfg:    getTypeCfg(session.session_type),
    };
  }

  function snapToHalfHour(rawY: number) {
    const fracHour  = rawY / ROW_HEIGHT + minHour;
    const snapped   = Math.round(fracHour * 60 / 30) * 30;
    const h = Math.floor(snapped / 60);
    const m = snapped % 60;
    return { h, m, y: (h + m / 60 - minHour) * ROW_HEIGHT };
  }

  function buildIso(dateKeyStr: string, h: number, m: number): string {
    const base = new Date(dateKeyStr);
    base.setHours(h, m, 0, 0);
    return base.toISOString();
  }

  function handleColClick(e: React.MouseEvent<HTMLDivElement>, colId: string) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { h, m } = snapToHalfHour(e.clientY - rect.top);
    onSlotClick(buildIso(dateKey, h, m), colId === '__none__' ? null : colId);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>, colId: string) {
    if (!onSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const { h, m, y } = snapToHalfHour(e.clientY - rect.top);
    setHoverInfo({ colId, y, h, m });
  }

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(320, columns.length * 160 + 60) }}>

        {/* ── Track column headers ──────────────────────────────────────────── */}
        <div className="grid mb-3" style={{ gridTemplateColumns: `52px repeat(${columns.length}, 1fr)`, gap: 8 }}>
          <div />
          {columns.map(col => (
            <div
              key={col.id}
              className="flex items-center gap-2 pb-2.5"
              style={{ borderBottom: `2px solid ${col.color}` }}
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ background: col.color }}
              />
              <span
                className="font-display font-semibold text-[13px]"
                style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}
              >
                {col.name}
              </span>
            </div>
          ))}
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid" style={{ gridTemplateColumns: `52px repeat(${columns.length}, 1fr)`, gap: 8 }}>

          {/* Time column */}
          <div className="relative" style={{ height: gridHeight }}>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute right-2 text-right text-[11px] font-semibold -translate-y-1/2 select-none"
                style={{ top: i * ROW_HEIGHT, color: '#6B7A72' }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>

          {/* Session columns */}
          {columns.map(col => {
            const colSessions = daySessions.filter(
              s => (s.track_id ?? '__none__') === col.id
            );
            const isHovered = hoverInfo?.colId === col.id;

            return (
              <div
                key={col.id}
                className="relative rounded-xl"
                style={{
                  height: gridHeight,
                  background: 'rgba(250,246,238,0.45)',
                  border: '1px solid #E5E0D4',
                  cursor: onSlotClick ? 'crosshair' : 'default',
                }}
                onClick={e => handleColClick(e, col.id)}
                onMouseMove={e => handleMouseMove(e, col.id)}
                onMouseLeave={() => setHoverInfo(null)}
              >
                {/* Hour grid lines */}
                {hours.map((_, i) => i > 0 && (
                  <div
                    key={i}
                    className="absolute left-0 right-0 pointer-events-none"
                    style={{ top: i * ROW_HEIGHT, borderTop: '1px solid rgba(229,224,212,0.5)' }}
                  />
                ))}

                {/* Click-to-add ghost indicator */}
                {onSlotClick && isHovered && hoverInfo && (
                  <div
                    className="absolute left-1.5 right-1.5 pointer-events-none flex items-center gap-1.5 px-2.5"
                    style={{
                      top: hoverInfo.y,
                      height: ROW_HEIGHT / 2 - 3,
                      border: '1.5px dashed #1F4D3A',
                      borderRadius: 6,
                      background: 'rgba(31,77,58,0.05)',
                    }}
                  >
                    <span
                      className="text-[10.5px] font-semibold"
                      style={{ color: '#1F4D3A' }}
                    >
                      + {formatTime(hoverInfo.h, hoverInfo.m)}
                    </span>
                  </div>
                )}

                {/* Session blocks */}
                {colSessions.map(session => {
                  const st = getSessionStyle(session);
                  if (!st) return null;
                  const { cfg } = st;
                  const speakers = session.session_speakers
                    ?.map(ss => ss.speakers?.name)
                    .filter(Boolean)
                    .join(', ') ?? '';
                  const timeRange = fmtTimeRange(session);
                  const showMeta  = st.height > 46;

                  return (
                    <div
                      key={session.id}
                      className="absolute left-1.5 right-1.5 overflow-hidden cursor-pointer"
                      style={{
                        top:    st.top,
                        height: st.height,
                        borderRadius: 7,
                        background:  cfg.bg,
                        // Left accent + outer border
                        borderLeft:  `${cfg.solid ? 5 : 3}px solid ${cfg.borderColor}`,
                        ...(cfg.solid
                          ? { boxShadow: '0 2px 8px rgba(15,31,24,0.18)' }
                          : cfg.dashed
                          ? { border: `1px dashed ${cfg.borderColor}`, borderLeft: `3px solid ${cfg.borderColor}` }
                          : { border: '1px solid rgba(229,224,212,0.8)', borderLeft: `3px solid ${cfg.borderColor}`, boxShadow: '0 1px 3px rgba(15,31,24,0.04)' }
                        ),
                        zIndex: 1,
                        transition: 'box-shadow 120ms ease',
                      }}
                      title={session.title}
                      onClick={e => e.stopPropagation()}
                      onMouseEnter={e => {
                        if (!cfg.solid) (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(15,31,24,0.12)';
                      }}
                      onMouseLeave={e => {
                        if (!cfg.solid) (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(15,31,24,0.04)';
                      }}
                    >
                      <div className="px-2.5 py-1.5 h-full flex flex-col gap-0.5">
                        {/* Title */}
                        <div
                          className="font-display font-semibold leading-tight line-clamp-2"
                          style={{ fontSize: 12.5, color: cfg.titleColor, letterSpacing: '-0.01em' }}
                        >
                          {session.title}
                        </div>

                        {/* Meta row — speakers + time range */}
                        {showMeta && (speakers || timeRange) && (
                          <div
                            className="flex items-center justify-between gap-2 mt-auto"
                          >
                            {speakers && (
                              <span
                                className="text-[10px] font-medium truncate"
                                style={{ color: cfg.metaColor }}
                              >
                                {speakers}
                              </span>
                            )}
                            {timeRange && (
                              <span
                                className="text-[9.5px] font-semibold shrink-0"
                                style={{ color: cfg.metaColor }}
                              >
                                {timeRange}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
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

// ── Legend ────────────────────────────────────────────────────────────────────

const LEGEND_ITEMS = [
  { type: 'keynote',   label: 'Keynote' },
  { type: 'talk',      label: 'Talk' },
  { type: 'workshop',  label: 'Workshop' },
  { type: 'panel',     label: 'Panel' },
  { type: 'fireside',  label: 'Fireside' },
  { type: 'lightning', label: 'Lightning' },
  { type: 'break',     label: 'Break' },
];

function TimelineLegend({ usedTypes }: { usedTypes: Set<string> }) {
  const visible = LEGEND_ITEMS.filter(l => usedTypes.has(l.type));
  if (visible.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {visible.map(l => {
        const cfg = getTypeCfg(l.type);
        return (
          <div key={l.type} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{
                background: cfg.solid ? cfg.bg : 'transparent',
                border: cfg.solid ? 'none' : `2px solid ${cfg.borderColor}`,
              }}
            />
            <span className="text-[11.5px] font-medium" style={{ color: '#6B7A72' }}>
              {l.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AgendaTimeline({ sessions, tracks, onSlotClick }: Props) {
  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  const usedTypes = useMemo(
    () => new Set(sessions.map(s => s.session_type ?? 'talk')),
    [sessions]
  );

  if (sessions.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          No sessions with time data yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <TimelineLegend usedTypes={usedTypes} />

      {grouped.map(([dateKey, daySessions]) => {
        const d     = new Date(dateKey);
        const label = d.toLocaleDateString(undefined, {
          weekday: 'long', month: 'long', day: 'numeric',
        });

        return (
          <div key={dateKey}>
            {/* Day header — bold, editorial */}
            <div className="flex items-center gap-4 mb-4">
              <h3
                className="font-display font-bold shrink-0"
                style={{ fontSize: 15, color: '#0F1F18', letterSpacing: '-0.02em' }}
              >
                {label}
              </h3>
              <div className="flex-1 h-px" style={{ background: '#E5E0D4' }} />
            </div>

            <DayGrid
              daySessions={daySessions}
              tracks={tracks}
              dateKey={dateKey}
              onSlotClick={onSlotClick}
            />
          </div>
        );
      })}
    </div>
  );
}
