'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, X, ChevronDown, ChevronUp, User, MapPin, Settings, CalendarDays, AlertCircle, Upload } from 'lucide-react';
import type { Session, Track, SessionType } from '@/types/database';
import { ImportWizard } from '@/components/shared/ImportWizard';
import { IMPORT_ENTITIES } from '@/lib/import/entities';

interface SpeakerOption {
  id: string;
  name: string;
  photo_url: string | null;
}

export interface EventDates {
  starts_at: string | null;
  ends_at: string | null;
}

interface Props {
  eventId: string;
  initialSessions: Session[];
  speakers: SpeakerOption[];
  initialTracks: Track[];
  eventDates?: EventDates;
}

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'talk', label: 'Talk' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'panel', label: 'Panel' },
  { value: 'fireside', label: 'Fireside' },
  { value: 'lightning', label: 'Lightning' },
  { value: 'break', label: 'Break' },
];

const TRACK_COLORS = ['#1F4D3A', '#3A6B8C', '#C97A2D', '#B8423C', '#7A4DCF', '#2D7A4F'];

interface SessionForm {
  title: string;
  description: string;
  session_type: SessionType;
  track_id: string;
  starts_at: string;
  ends_at: string;
  room: string;
  capacity: string;
  speaker_ids: string[];
  is_published: boolean;
}

