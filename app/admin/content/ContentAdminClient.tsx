'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, FileText, Globe, Pencil, Loader2, X, AlertTriangle } from 'lucide-react';
import type { CmsPage } from '@/lib/cms/types';

function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  return status === 'published' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12.5px] bg-emerald-50 text-emerald-700 border border-emerald-200">
      <Globe size={9} strokeWidth={2.5} /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12.5px] bg-amber-50 text-amber-700 border border-amber-200">
      <FileText size={9} strokeWidth={2.5} /> Draft
    </span>
  );
}

export function ContentAdminClient({ initialPages, blockCounts = {} }: { initialPages: CmsPage[]; blockCounts?: Record<string, number> }) {
  const [pages, setPages] = useState<CmsPage[]>(initialPages);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirmDelete, setBulkConfirmDelete] = useState(false);

  const allSelected = pages.length > 0 && pages.every(p => selected.has(p.id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(pages.map(p => p.id)));

  // Bulk runner — loops the existing per-page endpoint so its permission checks
  // + audit logging apply to every row. Rows update as the batch resolves.
  const runBulk = async (action: 'delete' | 'publish' | 'unpublish') => {
    setBulkConfirmDelete(false);
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch(`/api/admin/content/${id}`, { method: 'DELETE' })
            : fetch(`/api/admin/content/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action === 'publish' ? 'published' : 'draft' }),
              }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setPages(prev =>
        action === 'delete'
          ? prev.filter(p => !okIds.includes(p.id))
          : prev.map(p =>
              okIds.includes(p.id)
                ? { ...p, status: action === 'publish' ? 'published' : 'draft' }
                : p,
            ),
      );
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

  if (pages.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#E5E0D4] rounded-2xl p-16 text-center">
        <FileText size={36} className="mx-auto text-[#C9C3B1] mb-3" />
        <p className="text-[14px] text-[#65736B]">
          No pages seeded yet. Run the seed script to populate the CMS.
        </p>
        <code className="font-sans mt-4 block text-[12px] bg-[#FAF6EE] border border-[#E5E0D4] rounded-lg px-4 py-2 text-[#3A4A42] max-w-sm mx-auto">
          pnpm tsx scripts/seed-cms-pages.ts
        </code>
      </div>
    );
  }

  return (
    <div>
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
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => runBulk('unpublish')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#65736B] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => setBulkConfirmDelete(true)}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            style={{ background: '#B8423C' }}
          >
            Delete
          </button>
          <button
            disabled={bulkBusy}
            onClick={clearSelection}
            title="Clear selection"
            className="h-10 w-10 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#65736B] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* ── Desktop table (md and up) ──────────────────────────── */}
      <div className="hidden md:block border border-[#E5E0D4] rounded-2xl overflow-hidden bg-white overflow-x-auto">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] px-5 py-3 bg-[#FAF6EE] border-b border-[#E5E0D4] items-center gap-x-4" style={{ minWidth: 640 }}>
          <input
            type="checkbox"
            aria-label="Select all pages"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
          />
          <span className="text-[12.5px] uppercase tracking-[0.14em] text-[#65736B]">Page</span>
          <span className="text-[12.5px] uppercase tracking-[0.14em] text-[#65736B] text-right">Blocks</span>
          <span className="text-[12.5px] uppercase tracking-[0.14em] text-[#65736B] text-right px-6">Status</span>
          <span className="text-[12.5px] uppercase tracking-[0.14em] text-[#65736B] text-right">Actions</span>
        </div>
        {pages.map((page) => (
          <div
            key={page.id}
            className={`grid grid-cols-[auto_1fr_auto_auto_auto] px-5 py-4 border-b border-[#E5E0D4] last:border-b-0 transition-colors items-center gap-x-4 ${selected.has(page.id) ? 'bg-[#E8EFEB]/50' : 'hover:bg-[#FAF6EE]'}`}
            style={{ minWidth: 640 }}
          >
            <input
              type="checkbox"
              aria-label={`Select ${page.title}`}
              checked={selected.has(page.id)}
              onChange={() => toggleOne(page.id)}
              className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
            />
            <div className="min-w-0">
              <div className="font-medium text-[14px] text-[#0F1F18]">{page.title}</div>
              <div className=" text-[12.5px] text-[#65736B] mt-0.5">/{page.slug}</div>
            </div>
            <div className="text-[13px] text-[#65736B] text-right px-6">
              {blockCounts[page.id] ?? 0}
            </div>
            <div className="px-6">
              <StatusBadge status={page.status} />
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/content/${page.id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1F4D3A] text-white text-[12px] hover:bg-[#163828] transition-colors"
              >
                <Pencil size={12} /> Edit
              </Link>
              <Link
                href={`/admin/content/${page.id}/preview`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
              >
                <Eye size={12} /> Preview
              </Link>
              <Link
                href={`/${page.slug === 'home' ? '' : page.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
              >
                <Globe size={12} /> Live
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mobile cards (below md) ────────────────────────────── */}
      <div className="md:hidden space-y-2.5">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`rounded-xl border p-3.5 ${selected.has(page.id) ? 'border-[#1F4D3A]/30 bg-[#E8EFEB]/40' : 'border-[#E5E0D4] bg-white'}`}
          >
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                aria-label={`Select ${page.title}`}
                checked={selected.has(page.id)}
                onChange={() => toggleOne(page.id)}
                className="h-4 w-4 mt-1 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] text-[#0F1F18] truncate">{page.title}</div>
                <div className="text-[12.5px] text-[#65736B] mt-0.5">/{page.slug}</div>
              </div>
              <StatusBadge status={page.status} />
            </div>
            <div className="mt-2.5 text-[12px] text-[#65736B]">{blockCounts[page.id] ?? 0} blocks</div>
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Link
                href={`/admin/content/${page.id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#1F4D3A] text-white text-[12px] hover:bg-[#163828] transition-colors"
              >
                <Pencil size={12} /> Edit
              </Link>
              <Link
                href={`/admin/content/${page.id}/preview`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
              >
                <Eye size={12} /> Preview
              </Link>
              <Link
                href={`/${page.slug === 'home' ? '' : page.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
              >
                <Globe size={12} /> Live
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk delete confirm */}
      {bulkConfirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBulkConfirmDelete(false)} />
          <div className="relative bg-white rounded-2xl shadow-lift border border-[#E5E0D4] p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} className="text-[#B8423C]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F1F18]">
                  Delete {selected.size} page{selected.size === 1 ? '' : 's'}?
                </h3>
                <p className="text-[13px] text-[#65736B] mt-1">
                  This cannot be undone. The selected page{selected.size === 1 ? '' : 's'} and
                  {selected.size === 1 ? ' its' : ' their'} content blocks will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkConfirmDelete(false)} className="px-4 py-2 rounded-lg text-[13px] text-[#65736B] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Cancel</button>
              <button onClick={() => runBulk('delete')} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[#B8423C] hover:opacity-90 transition">Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
