'use client';

import { useState, useMemo } from 'react';
import { Clock, MapPin, Users, CheckCircle2, X } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Session = any;

interface Props {
  eventId: string;
  eventSlug: string;
  sessions: Session[];
  bookedIds: string[];
  registrationId?: string;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
}

function duration(start: string, end: string) {
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  return mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}` : `${mins}m`;
}

function CapacityBar({ filled, capacity }: { filled: number; capacity: number }) {
  const pct = Math.min((filled / capacity) * 100, 100);
  const color = pct >= 100 ? '#B8423C' : pct >= 85 ? '#C97A2D' : '#2D7A4F';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: '#E5E0D4' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold shrink-0" style={{ color, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {pct >= 100 ? 'Full' : `${filled}/${capacity}`}
      </span>
    </div>
  );
}

function ConfirmModal({ session, onClose, onConfirm, confirming }: { session: Session; onClose: () => void; onConfirm: () => void; confirming: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(15,31,24,0.45)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
        {/* Cover/header */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #F0EDE6' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: '#E8EFEB' }}>
            <CheckCircle2 size={20} style={{ color: '#1F4D3A' }} />
          </div>
          <h3 className="font-display font-semibold text-[18px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Book your seat
          </h3>
          <p className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{session.title}</p>
          <div className="flex items-center gap-3 mt-2 text-[13px]" style={{ color: '#6B7A72' }}>
            <span className="flex items-center gap-1"><Clock size={12} /> {fmtTime(session.starts_at)} · {duration(session.starts_at, session.ends_at)}</span>
            {session.room && <span className="flex items-center gap-1"><MapPin size={12} /> {session.room}</span>}
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-[13px] mb-4" style={{ color: '#6B7A72' }}>
            This seat will be added to your personal agenda. Check in by scanning your ticket at the door.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold border transition hover:opacity-80"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
              Cancel
            </button>
            <button onClick={onConfirm} disabled={confirming}
              className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              {confirming ? 'Booking…' : 'Confirm seat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkshopsClient({ eventId, eventSlug, sessions, bookedIds: initial, registrationId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set(initial));
  const [confirmSession, setConfirmSession] = useState<Session | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Group by day
  const byDay = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      if (!s.starts_at) continue;
      const key = fmtDay(s.starts_at);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [sessions]);

  async function bookSeat(session: Session) {
    if (!registrationId) return;
    setConfirming(true);
    const res = await fetch(`/api/events/${eventId}/sessions/${session.id}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId }),
    });
    setConfirming(false);
    setConfirmSession(null);
    if (res.ok) {
      setBookedIds(prev => { const next = new Set(prev); next.add(session.id); return next; });
      setSuccessId(session.id);
      setTimeout(() => setSuccessId(null), 3000);
    }
  }

  const DEMO_SESSIONS: Session[] = [
    { id: 'd1', title: 'Design Systems at Scale', starts_at: '2026-09-20T09:00:00Z', ends_at: '2026-09-20T10:30:00Z', room: 'Studio A', capacity: 40, registrations_count: 22, tracks: { name: 'Design', color: '#3A6B8C' }, session_speakers: [{ speakers: { name: 'Amina Osei' } }] },
    { id: 'd2', title: 'Figma to Production Pipeline', starts_at: '2026-09-20T11:00:00Z', ends_at: '2026-09-20T12:00:00Z', room: 'Studio B', capacity: 80, registrations_count: 74, tracks: { name: 'Dev', color: '#2D7A4F' }, session_speakers: [] },
    { id: 'd3', title: 'Office Hours: UX Research', starts_at: '2026-09-20T14:00:00Z', ends_at: '2026-09-20T14:45:00Z', room: 'Room 4', capacity: 12, registrations_count: 12, tracks: { name: 'Research', color: '#7A3A8C' }, session_speakers: [] },
    { id: 'd4', title: 'Accessibility Deep Dive', starts_at: '2026-09-21T09:30:00Z', ends_at: '2026-09-21T11:00:00Z', room: 'Main Hall', capacity: 120, registrations_count: 45, tracks: { name: 'Dev', color: '#2D7A4F' }, session_speakers: [{ speakers: { name: 'Kwame A.' } }] },
  ];

  const displaySessions = sessions.length > 0 ? sessions : DEMO_SESSIONS;
  const displayByDay = sessions.length > 0 ? byDay : (() => {
    const m: Record<string, Session[]> = {};
    for (const s of DEMO_SESSIONS) {
      const k = fmtDay(s.starts_at);
      if (!m[k]) m[k] = [];
      m[k].push(s);
    }
    return m;
  })();

  return (
    <>
      <div className="max-w-[720px] mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-[26px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Workshops — book your seat
          </h1>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            Limited-capacity sessions. Book early to guarantee your spot.
          </p>
        </div>

        {Object.entries(displayByDay).map(([day, daySessions]) => (
          <div key={day} className="mb-7">
            <div className="text-[11px] font-bold tracking-[0.12em] uppercase mb-3"
              style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {day}
            </div>
            <div className="flex flex-col gap-2">
              {(daySessions as Session[]).map((s: Session) => {
                const filled = s.registrations_count ?? 0;
                const cap = s.capacity ?? 0;
                const isFull = cap > 0 && filled >= cap;
                const isBooked = bookedIds.has(s.id);
                const isSuccess = successId === s.id;
                const speakers = s.session_speakers?.map((ss: { speakers?: { name: string } }) => ss.speakers?.name).filter(Boolean) ?? [];

                return (
                  <div key={s.id}
                    className="rounded-2xl p-4 transition"
                    style={{
                      background: '#FFFFFF',
                      border: `1px solid ${isBooked ? '#1F4D3A' : '#E5E0D4'}`,
                      boxShadow: isBooked ? '0 0 0 1px #1F4D3A' : 'none',
                    }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Track badge */}
                        {s.tracks && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1"
                            style={{ background: `${s.tracks.color}15`, color: s.tracks.color }}>
                            {s.tracks.name}
                          </span>
                        )}
                        <h3 className="font-semibold text-[14px] mb-1" style={{ color: '#0F1F18' }}>{s.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 text-[12px] mb-2" style={{ color: '#6B7A72' }}>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {fmtTime(s.starts_at)} · {s.ends_at ? duration(s.starts_at, s.ends_at) : ''}
                          </span>
                          {s.room && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {s.room}
                            </span>
                          )}
                          {speakers.length > 0 && (
                            <span style={{ color: '#3A4A42' }}>{speakers.join(', ')}</span>
                          )}
                        </div>
                        {cap > 0 && <CapacityBar filled={filled} capacity={cap} />}
                      </div>

                      {/* Action */}
                      <div className="shrink-0">
                        {isBooked ? (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold"
                            style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                            <CheckCircle2 size={13} />
                            {isSuccess ? 'Booked!' : 'In your agenda'}
                          </div>
                        ) : isFull ? (
                          <button
                            onClick={() => registrationId && bookSeat(s)}
                            className="px-3 py-2 rounded-xl text-[12px] font-semibold transition hover:opacity-80"
                            style={{ background: '#FEF9EC', color: '#C97A2D', border: '1px solid #F5D89A' }}>
                            <Users size={12} className="inline mr-1" />
                            Join waitlist
                          </button>
                        ) : (
                          <button
                            onClick={() => setConfirmSession(s)}
                            disabled={!registrationId}
                            className="px-3 py-2 rounded-xl text-[12px] font-semibold transition hover:opacity-90 disabled:opacity-40"
                            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                            Book seat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {displaySessions.length === 0 && (
          <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <p className="text-[15px] font-medium" style={{ color: '#6B7A72' }}>No workshops with limited seating</p>
          </div>
        )}

        {!registrationId && (
          <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2 text-[13px]"
            style={{ background: '#FEF9EC', border: '1px solid #F5D89A', color: '#C97A2D' }}>
            <X size={13} />
            <span>Register for the event first to book workshop seats — </span>
            <a href={`/e/${eventSlug}/register`} className="font-semibold underline" style={{ color: '#C97A2D' }}>Register</a>
          </div>
        )}
      </div>

      {confirmSession && (
        <ConfirmModal
          session={confirmSession}
          onClose={() => setConfirmSession(null)}
          onConfirm={() => bookSeat(confirmSession)}
          confirming={confirming}
        />
      )}
    </>
  );
}
