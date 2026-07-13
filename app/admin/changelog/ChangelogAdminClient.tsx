'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X } from 'lucide-react';
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

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const allSelected = entries.length > 0 && entries.every(e => selected.has(e.id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(entries.map(e => e.id)));

  // Bulk runner — loops the existing per-entry endpoints so their permission
  // checks + audit logging apply to every row. Rows update as the batch resolves.
  const runBulk = async (action: 'delete' | 'publish' | 'unpublish') => {
    if (action === 'delete' &&
        !confirm(`Delete ${selected.size} changelog ${selected.size === 1 ? 'entry' : 'entries'}? This cannot be undone.`)) {
      return;
    }
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch(`/api/admin/changelog?id=${id}`, { method: 'DELETE' })
            : fetch('/api/admin/changelog', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, published: action === 'publish' }),
              }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setEntries(prev =>
        action === 'delete'
          ? prev.filter(e => !okIds.includes(e.id))
          : prev.map(e =>
              okIds.includes(e.id) ? { ...e, published: action === 'publish' } : e,
            ),
      );
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

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
        <div className="flex items-center gap-3">
          {entries.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#6B7A72]">
              <input
                type="checkbox"
                aria-label="Select all entries"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
              />
              Select all
            </label>
          )}
          <div className="text-[12px] text-[#6B7A72]">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} ·{' '}
            {entries.filter(e => e.published).length} published
          </div>
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          <button
            disabled={bulkBusy}
            onClick={() => runBulk('publish')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#2D7A4F] hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => runBulk('unpublish')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => runBulk('delete')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            style={{ background: '#B8423C' }}
          >
            Delete
          </button>
          <button
            disabled={bulkBusy}
            onClick={clearSelection}
            title="Clear selection"
            className="h-8 w-8 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      )}

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
              style={{ borderColor: selected.has(entry.id) ? '#1F4D3A' : '#E5E0D4' }}
            >
              {/* Select checkbox */}
              <input
                type="checkbox"
                aria-label={`Select ${entry.title}`}
                checked={selected.has(entry.id)}
                onChange={() => toggleOne(entry.id)}
                className="mt-1 h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer shrink-0"
              />

              {/* Type badge */}
              <span
                className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-full  text-[11.5px] tracking-[0.14em] uppercase shrink-0"
                style={TYPE_STYLES[entry.type]}
              >
                {entry.type}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.version && (
                    <span className=" text-[12.5px] font-bold text-[#1F4D3A]">{entry.version}</span>
                  )}
                  <span className="font-display font-semibold text-[14px] text-[#0F1F18] leading-snug">
                    {entry.title}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[#6B7A72] leading-relaxed line-clamp-2">
                  {entry.description}
                </p>
                <div className="mt-1.5 flex items-center gap-3 text-[12.5px] text-[#6B7A72]/70">
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
