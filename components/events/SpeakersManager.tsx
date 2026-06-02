'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pencil, Trash2, Plus, X } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold" style={{ color: '#0F1F18' }}>
          Speakers
        </h2>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={15} />
            Add speaker
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-5 space-y-4" style={{ borderColor: '#E5E0D4' }}>
          <div className="flex items-center justify-between">
            <span className="font-display text-sm font-semibold" style={{ color: '#0F1F18' }}>
              {editingSpeaker ? 'Edit speaker' : 'New speaker'}
            </span>
            <button onClick={closeForm} className="p-1 rounded hover:bg-gray-100">
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
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>
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
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Headline</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. CEO at Acme"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Role</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                placeholder="Job title"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Company</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Organization"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Bio</label>
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
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Photo URL</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                value={form.photo_url}
                onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#6B7A72' }}>Speaker type</label>
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

      {speakers.length === 0 && !showForm ? (
        <div className="bg-white border rounded-2xl p-10 flex flex-col items-center gap-3" style={{ borderColor: '#E5E0D4' }}>
          <p className="text-sm" style={{ color: '#6B7A72' }}>No speakers yet.</p>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            Add first speaker
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {speakers.map((speaker) => (
            <li
              key={speaker.id}
              className="bg-white border rounded-2xl p-4 flex items-center gap-3"
              style={{ borderColor: '#E5E0D4' }}
            >
              {speaker.photo_url ? (
                <Image
                  src={speaker.photo_url}
                  alt={speaker.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover shrink-0"
                  style={{ border: '1px solid #E5E0D4' }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-sm font-semibold"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                >
                  {getInitials(speaker.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-display text-[15px] font-medium truncate" style={{ color: '#0F1F18' }}>
                  {speaker.name}
                </p>
                {speaker.headline && (
                  <p className="text-[13px] truncate" style={{ color: '#6B7A72' }}>{speaker.headline}</p>
                )}
              </div>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                {TYPE_LABELS[speaker.speaker_type]}
              </span>
              <button
                onClick={() => openEdit(speaker)}
                className="p-1.5 rounded-lg hover:bg-gray-100 shrink-0"
                title="Edit"
              >
                <Pencil size={15} color="#6B7A72" />
              </button>
              <button
                onClick={() => handleDelete(speaker.id)}
                disabled={deletingId === speaker.id}
                className="p-1.5 rounded-lg hover:bg-red-50 shrink-0 disabled:opacity-40"
                title="Delete"
              >
                <Trash2 size={15} color="#B8423C" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
