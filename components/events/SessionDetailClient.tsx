'use client';

import { useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { Session, Speaker, Track } from '@/types/database';

type SessionWithSpeakers = Omit<Session, 'session_speakers'> & {
  session_speakers: { speakers: Speaker }[];
};

interface Props {
  session: SessionWithSpeakers;
  relatedSessions: Partial<Session>[];
  registrationId: string | null;
  initialSaved: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function getDurationMin(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatShortTime(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export default function SessionDetailClient({ session, relatedSessions, registrationId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const track = session.tracks as Track | null | undefined;
  const speakers = session.session_speakers.map((ss) => ss.speakers);
  const duration = getDurationMin(session.starts_at, session.ends_at);

  async function toggleSave() {
    if (!registrationId) return;
    setSaving(true);
    const action = saved ? 'remove' : 'add';
    setSaved(!saved);
    try {
      await fetch(`/api/sessions/${session.id}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, action }),
      });
    } catch {
      setSaved(saved); // revert
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Top band */}
      <div style={{ background: '#FAF6EE' }}>
        <div className="max-w-[960px] mx-auto px-5 py-8">
          {/* Track / type pill */}
          <div className="mb-3">
            {track ? (
              <span
                className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1 rounded-full"
                style={{ background: `${track.color}18`, color: track.color, border: `1px solid ${track.color}40` }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: track.color }} />
                {track.name}
              </span>
            ) : (
              <span
                className="inline-block text-[12px] font-medium px-3 py-1 rounded-full"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                {session.session_type}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-display font-normal"
            style={{ fontSize: 32, color: '#1F4D3A', letterSpacing: '-0.025em', lineHeight: 1.2 }}
          >
            {session.title}
          </h1>

          {/* Meta row */}
          <p className="font-mono text-[13px] mt-3" style={{ color: '#6B7A72' }}>
            {formatTime(session.starts_at)}
            {' · '}
            {formatTime(session.ends_at)}
            {session.room ? ` · ${session.room}` : ''}
            {session.registrations_count > 0 ? ` · ${session.registrations_count} attending` : ''}
          </p>

          {/* Save button */}
          <button
            onClick={toggleSave}
            disabled={!registrationId || saving}
            className="mt-5 inline-flex items-center gap-2 px-5 rounded-full font-medium text-[15px] transition-colors disabled:opacity-50"
            style={{
              height: 48,
              background: saved ? 'transparent' : '#E8C57E',
              color: saved ? '#C9A45E' : '#0F1F18',
              border: saved ? '1px solid #E8C57E' : 'none',
            }}
          >
            {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {saved ? 'In my agenda' : 'Save to my agenda'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[960px] mx-auto px-5 py-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-10">
            {/* Description */}
            {session.description && (
              <section>
                <p className="text-[16px] leading-relaxed" style={{ color: '#3A4A42', lineHeight: 1.6 }}>
                  {session.description}
                </p>
              </section>
            )}

            {/* Speakers */}
            {speakers.length > 0 && (
              <section>
                <h2 className="font-display text-[15px] font-semibold mb-4" style={{ color: '#0F1F18' }}>
                  Presented by
                </h2>
                <div className="flex flex-wrap gap-4">
                  {speakers.map((speaker) => (
                    <div key={speaker.id} className="w-40">
                      <div
                        className="w-full rounded-xl overflow-hidden mb-2"
                        style={{ aspectRatio: '2/3' }}
                      >
                        {speaker.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-2xl font-semibold"
                            style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                          >
                            {getInitials(speaker.name)}
                          </div>
                        )}
                      </div>
                      <p className="font-display text-[14px] font-medium" style={{ color: '#0F1F18' }}>
                        {speaker.name}
                      </p>
                      {speaker.role && (
                        <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{speaker.role}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related sessions */}
            {relatedSessions.length > 0 && (
              <section>
                <h2 className="font-display text-[15px] font-semibold mb-3" style={{ color: '#0F1F18' }}>
                  You might also like
                </h2>
                <div className="space-y-2">
                  {relatedSessions.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 p-3 border rounded-xl"
                      style={{ borderColor: '#E5E0D4' }}
                    >
                      {(s as Session & { tracks?: Track | null }).tracks && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: (s as Session & { tracks?: Track | null }).tracks?.color ?? '#E5E0D4' }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>{s.title}</p>
                        <p className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                          {s.starts_at ? formatShortTime(s.starts_at) : ''}
                          {s.room ? ` · ${s.room}` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside
            className="w-full md:w-64 shrink-0 self-start md:sticky"
            style={{ top: 96 }}
          >
            <div className="bg-white border rounded-2xl p-5 space-y-4" style={{ borderColor: '#E5E0D4' }}>
              <div>
                <p className="font-display text-[15px] font-semibold" style={{ color: '#1F4D3A' }}>
                  {formatDate(session.starts_at)}
                </p>
              </div>
              <div>
                <p
                  className="font-mono"
                  style={{ fontSize: 22, color: '#1F4D3A', fontWeight: 500 }}
                >
                  {formatTime(session.starts_at)}
                </p>
                <p className="font-mono text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                  ends {formatTime(session.ends_at)} · {duration} min
                </p>
              </div>
              {session.room && (
                <p className="text-[14px]" style={{ color: '#6B7A72' }}>{session.room}</p>
              )}
              {session.capacity && (
                <p className="font-mono text-[13px]" style={{ color: '#6B7A72' }}>
                  {session.registrations_count} / {session.capacity} seats
                </p>
              )}

              <button
                onClick={toggleSave}
                disabled={!registrationId || saving}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: saved ? '#2D7A4F' : '#1F4D3A' }}
              >
                {saved ? 'Saved to agenda' : 'Save to agenda'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
