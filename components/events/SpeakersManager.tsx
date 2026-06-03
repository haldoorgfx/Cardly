'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react';
import type { Speaker, SpeakerType } from '@/types/database';

interface Props {
  eventId: string;
  initialSpeakers: Speaker[];
  speakerCount?: number;
}

const SPEAKER_TYPES: { value: SpeakerType; label: string }[] = [
  { value: 'speaker',  label: 'Speaker'  },
  { value: 'keynote',  label: 'Keynote'  },
  { value: 'panelist', label: 'Panelist' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'mc',       label: 'MC'       },
];

const TYPE_LABELS: Record<SpeakerType, string> = {
  speaker: 'Speaker', keynote: 'Keynote', panelist: 'Panelist', workshop: 'Workshop', mc: 'MC',
};

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

interface FormState {
  name: string; headline: string; role: string; company: string;
  bio: string; photo_url: string; speaker_type: SpeakerType; is_featured: boolean;
}

const EMPTY_FORM: FormState = {
  name: '', headline: '', role: '', company: '',
  bio: '', photo_url: '', speaker_type: 'speaker', is_featured: false,
};

export default function SpeakersManager({ eventId, initialSpeakers, speakerCount }: Props) {
  const [speakers, setSpeakers]       = useState<Speaker[]>(initialSpeakers);
  const [showForm, setShowForm]       = useState(false);
  const [editingSpeaker, setEditing]  = useState<Speaker | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [query, setQuery]             = useState('');
  const [typeFilter, setTypeFilter]   = useState<SpeakerType | 'all'>('all');

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setError(null); setShowForm(true);
  }
  function openEdit(s: Speaker) {
    setEditing(s);
    setForm({ name: s.name, headline: s.headline ?? '', role: s.role ?? '', company: s.company ?? '',
      bio: s.bio ?? '', photo_url: s.photo_url ?? '', speaker_type: s.speaker_type, is_featured: s.is_featured });
    setError(null); setShowForm(true);
  }
  function closeForm() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setError(null); }

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true); setError(null);
    try {
      if (editingSpeaker) {
        const res = await fetch(`/api/events/${eventId}/speakers`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speakerId: editingSpeaker.id, ...form }),
        });
        if (!res.ok) throw new Error('Failed to update speaker.');
        const { speaker: updated }: { speaker: Speaker } = await res.json();
        setSpeakers(p => p.map(s => s.id === updated.id ? updated : s));
      } else {
        const res = await fetch(`/api/events/${eventId}/speakers`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create speaker.');
        const { speaker: created }: { speaker: Speaker } = await res.json();
        setSpeakers(p => [created, ...p]);
      }
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally { setSaving(false); }
  }

  async function handleDelete(speakerId: string) {
    if (!confirm('Delete this speaker? This cannot be undone.')) return;
    setDeletingId(speakerId);
    try {
      await fetch(`/api/events/${eventId}/speakers?speakerId=${speakerId}`, { method: 'DELETE' });
      setSpeakers(p => p.filter(s => s.id !== speakerId));
    } finally { setDeletingId(null); }
  }

  // Filtered list
  const filtered = speakers.filter(s => {
    const q = query.toLowerCase();
    const matchQ = !q || s.name.toLowerCase().includes(q)
      || (s.headline ?? '').toLowerCase().includes(q)
      || (s.company ?? '').toLowerCase().includes(q);
    const matchT = typeFilter === 'all' || s.speaker_type === typeFilter;
    return matchQ && matchT;
  });

  const featured = filtered.find(s => s.is_featured);

  /* ── Inline add/edit form ───────────────────────────────────────────── */
  const Form = (
    <div className="bg-white border rounded-2xl p-6 space-y-4 mb-6" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between">
        <span className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
          {editingSpeaker ? 'Edit speaker' : 'New speaker'}
        </span>
        <button onClick={closeForm} className="w-7 h-7 grid place-items-center rounded-lg hover:bg-[#F0EDE8] transition-colors">
          <X size={16} style={{ color: '#6B7A72' }} />
        </button>
      </div>

      {error && (
        <p className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C' }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { key: 'name',      label: 'Name',          placeholder: 'Full name',       req: true },
          { key: 'headline',  label: 'Headline',       placeholder: 'e.g. CEO at Acme' },
          { key: 'role',      label: 'Role',           placeholder: 'Job title' },
          { key: 'company',   label: 'Company',        placeholder: 'Organization' },
          { key: 'photo_url', label: 'Photo URL',      placeholder: 'https://…' },
        ].map(f => (
          <div key={f.key} className={f.key === 'photo_url' ? '' : ''}>
            <label className="block text-[11px] font-medium mb-1" style={{ color: '#6B7A72' }}>
              {f.label}{f.req && <span style={{ color: '#B8423C' }}> *</span>}
            </label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-[13px] outline-none"
              style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              value={(form as Record<string, string>)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium mb-1" style={{ color: '#6B7A72' }}>Bio</label>
          <textarea
            className="w-full border rounded-lg px-3 py-2 text-[13px] resize-none outline-none"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
            rows={3}
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            placeholder="Short biography…"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium mb-1" style={{ color: '#6B7A72' }}>Speaker type</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-[13px] outline-none"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
            value={form.speaker_type}
            onChange={e => setForm(p => ({ ...p, speaker_type: e.target.value as SpeakerType }))}
          >
            {SPEAKER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="rounded" />
        <span className="text-[13px]" style={{ color: '#0F1F18' }}>Featured speaker (shown as hero card)</span>
      </label>

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60 transition-colors" style={{ background: '#1F4D3A' }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={closeForm} className="px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[#FAF6EE]" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
          Cancel
        </button>
      </div>
    </div>
  );

  /* ── Empty state ────────────────────────────────────────────────────── */
  if (speakers.length === 0 && !showForm) {
    return (
      <div>
        {/* Page header — shown even on empty state */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em]" style={{ color: '#1F4D3A' }}>Speakers</h1>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white shrink-0" style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.2} /> Add speaker
          </button>
        </div>
        <div className="rounded-2xl border p-12 text-center" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="inline-grid place-items-center w-12 h-12 rounded-xl mb-4" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            <Plus size={22} strokeWidth={1.8} />
          </div>
          <h3 className="font-display text-[16px] font-semibold mb-1" style={{ color: '#1F4D3A' }}>No speakers yet</h3>
          <p className="text-[13.5px] mb-5" style={{ color: '#6B7A72' }}>Add your speakers — they'll appear on the public event page.</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white" style={{ background: '#1F4D3A' }}>
            <Plus size={14} strokeWidth={2.2} /> Add first speaker
          </button>
        </div>
      </div>
    );
  }

  /* ── Main view ──────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.02em]" style={{ color: '#1F4D3A' }}>
            Speakers
          </h1>
          {speakers.length > 0 && (
            <p className="text-[14px] mt-0.5" style={{ color: '#6B7A72' }}>
              {speakers.length} speaker{speakers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium text-white shrink-0 transition-colors hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.2} /> Add speaker
          </button>
        )}
      </div>

      {showForm && Form}

      {/* Search + filter chips */}
      {speakers.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="relative max-w-[360px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7A72' }} />
            <input
              type="text"
              placeholder="Search speakers…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] outline-none"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(['all', ...SPEAKER_TYPES.map(t => t.value)] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t as SpeakerType | 'all')}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                style={typeFilter === t
                  ? { background: '#1F4D3A', color: 'white' }
                  : { background: 'white', border: '1px solid #E5E0D4', color: '#6B7A72' }}
              >
                {t === 'all' ? 'All' : TYPE_LABELS[t as SpeakerType]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Featured speaker banner */}
      {featured && (
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ height: 340 }}>
          {featured.photo_url ? (
            <Image
              src={featured.photo_url}
              alt={featured.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)' }} />
          )}
          {/* Scrim */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,31,23,0.85) 0%, rgba(13,31,23,0.2) 60%, transparent 100%)' }} />
          {/* Badge */}
          <div className="absolute top-5 right-5 font-mono text-[11px] font-medium px-3 py-1.5 rounded-full" style={{ background: 'white', color: '#1F4D3A' }}>
            Featured
          </div>
          {/* Caption */}
          <div className="absolute left-0 right-0 bottom-0 p-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-[26px] font-medium tracking-tight text-white" style={{ letterSpacing: '-0.02em' }}>
                {featured.name}
              </h2>
              <div className="text-[15px] mt-1" style={{ color: '#E8C57E' }}>
                {featured.headline || [featured.role, featured.company].filter(Boolean).join(', ')}
              </div>
              {featured.speaker_type !== 'speaker' && (
                <div className="inline-flex items-center gap-1.5 mt-3 h-7 px-3 rounded-full border text-[12px] font-medium" style={{ borderColor: '#E8C57E', color: '#E8C57E' }}>
                  {TYPE_LABELS[featured.speaker_type]}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(featured)} className="w-8 h-8 grid place-items-center rounded-lg transition-colors" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                <Pencil size={14} strokeWidth={1.8} />
              </button>
              <button onClick={() => handleDelete(featured.id)} disabled={deletingId === featured.id} className="w-8 h-8 grid place-items-center rounded-lg disabled:opacity-40 transition-colors" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>
                <Trash2 size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Speaker card grid ── */}
      {filtered.filter(s => !s.is_featured || !featured || s.id !== featured.id).length > 0 && (
        <>
          {featured && (
            <p className="font-display text-[18px] font-medium mb-4" style={{ color: '#0F1F18' }}>
              All speakers
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered
              .filter(s => !s.is_featured || !featured || s.id !== featured.id)
              .map(speaker => (
                <div
                  key={speaker.id}
                  className="group rounded-2xl overflow-hidden border transition-colors cursor-pointer"
                  style={{ background: 'white', borderColor: '#E5E0D4' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#E8C57E')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#E5E0D4')}
                >
                  {/* Photo — 3/4 aspect */}
                  <div className="relative w-full" style={{ paddingBottom: '133%' }}>
                    {speaker.photo_url ? (
                      <Image
                        src={speaker.photo_url}
                        alt={speaker.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 grid place-items-center"
                        style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', color: '#E8C57E' }}
                      >
                        <span className="font-display text-[28px] font-medium" style={{ color: '#FAF6EE' }}>
                          {getInitials(speaker.name)}
                        </span>
                      </div>
                    )}
                    {/* Hover controls */}
                    <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(speaker); }}
                        className="w-7 h-7 grid place-items-center rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.9)' }}
                      >
                        <Pencil size={13} strokeWidth={2} style={{ color: '#1F4D3A' }} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(speaker.id); }}
                        disabled={deletingId === speaker.id}
                        className="w-7 h-7 grid place-items-center rounded-lg disabled:opacity-40"
                        style={{ background: 'rgba(255,255,255,0.9)' }}
                      >
                        <Trash2 size={13} strokeWidth={2} style={{ color: '#B8423C' }} />
                      </button>
                    </div>
                  </div>

                  {/* Info strip */}
                  <div className="px-4 py-3.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-display text-[14px] font-medium leading-snug" style={{ color: '#1F4D3A' }}>
                        {speaker.name}
                      </div>
                      {(speaker.headline || speaker.role) && (
                        <div className="text-[12px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                          {speaker.headline || [speaker.role, speaker.company].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                    {speaker.speaker_type !== 'speaker' && (
                      <span className="text-[10.5px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                        {TYPE_LABELS[speaker.speaker_type]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {filtered.length === 0 && speakers.length > 0 && (
        <div className="py-12 text-center rounded-2xl border" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>No speakers match your search.</p>
        </div>
      )}
    </div>
  );
}
