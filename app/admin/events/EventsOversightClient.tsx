'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2, Flag, Trash2, RotateCcw, ExternalLink, X, Download } from 'lucide-react';
import type { EventRow } from './page';
import { toast } from '@/hooks/use-toast';
import { StatusState, describeError } from '@/components/ui/status-state';
import { useConfirm } from '@/components/ui/ConfirmProvider';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft:     { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  published: { bg: 'rgba(31,77,58,0.10)',   color: '#2D7A4F' },
  archived:  { bg: 'rgba(107,122,114,0.10)', color: '#65736B' },
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
  const confirm  = useConfirm();

  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  // Inline name edit
  const [editName, setEditName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const saveName = async (ev: EventRow, value: string) => {
    const v = value.trim();
    setEditName(null);
    if (!v || v === ev.name) return;
    setEvents(prev => prev.map(e => (e.id === ev.id ? { ...e, name: v } : e)));
    try {
      const res = await fetch(`/api/admin/events/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: v }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      toast({ title: 'Event name updated', variant: 'success' });
    } catch (e) {
      /* optimistic */
      const reason = describeError(e, 'the rename');
      toast({ title: 'Could not rename the event', description: `${reason} Refresh to see the current value.`, variant: 'destructive' });
    }
  };

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
      !(await confirm({
        title: `Remove ${selected.size} event${selected.size === 1 ? '' : 's'} from the marketplace?`,
        body: 'They will no longer be publicly visible until restored.',
        confirmLabel: 'Remove',
        danger: true,
      }))
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
      const failed = ids.length - okIds.length;
      if (failed > 0) {
        setActionError(`${failed} event${failed === 1 ? '' : 's'} could not be updated.`);
      }
      const verb = status === 'removed' ? 'Removed' : status === 'flagged' ? 'Flagged' : 'Restored';
      if (okIds.length > 0) {
        toast({
          title: `${verb} ${okIds.length} event${okIds.length === 1 ? '' : 's'}`,
          description: failed > 0 ? `${failed} could not be updated.` : undefined,
          variant: 'success',
        });
      } else if (ids.length > 0) {
        toast({ title: 'Could not update the events', description: `None of the ${ids.length} events could be updated.`, variant: 'destructive' });
      }
      clearSelection();
      router.refresh();
    } catch (e) {
      toast({ title: 'Could not update the events', description: describeError(e, 'the bulk update'), variant: 'destructive' });
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
    if (status === 'removed' && !(await confirm({
      title: `Remove "${event.name}" from the marketplace?`,
      body: 'It will no longer be publicly visible until restored.',
      confirmLabel: 'Remove',
      danger: true,
    }))) return;
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
        const verb = status === 'removed' ? 'removed from the marketplace' : status === 'flagged' ? 'flagged' : 'restored';
        toast({ title: `Event ${verb}`, description: event.name, variant: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Could not update this event — please try again.';
        setActionError(msg);
        toast({ title: 'Could not update the event', description: msg, variant: 'destructive' });
      }
    } catch (e) {
      const msg = describeError(e, 'this event');
      setActionError(msg);
      toast({ title: 'Could not update the event', description: msg, variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  // ── Shared cell renderers (used by both table + mobile cards) ────────────────

  const EventNameCell = ({ ev }: { ev: EventRow }) => (
    <div className="min-w-0">
      {editName === ev.id ? (
        <input
          autoFocus
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          onBlur={() => saveName(ev, nameDraft)}
          onKeyDown={e => {
            if (e.key === 'Enter') saveName(ev, nameDraft);
            if (e.key === 'Escape') setEditName(null);
          }}
          className="w-full max-w-[220px] border border-[#1F4D3A]/40 rounded-lg px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
        />
      ) : (
        <button
          type="button"
          onClick={() => { setNameDraft(ev.name); setEditName(ev.id); }}
          title="Click to edit name"
          className="font-medium text-[#0F1F18] hover:text-[#1F4D3A] transition-colors text-left truncate max-w-full block"
        >
          {ev.name}
        </button>
      )}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-[12.5px] text-[#65736B] truncate">/{ev.slug}</span>
        <a
          href={`/e/${ev.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#1F4D3A]/50 hover:text-[#1F4D3A] transition-colors shrink-0"
          title="Open attendee page"
        >
          <ExternalLink size={10} strokeWidth={2} />
        </a>
      </div>
    </div>
  );

  const renderStatusBadge = (ev: EventRow) => {
    const statusStyle = STATUS_STYLES[ev.status] ?? STATUS_STYLES.draft;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[12px] tracking-[0.1em] uppercase" style={statusStyle}>
        {ev.status}
      </span>
    );
  };

  const renderModerationBadge = (ev: EventRow) => {
    const modStyle = MOD_STYLES[ev.moderation_status] ?? MOD_STYLES.ok;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[12px] tracking-[0.1em]" style={{ background: modStyle.bg, color: modStyle.color }}>
        {modStyle.label}
      </span>
    );
  };

  const RowActions = ({ ev }: { ev: EventRow }) => {
    const isBusy = busy === ev.id;
    if (isBusy) return <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#65736B]" />;
    return (
      <div className="flex items-center gap-1">
        {/* Flag */}
        {ev.moderation_status !== 'flagged' && ev.moderation_status !== 'removed' && (
          <button
            onClick={() => setModeration(ev, 'flagged')}
            title="Flag"
            className="h-10 w-10 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#C97A2D] hover:bg-amber-50 transition-colors"
          >
            <Flag size={11} strokeWidth={2} />
          </button>
        )}
        {/* Remove */}
        {ev.moderation_status !== 'removed' && (
          <button
            onClick={() => setModeration(ev, 'removed')}
            title="Remove"
            className="h-10 w-10 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors"
          >
            <Trash2 size={11} strokeWidth={2} />
          </button>
        )}
        {/* Restore */}
        {ev.moderation_status !== 'ok' && (
          <button
            onClick={() => setModeration(ev, 'ok')}
            title="Restore"
            className="h-10 w-10 rounded-lg border border-[#E5E0D4] grid place-items-center text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <RotateCcw size={11} strokeWidth={2} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-2 items-end">
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={2} className="text-[#65736B] shrink-0" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Event name or slug…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#65736B]/60 text-[#0F1F18]"
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
          <button onClick={clearFilters} className="h-9 px-4 rounded-lg text-[13px] text-[#65736B] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">
            Clear
          </button>
        )}

        <a
          href={`/api/admin/events/export?${new URLSearchParams(
            Object.fromEntries(Object.entries(defaultFilters).filter(([, v]) => v)),
          ).toString()}`}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-[#1F4D3A] border border-[#1F4D3A]/30 hover:bg-[#E8EFEB] transition-colors inline-flex items-center gap-1.5"
        >
          <Download size={13} strokeWidth={2} /> Export CSV
        </a>
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl border border-danger/25 bg-danger/5">
          <StatusState
            kind="error"
            reason="generic"
            compact
            message={actionError}
            secondaryAction={{ label: 'Dismiss', onClick: () => setActionError('') }}
          />
        </div>
      )}

      {/* Count */}
      <div className="mb-4 text-[12px] text-[#65736B]">
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
            className="h-10 w-10 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#65736B] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Table */}
      {events.length === 0 ? (
        <StatusState
          kind="empty"
          title="No events match these filters"
          message={hasActiveFilters ? 'Try a different search, or clear the filters to see everything.' : 'No events have been created yet.'}
          secondaryAction={hasActiveFilters ? { label: 'Clear filters', onClick: clearFilters } : undefined}
        />
      ) : (
        <>
          {/* ── Desktop table (md+) ────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E5E0D4]">
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
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Event</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Owner</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Status</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Moderation</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Views / Cards</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Created</th>
                  <th className="text-left px-4 py-3  text-[12px] tracking-[0.14em] uppercase text-[#65736B]">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E0D4]">
                {events.map(ev => (
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
                    <td className="px-4 py-3"><EventNameCell ev={ev} /></td>

                    <td className="px-4 py-3">
                      <div className="text-[12px] text-[#0F1F18]">{ev.profiles?.full_name ?? '—'}</div>
                      <div className="text-[12.5px] text-[#65736B]">{ev.profiles?.email ?? '—'}</div>
                    </td>

                    <td className="px-4 py-3">{renderStatusBadge(ev)}</td>

                    <td className="px-4 py-3">{renderModerationBadge(ev)}</td>

                    <td className="px-4 py-3  text-[12.5px] text-[#65736B]">
                      {ev.view_count} / {ev.download_count}
                    </td>

                    <td className="px-4 py-3  text-[12.5px] text-[#65736B]">
                      {formatDate(ev.created_at)}
                    </td>

                    <td className="px-4 py-3"><RowActions ev={ev} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards (below md) ────────────────────────── */}
          <div className="md:hidden space-y-2.5">
            {events.map(ev => (
              <div key={ev.id} className={`rounded-xl border p-3.5 ${ev.moderation_status === 'removed' ? 'opacity-60' : ''} ${selected.has(ev.id) ? 'border-[#1F4D3A]/30 bg-[#E8EFEB]/40' : 'border-[#E5E0D4] bg-white'}`}>
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${ev.name}`}
                    checked={selected.has(ev.id)}
                    onChange={() => toggleOne(ev.id)}
                    className="h-4 w-4 mt-1 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0"><EventNameCell ev={ev} /></div>
                  <RowActions ev={ev} />
                </div>
                <div className="mt-2.5 text-[12px] text-[#65736B]">
                  {ev.profiles?.full_name ?? '—'} · {ev.profiles?.email ?? '—'}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2.5">
                  {renderStatusBadge(ev)}
                  {renderModerationBadge(ev)}
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[12px] text-[#65736B]">
                  <span>{ev.view_count} views · {ev.download_count} cards</span>
                  <span>{formatDate(ev.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <PagLink page={page - 1} disabled={page <= 1} label="← Previous" filters={defaultFilters} pathname={pathname} />
          <span className="text-[13px] text-[#65736B]">{page} / {totalPages}</span>
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

  if (disabled) return <span className="text-[13px] text-[#65736B]/40  px-3 py-1.5">{label}</span>;
  return (
    <a href={`${pathname}?${params.toString()}`}
      className="text-[13px] text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors">
      {label}
    </a>
  );
}
