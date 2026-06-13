'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ChangelogForm, type ChangelogEntry, type ChangelogType } from '@/components/admin/ChangelogForm';

const TYPE_STYLES: Record<ChangelogType, { bg: string; color: string }> = {
  added:    { bg: 'rgba(31,77,58,0.10)',    color: '#1F4D3A' },
  improved: { bg: 'rgba(58,107,140,0.10)',  color: '#3A6B8C' },
  fixed:    { bg: 'rgba(201,122,45,0.10)',  color: '#C97A2D' },
  removed:  { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' },
  security: { bg: 'rgba(184,66,60,0.10)',   color: '#B8423C' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function ChangelogAdminClient({ initialEntries }: { initialEntries: ChangelogEntry[] }) {
  const [entries, setEntries]     = useState<ChangelogEntry[]>(initialEntries);
  const [showForm, setShowForm]   = useState(false);
  const [editEntry, setEditEntry] = useState<ChangelogEntry | null>(null);
  const [toggling, setToggling]   = useState<string | null>(null);
  const [deleting, setDeleting]   = useState<string | null>(null);

  const handleSaved = (saved: ChangelogEntry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setShowForm(false);
    setEditEntry(null);
  };

  const togglePublish = async (entry: ChangelogEntry) => {
    setToggling(entry.id);
    try {
      const res = await fetch('/api/admin/changelog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entry.id, published: !entry.published }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
      }
    } finally {
      setToggling(null);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Delete this changelog entry? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/changelog?id=${id}`, { method: 'DELETE' });
      setEntries(prev => prev.filter(e => e.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-[12px] text-[#6B7A72]">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·{' '}
          {entries.filter(e => e.published).length} published
        </div>
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={13} strokeWidth={2.5} />
          New entry
        </button>
      </div>

      {/* List */}
      {entries.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">
          No entries yet. Create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div
              key={entry.id}
              className="bg-white rounded-xl border p-4 flex items-start gap-4"
              style={{ borderColor: '#E5E0D4' }}
            >
              {/* Type badge */}
              <span
                className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full  text-[9px] tracking-[0.14em] uppercase shrink-0"
                style={TYPE_STYLES[entry.type]}
              >
                {entry.type}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.version && (
                    <span className=" text-[11px] font-bold text-[#1F4D3A]">{entry.version}</span>
                  )}
                  <span className="font-display font-semibold text-[14px] text-[#0F1F18] leading-snug">
                    {entry.title}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#6B7A72] leading-relaxed line-clamp-2">
                  {entry.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[#6B7A72]/70">
                  <span>{formatDate(entry.created_at)}</span>
                  {entry.published && entry.published_at && (
                    <span className="text-[#2D7A4F]">Published {formatDate(entry.published_at)}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Publish / unpublish */}
                <button
                  onClick={() => togglePublish(entry)}
                  disabled={toggling === entry.id}
                  title={entry.published ? 'Unpublish' : 'Publish'}
                  className="h-8 w-8 rounded-lg grid place-items-center transition border hover:bg-[#FAF6EE]"
                  style={{ borderColor: '#E5E0D4', color: entry.published ? '#2D7A4F' : '#6B7A72' }}
                >
                  {toggling === entry.id
                    ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                    : entry.published
                      ? <Eye size={13} strokeWidth={1.8} />
                      : <EyeOff size={13} strokeWidth={1.8} />
                  }
                </button>

                {/* Edit */}
                <button
                  onClick={() => { setEditEntry(entry); setShowForm(true); }}
                  title="Edit"
                  className="h-8 w-8 rounded-lg grid place-items-center transition border hover:bg-[#FAF6EE] text-[#6B7A72] hover:text-[#0F1F18]"
                  style={{ borderColor: '#E5E0D4' }}
                >
                  <Pencil size={13} strokeWidth={1.8} />
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteEntry(entry.id)}
                  disabled={deleting === entry.id}
                  title="Delete"
                  className="h-8 w-8 rounded-lg grid place-items-center transition border hover:bg-red-50 text-[#6B7A72] hover:text-[#B8423C] hover:border-red-200"
                  style={{ borderColor: '#E5E0D4' }}
                >
                  {deleting === entry.id
                    ? <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                    : <Trash2 size={13} strokeWidth={1.8} />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <ChangelogForm
          entry={editEntry ?? undefined}
          onSave={handleSaved}
          onCancel={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}
    </div>
  );
}
