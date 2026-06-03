'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface SavedSession {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  room: string | null;
  session_speakers?: { speakers: { name: string } | null }[];
  tracks?: { id: string; name: string; color: string } | null;
}

interface Props {
  sessions: SavedSession[];
  eventName: string;
  eventSlug: string;
  registrationId: string;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDayName(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function toDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupByDate(sessions: SavedSession[]): [string, SavedSession[]][] {
  const map = new Map<string, SavedSession[]>();
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );
  for (const s of sorted) {
    const key = toDateKey(s.starts_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries());
}

function sessionsOverlap(a: SavedSession, b: SavedSession): boolean {
  const aStart = new Date(a.starts_at).getTime();
  const aEnd = a.ends_at ? new Date(a.ends_at).getTime() : aStart + 1;
  const bStart = new Date(b.starts_at).getTime();
  return bStart < aEnd && aStart < bStart;
}

function getSpeakerNames(session: SavedSession): string {
  return (session.session_speakers ?? [])
    .map((ss) => ss.speakers?.name)
    .filter(Boolean)
    .join(', ');
}

export default function PersonalAgendaClient({
  sessions: initialSessions,
  eventName,
  eventSlug,
  registrationId,
}: Props) {
  const [sessions, setSessions] = useState<SavedSession[]>(initialSessions);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  const activeDayKey = activeDay ?? grouped[0]?.[0] ?? null;

  const totalDays = grouped.length;
  const totalSessions = sessions.length;

  function handleRemove(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    // After short fade delay, remove from list
    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 380);
  }

  const activeSessions =
    grouped.find(([key]) => key === activeDayKey)?.[1] ?? [];

  return (
    <div
      style={{
        background: '#FAF6EE',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#0F1F18',
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '48px 24px 80px',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 28,
                fontWeight: 400,
                color: '#1F4D3A',
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              My Agenda &mdash; {eventName}
            </h1>
            <p
              style={{
                marginTop: 6,
                fontSize: 16,
                color: '#6B7A72',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {totalSessions}
              </span>{' '}
              session{totalSessions !== 1 ? 's' : ''} saved across{' '}
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {totalDays}
              </span>{' '}
              day{totalDays !== 1 ? 's' : ''}
            </p>
          </div>

          <Link
            href={`/e/${eventSlug}/schedule`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #1F4D3A',
              color: '#1F4D3A',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background 0.15s ease',
            }}
          >
            Add more sessions &rarr;
          </Link>
        </div>

        {/* ── Day tabs ── */}
        {grouped.length > 1 && (
          <div
            style={{
              display: 'flex',
              gap: 4,
              marginBottom: 32,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {grouped.map(([key, daySessions]) => {
              const isActive = key === activeDayKey;
              const sample = daySessions[0].starts_at;
              return (
                <button
                  key={key}
                  onClick={() => setActiveDay(key)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 0,
                    border: 'none',
                    borderBottom: isActive
                      ? '2px solid #E8C57E'
                      : '2px solid transparent',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                    flexShrink: 0,
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 14,
                      fontWeight: 500,
                      color: isActive ? '#0F1F18' : '#6B7A72',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {formatDayName(sample)}
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11,
                      color: isActive ? '#1F4D3A' : '#6B7A72',
                      marginTop: 2,
                    }}
                  >
                    {formatDayDate(sample)}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Agenda list ── */}
        <div style={{ maxWidth: 760 }}>
          {activeSessions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 0',
                color: '#6B7A72',
                fontSize: 14,
              }}
            >
              No sessions saved for this day
            </div>
          ) : (
            activeSessions.map((session, idx) => {
              const prevSession = activeSessions[idx - 1];
              const isConflict =
                prevSession != null && sessionsOverlap(prevSession, session);
              const isRemoved = removedIds.has(session.id);
              const speakers = getSpeakerNames(session);
              const track = session.tracks ?? null;

              return (
                <div key={session.id}>
                  {/* Conflict indicator */}
                  {isConflict && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        border: '1px solid #E8C57E',
                        background: 'rgba(232,197,126,0.10)',
                        color: '#C9A45E',
                        borderRadius: 100,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono, monospace',
                        marginBottom: 10,
                        marginLeft: 82,
                      }}
                    >
                      Conflict &middot; two sessions overlap at {formatTime(session.starts_at)}
                    </div>
                  )}

                  {/* Time + card row */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      gap: 18,
                      alignItems: 'stretch',
                      marginBottom: 12,
                    }}
                  >
                    {/* Left: time + vertical gold line */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingTop: 18,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 15,
                          fontWeight: 700,
                          color: '#1F4D3A',
                          lineHeight: 1,
                        }}
                      >
                        {formatTime(session.starts_at)}
                      </span>
                      {idx < activeSessions.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 20,
                            marginTop: 8,
                            background: '#E8C57E',
                            opacity: 0.35,
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </div>

                    {/* Right: session card */}
                    <div
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E0D4',
                        borderRadius: 12,
                        padding: '16px 18px',
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        opacity: isRemoved ? 0.4 : 1,
                        transition: 'opacity 0.35s ease',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title */}
                        <div
                          style={{
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: 16,
                            fontWeight: 500,
                            color: '#1F4D3A',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}
                        >
                          {session.title}
                        </div>

                        {/* Meta: speaker · room */}
                        {(speakers || session.room) && (
                          <div
                            style={{
                              fontSize: 14,
                              color: '#6B7A72',
                              marginBottom: 8,
                              lineHeight: 1.4,
                            }}
                          >
                            {[speakers, session.room].filter(Boolean).join(' · ')}
                          </div>
                        )}

                        {/* Track pill */}
                        {track && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#FAF6EE',
                              border: `1px solid #E5E0D4`,
                              color: '#6B7A72',
                              fontSize: 11,
                              height: 24,
                              padding: '0 8px',
                              borderRadius: 100,
                              fontFamily: 'Inter, sans-serif',
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: track.color,
                                flexShrink: 0,
                              }}
                            />
                            {track.name}
                          </span>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemove(session.id)}
                        disabled={isRemoved}
                        title="Remove from agenda"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isRemoved ? 'default' : 'pointer',
                          color: '#6B7A72',
                          fontSize: 12,
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: 500,
                          padding: '2px 0',
                          flexShrink: 0,
                          opacity: isRemoved ? 0 : 1,
                          transition: 'color 0.15s ease, opacity 0.35s ease',
                          lineHeight: 1,
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#B8423C';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#6B7A72';
                        }}
                      >
                        {isRemoved ? 'Removed' : 'Remove ×'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
