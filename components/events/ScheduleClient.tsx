'use client';

import { useState, useMemo } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { Session, Track } from '@/types/database';

interface Props {
  sessions: Session[];
  tracks: Track[];
  registrationId: string | null;
  savedSessionIds: string[];
}

function getUniqueDates(sessions: Session[]): Date[] {
  const seen = new Set<string>();
  const dates: Date[] = [];
  const sorted = [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  for (const s of sorted) {
    const d = new Date(s.starts_at);
    const key = d.toDateString();
    if (!seen.has(key)) { seen.add(key); dates.push(d); }
  }
  return dates;
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function ScheduleClient({ sessions, tracks, registrationId, savedSessionIds }: Props) {
  const days = useMemo(() => getUniqueDates(sessions), [sessions]);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [activeTrackId, setActiveTrackId] = useState<string | 'all'>('all');
  const [saved, setSaved] = useState<Set<string>>(() => new Set(savedSessionIds));
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeDay = days[activeDayIdx];

  const visibleSessions = useMemo(() => {
    if (!activeDay) return [];
    return sessions
      .filter(s => isSameDay(new Date(s.starts_at), activeDay))
      .filter(s => activeTrackId === 'all' || s.track_id === activeTrackId)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [sessions, activeDay, activeTrackId]);

  async function toggleSave(sessionId: string) {
    if (!registrationId) return;
    const isAdding = !saved.has(sessionId);
    setSavingId(sessionId);
    setSaved(prev => {
      const next = new Set(prev);
      if (isAdding) next.add(sessionId); else next.delete(sessionId);
      return next;
    });
    try {
      await fetch(`/api/sessions/${sessionId}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, action: isAdding ? 'add' : 'remove' }),
      });
    } catch {
      setSaved(prev => {
        const next = new Set(prev);
        if (isAdding) next.delete(sessionId); else next.add(sessionId);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  function getTrack(trackId: string | null) {
    return tracks.find(t => t.id === trackId) ?? null;
  }

  function getSpeakerNames(session: Session) {
    return (session.session_speakers ?? []).map(ss => ss.speakers?.name).filter(Boolean).join(', ');
  }

  return (
    <div>
      {/* ── Day tabs ──────────────────────────────────────────────────────── */}
      {days.length > 1 && (
        <div className="flex gap-0.5" style={{ borderBottom: '1px solid #E5E0D4', marginBottom: 20 }}>
          {days.map((day, idx) => {
            const active = activeDayIdx === idx;
            return (
              <button
                key={day.toDateString()}
                onClick={() => setActiveDayIdx(idx)}
                className="px-[18px] py-3 font-display font-medium text-[15px] transition-colors"
                style={{
                  color: active ? '#1F4D3A' : '#6B7A72',
                  borderBottom: active ? '2px solid #E8C57E' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                <span
                  className="block font-mono text-[12px]"
                  style={{ color: active ? '#6B7A72' : '#6B7A72' }}
                >
                  {day.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Track filter chips ────────────────────────────────────────────── */}
      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5" style={{ overflowX: 'auto' }}>
          {[{ id: 'all' as const, name: 'All tracks', color: '#1F4D3A' }, ...tracks].map(t => {
            const active = activeTrackId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTrackId(t.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors whitespace-nowrap"
                style={active
                  ? { background: t.id === 'all' ? '#1F4D3A' : t.color, color: '#fff', borderColor: t.id === 'all' ? '#1F4D3A' : t.color }
                  : { background: 'white', color: '#0F1F18', borderColor: '#E5E0D4' }
                }
              >
                {t.id !== 'all' && (
                  <span
                    className="rounded-full shrink-0"
                    style={{ width: 7, height: 7, background: active ? 'rgba(255,255,255,0.8)' : t.color, display: 'inline-block' }}
                  />
                )}
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Session list ──────────────────────────────────────────────────── */}
      {visibleSessions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>No sessions scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {visibleSessions.map(session => {
            const track    = getTrack(session.track_id);
            const isSaved  = saved.has(session.id);
            const speakers = getSpeakerNames(session);
            const trackColor = track?.color ?? '#E5E0D4';

            return (
              <div
                key={session.id}
                className="grid gap-3.5"
                style={{
                  gridTemplateColumns: '64px 1fr',
                  padding: '16px 0',
                  borderBottom: '1px solid #E5E0D4',
                }}
              >
                {/* Time */}
                <div className="font-mono text-[13px] pt-0.5" style={{ color: '#6B7A72' }}>
                  {formatTime(session.starts_at)}
                </div>

                {/* Card */}
                <div
                  className="rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{
                    background: isSaved ? '#FBF7EC' : 'white',
                    border: '1px solid #E5E0D4',
                    borderLeft: `3px solid ${isSaved ? '#E8C57E' : trackColor}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-medium text-[15px]" style={{ color: '#1F4D3A' }}>
                      {session.title}
                    </p>
                    {speakers && (
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                        {speakers}
                        {session.room ? ` · ${session.room}` : ''}
                      </p>
                    )}
                    {!speakers && session.room && (
                      <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{session.room}</p>
                    )}
                  </div>

                  <button
                    onClick={() => toggleSave(session.id)}
                    disabled={!registrationId || savingId === session.id}
                    className="shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                    style={{ color: isSaved ? '#E8C57E' : '#6B7A72' }}
                    title={isSaved ? 'Remove from agenda' : 'Save to agenda'}
                  >
                    {isSaved
                      ? <BookmarkCheck size={18} fill="#E8C57E" />
                      : <Bookmark size={18} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex items-center gap-2 text-[13px]" style={{ color: '#6B7A72' }}>
        <span className="rounded-full" style={{ width: 8, height: 8, background: '#E8C57E', display: 'inline-block' }} />
        In my agenda
        <span className="ml-2">· Tap a session to save it to your personal schedule.</span>
      </div>
    </div>
  );
}
