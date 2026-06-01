'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { Session, Track, SessionType } from '@/types/database';

interface SpeakerOption {
  id: string;
  name: string;
  photo_url: string | null;
}

interface Props {
  eventId: string;
  initialSessions: Session[];
  speakers: SpeakerOption[];
  initialTracks: Track[];
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

function formatTimeRange(start: string, end: string) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  const dateStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const startTime = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const endTime = e.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} · ${startTime}–${endTime}`;
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

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function SessionsManager({ eventId, initialSessions, speakers, initialTracks }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [trackForm, setTrackForm] = useState({ name: '', color: TRACK_COLORS[0] });
  const [showTrackForm, setShowTrackForm] = useState(false);

  const [showSessionForm, setShowSessionForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>(EMPTY_SESSION);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grouped = useMemo(() => groupByDate(sessions), [sessions]);

  // Track management
  async function handleAddTrack() {
    if (!trackForm.name.trim()) return;
    const res = await fetch(`/api/events/${eventId}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trackForm.name, color: trackForm.color }),
    });
    if (!res.ok) return;
    const created: Track = await res.json();
    setTracks((prev) => [...prev, created]);
    setTrackForm({ name: '', color: TRACK_COLORS[0] });
    setShowTrackForm(false);
  }

  async function handleDeleteTrack(trackId: string) {
    if (!confirm('Delete track? Sessions will be unassigned.')) return;
    await fetch(`/api/events/${eventId}/tracks?trackId=${trackId}`, { method: 'DELETE' });
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
  }

  // Session form helpers
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

  async function handleSaveSession() {
    if (!sessionForm.title.trim()) { setError('Title is required.'); return; }
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
        if (!res.ok) throw new Error('Failed to update.');
        const updated: Session = await res.json();
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const res = await fetch(`/api/events/${eventId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create.');
        const created: Session = await res.json();
        setSessions((prev) => [...prev, created]);
      }
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error.');
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
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: track.color }}
                  />
                  <span className="text-sm flex-1" style={{ color: '#0F1F18' }}>{track.name}</span>
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    className="p-1 rounded hover:bg-red-50"
                  >
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
                <button
                  onClick={handleAddTrack}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                  style={{ background: '#1F4D3A' }}
                >
                  Add
                </button>
                <button
                  onClick={() => setShowTrackForm(false)}
                  className="p-1.5 rounded hover:bg-gray-100"
                >
                  <X size={14} color="#6B7A72" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTrackForm(true)}
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: '#1F4D3A' }}
              >
                <Plus size={14} /> Add track
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sessions section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold" style={{ color: '#0F1F18' }}>Sessions</h2>
          {!showSessionForm && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#1F4D3A' }}
            >
              <Plus size={15} /> Add session
            </button>
          )}
        </div>

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

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg bg-red-50" style={{ color: '#B8423C' }}>{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Title <span style={{ color: '#B8423C' }}>*</span></label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.title}
                  onChange={(e) => setSessionForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Description</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  rows={3}
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Type</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.session_type}
                  onChange={(e) => setSessionForm((f) => ({ ...f, session_type: e.target.value as SessionType }))}
                >
                  {SESSION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
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
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Start</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.starts_at}
                  onChange={(e) => setSessionForm((f) => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>End</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.ends_at}
                  onChange={(e) => setSessionForm((f) => ({ ...f, ends_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Room</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.room}
                  onChange={(e) => setSessionForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="Room / Hall"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Capacity</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                  value={sessionForm.capacity}
                  onChange={(e) => setSessionForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="e.g. 100"
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
                {saving ? 'Saving…' : 'Save'}
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
          <div className="bg-white border rounded-2xl p-10 flex flex-col items-center gap-3" style={{ borderColor: '#E5E0D4' }}>
            <p className="text-sm" style={{ color: '#6B7A72' }}>No sessions yet.</p>
            <button
              onClick={openAdd}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: '#1F4D3A' }}
            >
              Add first session
            </button>
          </div>
        ) : (
          grouped.map(([dateKey, daySessions]) => (
            <div key={dateKey} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#6B7A72' }}>
                {new Date(dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {daySessions.map((session) => {
                const track = getTrack(session.track_id);
                const sessionSpeakers = session.session_speakers?.map((ss) => ss.speakers).filter(Boolean) ?? [];
                return (
                  <div
                    key={session.id}
                    className="bg-white border rounded-xl p-3 flex items-center gap-3"
                    style={{ borderColor: '#E5E0D4' }}
                  >
                    <div
                      className="w-[3px] self-stretch rounded-full shrink-0"
                      style={{ background: track?.color ?? '#E5E0D4', minHeight: 32 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>
                        {session.title}
                      </p>
                      <p className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                        {formatTimeRange(session.starts_at, session.ends_at)}
                        {session.room ? ` · ${session.room}` : ''}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                    >
                      {session.session_type}
                    </span>
                    <div className="flex -space-x-2 shrink-0">
                      {sessionSpeakers.slice(0, 3).map((sp) =>
                        sp ? (
                          sp.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={sp.id} src={sp.photo_url} alt={sp.name} className="w-6 h-6 rounded-full border-2 border-white object-cover" />
                          ) : (
                            <div
                              key={sp.id}
                              className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-semibold"
                              style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                            >
                              {getInitials(sp.name)}
                            </div>
                          )
                        ) : null
                      )}
                    </div>
                    <button onClick={() => openEdit(session)} className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0">
                      <Pencil size={14} color="#6B7A72" />
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      disabled={deletingId === session.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 shrink-0 disabled:opacity-40"
                    >
                      <Trash2 size={14} color="#B8423C" />
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
