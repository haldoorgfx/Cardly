'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';

export type ChangelogType = 'added' | 'fixed' | 'improved' | 'removed' | 'security';

export interface ChangelogEntry {
  id: string;
  version: string | null;
  title: string;
  description: string;
  type: ChangelogType;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

const TYPE_OPTIONS: { value: ChangelogType; label: string; color: string }[] = [
  { value: 'added',    label: 'Added',    color: '#1F4D3A' },
  { value: 'improved', label: 'Improved', color: '#3A6B8C' },
  { value: 'fixed',    label: 'Fixed',    color: '#C97A2D' },
  { value: 'removed',  label: 'Removed',  color: '#6B7A72' },
  { value: 'security', label: 'Security', color: '#B8423C' },
];

interface Props {
  entry?: ChangelogEntry;
  onSave: (entry: ChangelogEntry) => void;
  onCancel: () => void;
}

export function ChangelogForm({ entry, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    version:     entry?.version ?? '',
    title:       entry?.title ?? '',
    description: entry?.description ?? '',
    type:        entry?.type ?? 'added' as ChangelogType,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEdit = !!entry;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/changelog', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit && { id: entry.id }),
          version:     form.version.trim() || null,
          title:       form.title.trim(),
          description: form.description.trim(),
          type:        form.type,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'Save failed');
      }
      const saved = await res.json();
      onSave(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,31,24,0.5)' }}
      onClick={e => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-lift w-full max-w-[560px] overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
          <h2 className="font-display font-semibold text-[16px] text-[#0F1F18]">
            {isEdit ? 'Edit entry' : 'New changelog entry'}
          </h2>
          <button onClick={onCancel} className="h-7 w-7 rounded-lg hover:bg-[#FAF6EE] grid place-items-center text-[#6B7A72] transition">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-[12px] font-medium text-[#3A4A42] mb-2">Type</label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: o.value }))}
                  className="px-3 py-1 rounded-full text-[12px] transition border"
                  style={form.type === o.value
                    ? { background: o.color, color: '#FAF6EE', borderColor: o.color }
                    : { background: 'transparent', color: '#6B7A72', borderColor: '#E5E0D4' }
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Version */}
          <div>
            <label className="block text-[12px] font-medium text-[#3A4A42] mb-1">Version <span className="text-[#6B7A72] font-normal">(optional)</span></label>
            <input
              value={form.version}
              onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
              placeholder="v1.5.0"
              className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition"
              style={{ borderColor: '#E5E0D4' }}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] font-medium text-[#3A4A42] mb-1">Title <span className="text-[#B8423C]">*</span></label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What shipped?"
              required
              className="w-full h-9 px-3 rounded-lg border text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition"
              style={{ borderColor: '#E5E0D4' }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] font-medium text-[#3A4A42] mb-1">Description <span className="text-[#B8423C]">*</span></label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the change in 1–3 sentences…"
              rows={4}
              required
              className="w-full px-3 py-2 rounded-lg border text-[13px] resize-none outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]/40 transition"
              style={{ borderColor: '#E5E0D4' }}
            />
          </div>

          {error && (
            <p className="text-[12px] text-[#B8423C]">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-4 rounded-lg text-[13px] text-[#6B7A72] hover:bg-[#FAF6EE] border transition"
              style={{ borderColor: '#E5E0D4' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 px-5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition hover:opacity-90 flex items-center gap-2"
              style={{ background: '#1F4D3A' }}
            >
              {saving && <Loader2 size={13} strokeWidth={2} className="animate-spin" />}
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
