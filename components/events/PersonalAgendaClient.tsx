'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { X, AlertTriangle } from 'lucide-react';
import type { Session, Track } from '@/types/database';
import { formatZonedTime, formatZonedDayLabel, groupSessionsByZonedDay } from '@/lib/events/format';

interface Props {
  sessions: Session[];
  registrationId: string;
  eventSlug: string;
  /** IANA zone of the event. Times render here, not in the viewer's zone. */
  timezone: string;
}

/**
 * Does this session overlap ANY earlier session in the same day?
 *
 * The previous check only compared each session against its immediate
 * predecessor, so it missed the common case of one long session containing
 * several short ones: with A 09:00–12:00, B 10:00–10:30 and C 11:00–12:00,
 * C was compared only against B (no overlap) and the clash with A went
 * unflagged — the attendee saw no warning for a talk they cannot attend.
 */
function findConflict(session: Session, earlier: Session[]): Session | null {
  const start = new Date(session.starts_at).getTime();
  const end = new Date(session.ends_at).getTime();
  for (const other of earlier) {
    const oStart = new Date(other.starts_at).getTime();
    const oEnd = new Date(other.ends_at).getTime();
    // Half-open intervals: a session starting exactly when another ends is fine.
    if (start < oEnd && oStart < end) return other;
  }
  return null;
}

function getSpeakerNames(session: Session) {
  return (session.session_speakers ?? [])
    .map((ss) => ss.speakers?.name)
    .filter(Boolean)
    .join(', ');
}

export default function PersonalAgendaClient({ sessions: initialSessions, registrationId, eventSlug, timezone }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupSessionsByZonedDay(sessions, timezone), [sessions, timezone]);

  async function handleRemove(sessionId: string) {
    setRemovingId(sessionId);
    try {
      await fetch(`/api/sessions/${sessionId}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, action: 'remove' }),
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // silent — still remove optimistically
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } finally {
      setRemovingId(null);
    }
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4">
        <p className="text-[16px]" style={{ color: '#65736B' }}>Your agenda is empty.</p>
        <Link
          href={`/e/${eventSlug}/schedule`}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: '#1F4D3A' }}
        >
          Browse schedule
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/e/${eventSlug}/schedule`}
          className="inline-flex items-center h-9 px-4 rounded-full text-[13px] font-medium border transition-colors"
          style={{ background: '#fff', color: '#1F4D3A', borderColor: '#E5E0D4' }}
        >
          Add more sessions
        </Link>
      </div>

      {grouped.map(({ key: dateKey, firstStartsAt, sessions: daySessions }) => (
        <div key={dateKey} className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider px-1 mb-3" style={{ color: '#65736B' }}>
            {formatZonedDayLabel(firstStartsAt, timezone)}
          </h2>

          {daySessions.map((session, idx) => {
            const conflict = findConflict(session, daySessions.slice(0, idx));
            const track = session.tracks as Track | null | undefined;
            const speakerNames = getSpeakerNames(session);

            return (
              <div key={session.id}>
                {conflict && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg mb-1 text-[12px] font-medium"
                    style={{ background: 'rgba(201,122,45,0.12)', color: '#C97A2D' }}
                  >
                    <AlertTriangle size={13} />
                    <span className="min-w-0">Overlaps “{conflict.title}”</span>
                  </div>
                )}

                <div className="flex gap-3 items-stretch">
                  {/* Time + connector */}
                  <div className="w-16 shrink-0 flex flex-col items-center pt-4">
                    <span
                      className="text-[15px] font-medium"
                      style={{ color: '#0F1F18' }}
                    >
                      {formatZonedTime(session.starts_at, timezone)}
                    </span>
                    {idx < daySessions.length - 1 && (
                      <div
                        className="flex-1 w-px mt-2"
                        style={{ background: '#E8C57E', minHeight: 20 }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 bg-white border rounded-2xl p-4 mb-2"
                    style={{ borderColor: '#E5E0D4' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-[15px] font-medium" style={{ color: '#0F1F18' }}>
                          {session.title}
                        </p>
                        {speakerNames && (
                          <p className="text-[13px] mt-0.5" style={{ color: '#65736B' }}>{speakerNames}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {session.room && (
                            <span className="text-[12px]" style={{ color: '#65736B' }}>{session.room}</span>
                          )}
                          {track && (
                            <span
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${track.color}18`, color: track.color }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: track.color }} />
                              {track.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(session.id)}
                        disabled={removingId === session.id}
                        aria-label={`Remove ${session.title} from agenda`}
                        title="Remove from agenda"
                        className="flex items-center justify-center rounded-lg shrink-0 disabled:opacity-40 transition-colors group hover:bg-[#B8423C1A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ width: 40, height: 40, outlineColor: '#1F4D3A' }}
                      >
                        <X
                          size={15}
                          className="group-hover:text-[#B8423C]"
                          style={{ color: '#65736B' }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
