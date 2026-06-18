'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import SessionsManager, { type EventDates as SessionEventDates } from './SessionsManager';
import { AgendaTimeline } from './AgendaTimeline';
import type { Session, Track } from '@/types/database';

interface SpeakerOption { id: string; name: string; photo_url: string | null }

interface Props {
  eventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialSessions: any[];
  speakers: SpeakerOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialTracks: any[];
  eventDates?: SessionEventDates;
}

function formatDayTab(date: Date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); // "12 Mar"
}

function toLocalDatetimeString(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SESSION_TYPES = ['talk', 'keynote', 'workshop', 'panel', 'fireside', 'lightning', 'break'];
const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hr', value: 60 },
  { label: '1.5 hr', value: 90 },
  { label: '2 hr', value: 120 },
];

interface QuickFormState {
  title: string;
  starts_at: string;
  duration: number;
  track_id: string;
  session_type: string;
}

export function AgendaView({ eventId, initialSessions, speakers, initialTracks, eventDates }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>(initialSessions as Session[]);

  // Quick-add modal state
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; startsAt: string; trackId: string | null } | null>(null);
  const [quickForm, setQuickForm] = useState<QuickFormState>({
    title: '',
    starts_at: '',
    duration: 60,
    track_id: '',
    session_type: 'talk',
  });
  const [quickSaving, setQuickSaving] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (quickAdd?.open) {
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [quickAdd?.open]);

  function handleSlotClick(startsAt: string, trackId: string | null) {
    setQuickForm({
      title: '',
      starts_at: toLocalDatetimeString(startsAt),
      duration: 60,
      track_id: trackId ?? '',
      session_type: 'talk',
    });
    setQuickAdd({ open: true, startsAt, trackId });
  }

  async function handleQuickSave() {
    if (!quickForm.title.trim()) return;
    setQuickSaving(true);
    try {
      const startsAtDate = new Date(quickForm.starts_at);
      const endsAtDate = new Date(startsAtDate.getTime() + quickForm.duration * 60000);
      const body: Record<string, unknown> = {
        title: quickForm.title.trim(),
        starts_at: startsAtDate.toISOString(),
        ends_at: endsAtDate.toISOString(),
        session_type: quickForm.session_type,
      };
      if (quickForm.track_id) body.track_id = quickForm.track_id;

      const res = await fetch(`/api/events/${eventId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { session: created } = await res.json();
        setSessions(prev => [...prev, created as Session]);
        setQuickAdd(null);
      }
    } finally {
      setQuickSaving(false);
    }
  }

  // Group sessions by calendar day
  const days = useMemo(() => {
    const map = new Map<string, Session[]>();
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime()
    );
    for (const s of sorted) {
      if (!s.starts_at) continue;
      const key = new Date(s.starts_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).map(([key, daySessions], idx) => ({
      key,
      label: `Day ${idx + 1} · ${formatDayTab(new Date(key))}`,
      sessions: daySessions,
    }));
  }, [sessions]);

  const [selectedDay, setSelectedDay] = useState(0);

  // Subtitle calculations
  const totalSessions = sessions.length;
  const totalDays     = days.length;
  const totalTracks   = initialTracks.length;

  const subtitle = totalSessions === 0
    ? 'No sessions yet — add your first one'
    : `${totalSessions} session${totalSessions !== 1 ? 's' : ''} across ${totalDays} day${totalDays !== 1 ? 's' : ''} · ${totalTracks} track${totalTracks !== 1 ? 's' : ''}`;

  const displayedSessions: Session[] = days.length > 0
    ? (days[selectedDay]?.sessions ?? [])
    : sessions;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[26px] tracking-[-0.02em]" style={{ color: '#0F1F18' }}>
            Agenda
          </h1>
          <p className="text-[13.5px] mt-0.5" style={{ color: '#6B7A72' }}>{subtitle}</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 shrink-0"
          style={{ background: '#1F4D3A' }}>
          <Plus size={14} strokeWidth={2.5} />
          Add session
        </button>
      </div>

      {/* ── Day tabs ──────────────────────────────────────────────────────── */}
      {days.length > 0 && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {days.map((day, idx) => (
            <button
              key={day.key}
              onClick={() => setSelectedDay(idx)}
              className="px-4 py-1.5 rounded-full text-[13px] font-medium transition-all"
              style={selectedDay === idx
                ? { background: '#1F4D3A', color: 'white' }
                : { background: 'white', color: '#3A4A42', border: '1px solid #E5E0D4' }}>
              {day.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Click-to-add hint ─────────────────────────────────────────────── */}
      {totalSessions > 0 && (
        <p className="text-[12px] mb-4" style={{ color: '#9BA8A1' }}>
          Click the timeline to add a session
        </p>
      )}

      {/* ── Timeline grid ─────────────────────────────────────────────────── */}
      {totalSessions === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center" style={{ borderColor: '#E5E0D4' }}>
          <p className="text-[14px] mb-4" style={{ color: '#6B7A72' }}>
            No sessions yet. Add sessions with start/end times to see the timeline.
          </p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.5} />
            Add first session
          </button>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-5 overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
          <AgendaTimeline
            sessions={displayedSessions}
            tracks={initialTracks as Track[]}
            onSlotClick={handleSlotClick}
            onSessionClick={s => { setEditSessionId(s.id); setAddOpen(true); }}
          />
        </div>
      )}

      {/* ── Quick-add modal ───────────────────────────────────────────────── */}
      {quickAdd?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setQuickAdd(null)} />
          <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border border-[#E5E0D4] w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Quick add session</span>
              <button onClick={() => setQuickAdd(null)} className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#3A4A42' }}>Title</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={quickForm.title}
                  onChange={e => setQuickForm(f => ({ ...f, title: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') handleQuickSave(); }}
                  placeholder="Session title"
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none transition"
                  style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: 'white' }}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#3A4A42' }}>Type</label>
                <select
                  value={quickForm.session_type}
                  onChange={e => setQuickForm(f => ({ ...f, session_type: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none"
                  style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: 'white' }}
                >
                  {SESSION_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Start time */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#3A4A42' }}>Start time</label>
                <input
                  type="datetime-local"
                  value={quickForm.starts_at}
                  onChange={e => setQuickForm(f => ({ ...f, starts_at: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none"
                  style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: 'white' }}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[12px] font-medium mb-1" style={{ color: '#3A4A42' }}>Duration</label>
                <select
                  value={quickForm.duration}
                  onChange={e => setQuickForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  className="w-full h-9 px-3 rounded-lg text-[13px] outline-none"
                  style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: 'white' }}
                >
                  {DURATIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              {/* Track (if tracks exist) */}
              {initialTracks.length > 0 && (
                <div>
                  <label className="block text-[12px] font-medium mb-1" style={{ color: '#3A4A42' }}>Track</label>
                  <select
                    value={quickForm.track_id}
                    onChange={e => setQuickForm(f => ({ ...f, track_id: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg text-[13px] outline-none"
                    style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: 'white' }}
                  >
                    <option value="">No track (General)</option>
                    {(initialTracks as Track[]).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setQuickAdd(null)}
                className="flex-1 h-9 rounded-xl text-[13px] font-medium transition"
                style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}>
                Cancel
              </button>
              <button
                onClick={handleQuickSave}
                disabled={quickSaving || !quickForm.title.trim()}
                className="flex-1 h-9 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1F4D3A' }}>
                {quickSaving ? 'Adding…' : 'Add session'}
              </button>
            </div>

            {/* Full form link */}
            <p className="text-center mt-3 text-[12px]" style={{ color: '#9BA8A1' }}>
              Need more fields?{' '}
              <button
                onClick={() => { setQuickAdd(null); setAddOpen(true); }}
                className="underline transition hover:text-[#1F4D3A]"
                style={{ color: '#6B7A72' }}>
                Full session form
              </button>
            </p>
          </div>
        </div>
      )}

      {/* ── Add session modal (uses SessionsManager in modal mode) ─────────── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setAddOpen(false); setEditSessionId(null); }} />
          <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border border-[#E5E0D4] w-full max-w-[700px] max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#E5E0D4' }}>
              <span className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>{editSessionId ? 'Edit session' : 'Sessions'}</span>
              <button onClick={() => { setAddOpen(false); setEditSessionId(null); }} className="h-8 w-8 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-6">
              <SessionsManager
                eventId={eventId}
                initialSessions={sessions as Session[]}
                speakers={speakers}
                initialTracks={initialTracks as Track[]}
                eventDates={eventDates}
                defaultEditSessionId={editSessionId}
                onSessionsChange={updated => setSessions(updated)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
