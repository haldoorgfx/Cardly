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

function formatDayTab(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
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
      .filter((s) => isSameDay(new Date(s.starts_at), activeDay))
      .filter((s) => activeTrackId === 'all' || s.track_id === activeTrackId)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [sessions, activeDay, activeTrackId]);

  async function toggleSave(sessionId: string) {
    if (!registrationId) return;
    const isAdding = !saved.has(sessionId);
    setSavingId(sessionId);
    setSaved((prev) => {
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
      // revert on error
      setSaved((prev) => {
        const next = new Set(prev);
        if (isAdding) next.delete(sessionId); else next.add(sessionId);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  function getTrack(trackId: string | null) {
    return tracks.find((t) => t.id === trackId) ?? null;
  }

  function getSpeakerNames(session: Session) {
    return (session.session_speakers ?? [])
      .map((ss) => ss.speakers?.name)
      .filter(Boolean)
      .join(', ');
  }

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      {days.length > 1 && (
        <div className="flex gap-1 border-b" style={{ borderColor: '#E5E0D4' }}>
          {days.map((day, idx) => (
            <button
              key={day.toDateString()}
              onClick={() => setActiveDayIdx(idx)}
              className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={
                activeDayIdx === idx
                  ? { color: '#1F4D3A', borderBottom: '2px solid #1F4D3A', marginBottom: -1 }
                  : { color: '#6B7A72', borderBottom: '2px solid transparent', marginBottom: -1 }
              }
            >
              {formatDayTab(day)}
            </button>
          ))}
        </div>
      )}

      {/* Track filter */}
      {tracks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTrackId('all')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
            style={
              activeTrackId === 'all'
                ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                : { background: '#fff', color: '#0F1F18', borderColor: '#E5E0D4' }
            }
          >
            All tracks
          </button>
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setActiveTrackId(track.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={
                activeTrackId === track.id
                  ? { background: track.color, color: '#fff', borderColor: track.color }
                  : { background: '#fff', color: '#0F1F18', borderColor: '#E5E0D4' }
              }
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: activeTrackId === track.id ? '#fff' : track.color }}
              />
              {track.name}
            </button>
          ))}
        </div>
      )}

      {/* Session list */}
      {visibleSessions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: '#6B7A72' }}>No sessions scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSessions.map((session, idx) => {
            const track = getTrack(session.track_id);
            const isSaved = saved.has(session.id);
            const speakerNames = getSpeakerNames(session);
            const prevSession = visibleSessions[idx - 1];
            const hasAdjacentPrev = prevSession ? new Date(prevSession.ends_at).getTime() >= new Date(session.starts_at).getTime() : false;

            return (
              <div key={session.id} className="flex gap-3 items-start">
                {/* Time column */}
                <div className="w-14 shrink-0 flex flex-col items-center pt-3.5">
                  <span
                    className=" text-[13px] font-medium"
                    style={{ color: '#1F4D3A' }}
                  >
                    {formatTime(session.starts_at)}
                  </span>
                  {hasAdjacentPrev && (
                    <div
                      className="w-px mt-1 flex-1"
                      style={{ background: '#E8C57E', height: 20 }}
                    />
                  )}
                </div>

                {/* Session card */}
                <div
                  className="flex-1 bg-white border rounded-xl p-3 flex items-start gap-3"
                  style={{
                    borderColor: '#E5E0D4',
                    borderLeft: track ? `3px solid ${track.color}` : '3px solid #E5E0D4',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-[15px] font-medium" style={{ color: '#0F1F18' }}>
                      {session.title}
                    </p>
                    {speakerNames && (
                      <p className="text-[13px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                        {speakerNames}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {session.room && (
                        <span className="text-[12px]" style={{ color: '#6B7A72' }}>{session.room}</span>
                      )}
                      <span
                        className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                      >
                        {session.session_type}
                      </span>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => toggleSave(session.id)}
                    disabled={!registrationId || savingId === session.id}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 disabled:opacity-40 transition-colors"
                    title={isSaved ? 'Remove from agenda' : 'Save to agenda'}
                  >
                    {isSaved ? (
                      <BookmarkCheck size={18} style={{ color: '#E8C57E', fill: '#E8C57E' }} />
                    ) : (
                      <Bookmark size={18} style={{ color: '#6B7A72' }} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
