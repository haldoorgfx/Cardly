'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2, AlertTriangle, Trash2, X, Download, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import type { RegistrationRow } from './page';

// Registration status enum (types/database.ts → RegistrationStatus)
const STATUS_OPTIONS = ['pending', 'confirmed', 'checked_in', 'cancelled', 'refunded', 'pending_approval'] as const;
type RegStatus = (typeof STATUS_OPTIONS)[number];

// Payment status enum (types/database.ts → PaymentStatus)
const PAYMENT_OPTIONS = ['free', 'pending', 'paid', 'refunded', 'failed'] as const;

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  confirmed:        { bg: 'rgba(45,122,79,0.12)',  color: '#2D7A4F' },
  checked_in:       { bg: 'rgba(31,77,58,0.12)',   color: '#1F4D3A' },
  pending:          { bg: 'rgba(201,122,45,0.14)', color: '#C97A2D' },
  pending_approval: { bg: 'rgba(201,122,45,0.14)', color: '#C97A2D' },
  cancelled:        { bg: 'rgba(107,122,114,0.12)', color: '#6B7A72' },
  refunded:         { bg: 'rgba(184,66,60,0.10)',  color: '#B8423C' },
};

const PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  paid:     { bg: 'rgba(45,122,79,0.12)',  color: '#2D7A4F' },
  free:     { bg: '#F5F5F4',               color: '#6B7A72' },
  pending:  { bg: 'rgba(201,122,45,0.14)', color: '#C97A2D' },
  refunded: { bg: 'rgba(184,66,60,0.10)',  color: '#B8423C' },
  failed:   { bg: 'rgba(184,66,60,0.14)',  color: '#B8423C' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number, currency: string) {
  if (!amount) return '—';
  return `${currency ? currency + ' ' : ''}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

interface Filters {
  q: string;
  status: string;
  payment_status: string;
  event_id: string;
}

interface Props {
  rows: RegistrationRow[];
  total: number;
  page: number;
  totalPages: number;
  canManage: boolean;
  defaultFilters: Filters;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  confirmDanger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} strokeWidth={1.8} className="text-[#B8423C]" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-[#0F1F18]">{title}</h3>
            <div className="text-[13px] text-[#6B7A72] mt-1 leading-relaxed">{body}</div>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
            style={{ background: confirmDanger ? '#B8423C' : '#1F4D3A' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RegistrationsAdminClient({
  rows: initialRows,
  total,
  page,
  totalPages,
  canManage,
  defaultFilters,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [rows, setRows]       = useState<RegistrationRow[]>(initialRows);
  const [busy, setBusy]       = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<RegistrationRow | null>(null);

  // Bulk selection
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy]   = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete' | RegStatus>(null);
  const [bulkStatus, setBulkStatus] = useState<RegStatus>('confirmed');

  const selectableIds = rows.map(r => r.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectableIds));

  // ── Filters ─────────────────────────────────────────────────────────────────
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q.trim())              params.set('q', filters.q.trim());
    if (filters.status.trim())         params.set('status', filters.status.trim());
    if (filters.payment_status.trim()) params.set('payment_status', filters.payment_status.trim());
    if (filters.event_id.trim())       params.set('event_id', filters.event_id.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  const clearFilters = () => {
    setFilters({ q: '', status: '', payment_status: '', event_id: '' });
    router.push(pathname);
  };

  const hasActiveFilters = Object.values(defaultFilters).some(v => v !== '');

  // ── Export CSV (current filters) ─────────────────────────────────────────────
  const exportUrl = () => {
    const params = new URLSearchParams();
    if (defaultFilters.q)              params.set('q', defaultFilters.q);
    if (defaultFilters.status)         params.set('status', defaultFilters.status);
    if (defaultFilters.payment_status) params.set('payment_status', defaultFilters.payment_status);
    if (defaultFilters.event_id)       params.set('event_id', defaultFilters.event_id);
    const qs = params.toString();
    return `/api/admin/registrations/export${qs ? `?${qs}` : ''}`;
  };

  // ── Per-row: change status ────────────────────────────────────────────────────
  const changeStatus = async (id: string, status: RegStatus) => {
    setChanging(id);
    try {
      const res = await fetch(`/api/admin/registrations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      }
    } finally {
      setChanging(null);
    }
  };

  // ── Per-row: delete ───────────────────────────────────────────────────────────
  const doDelete = async (row: RegistrationRow) => {
    setConfirmDelete(null);
    setBusy(row.id);
    try {
      const res = await fetch(`/api/admin/registrations/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRows(prev => prev.filter(r => r.id !== row.id));
      }
    } finally {
      setBusy(null);
    }
  };

  // ── Bulk runner — loops the per-record endpoint so its guard + audit apply to
  //    every affected row. Rows update as the batch resolves. ─────────────────────
  const runBulk = async (action: 'delete' | RegStatus) => {
    setBulkConfirm(null);
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch(`/api/admin/registrations/${id}`, { method: 'DELETE' })
            : fetch(`/api/admin/registrations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
              }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setRows(prev =>
        action === 'delete'
          ? prev.filter(r => !okIds.includes(r.id))
          : prev.map(r => okIds.includes(r.id) ? { ...r, status: action } : r),
      );
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div>
      {/* ── Filters ──────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white min-w-[200px] flex-1 max-w-[280px]">
          <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Attendee name or email…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
          />
        </div>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Payment status filter */}
        <select
          value={filters.payment_status}
          onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15"
        >
          <option value="">All payments</option>
          {PAYMENT_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={applyFilters}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          Apply
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-4 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors"
          >
            Clear
          </button>
        )}

        <div className="flex-1" />

        {/* Export CSV */}
        <a
          href={exportUrl()}
          className="h-9 px-4 inline-flex items-center gap-2 rounded-lg text-[13px] font-medium text-[#1F4D3A] border border-[#1F4D3A]/30 bg-white hover:bg-[#E8EFEB] transition-colors"
        >
          <Download size={13} strokeWidth={2} />
          Export CSV
        </a>
      </div>

      {/* Count */}
      <div className="mb-4 text-[12px] text-[#6B7A72]">
        {total} {total === 1 ? 'registration' : 'registrations'}
        {page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {canManage && selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          <div className="flex items-center gap-1.5">
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value as RegStatus)}
              disabled={bulkBusy}
              className="h-8 px-2 rounded-lg border border-[#E5E0D4] bg-white text-[12px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
            <button
              disabled={bulkBusy}
              onClick={() => setBulkConfirm(bulkStatus)}
              className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#1F4D3A] hover:bg-white/60 transition-colors disabled:opacity-50"
            >
              Set status
            </button>
          </div>
          <button
            disabled={bulkBusy}
            onClick={() => setBulkConfirm('delete')}
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

      {/* ── Table ────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">No registrations match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E0D4]">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                {canManage && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={allSelected}
                      onChange={toggleAll}
                      disabled={selectableIds.length === 0}
                      className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer disabled:cursor-not-allowed"
                    />
                  </th>
                )}
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Attendee</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Event</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Ticket</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Status</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Payment</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Amount</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Created</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E0D4]">
              {rows.map(r => {
                const statusStyle  = STATUS_STYLES[r.status]  ?? STATUS_STYLES.cancelled;
                const paymentStyle = PAYMENT_STYLES[r.payment_status] ?? PAYMENT_STYLES.free;
                const isBusy = busy === r.id;

                return (
                  <tr key={r.id} className={`hover:bg-[#FAF6EE]/60 transition-colors ${selected.has(r.id) ? 'bg-[#E8EFEB]/50' : ''}`}>
                    {canManage && (
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.attendee_email}`}
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
                        />
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F1F18]">{r.attendee_name}</div>
                      <div className="text-[11px] text-[#6B7A72]">{r.attendee_email}</div>
                    </td>

                    <td className="px-4 py-3">
                      {r.event_slug ? (
                        <Link
                          href={`/e/${r.event_slug}`}
                          target="_blank"
                          className="group inline-flex items-center gap-1 text-[#0F1F18] hover:text-[#1F4D3A] transition-colors"
                        >
                          <span className="max-w-[200px] truncate">{r.event_name ?? r.event_slug}</span>
                          <ExternalLink size={11} strokeWidth={2} className="text-[#6B7A72]/40 group-hover:text-[#1F4D3A]/60 transition-colors shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-[#6B7A72]">{r.event_name ?? '—'}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-[#3A4A42]">{r.ticket_name ?? '—'}</td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-[0.06em] uppercase" style={statusStyle}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] tracking-[0.06em] uppercase" style={paymentStyle}>
                        {r.payment_status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[12px] text-[#3A4A42]">
                      {formatAmount(r.amount_paid, r.currency)}
                    </td>

                    <td className="px-4 py-3  text-[11px] text-[#6B7A72]">
                      {formatDate(r.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {!canManage ? (
                        <span className="text-[11px] text-[#6B7A72]/30">—</span>
                      ) : isBusy ? (
                        <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#6B7A72]" />
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={r.status}
                            key={r.status}
                            onChange={e => changeStatus(r.id, e.target.value as RegStatus)}
                            disabled={changing === r.id}
                            className="h-8 px-2 rounded-lg border border-[#E5E0D4] text-[12px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 transition disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                          {changing === r.id && (
                            <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#6B7A72]" />
                          )}
                          <button
                            onClick={() => setConfirmDelete(r)}
                            title="Delete registration"
                            className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={12} strokeWidth={2} />
                          </button>
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

      {/* ── Confirm dialogs ──────────────────────────────────── */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete registration?"
          body={<>This permanently removes the registration for <strong>{confirmDelete.attendee_email}</strong>. This cannot be undone.</>}
          confirmLabel="Delete"
          confirmDanger
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {bulkConfirm === 'delete' && (
        <ConfirmDialog
          title={`Delete ${selected.size} registration${selected.size === 1 ? '' : 's'}?`}
          body={<>This permanently removes the selected {selected.size === 1 ? 'registration' : 'registrations'}. This cannot be undone.</>}
          confirmLabel={`Delete ${selected.size}`}
          confirmDanger
          onConfirm={() => runBulk('delete')}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
      {bulkConfirm && bulkConfirm !== 'delete' && (
        <ConfirmDialog
          title={`Set ${selected.size} registration${selected.size === 1 ? '' : 's'} to "${bulkConfirm.replace('_', ' ')}"?`}
          body={<>This changes the status of the selected {selected.size === 1 ? 'registration' : 'registrations'}.</>}
          confirmLabel={`Update ${selected.size}`}
          onConfirm={() => runBulk(bulkConfirm)}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
    </div>
  );
}

function PagLink({ page, disabled, label, filters, pathname }: {
  page: number; disabled: boolean; label: string; filters: Filters; pathname: string;
}) {
  const params = new URLSearchParams();
  if (filters.q)              params.set('q', filters.q);
  if (filters.status)         params.set('status', filters.status);
  if (filters.payment_status) params.set('payment_status', filters.payment_status);
  if (filters.event_id)       params.set('event_id', filters.event_id);
  params.set('page', String(page));

  if (disabled) {
    return <span className="text-[13px] text-[#6B7A72]/40  px-3 py-1.5">{label}</span>;
  }
  return (
    <a
      href={`${pathname}?${params.toString()}`}
      className="text-[13px] text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors"
    >
      {label}
    </a>
  );
}
