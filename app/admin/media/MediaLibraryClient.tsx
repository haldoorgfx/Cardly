'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Search,
  X,
  Trash2,
  Pencil,
  Check,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import type { CmsMedia } from '@/lib/cms/types';

interface Props {
  initialItems: CmsMedia[];
  total: number;
  page: number;
  totalPages: number;
  defaultSearch: string;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function MediaLibraryClient({
  initialItems,
  total,
  page,
  totalPages,
  defaultSearch,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<CmsMedia[]>(initialItems);
  const [search, setSearch] = useState(defaultSearch);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Alt-text editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState('');
  const [savingAlt, setSavingAlt] = useState(false);

  // Delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Selected for detail view
  const [selected, setSelected] = useState<CmsMedia | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const allSelected = items.length > 0 && items.every((m) => selectedIds.has(m.id));
  const clearSelection = () => setSelectedIds(new Set());
  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(items.map((m) => m.id)));

  // Bulk delete — loops the existing per-item DELETE endpoint so its Storage
  // cleanup + audit logging apply to every file. Rows drop as the batch resolves.
  async function runBulkDelete() {
    setBulkConfirmOpen(false);
    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/admin/media/${id}`, { method: 'DELETE' })),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setItems((prev) => prev.filter((m) => !okIds.includes(m.id)));
      if (selected && okIds.includes(selected.id)) setSelected(null);
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    router.push(`/admin/media?${params.toString()}`);
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploaded: CmsMedia[] = [];

    for (const file of Array.from(files)) {
      setUploadProgress(`Uploading ${file.name}…`);
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/admin/media', { method: 'POST', body: fd });
      const json = await res.json();
      if (res.ok && json.media) {
        uploaded.push(json.media as CmsMedia);
      }
    }

    setUploading(false);
    setUploadProgress(null);

    if (uploaded.length > 0) {
      setItems((prev) => [...uploaded, ...prev]);
    }
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  // ── Alt text ────────────────────────────────────────────────────────────────

  function startEdit(item: CmsMedia) {
    setEditingId(item.id);
    setEditingAlt(item.alt ?? '');
  }

  async function saveAlt(id: string) {
    setSavingAlt(true);
    const res = await fetch(`/api/admin/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alt: editingAlt }),
    });
    setSavingAlt(false);
    if (res.ok) {
      setItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, alt: editingAlt } : m)),
      );
      if (selected?.id === id) setSelected((s) => s ? { ...s, alt: editingAlt } : null);
    }
    setEditingId(null);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/media/${confirmDeleteId}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setItems((prev) => prev.filter((m) => m.id !== confirmDeleteId));
      if (selected?.id === confirmDeleteId) setSelected(null);
    }
    setConfirmDeleteId(null);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by filename or alt text…"
              className="w-full pl-9 pr-4 h-9 rounded-lg border border-[#E5E0D4] bg-white text-[14px] text-[#0F1F18] placeholder:text-[#6B7A72] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 focus:border-[#1F4D3A]"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); router.push('/admin/media'); }}
              className="p-2 rounded-lg hover:bg-[#E8EFEB] text-[#6B7A72]"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1F4D3A] text-white text-[13px] font-medium hover:bg-[#163828] disabled:opacity-60 transition-colors"
        >
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {uploading ? uploadProgress ?? 'Uploading…' : 'Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Drop zone hint when empty */}
      {items.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-[#E5E0D4] rounded-xl p-16 text-center"
        >
          <ImageIcon size={36} className="mx-auto text-[#C9C3B1] mb-3" />
          <p className="text-[14px] text-[#6B7A72]">
            {defaultSearch ? 'No media matches your search.' : 'No media yet. Upload your first image.'}
          </p>
          {!defaultSearch && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-[#E5E0D4] text-[13px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
            >
              <Upload size={14} /> Choose files
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Count + select all */}
          <div className="mb-4 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#6B7A72]">
              <input
                type="checkbox"
                aria-label="Select all media"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
              />
              Select all
            </label>
            <span className="text-[13px] text-[#6B7A72]">
              {total} {total === 1 ? 'item' : 'items'}
              {defaultSearch && ` for "${defaultSearch}"`}
            </span>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
              <span className="text-[13px] font-medium text-[#1F4D3A]">
                {selectedIds.size} selected
              </span>
              <div className="flex-1" />
              {bulkBusy && <Loader2 size={14} className="animate-spin text-[#1F4D3A]" />}
              <button
                disabled={bulkBusy}
                onClick={() => setBulkConfirmOpen(true)}
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
                <X size={13} />
              </button>
            </div>
          )}

          {/* Grid */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          >
            {items.map((item) => (
              <MediaTile
                key={item.id}
                item={item}
                isEditing={editingId === item.id}
                editingAlt={editingAlt}
                savingAlt={savingAlt}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleOne(item.id)}
                onSelect={() => setSelected(item)}
                onStartEdit={() => startEdit(item)}
                onAltChange={setEditingAlt}
                onSaveAlt={() => saveAlt(item.id)}
                onCancelEdit={() => setEditingId(null)}
                onDeleteRequest={() => setConfirmDeleteId(item.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (defaultSearch) params.set('q', defaultSearch);
                    if (p > 1) params.set('page', String(p));
                    router.push(`/admin/media?${params.toString()}`);
                  }}
                  className={`w-8 h-8 rounded-lg text-[13px] font-medium transition-colors ${
                    p === page
                      ? 'bg-[#1F4D3A] text-white'
                      : 'border border-[#E5E0D4] text-[#3A4A42] hover:bg-[#FAF6EE]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail panel */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="bg-white rounded-2xl shadow-lift w-full max-w-lg overflow-hidden">
            {/* Image preview */}
            <div className="bg-[#FAF6EE] flex items-center justify-center h-64">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.url}
                alt={selected.alt ?? ''}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            {/* Meta */}
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#0F1F18] truncate">
                    {selected.filename ?? 'Unknown'}
                  </p>
                  <p className="text-[12px] text-[#6B7A72] mt-0.5">
                    {selected.width && selected.height
                      ? `${selected.width} × ${selected.height}px · `
                      : ''}
                    {formatBytes(selected.size_bytes)} · {selected.mime ?? '—'}
                  </p>
                  <p className="text-[12px] text-[#6B7A72]">
                    Uploaded {formatDate(selected.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-[#FAF6EE] text-[#6B7A72] shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* URL copy */}
              <div className="mt-4">
                <label className="block text-[12.5px] uppercase tracking-[0.12em] text-[#6B7A72] mb-1">
                  URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={selected.url}
                    className="flex-1 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] bg-[#FAF6EE] focus:outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(selected.url)}
                    className="h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Alt text */}
              <div className="mt-4">
                <label className="block text-[12.5px] uppercase tracking-[0.12em] text-[#6B7A72] mb-1">
                  Alt text
                </label>
                {editingId === selected.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingAlt}
                      onChange={(e) => setEditingAlt(e.target.value)}
                      autoFocus
                      className="flex-1 h-8 px-3 rounded-lg border border-[#1F4D3A] text-[13px] text-[#0F1F18] focus:outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
                    />
                    <button
                      onClick={() => saveAlt(selected.id)}
                      disabled={savingAlt}
                      className="h-8 w-8 rounded-lg bg-[#1F4D3A] text-white flex items-center justify-center hover:bg-[#163828] disabled:opacity-60"
                    >
                      {savingAlt ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="h-8 w-8 rounded-lg border border-[#E5E0D4] text-[#6B7A72] flex items-center justify-center hover:bg-[#FAF6EE]"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-[13px] text-[#3A4A42] min-h-[32px] flex items-center px-3 rounded-lg border border-[#E5E0D4] bg-[#FAF6EE]">
                      {selected.alt || <span className="text-[#6B7A72] italic">None</span>}
                    </span>
                    <button
                      onClick={() => startEdit(selected)}
                      className="h-8 w-8 rounded-lg border border-[#E5E0D4] text-[#6B7A72] flex items-center justify-center hover:bg-[#FAF6EE]"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="mt-5 pt-4 border-t border-[#E5E0D4]">
                <button
                  onClick={() => { setConfirmDeleteId(selected.id); setSelected(null); }}
                  className="inline-flex items-center gap-1.5 text-[13px] text-[#B8423C] hover:underline"
                >
                  <Trash2 size={13} /> Delete this file
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDeleteId(null); }}
        >
          <div className="bg-white rounded-2xl shadow-lift w-full max-w-sm p-6">
            <h2 className="text-[16px] font-semibold text-[#0F1F18] mb-2">Delete media?</h2>
            <p className="text-[14px] text-[#6B7A72] mb-5">
              This removes the file from storage and the media library. Any CMS blocks using this
              URL will show broken images.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl border border-[#E5E0D4] text-[14px] font-medium text-[#3A4A42] hover:bg-[#FAF6EE] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-[#B8423C] text-white text-[14px] font-medium hover:bg-[#9e3630] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget && !bulkBusy) setBulkConfirmOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-lift w-full max-w-sm p-6">
            <h2 className="text-[16px] font-semibold text-[#0F1F18] mb-2">
              Delete {selectedIds.size} file{selectedIds.size === 1 ? '' : 's'}?
            </h2>
            <p className="text-[14px] text-[#6B7A72] mb-5">
              This removes the selected file{selectedIds.size === 1 ? '' : 's'} from storage and the
              media library. Any CMS blocks using {selectedIds.size === 1 ? 'this URL' : 'these URLs'} will
              show broken images.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBulkConfirmOpen(false)}
                disabled={bulkBusy}
                className="flex-1 h-10 rounded-xl border border-[#E5E0D4] text-[14px] font-medium text-[#3A4A42] hover:bg-[#FAF6EE] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={runBulkDelete}
                disabled={bulkBusy}
                className="flex-1 h-10 rounded-xl bg-[#B8423C] text-white text-[14px] font-medium hover:bg-[#9e3630] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkBusy && <Loader2 size={14} className="animate-spin" />}
                Delete {selectedIds.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MediaTile ─────────────────────────────────────────────────────────────────

interface TileProps {
  item: CmsMedia;
  isEditing: boolean;
  editingAlt: string;
  savingAlt: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onSelect: () => void;
  onStartEdit: () => void;
  onAltChange: (v: string) => void;
  onSaveAlt: () => void;
  onCancelEdit: () => void;
  onDeleteRequest: () => void;
}

function MediaTile({
  item,
  isEditing,
  editingAlt,
  savingAlt,
  isSelected,
  onToggleSelect,
  onSelect,
  onStartEdit,
  onAltChange,
  onSaveAlt,
  onCancelEdit,
  onDeleteRequest,
}: TileProps) {
  return (
    <div className={`group relative rounded-xl overflow-hidden border bg-[#FAF6EE] aspect-square ${isSelected ? 'border-[#1F4D3A] ring-1 ring-[#1F4D3A]/30' : 'border-[#E5E0D4]'}`}>
      {/* Select checkbox */}
      <label className={`absolute top-2 left-2 z-20 h-6 w-6 grid place-items-center rounded-md bg-white/90 border border-[#E5E0D4] cursor-pointer transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <input
          type="checkbox"
          aria-label={`Select ${item.filename ?? 'media'}`}
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
        />
      </label>

      {/* Thumbnail */}
      <button className="w-full h-full" onClick={onSelect}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.alt ?? ''}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </button>

      {/* Hover overlay with quick actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150 pointer-events-none group-hover:pointer-events-auto flex flex-col justify-end p-2 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {/* Alt text inline edit */}
        {isEditing ? (
          <div
            className="flex items-center gap-1 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              value={editingAlt}
              onChange={(e) => onAltChange(e.target.value)}
              autoFocus
              placeholder="Alt text"
              className="flex-1 h-7 px-2 rounded-lg text-[12.5px] bg-white text-[#0F1F18] border border-[#1F4D3A] focus:outline-none min-w-0"
            />
            <button
              onClick={onSaveAlt}
              disabled={savingAlt}
              className="h-7 w-7 rounded-lg bg-[#1F4D3A] text-white flex items-center justify-center shrink-0"
            >
              {savingAlt ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
            </button>
            <button
              onClick={onCancelEdit}
              className="h-7 w-7 rounded-lg bg-white/80 text-[#3A4A42] flex items-center justify-center shrink-0"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
              className="h-7 w-7 rounded-lg bg-white/90 text-[#3A4A42] flex items-center justify-center hover:bg-white"
              title="Edit alt text"
            >
              <Pencil size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteRequest(); }}
              className="h-7 w-7 rounded-lg bg-white/90 text-[#B8423C] flex items-center justify-center hover:bg-white"
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