const EMPTY_SESSION: SessionForm = {
  title: '',
  description: '',
  session_type: 'talk',
  track_id: '',
  starts_at: '',
  ends_at: '',
  room: '',
  capacity: '',
  speaker_ids: [],
  is_published: false,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function groupByDate(sessions: Session[]): [string, Session[]][] {
  const map = new Map<string, Session[]>();
  const sorted = [...sessions].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  for (const s of sorted) {
    const key = new Date(s.starts_at).toDateString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries());
}

export default function SessionsManager({ eventId, initialSessions, speakers, initialTracks, eventDates }: Props) {
  const ev = eventDates ?? { starts_at: null, ends_at: null };

  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);
  const [trackForm, setTrackForm] = useState({ name: '', color: TRACK_COLORS[0] });
  const [showTrackForm, setShowTrackForm] = useState(false);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(EMPTY_SESSION);
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);

  async function reloadSessions() {
    const res = await fetch(`/api/events/${eventId}/sessions`);
    if (res.ok) {
      const { sessions: fresh }: { sessions: Session[] } = await res.json();
      setSessions(fresh);
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);
  const dayKeys = useMemo(() => grouped.map(([k]) => k), [grouped]);
  const currentDay = activeDay && dayKeys.includes(activeDay) ? activeDay : (dayKeys[0] ?? null);
  const activeSessions = useMemo(
    () => grouped.find(([k]) => k === currentDay)?.[1] ?? [],
    [grouped, currentDay]
  );

  // datetime-local min/max from event dates
  const eventStartInput = ev.starts_at ? toLocalInput(ev.starts_at) : undefined;
  const eventEndInput = ev.ends_at ? toLocalInput(ev.ends_at) : undefined;

  async function handleAddTrack() {
    if (!trackForm.name.trim()) return;
    const res = await fetch(`/api/events/${eventId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trackForm.name, color: trackForm.color }),
    });
    if (!res.ok) return;
    const { track: created }: { track: Track } = await res.json();
    setTracks((prev) => [...prev, created]);
    setTrackForm({ name: '', color: TRACK_COLORS[0] });
    setShowTrackForm(false);
  }

  async function handleDeleteTrack(trackId: string) {
    if (!confirm('Delete track? Sessions will be unassigned.')) return;
    await fetch(`/api/events/${eventId}/tracks?trackId=${trackId}`, { method: 'DELETE' });
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }

  function openAdd() {
    setEditingSession(null);
    setSessionForm(EMPTY_SESSION);
    setError(null);
    setShowSessionForm(true);
  }

  function openEdit(session: Session) {
    setEditingSession(session);
    setSessionForm({
      title: session.title,
      description: session.description ?? '',
      session_type: session.session_type,
      track_id: session.track_id ?? '',
      starts_at: session.starts_at ? session.starts_at.slice(0, 16) : '',
      ends_at: session.ends_at ? session.ends_at.slice(0, 16) : '',
      room: session.room ?? '',
      capacity: session.capacity?.toString() ?? '',
      speaker_ids: session.session_speakers?.map((ss) => ss.speaker_id) ?? [],
      is_published: session.is_published,
    });
    setError(null);
    setShowSessionForm(true);
  }

  function closeForm() {
    setShowSessionForm(false);
    setEditingSession(null);
    setSessionForm(EMPTY_SESSION);
    setError(null);
  }

  function toggleSpeaker(id: string) {
    setSessionForm((f) => ({
      ...f,
      speaker_ids: f.speaker_ids.includes(id)
        ? f.speaker_ids.filter((s) => s !== id)
        : [...f.speaker_ids, id],
    }));
  }

  function clientValidate(): string | null {
    if (!sessionForm.title.trim()) return 'Title is required';
    if (!sessionForm.starts_at) return 'Start time is required';
    if (!sessionForm.ends_at) return 'End time is required';

    const start = new Date(sessionForm.starts_at);
    const end = new Date(sessionForm.ends_at);

    if (isNaN(start.getTime())) return 'Start time is not a valid date';
    if (isNaN(end.getTime())) return 'End time is not a valid date';
    if (start >= end) return 'Session start must be before session end';

    if (ev.starts_at && start < new Date(ev.starts_at)) {
      return `Session cannot start before the event begins (${fmtDate(ev.starts_at)})`;
    }
    if (ev.ends_at && end > new Date(ev.ends_at)) {
      return `Session cannot end after the event ends (${fmtDate(ev.ends_at)})`;
    }
    if (ev.ends_at && start > new Date(ev.ends_at)) {
      return `Session start (${fmtDate(sessionForm.starts_at)}) is after the event has ended (${fmtDate(ev.ends_at)})`;
    }

    if (sessionForm.capacity) {
      const cap = parseInt(sessionForm.capacity);
      if (isNaN(cap) || cap < 1) return 'Capacity must be at least 1';
    }

    return null;
  }

  async function handleSaveSession() {
    const validationErr = clientValidate();
    if (validationErr) { setError(validationErr); return; }

    setSaving(true); setError(null);
    try {
      const payload = {
        ...sessionForm,
        capacity: sessionForm.capacity ? parseInt(sessionForm.capacity) : null,
        track_id: sessionForm.track_id || null,
      };
      if (editingSession) {
        const res = await fetch(`/api/events/${eventId}/sessions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: editingSession.id, ...payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to update');
        const { session: updated }: { session: Session } = data;
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const res = await fetch(`/api/events/${eventId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to create');
        const { session: created }: { session: Session } = data;
        setSessions((prev) => [...prev, created]);
      }
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Delete this session?')) return;
    setDeletingId(sessionId);
    try {
      await fetch(`/api/events/${eventId}/sessions?sessionId=${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } finally {
      setDeletingId(null);
    }
  }

  function getTrack(trackId: string | null) {
    return tracks.find((t) => t.id === trackId) ?? null;
  }

  return (
    <div className="space-y-6">
      {/* Tracks section */}
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
        <button
          className="w-full flex items-center justify-between px-5 py-4"
          onClick={() => setTracksOpen((v) => !v)}
        >
          <span className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
            Tracks ({tracks.length})
          </span>
          {tracksOpen ? <ChevronUp size={16} color="#6B7A72" /> : <ChevronDown size={16} color="#6B7A72" />}
        </button>

        {tracksOpen && (
          <div className="px-5 pb-5 space-y-3 border-t" style={{ borderColor: '#E5E0D4' }}>
            <div className="pt-3 space-y-2">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: track.color }} />
                  <span className="text-sm flex-1" style={{ color: '#0F1F18' }}>{track.name}</span>
                  <button onClick={() => handleDeleteTrack(track.id)} className="p-1 rounded hover:bg-red-50">
                    <Trash2 size={13} color="#B8423C" />
                  </button>
                </div>
              ))}
            </div>
            {showTrackForm ? (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <input
                  className="border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[140px]"
                  style={{ borderColor: '#E5E0D4' }}
                  placeholder="Track name"
                  value={trackForm.name}
                  onChange={(e) => setTrackForm((f) => ({ ...f, name: e.target.value }))}
                />
                <div className="flex gap-1">
                  {TRACK_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setTrackForm((f) => ({ ...f, color: c }))}
                      className="w-6 h-6 rounded-full border-2 transition-transform"
                      style={{
                        background: c,
                        borderColor: trackForm.color === c ? '#0F1F18' : 'transparent',
                        transform: trackForm.color === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <button onClick={handleAddTrack} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ background: '#1F4D3A' }}>
                  Add
                </button>
                <button onClick={() => setShowTrackForm(false)} className="p-1.5 rounded hover:bg-gray-100">
                  <X size={14} color="#6B7A72" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowTrackForm(true)} className="flex items-center gap-1 text-sm font-medium" style={{ color: '#1F4D3A' }}>
                <Plus size={14} /> Add track
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <h2 className="font-display text-[18px] font-semibold" style={{ color: '#0F1F18' }}>Sessions</h2>
            {dayKeys.length > 1 && (
              <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                {grouped.map(([dateKey]) => {
                  const d = new Date(dateKey);
                  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const isActive = dateKey === currentDay;
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setActiveDay(dateKey)}
                      className="h-7 px-3 rounded-lg text-[12.5px] font-medium transition whitespace-nowrap"
                      style={isActive ? { background: '#E8EFEB', color: '#0F1F18' } : { color: '#6B7A72' }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {!showSessionForm && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImport(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium border transition hover:bg-[#F5F3EE]"
                style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}
              >
                <Upload size={15} strokeWidth={2} /> Import
              </button>
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13.5px] font-medium text-white transition hover:bg-[#163828]"
                style={{ background: '#1F4D3A' }}
              >
                <Plus size={15} strokeWidth={2} /> Add session
              </button>
            </div>
          )}
        </div>

        <ImportWizard
          open={showImport}
          onClose={() => setShowImport(false)}
          eventId={eventId}
          entity={IMPORT_ENTITIES.sessions}
          onComplete={reloadSessions}
        />

        {showSessionForm && (
          <div className="bg-white border rounded-2xl p-5 space-y-4" style={{ borderColor: '#E5E0D4' }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-semibold" style={{ color: '#0F1F18' }}>
                {editingSession ? 'Edit session' : 'New session'}
              </span>
              <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100">
                <X size={16} color="#6B7A72" />
              </button>
            </div>

            {/* Event date hint */}
            {(ev.starts_at || ev.ends_at) && (
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px]"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                <CalendarDays size={12} strokeWidth={2} />
                Sessions must be within:{' '}
                <strong>
                  {ev.starts_at && fmtDate(ev.starts_at)}
                  {ev.starts_at && ev.ends_at && ' → '}
                  {ev.ends_at && fmtDate(ev.ends_at)}
                </strong>
              </div>
            )}

            {error && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-[13px]"
                style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}
              >
                <AlertCircle size={14} strokeWidth={2} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>
                  Title <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none transition"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  rows={3}
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm((f) => ({ ...f, description: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Type</label>
                <div className="flex flex-wrap gap-1.5">
                  {SESSION_TYPES.map((t) => {
                    const active = sessionForm.session_type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setSessionForm((f) => ({ ...f, session_type: t.value }))}
                        className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition"
                        style={active
                          ? { background: '#1F4D3A', color: 'white' }
                          : { background: 'white', color: '#6B7A72', border: '1px solid #E5E0D4' }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Track</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.track_id}
                  onChange={(e) => setSessionForm((f) => ({ ...f, track_id: e.target.value }))}
                >
                  <option value="">No track</option>
                  {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>
                  Start <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: sessionForm.starts_at ? '#E5E0D4' : 'rgba(184,66,60,0.4)', color: '#0F1F18' }}
                  value={sessionForm.starts_at}
                  min={eventStartInput}
                  max={sessionForm.ends_at || eventEndInput}
                  onChange={(e) => setSessionForm((f) => ({ ...f, starts_at: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>
                  End <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ borderColor: sessionForm.ends_at ? '#E5E0D4' : 'rgba(184,66,60,0.4)', color: '#0F1F18' }}
                  value={sessionForm.ends_at}
                  min={sessionForm.starts_at || eventStartInput}
                  max={eventEndInput}
                  onChange={(e) => setSessionForm((f) => ({ ...f, ends_at: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>

              {/* Inline time conflict warning */}
              {sessionForm.starts_at && sessionForm.ends_at && new Date(sessionForm.starts_at) >= new Date(sessionForm.ends_at) && (
                <div className="sm:col-span-2 flex items-center gap-1.5 text-[12px]" style={{ color: '#C97A2D' }}>
                  <AlertCircle size={12} strokeWidth={2} />
                  Start time must be before end time
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Room</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.room}
                  onChange={(e) => setSessionForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="Room / Hall"
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Capacity (optional)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.capacity}
                  min={1}
                  onChange={(e) => setSessionForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 100"
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
            </div>

            {speakers.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Speakers</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {speakers.map((sp) => (
                    <label key={sp.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sessionForm.speaker_ids.includes(sp.id)}
                        onChange={() => toggleSpeaker(sp.id)}
                        className="rounded"
                      />
                      <span className="text-sm truncate" style={{ color: '#0F1F18' }}>{sp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sessionForm.is_published}
                onChange={(e) => setSessionForm((f) => ({ ...f, is_published: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm" style={{ color: '#0F1F18' }}>Published</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSession}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
                style={{ background: '#1F4D3A' }}
              >
                {saving ? 'Saving…' : editingSession ? 'Save changes' : 'Add session'}
              </button>
              <button
                onClick={closeForm}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {grouped.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 flex flex-col items-center gap-4 text-center" style={{ borderColor: '#E5E0D4' }}>
            <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: '#E8EFEB' }}>
              <Plus size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
            </div>
            <div>
              <div className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>No sessions yet</div>
              <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
                Add sessions to build your agenda.
                {ev.starts_at && ev.ends_at && (
                  <span> Sessions must fall within{' '}
                    <strong>{fmtDate(ev.starts_at)}</strong> and <strong>{fmtDate(ev.ends_at)}</strong>.
                  </span>
                )}
              </p>
            </div>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13.5px] font-medium text-white" style={{ background: '#1F4D3A' }}>
              <Plus size={15} strokeWidth={2} /> Add first session
            </button>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {activeSessions.map((session) => {
              const track = getTrack(session.track_id);
              const sessionSpeakers = session.session_speakers?.map((ss) => ss.speakers).filter(Boolean) ?? [];
              const startTime = session.starts_at
                ? new Date(session.starts_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                : null;
              const duration = session.starts_at && session.ends_at
                ? Math.round((new Date(session.ends_at).getTime() - new Date(session.starts_at).getTime()) / 60000) + 'm'
                : null;
              const speakerText = sessionSpeakers.length === 1
                ? sessionSpeakers[0]?.name
                : sessionSpeakers.length > 1
                ? `Panel · ${sessionSpeakers.length} speakers`
                : null;
              return (
                <div
                  key={session.id}
                  className="bg-white border border-[#E5E0D4] rounded-2xl px-5 py-4 flex items-center gap-5 hover:border-[#1F4D3A]/40 transition-colors"
                >
                  <div className="text-center shrink-0 w-[52px]">
                    {startTime && <div className="font-mono text-[15px] tracking-tight" style={{ color: '#1F4D3A' }}>{startTime}</div>}
                    {duration && <div className="font-mono text-[10px] mt-0.5" style={{ color: '#6B7A72' }}>{duration}</div>}
                  </div>
                  <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: track?.color ?? '#E5E0D4', minHeight: 32 }} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[14.5px] font-semibold tracking-tight leading-snug" style={{ color: '#0F1F18' }}>{session.title}</div>
                    <div className="flex items-center gap-2.5 mt-1.5 font-mono text-[11px] flex-wrap" style={{ color: '#6B7A72' }}>
                      {speakerText && <span className="inline-flex items-center gap-1"><User size={11} strokeWidth={1.8} />{speakerText}</span>}
                      {speakerText && session.room && <span style={{ color: '#E5E0D4' }}>·</span>}
                      {session.room && <span className="inline-flex items-center gap-1"><MapPin size={11} strokeWidth={1.8} />{session.room}</span>}
                    </div>
                  </div>
                  {track && (
                    <span className="hidden sm:inline-flex items-center text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      {track.name}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={session.is_published
                      ? { background: '#ECFDF5', border: '1px solid #BBF7D0', color: '#065f46' }
                      : { background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400e' }}
                  >
                    {session.is_published ? 'Confirmed' : 'Draft'}
                  </span>
                  <button
                    onClick={() => openEdit(session)}
                    className="w-8 h-8 grid place-items-center rounded-lg transition shrink-0 hover:bg-[#E8EFEB] hover:text-[#1F4D3A]"
                    style={{ color: '#6B7A72' }}
                  >
                    <Settings size={15} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    disabled={deletingId === session.id}
                    className="w-8 h-8 grid place-items-center rounded-lg transition shrink-0 hover:bg-red-50 disabled:opacity-40"
                    style={{ color: '#B8423C' }}
                  >
                    <Trash2 size={15} strokeWidth={1.8} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
