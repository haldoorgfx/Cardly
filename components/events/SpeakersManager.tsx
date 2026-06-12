'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Plus, X, Sparkles, ExternalLink } from 'lucide-react';
import type { Speaker, SpeakerType } from '@/types/database';

interface Props {
  eventId: string;
  initialSpeakers: Speaker[];
}

const SPEAKER_TYPES: { value: SpeakerType; label: string }[] = [
  { value: 'speaker', label: 'Speaker' },
  { value: 'keynote', label: 'Keynote' },
  { value: 'panelist', label: 'Panelist' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'mc', label: 'MC' },
];

const TYPE_LABELS: Record<SpeakerType, string> = {
  speaker: 'Speaker',
  keynote: 'Keynote',
  panelist: 'Panelist',
  workshop: 'Workshop',
  mc: 'MC',
};

const AVATAR_GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#C9A45E,#1F4D3A)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#1F4D3A,#163828)',
];

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface FormState {
  name: string;
  headline: string;
  role: string;
  company: string;
  bio: string;
  photo_url: string;
  speaker_type: SpeakerType;
  is_featured: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  headline: '',
  role: '',
  company: '',
  bio: '',
  photo_url: '',
  speaker_type: 'speaker',
  is_featured: false,
};

export default function SpeakersManager({ eventId, initialSpeakers }: Props) {
  const [speakers, setSpeakers] = useState<Speaker[]>(initialSpeakers);
  const [showForm, setShowForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function openAdd() {
    setEditingSpeaker(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function openEdit(speaker: Speaker) {
    setEditingSpeaker(speaker);
    setForm({
      name: speaker.name,
      headline: speaker.headline ?? '',
      role: speaker.role ?? '',
      company: speaker.company ?? '',
      bio: speaker.bio ?? '',
      photo_url: speaker.photo_url ?? '',
      speaker_type: speaker.speaker_type,
      is_featured: speaker.is_featured,
    });
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSpeaker(null);
    setForm(EMPTY_FORM);
    setError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingSpeaker) {
        const res = await fetch(`/api/events/${eventId}/speakers`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speakerId: editingSpeaker.id, ...form }),
        });
        if (!res.ok) throw new Error('Failed to update speaker.');
        const { speaker: updated }: { speaker: Speaker } = await res.json();
        setSpeakers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const res = await fetch(`/api/events/${eventId}/speakers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('Failed to create speaker.');
        const { speaker: created }: { speaker: Speaker } = await res.json();
        setSpeakers((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(speakerId: string) {
    if (!confirm('Delete this speaker? This cannot be undone.')) return;
    setDeletingId(speakerId);
    try {
      await fetch(`/api/events/${eventId}/speakers?speakerId=${speakerId}`, {
        method: 'DELETE',
      });
      setSpeakers((prev) => prev.filter((s) => s.id !== speakerId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-[24px] font-semibold tracking-[-0.015em]" style={{ color: '#0F1F18' }}>Speakers</h1>
          <p className="text-[14px] mt-0.5" style={{ color: '#6B7A72' }}>
            {speakers.length > 0 ? `${speakers.length} speaker${speakers.length !== 1 ? 's' : ''}` : 'Add speakers to your event'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!showForm && (
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-white transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}
            >
              <Plus size={15} strokeWidth={2} /> Add speaker
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-5 space-y-4" style={{ borderColor: '#E5E0D4' }}>
          <div className="flex items-center justify-between">
            <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>
              {editingSpeaker ? 'Edit speaker' : 'New speaker'}
            </span>
            <button onClick={closeForm} className="p-1 rounded hover:bg-[#F5F3EE]">
              <X size={16} color="#6B7A72" />
            </button>
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg bg-red-50" style={{ color: '#B8423C' }}>
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>
                Name <span style={{ color: '#B8423C' }}>*</span>
              </label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Headline</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. CEO at Acme"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Role</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Job title"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Company</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Organization"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Bio</label>
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Short biography..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Photo URL</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.photo_url}
                onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>Speaker type</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.speaker_type}
                onChange={(e) => setForm((f) => ({ ...f, speaker_type: e.target.value as SpeakerType }))}
              >
                {SPEAKER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm" style={{ color: '#0F1F18' }}>Featured speaker</span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-[13.5px] font-medium text-white disabled:opacity-60"
              style={{ background: '#1F4D3A' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={closeForm}
              className="px-4 py-2 rounded-xl text-[13.5px] font-medium border"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {speakers.length === 0 && !showForm ? (
        <div className="bg-white border rounded-2xl py-16 flex flex-col items-center gap-4 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="w-12 h-12 rounded-2xl grid place-items-center" style={{ background: '#E8EFEB' }}>
            <Plus size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
          </div>
          <div>
            <div className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>No speakers yet</div>
            <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Add your first speaker — they&apos;ll appear on the event page.</p>
          </div>
          <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-white" style={{ background: '#1F4D3A' }}>
            <Plus size={15} strokeWidth={2} /> Add first speaker
          </button>
        </div>
      ) : speakers.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {speakers.map((speaker, i) => {
            const initials = getInitials(speaker.name);
            const grad = AVATAR_GRADS[i % AVATAR_GRADS.length];
            return (
              <div
                key={speaker.id}
                className="group bg-white border border-[#E5E0D4] rounded-2xl p-5 hover:border-[#1F4D3A]/40 hover:-translate-y-0.5 transition-all flex flex-col"
              >
                {/* Avatar row + featured badge */}
                <div className="flex items-start justify-between mb-3">
                  {speaker.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="w-[52px] h-[52px] rounded-full object-cover shrink-0"
                      style={{ border: '1px solid #E5E0D4' }}
                    />
                  ) : (
                    <div
                      className="w-[52px] h-[52px] rounded-full shrink-0 grid place-items-center font-display text-[15px] font-bold text-white"
                      style={{ background: grad }}
                    >
                      {initials}
                    </div>
                  )}
                  {speaker.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border" style={{ color: '#C9A45E', borderColor: 'rgba(201,164,94,0.4)', background: 'rgba(232,197,126,0.12)' }}>
                      <Sparkles size={9} strokeWidth={2} /> Featured
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="font-display text-[15px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>{speaker.name}</div>
                {(speaker.role || speaker.headline) && (
                  <div className="text-[12.5px] mt-0.5" style={{ color: '#3A4A42' }}>{speaker.role || speaker.headline}</div>
                )}
                {speaker.company && (
                  <div className="font-mono text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{speaker.company}</div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 flex-1 items-end" style={{ borderTop: '1px solid rgba(229,224,212,0.7)' }}>
                  <span className="inline-flex items-center text-[10.5px] font-mono font-medium px-2 py-0.5 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {TYPE_LABELS[speaker.speaker_type]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link href={`/events/${eventId}/speakers/${speaker.id}`} className="w-7 h-7 grid place-items-center rounded-lg transition hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }} title="View detail">
                      <ExternalLink size={13} strokeWidth={1.8} />
                    </Link>
                    <button onClick={() => openEdit(speaker)} className="w-7 h-7 grid place-items-center rounded-lg transition hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }} title="Edit">
                      <Pencil size={13} strokeWidth={1.8} />
                    </button>
                    <button onClick={() => handleDelete(speaker.id)} disabled={deletingId === speaker.id} className="w-7 h-7 grid place-items-center rounded-lg transition hover:bg-red-50 disabled:opacity-40" title="Delete">
                      <Trash2 size={13} strokeWidth={1.8} style={{ color: '#B8423C' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
