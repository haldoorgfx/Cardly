'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { X, Plus, Trash2 } from 'lucide-react';
import type { Session, Track, SessionType } from '@/types/database';

interface SpeakerOption { id: string; name: string }

interface Props {
  eventId: string;
  initialSessions: Session[];
  speakers: SpeakerOption[];
  initialTracks: Track[];
}

const ROW_PX  = 64;  // px per 30-min slot
const SLOT_MIN = 30; // minutes per row

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: 'talk',      label: 'Talk'       },
  { value: 'keynote',   label: 'Keynote'    },
  { value: 'workshop',  label: 'Workshop'   },
  { value: 'panel',     label: 'Panel'      },
  { value: 'fireside',  label: 'Fireside'   },
  { value: 'lightning', label: 'Lightning'  },
  { value: 'break',     label: 'Break'      },
];

interface SessionForm {
  title: string;
  description: string;
  session_type: SessionType;
  track_id: string;
  starts_at: string;
  ends_at: string;
  room: string;
  speaker_ids: string[];
  is_published: boolean;
}

const EMPTY: SessionForm = {
  title: '', description: '', session_type: 'talk',
  track_id: '', starts_at: '', ends_at: '',
  room: '', speaker_ids: [], is_published: true,
};

function groupByDate(sessions: Session[]): Map<string, Session[]> {
  const m = new Map<string, Session[]>();
  for (const s of [...sessions].sort((a, b) =>
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )) {
    const k = new Date(s.starts_at).toDateString();
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(s);
  }
  return m;
}

