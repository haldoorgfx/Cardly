'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2, Flag, Trash2, RotateCcw, ExternalLink, X } from 'lucide-react';
import type { EventRow } from './page';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  published: { bg: 'rgba(31,77,58,0.10)',   color: '#2D7A4F' },
  archived:  { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' },
};

const MOD_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ok:      { bg: 'rgba(45,122,79,0.10)',  color: '#2D7A4F', label: 'ok'      },
  flagged: { bg: 'rgba(201,122,45,0.12)', color: '#C97A2D', label: 'flagged' },
  removed: { bg: 'rgba(184,66,60,0.10)', color: '#B8423C', label: 'removed'  },
};

interface Filters {
  q: string;
  status: string;
  moderation: string;
}

interface Props {
  events: EventRow[];
  total: number;
  page: number;
  totalPages: number;
  defaultFilters: Filters;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function EventsOversightClient({ events: initialEvents, total, page, totalPages, defaultFilters }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const allSelected = events.length > 0 && events.every(e => selected.has(e.id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(events.map(e => e.id)));

  // Bulk moderation — loops the per-event endpoint (its permission + audit
  // logging apply per event). Optimistic update, then refresh to reconcile any
  // server-side status change (e.g. removed → hidden).
  const runBulkModeration = async (status: 'ok' | 'flagged' | 'removed') => {
    if (
      status === 'removed' &&
      !confirm(`Remove ${selected.size} event${selected.size === 1 ? '' : 's'} from the marketplace?\n\nThey will no longer be publicly visible until restored.`)
    ) return;
    setBulkBusy(true);
    setActionError('');
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/admin/events/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moderation_status: status }),
          }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setEvents(prev => prev.map(e => (okIds.includes(e.id) ? { ...e, moderation_status: status } : e)));
      if (okIds.length < ids.length) {
        setActionError(`${ids.length - okIds.length} event${ids.length - okIds.length === 1 ? '' : 's'} could not be updated.`);
      }
      clearSelection();
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const hasActiveFilters = Object.values(defaultFilters).some(v => v !== '');

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q.trim())          params.set('q',          filters.q.trim());
    if (filters.status.trim())     params.set('status',     filters.status.trim());
    if (filters.moderation.trim()) params.set('moderation', filters.moderation.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  const clearFilters = () => {
    setFilters({ q: '', status: '', moderation: '' });
    router.push(pathname);
  };

  const setModeration = async (event: EventRow, status: 'ok' | 'flagged' | 'removed') => {
    if (status === 'removed' && !confirm(`Remove "${event.name}" from the marketplace?\n\nIt will no longer be publicly visible until restored.`)) return;
    setBusy(event.id);
    setActionError('');
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderation_status: status }),
      });
      if (res.ok) {
        const { event: updated } = await res.json();
        setEvents(prev => prev.map(e =>
          e.id === event.id
            ? { ...e, moderation_status: updated.moderation_status, status: updated.status }
            : e
        ));
      } else {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error ?? 'Could not update this event — please try again.');
      }
    } catch {
      setActionError('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2 items-end">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Event name or slug…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
          />
        </div>

        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filters.moderation}
          onChange={e => setFilters(f => ({ ...f, moderation: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none"
        >
          <option value="">All moderation</option>
          <option value="ok">OK</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>

        <button
          onClick={applyFilters}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-white hover:opacity-90 transition"
          style={{ background: '#1F4D3A' }}
        >
          Apply
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="h-9 px-4 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">
            Clear
          </button>
        )}
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-[13px]" role="alert"
          style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.25)', color: '#B8423C' }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="shrink-0 text-[11px] underline">Dismiss</button>
        </div>
      )}

      {/* Count */}
      <div className="mb-4 text-[12px] text-[#6B7A72]">
        {total} {total === 1 ? 'event' : 'events'}
        {page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">{selected.size} selected</span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          <button
            disabled={bulkBusy}
            onClick={() => runBulkModeration('flagged')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#C97A2D] hover:bg-amber-50 transition-colors disabled:opacity-50"
          >
            Flag
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => runBulkModeration('ok')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            Restore
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => runBulkModeration('removed')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            style={{ background: '#B8423C' }}
          >
            Remove
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

      {/* Table */}
      {events.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">No events match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E0D4]">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={events.length === 0}
                    className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer disabled:cursor-not-allowed"
                  />
                </th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Event</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Owner</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Status</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Moderation</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Views / Cards</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Created</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E0D4]">
              {events.map(ev => {
                const statusStyle = STATUS_STYLES[ev.status] ?? STATUS_STYLES.draft;
                const modStyle    = MOD_STYLES[ev.moderation_status] ?? MOD_STYLES.ok;
                const isBusy      = busy === ev.id;

                return (
                  <tr key={ev.id} className={`hover:bg-[#FAF6EE]/50 transition-colors ${ev.moderation_status === 'removed' ? 'opacity-50' : ''} ${selected.has(ev.id) ? 'bg-[#E8EFEB]/50' : ''}`}>
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${ev.name}`}
                        checked={selected.has(ev.id)}
                        onChange={() => toggleOne(ev.id)}
                        className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F1F18]">{ev.name}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] text-[#6B7A72]">/{ev.slug}</span>
                        <a
                          href={`/c/${ev.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#1F4D3A]/50 hover:text-[#1F4D3A] transition-colors"
                          title="Open attendee page"
                        >
                          <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-[12px] text-[#0F1F18]">{ev.profiles?.full_name ?? '—'}</div>
                      <div className="text-[11px] text-[#6B7A72]">{ev.profiles?.email ?? '—'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[10px] tracking-[0.1em] uppercase" style={statusStyle}>
                        {ev.status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[10px] tracking-[0.1em]" style={{ background: modStyle.bg, color: modStyle.color }}>
                        {modStyle.label}
                      </span>
                    </td>

                    <td className="px-4 py-3  text-[11px] text-[#6B7A72]">
                      {ev.view_count} / {ev.download_count}
                    </td>

                    <td className="px-4 py-3  text-[11px] text-[#6B7A72]">
                      {formatDate(ev.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      {isBusy ? (
                        <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#6B7A72]" />
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Flag */}
                          {ev.moderation_status !== 'flagged' && ev.moderation_status !== 'removed' && (
                            <button
                              onClick={() => setModeration(ev, 'flagged')}
                              title="Flag"
                              className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#C97A2D] hover:bg-amber-50 transition-colors"
                            >
                              <Flag size={11} strokeWidth={2} />
                            </button>
                          )}
                          {/* Remove */}
                          {ev.moderation_status !== 'removed' && (
                            <button
                              onClick={() => setModeration(ev, 'removed')}
                              title="Remove"
                              className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={11} strokeWidth={2} />
                            </button>
                          )}
                          {/* Restore */}
                          {ev.moderation_status !== 'ok' && (
                            <button
                              onClick={() => setModeration(ev, 'ok')}
                              title="Restore"
                              className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <RotateCcw size={11} strokeWidth={2} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <PagLink page={page - 1} disabled={page <= 1} label="← Previous" filters={defaultFilters} pathname={pathname} />
          <span className="text-[13px] text-[#6B7A72]">{page} / {totalPages}</span>
          <PagLink page={page + 1} disabled={page >= totalPages} label="Next →" filters={defaultFilters} pathname={pathname} />
        </div>
      )}
    </div>
  );
}

function PagLink({ page, disabled, label, filters, pathname }: {
  page: number; disabled: boolean; label: string; filters: Filters; pathname: string;
}) {
  const params = new URLSearchParams();
  if (filters.q)          params.set('q',          filters.q);
  if (filters.status)     params.set('status',     filters.status);
  if (filters.moderation) params.set('moderation', filters.moderation);
  params.set('page', String(page));

  if (disabled) return <span className="text-[13px] text-[#6B7A72]/40  px-3 py-1.5">{label}</span>;
  return (
    <a href={`${pathname}?${params.toString()}`}
      className="text-[13px] text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors">
      {label}
    </a>
  );
}
