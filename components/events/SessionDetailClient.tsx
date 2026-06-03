'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Session, Speaker, Track } from '@/types/database';

type SessionWithSpeakers = Omit<Session, 'session_speakers'> & {
  session_speakers: { speakers: Speaker }[];
};

interface RelatedSession {
  id: string;
  title: string;
  starts_at: string;
  ends_at?: string | null;
  room?: string | null;
  tracks?: { id: string; name: string; color: string } | null;
}

interface Props {
  session: SessionWithSpeakers;
  relatedSessions: RelatedSession[];
  registrationId: string | null;
  initialSaved: boolean;
}

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString('en-US', opts);
}

function getDuration(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export default function SessionDetailClient({ session, relatedSessions, registrationId, initialSaved }: Props) {
  const [saved, setSaved]   = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const track    = (session as any).tracks as Track | null | undefined;
  const speakers = session.session_speakers.map(ss => ss.speakers);
  const duration = getDuration(session.starts_at, session.ends_at ?? session.starts_at);

  const timeRange = `${fmt(session.starts_at, { hour: '2-digit', minute: '2-digit', hour12: false })} – ${fmt(session.ends_at ?? session.starts_at, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  const dateLabel = fmt(session.starts_at, { weekday: 'long', day: 'numeric', month: 'long' });

  async function toggleSave() {
    if (!registrationId) return;
    setSaving(true);
    const action = saved ? 'remove' : 'add';
    setSaved(s => !s);
    try {
      await fetch(`/api/sessions/${session.id}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, action }),
      });
    } catch {
      setSaved(s => !s);
    } finally {
      setSaving(false);
    }
  }

  const trackColor = track?.color ?? '#E5E0D4';

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── Header band ────────────────────────────────────────────────────── */}
      <div style={{ background: '#F5F2EB', borderBottom: '1px solid #E5E0D4' }}>
        <div
          className="max-w-[960px] mx-auto px-10 py-10 flex items-end justify-between gap-6 flex-wrap"
        >
          <div className="flex-1 min-w-0">
            {/* Track pill */}
            {track && (
              <div
                className="inline-flex items-center gap-1.5 px-3 rounded-full mb-4"
                style={{ height: 26, background: 'white', border: '1px solid #E5E0D4', fontSize: 12, fontWeight: 500, color: '#3A4A42' }}
              >
                <span className="rounded-full" style={{ width: 7, height: 7, background: trackColor, display: 'inline-block' }} />
                {track.name}
              </div>
            )}
            <h1
              className="font-display"
              style={{ fontWeight: 400, fontSize: 32, color: '#1F4D3A', letterSpacing: '-0.025em', lineHeight: 1.2, maxWidth: 720 }}
            >
              {session.title}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-3 font-mono text-[14px]" style={{ color: '#6B7A72' }}>
              <span>{fmt(session.starts_at, { day: 'numeric', month: 'short' })} · {timeRange}</span>
              {session.room && <><span style={{ color: '#E5E0D4' }}>·</span><span>{session.room}</span></>}
              {session.registrations_count > 0 && <><span style={{ color: '#E5E0D4' }}>·</span><span>{session.registrations_count} attending</span></>}
            </div>
          </div>

          {/* Add to agenda CTA */}
          <button
            onClick={toggleSave}
            disabled={!registrationId || saving}
            className="shrink-0 inline-flex items-center h-11 px-6 rounded-xl font-display font-semibold text-[14px] transition"
            style={saved
              ? { background: 'rgba(232,197,126,0.15)', color: '#C9A45E', border: '1px solid #E8C57E' }
              : { background: '#E8C57E', color: '#163828' }
            }
          >
            {saved ? '✓ In your agenda' : 'Add to my agenda'}
          </button>
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div
        className="max-w-[960px] mx-auto px-10 mt-11 mb-24"
        style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 56, alignItems: 'start' }}
      >

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div>
          {/* Description */}
          {session.description && (
            <p className="text-[15px] leading-relaxed" style={{ color: '#3A4A42' }}>
              {session.description}
            </p>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <section style={{ marginTop: session.description ? 40 : 0 }}>
              <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 20, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                Presented by
              </h2>
              <div className="flex gap-4 flex-wrap">
                {speakers.map(sp => (
                  <div
                    key={sp.id}
                    className="overflow-hidden rounded-xl"
                    style={{ width: 180, border: '1px solid #E5E0D4', background: 'white' }}
                  >
                    {/* Photo */}
                    <div className="relative" style={{ aspectRatio: '2/3', background: '#E8EFEB' }}>
                      {sp.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sp.photo_url} alt={sp.name} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center font-display text-[22px] font-semibold" style={{ color: '#1F4D3A', background: 'linear-gradient(160deg, #E8EFEB, #FAF6EE)' }}>
                          {sp.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="px-3.5 py-3">
                      <div className="font-display font-medium text-[14px]" style={{ color: '#1F4D3A' }}>{sp.name}</div>
                      {(sp.role || sp.company) && (
                        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                          {[sp.role, sp.company].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related sessions */}
          {relatedSessions.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 className="font-display mb-4" style={{ fontWeight: 400, fontSize: 20, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                You might also like
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                {relatedSessions.map((s, i) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const rt = (s as any).tracks as { name: string; color: string } | null;
                  const shortTime = `${fmt(s.starts_at, { day: 'numeric', month: 'short' })} · ${fmt(s.starts_at, { hour: '2-digit', minute: '2-digit', hour12: false })}${s.room ? ` · ${s.room}` : ''}`;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F5F2EB] cursor-pointer"
                      style={{ borderTop: i > 0 ? '1px solid #E5E0D4' : undefined }}
                    >
                      <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: rt?.color ?? '#E5E0D4', display: 'inline-block' }} />
                      <span className="flex-1 font-medium text-[14px]" style={{ color: '#0F1F18' }}>{s.title}</span>
                      <span className="font-mono text-[12px] shrink-0" style={{ color: '#6B7A72' }}>{shortTime}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside style={{ position: 'sticky', top: 88 }}>
          <div
            className="rounded-2xl p-6"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
          >
            <div className="font-display font-medium text-[16px]" style={{ color: '#1F4D3A' }}>{dateLabel}</div>
            <div className="font-mono mt-2.5" style={{ fontSize: 20, color: '#1F4D3A' }}>{timeRange}</div>
            {session.room && (
              <div className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>{session.room}</div>
            )}
            {duration > 0 && (
              <div className="font-mono text-[13px] mt-1" style={{ color: '#6B7A72' }}>{duration} min</div>
            )}
            {session.registrations_count > 0 && (
              <div className="mt-3 font-mono text-[13px]" style={{ color: '#1F4D3A' }}>
                <span style={{ color: '#1F4D3A' }}>{session.registrations_count}</span>
                {session.capacity ? <span style={{ color: '#6B7A72' }}> / {session.capacity} registered</span> : <span style={{ color: '#6B7A72' }}> attending</span>}
              </div>
            )}

            <button
              onClick={toggleSave}
              disabled={!registrationId || saving}
              className="w-full h-11 rounded-xl font-display font-semibold text-[14px] transition mt-4"
              style={saved
                ? { background: 'rgba(232,197,126,0.15)', color: '#C9A45E', border: '1px solid #E8C57E' }
                : { background: '#1F4D3A', color: 'white' }
              }
            >
              {saved ? '✓ In your agenda' : 'Add to agenda'}
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
}