function dayTab(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

function slotTime(slot: number, firstSlot: number): string {
  const totalMin = (firstSlot + slot) * SLOT_MIN;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

function sessionTopSlot(s: Session, firstSlot: number): number {
  const d = new Date(s.starts_at);
  const totalMin = d.getHours() * 60 + d.getMinutes();
  return totalMin / SLOT_MIN - firstSlot;
}

function sessionSlotSpan(s: Session): number {
  const start = new Date(s.starts_at).getTime();
  const end   = new Date(s.ends_at   ?? s.starts_at).getTime();
  const mins  = Math.max(SLOT_MIN, (end - start) / 60_000);
  return mins / SLOT_MIN;
}

function durationLabel(s: Session): string {
  const start = new Date(s.starts_at).getTime();
  const end   = new Date(s.ends_at   ?? s.starts_at).getTime();
  const min   = Math.round((end - start) / 60_000);
  return `${min} min`;
}

export default function AgendaBuilder({ eventId, initialSessions, speakers, initialTracks }: Props) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [tracks]                = useState<Track[]>(initialTracks);

  // Day navigation
  const byDate  = useMemo(() => groupByDate(sessions), [sessions]);
  const dayKeys = useMemo(() => Array.from(byDate.keys()), [byDate]);
  const [activeDay, setActiveDay] = useState<string>(dayKeys[0] ?? '');

  // All sessions (sidebar) + day sessions (grid)
  const allSorted   = useMemo(() => [...sessions].sort((a, b) =>
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  ), [sessions]);
  const daySessions = useMemo(() => byDate.get(activeDay) ?? [], [byDate, activeDay]);

  // Track columns for current day
  const dayTrackIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const s of daySessions) {
      const tid = (s as unknown as { track_id?: string }).track_id ?? '__general__';
      if (!seen.has(tid)) { seen.add(tid); result.push(tid); }
    }
    return result;
  }, [daySessions]);
  const columns: { id: string; name: string; color: string }[] = useMemo(() =>
    dayTrackIds.map(id => {
      if (id === '__general__') return { id, name: 'General', color: '#1F4D3A' };
      const t = tracks.find(t => t.id === id);
      return t ? { id: t.id, name: t.name, color: t.color ?? '#1F4D3A' } : { id, name: 'Track', color: '#1F4D3A' };
    }),
    [dayTrackIds, tracks]
  );

  // Time range (in 30-min slots)
  const { firstSlot, slotCount } = useMemo(() => {
    if (daySessions.length === 0) return { firstSlot: 18, slotCount: 18 }; // 9:00–18:00
    const mins = daySessions.flatMap(s => {
      const start = new Date(s.starts_at);
      const end   = new Date(s.ends_at ?? s.starts_at);
      return [start.getHours() * 60 + start.getMinutes(), end.getHours() * 60 + end.getMinutes()];
    });
    const minM = Math.max(0,   Math.floor(Math.min(...mins) / SLOT_MIN) - 1);
    const maxM = Math.min(1440, Math.ceil( Math.max(...mins) / SLOT_MIN) + 2);
    return { firstSlot: minM, slotCount: maxM - minM };
  }, [daySessions]);

  const slots = Array.from({ length: slotCount }, (_, i) => i);

  // Edit panel state
  const [panelSession, setPanelSession]     = useState<Session | null>(null);
  const [panelOpen, setPanelOpen]           = useState(false);
  const [form, setForm]                     = useState<SessionForm>(EMPTY);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState<string | null>(null);

  function openPanel(s: Session | null) {
    if (s) {
      setForm({
        title:        s.title,
        description:  s.description ?? '',
        session_type: s.session_type,
        track_id:     (s as unknown as { track_id?: string }).track_id ?? '',
        starts_at:    s.starts_at?.slice(0, 16) ?? '',
        ends_at:      s.ends_at?.slice(0, 16)   ?? '',
        room:         s.room ?? '',
        speaker_ids:  s.session_speakers?.map(ss => ss.speaker_id) ?? [],
        is_published: s.is_published,
      });
    } else {
      setForm(EMPTY);
    }
    setPanelSession(s);
    setFormError(null);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setPanelSession(null);
    setFormError(null);
  }

  function field<K extends keyof SessionForm>(key: K, value: SessionForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleSpeaker(id: string) {
    setForm(f => ({
      ...f,
      speaker_ids: f.speaker_ids.includes(id)
        ? f.speaker_ids.filter(s => s !== id)
        : [...f.speaker_ids, id],
    }));
  }

  async function handleSave() {
    if (!form.title.trim()) { setFormError('Title is required'); return; }
    setSaving(true); setFormError(null);
    try {
      const payload = { ...form, track_id: form.track_id || null };
      if (panelSession) {
        const res = await fetch(`/api/events/${eventId}/sessions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: panelSession.id, ...payload }),
        });
        if (!res.ok) throw new Error('Save failed');
        const { session: updated }: { session: Session } = await res.json();
        setSessions(prev => prev.map(s => s.id === updated.id ? updated : s));
      } else {
        const res = await fetch(`/api/events/${eventId}/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        const { session: created }: { session: Session } = await res.json();
        setSessions(prev => [...prev, created]);
      }
      closePanel();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!panelSession) return;
    if (!confirm('Delete this session?')) return;
    await fetch(`/api/events/${eventId}/sessions?sessionId=${panelSession.id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== panelSession.id));
    closePanel();
  }

  const LABEL_W = 64;
  const COL_W   = 160; // min track column width

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── Top action bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-7 shrink-0"
        style={{ height: 60, borderBottom: '1px solid #E5E0D4', background: '#FAF6EE' }}
      >
        {/* Day tabs */}
        <div className="flex gap-1">
          {dayKeys.length > 0 ? dayKeys.map(k => (
            <button
              key={k}
              onClick={() => setActiveDay(k)}
              className="px-4 py-1.5 rounded-lg font-display font-medium text-[14px] transition-colors"
              style={k === activeDay
                ? { background: '#E8EFEB', color: '#1F4D3A' }
                : { color: '#6B7A72' }}
            >
              {dayTab(k)}
            </button>
          )) : (
            <span className="text-[13px]" style={{ color: '#6B7A72' }}>No sessions yet</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/e/${eventId}`}
            className="inline-flex items-center h-8 px-3 rounded-lg text-[13px] font-medium transition"
            style={{ border: '1px solid #E5E0D4', color: '#1F4D3A', background: 'white' }}
          >
            Preview as attendee
          </Link>
          <button
            onClick={() => openPanel(null)}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2} />
            Add session
          </button>
        </div>
      </div>

      {/* ── Builder body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        <aside
          className="shrink-0 flex flex-col overflow-y-auto"
          style={{ width: 280, borderRight: '1px solid #E5E0D4', background: '#FAF6EE', padding: '20px 14px' }}
        >
          <div
            className="text-[11px] font-medium uppercase tracking-wider px-1.5 mb-3"
            style={{ color: '#6B7A72' }}
          >
            Sessions
          </div>

          {allSorted.length === 0 ? (
            <div className="text-[13px] px-1.5" style={{ color: '#6B7A72' }}>
              No sessions yet. Add one to get started.
            </div>
          ) : (
            allSorted.map(s => {
              const track = tracks.find(t => t.id === (s as unknown as { track_id?: string }).track_id);
              const firstSpeaker = s.session_speakers?.[0]?.speakers?.name;
              return (
                <button
                  key={s.id}
                  onClick={() => openPanel(s)}
                  className="flex items-start gap-2.5 px-2.5 py-3 rounded-xl text-left transition-colors w-full"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F0ECE4')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* drag handle visual */}
                  <span className="shrink-0 pt-0.5 text-[16px] leading-none" style={{ color: '#6B7A72', letterSpacing: -1 }}>⠿</span>
                  <div className="min-w-0">
                    <div className="font-medium text-[14px] leading-snug" style={{ color: '#1F4D3A' }}>
                      {s.title}
                    </div>
                    {(firstSpeaker || track) && (
                      <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                        {firstSpeaker ?? (track ? track.name : '')}
                      </div>
                    )}
                    <div className="font-mono text-[11px] mt-1" style={{ color: '#6B7A72' }}>
                      {durationLabel(s)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </aside>

        {/* ── Grid ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto" style={{ background: '#FAF6EE' }}>
          {daySessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: '#6B7A72' }}>
              <div className="text-[15px] mb-2">No sessions on this day</div>
              <button
                onClick={() => openPanel(null)}
                className="text-[13px] font-medium"
                style={{ color: '#1F4D3A' }}
              >
                + Add session
              </button>
            </div>
          ) : (
            <>
              {/* Track headers */}
              <div
                className="sticky top-0 z-10 grid"
                style={{
                  gridTemplateColumns: `${LABEL_W}px repeat(${columns.length}, minmax(${COL_W}px, 1fr))`,
                  borderBottom: '1px solid #E5E0D4',
                  background: '#FAF6EE',
                }}
              >
                <div />
                {columns.map(col => (
                  <div
                    key={col.id}
                    className="px-3 py-3.5 text-[13px] font-medium flex items-center gap-2"
                    style={{ borderRight: '1px solid #E5E0D4', color: '#3A4A42' }}
                  >
                    <span
                      className="inline-block rounded-full shrink-0"
                      style={{ width: 8, height: 8, background: col.color }}
                    />
                    {col.name}
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div
                className="grid relative"
                style={{ gridTemplateColumns: `${LABEL_W}px repeat(${columns.length}, minmax(${COL_W}px, 1fr))` }}
              >
                {/* Time labels column */}
                <div>
                  {slots.map(i => (
                    <div
                      key={i}
                      className="font-mono text-[12px] text-right pr-2"
                      style={{ height: ROW_PX, paddingTop: 4, color: '#6B7A72', borderRight: '1px solid #E5E0D4' }}
                    >
                      {i % 2 === 0 ? slotTime(i, firstSlot) : ''}
                    </div>
                  ))}
                </div>

                {/* Track columns */}
                {columns.map(col => {
                  const colSessions = daySessions.filter(s => {
                    const tid = (s as unknown as { track_id?: string }).track_id;
                    return col.id === '__general__' ? !tid : tid === col.id;
                  });

                  return (
                    <div
                      key={col.id}
                      className="relative"
                      style={{ borderRight: '1px solid #E5E0D4', height: slots.length * ROW_PX }}
                    >
                      {/* Slot grid lines */}
                      {slots.map(i => (
                        <div
                          key={i}
                          className="absolute left-0 right-0"
                          style={{
                            top: i * ROW_PX,
                            borderTop: `1px solid ${i % 2 === 0 ? '#E5E0D4' : 'rgba(229,224,212,0.4)'}`,
                          }}
                        />
                      ))}

                      {/* Session blocks */}
                      {colSessions.map(s => {
                        const topSlot = sessionTopSlot(s, firstSlot);
                        const span    = sessionSlotSpan(s);
                        const top     = topSlot * ROW_PX + 3;
                        const height  = Math.max(ROW_PX - 6, span * ROW_PX - 6);
                        const isOpen  = panelSession?.id === s.id && panelOpen;
                        return (
                          <div
                            key={s.id}
                            onClick={() => openPanel(s)}
                            className="absolute rounded-xl overflow-hidden cursor-pointer"
                            style={{
                              left: 4, right: 4, top, height,
                              background: '#F7F4F0',
                              border: isOpen ? `1px solid #E8C57E` : '1px solid #E5E0D4',
                              boxShadow: isOpen ? '0 0 0 1px #E8C57E' : undefined,
                              borderLeft: `3px solid ${col.color}`,
                            }}
                          >
                            <div className="px-2.5 pt-2">
                              <div className="font-medium text-[13px] leading-tight" style={{ color: '#1F4D3A' }}>
                                {s.title}
                              </div>
                              {height > 48 && (
                                <div className="text-[11px] mt-1" style={{ color: '#6B7A72' }}>
                                  {s.session_speakers?.[0]?.speakers?.name ?? ''}
                                  {s.room ? ` · ${s.room}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Edit panel (slide-out) ────────────────────────────────────────── */}
        <aside
          className="fixed top-16 right-0 bottom-0 overflow-y-auto"
          style={{
            width: 360,
            background: '#FAF6EE',
            borderLeft: '1px solid #E5E0D4',
            boxShadow: '-4px 0 24px rgba(15,31,24,0.08)',
            transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
            zIndex: 40,
            padding: 24,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="font-display font-semibold text-[16px]" style={{ color: '#1F4D3A' }}>
              {panelSession ? 'Edit session' : 'New session'}
            </div>
            <button onClick={closePanel} className="p-1 rounded-lg hover:bg-black/5">
              <X size={18} strokeWidth={2} color="#6B7A72" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 px-3 py-2 rounded-lg text-[13px]" style={{ background: '#FDECEA', color: '#B8423C' }}>
              {formError}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            <Field label="Title">
              <input
                className="field-input"
                style={inputStyle}
                value={form.title}
                onChange={e => field('title', e.target.value)}
                placeholder="Session title"
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                style={{ ...inputStyle, resize: 'none' }}
                value={form.description}
                onChange={e => field('description', e.target.value)}
                placeholder="Optional description"
              />
            </Field>

            {speakers.length > 0 && (
              <Field label="Speaker(s)">
                <select style={inputStyle} onChange={e => e.target.value && toggleSpeaker(e.target.value)} value="">
                  <option value="">Select speaker…</option>
                  {speakers.filter(sp => !form.speaker_ids.includes(sp.id)).map(sp => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
                {form.speaker_ids.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.speaker_ids.map(id => {
                      const sp = speakers.find(s => s.id === id);
                      return sp ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px]"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                        >
                          {sp.name}
                          <button onClick={() => toggleSpeaker(id)} className="hover:opacity-60">
                            <X size={10} />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </Field>
            )}

            <Field label="Room">
              <input
                style={inputStyle}
                value={form.room}
                onChange={e => field('room', e.target.value)}
                placeholder="e.g. Main Stage"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Track">
                <select style={inputStyle} value={form.track_id} onChange={e => field('track_id', e.target.value)}>
                  <option value="">None</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Type">
                <select style={inputStyle} value={form.session_type} onChange={e => field('session_type', e.target.value as SessionType)}>
                  {SESSION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={form.starts_at}
                  onChange={e => field('starts_at', e.target.value)}
                />
              </Field>
              <Field label="End">
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={form.ends_at}
                  onChange={e => field('ends_at', e.target.value)}
                />
              </Field>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 w-full h-11 rounded-xl font-display font-semibold text-[14px] text-white transition"
            style={{ background: saving ? '#6B7A72' : '#1F4D3A' }}
          >
            {saving ? 'Saving…' : panelSession ? 'Save changes' : 'Create session'}
          </button>

          {/* Delete */}
          {panelSession && (
            <div className="mt-4 text-center">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 text-[13px]"
                style={{ color: '#B8423C' }}
              >
                <Trash2 size={13} />
                Delete session
              </button>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5E0D4',
  borderRadius: 8,
  padding: '9px 12px',
  fontSize: 14,
  fontFamily: 'inherit',
  color: '#0F1F18',
  background: 'white',
  outline: 'none',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>{label}</label>
      {children}
    </div>
  );
}
