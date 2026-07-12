'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2, AlertTriangle, Ban, Trash2, RotateCcw, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import type { UserRow } from './page';
import type { UserRole } from '@/lib/auth/permissions';

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  user:        { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' },
  studio:      { bg: 'rgba(31,77,58,0.10)',    color: '#1F4D3A' },
  admin:       { bg: 'rgba(232,197,126,0.18)', color: '#C9A45E' },
  super_admin: { bg: 'rgba(184,66,60,0.10)',   color: '#B8423C' },
};

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  free:   { bg: '#F5F5F4',               color: '#6B7A72' },
  pro:    { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  studio: { bg: 'rgba(31,77,58,0.12)',   color: '#1F4D3A' },
};

const ASSIGNABLE_BY_ADMIN: UserRole[] = ['user', 'studio'];
const ASSIGNABLE_BY_SUPER: UserRole[] = ['user', 'studio', 'admin', 'super_admin'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Filters {
  q: string;
  role: string;
  plan: string;
  status: string;
}

interface Props {
  users: UserRow[];
  total: number;
  page: number;
  totalPages: number;
  currentUserId: string;
  actorRole: string;
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
  extraInput,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  confirmDanger?: boolean;
  onConfirm: (extra?: string) => void;
  onCancel: () => void;
  extraInput?: { label: string; placeholder: string };
}) {
  const [extra, setExtra] = useState('');
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
        {extraInput && (
          <div className="mb-4">
            <label className="text-[12px] text-[#6B7A72] mb-1.5 block">{extraInput.label}</label>
            <input
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder={extraInput.placeholder}
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
            />
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(extra || undefined)}
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

export function UsersAdminClient({
  users: initialUsers,
  total,
  page,
  totalPages,
  currentUserId,
  actorRole,
  defaultFilters,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [users, setUsers]     = useState<UserRow[]>(initialUsers);
  const [changing, setChanging] = useState<string | null>(null);
  const [busy, setBusy]        = useState<string | null>(null);

  // Confirm dialogs
  const [confirmSuspend, setConfirmSuspend] = useState<UserRow | null>(null);
  const [confirmUnsuspend, setConfirmUnsuspend] = useState<UserRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserRow | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<null | 'suspend' | 'unsuspend' | 'delete'>(null);

  const assignable = actorRole === 'super_admin' ? ASSIGNABLE_BY_SUPER : ASSIGNABLE_BY_ADMIN;
  const canSuspend = actorRole === 'super_admin';
  const canDelete  = actorRole === 'super_admin';

  // Only rows the admin may act on in bulk — never yourself, never another
  // super_admin (mirrors the per-row protection).
  const selectableIds = users
    .filter(u => u.id !== currentUserId && u.role !== 'super_admin')
    .map(u => u.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectableIds));

  // Bulk runner — loops the existing, per-user endpoints so their permission
  // checks + audit logging apply to every affected account. Rows update as the
  // batch resolves; failures are left untouched.
  const runBulk = async (action: 'suspend' | 'unsuspend' | 'delete', reason?: string) => {
    setBulkConfirm(null);
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch('/api/admin/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id }),
              })
            : fetch('/api/admin/users/suspend', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, suspend: action === 'suspend', reason }),
              }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setUsers(prev =>
        action === 'delete'
          ? prev.filter(u => !okIds.includes(u.id))
          : prev.map(u =>
              okIds.includes(u.id)
                ? {
                    ...u,
                    suspended: action === 'suspend',
                    suspended_reason: action === 'suspend' ? (reason ?? 'Suspended by administrator.') : null,
                  }
                : u,
            ),
      );
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q.trim())     params.set('q',      filters.q.trim());
    if (filters.role.trim())  params.set('role',   filters.role.trim());
    if (filters.plan.trim())  params.set('plan',   filters.plan.trim());
    if (filters.status.trim()) params.set('status', filters.status.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, pathname, router]);

  const clearFilters = () => {
    setFilters({ q: '', role: '', plan: '', status: '' });
    router.push(pathname);
  };

  const hasActiveFilters = Object.values(defaultFilters).some(v => v !== '');

  // Role change
  const changeRole = async (userId: string, newRole: UserRole) => {
    setChanging(userId);
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        const { role } = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      }
    } finally {
      setChanging(null);
    }
  };

  // Suspend
  const doSuspend = async (targetUser: UserRow, reason?: string) => {
    setConfirmSuspend(null);
    setBusy(targetUser.id);
    try {
      const res = await fetch('/api/admin/users/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, suspend: true, reason }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === targetUser.id
            ? { ...u, suspended: true, suspended_reason: reason ?? 'Suspended by administrator.' }
            : u
        ));
      }
    } finally {
      setBusy(null);
    }
  };

  // Unsuspend
  const doUnsuspend = async (targetUser: UserRow) => {
    setConfirmUnsuspend(null);
    setBusy(targetUser.id);
    try {
      const res = await fetch('/api/admin/users/suspend', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id, suspend: false }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u =>
          u.id === targetUser.id
            ? { ...u, suspended: false, suspended_reason: null }
            : u
        ));
      }
    } finally {
      setBusy(null);
    }
  };

  // Delete
  const doDelete = async (targetUser: UserRow) => {
    setConfirmDelete(null);
    setBusy(targetUser.id);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      }
    } finally {
      setBusy(null);
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
            placeholder="Email or name…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
          />
        </div>

        {/* Role filter */}
        <select
          value={filters.role}
          onChange={e => setFilters(f => ({ ...f, role: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="studio">Studio</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        {/* Plan filter */}
        <select
          value={filters.plan}
          onChange={e => setFilters(f => ({ ...f, plan: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="studio">Studio</option>
        </select>

        {/* Status filter */}
        <select
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="h-9 px-3 rounded-lg border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
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
      </div>

      {/* Count */}
      <div className="mb-4 text-[12px] text-[#6B7A72]">
        {total} {total === 1 ? 'user' : 'users'}
        {page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {(canSuspend || canDelete) && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          {canSuspend && (
            <>
              <button
                disabled={bulkBusy}
                onClick={() => setBulkConfirm('suspend')}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#C97A2D] hover:bg-amber-50 transition-colors disabled:opacity-50"
              >
                Suspend
              </button>
              <button
                disabled={bulkBusy}
                onClick={() => setBulkConfirm('unsuspend')}
                className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
              >
                Unsuspend
              </button>
            </>
          )}
          {canDelete && (
            <button
              disabled={bulkBusy}
              onClick={() => setBulkConfirm('delete')}
              className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
              style={{ background: '#B8423C' }}
            >
              Delete
            </button>
          )}
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
      {users.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">No users match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E5E0D4]">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                {(canSuspend || canDelete) && (
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
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">User</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Plan</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Role</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Status</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Joined</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Change role</th>
                <th className="text-left px-4 py-3  text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E5E0D4]">
              {users.map(u => {
                const isSelf    = u.id === currentUserId;
                const isSuperA  = u.role === 'super_admin';
                const roleStyle = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
                const planStyle = PLAN_STYLES[u.plan] ?? PLAN_STYLES.free;
                const isBusy    = busy === u.id;

                const selectable = !isSelf && !isSuperA;

                return (
                  <tr key={u.id} className={`hover:bg-[#FAF6EE]/60 transition-colors ${u.suspended ? 'opacity-60' : ''} ${selected.has(u.id) ? 'bg-[#E8EFEB]/50' : ''}`}>
                    {(canSuspend || canDelete) && (
                      <td className="w-10 px-4 py-3">
                        {selectable && (
                          <input
                            type="checkbox"
                            aria-label={`Select ${u.email}`}
                            checked={selected.has(u.id)}
                            onChange={() => toggleOne(u.id)}
                            className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="group flex items-center gap-1">
                        <div>
                          <div className="font-medium text-[#0F1F18] group-hover:text-[#1F4D3A] transition-colors">
                            {u.full_name ?? '—'}
                            {isSelf && <span className="ml-1.5 text-[10px] text-[#6B7A72]/60">(you)</span>}
                          </div>
                          <div className="text-[11px] text-[#6B7A72]">{u.email}</div>
                        </div>
                        <ChevronRight size={11} strokeWidth={2} className="ml-0.5 text-[#6B7A72]/30 group-hover:text-[#1F4D3A]/50 transition-colors" />
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[10px] tracking-[0.1em] uppercase" style={planStyle}>
                        {u.plan}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[10px] tracking-[0.1em]" style={roleStyle}>
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full  text-[10px] bg-red-50 text-[#B8423C]">
                          <Ban size={9} strokeWidth={2.2} /> suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[10px] bg-emerald-50 text-emerald-700">
                          active
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3  text-[11px] text-[#6B7A72]">
                      {formatDate(u.created_at)}
                    </td>

                    {/* Role change */}
                    <td className="px-4 py-3">
                      {isSelf || isSuperA ? (
                        <span className="text-[11px] text-[#6B7A72]/40 ">
                          {isSelf ? 'you' : 'protected'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={u.role}
                            key={u.role}
                            onChange={e => changeRole(u.id, e.target.value as UserRole)}
                            disabled={changing === u.id || isBusy}
                            className="h-8 px-2 rounded-lg border border-[#E5E0D4] text-[12px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 transition disabled:opacity-50"
                          >
                            {assignable.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                            {!assignable.includes(u.role as UserRole) && (
                              <option value={u.role} disabled>{u.role} (current)</option>
                            )}
                          </select>
                          {changing === u.id && (
                            <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#6B7A72]" />
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {isSelf || isSuperA ? (
                        <span className="text-[11px] text-[#6B7A72]/30 ">—</span>
                      ) : isBusy ? (
                        <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#6B7A72]" />
                      ) : (
                        <div className="flex items-center gap-1">
                          {canSuspend && (
                            u.suspended ? (
                              <button
                                onClick={() => setConfirmUnsuspend(u)}
                                title="Unsuspend"
                                className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <RotateCcw size={12} strokeWidth={2} />
                              </button>
                            ) : (
                              <button
                                onClick={() => setConfirmSuspend(u)}
                                title="Suspend"
                                className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#C97A2D] hover:bg-amber-50 transition-colors"
                              >
                                <Ban size={12} strokeWidth={2} />
                              </button>
                            )
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDelete(u)}
                              title="Delete"
                              className="h-7 w-7 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={12} strokeWidth={2} />
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

      {/* ── Confirm dialogs ──────────────────────────────────── */}
      {confirmSuspend && (
        <ConfirmDialog
          title="Suspend account?"
          body={<>This will immediately block <strong>{confirmSuspend.email}</strong> from accessing Eventera.</>}
          confirmLabel="Suspend"
          confirmDanger
          extraInput={{ label: 'Reason (optional)', placeholder: 'E.g. violated terms of service' }}
          onConfirm={reason => doSuspend(confirmSuspend, reason)}
          onCancel={() => setConfirmSuspend(null)}
        />
      )}

      {confirmUnsuspend && (
        <ConfirmDialog
          title="Unsuspend account?"
          body={<>This will restore full access for <strong>{confirmUnsuspend.email}</strong>.</>}
          confirmLabel="Unsuspend"
          onConfirm={() => doUnsuspend(confirmUnsuspend)}
          onCancel={() => setConfirmUnsuspend(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Permanently delete account?"
          body={<>This cannot be undone. All events, cards, and data for <strong>{confirmDelete.email}</strong> will be permanently deleted.</>}
          confirmLabel="Delete permanently"
          confirmDanger
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Bulk confirm dialogs ─────────────────────────────── */}
      {bulkConfirm === 'suspend' && (
        <ConfirmDialog
          title={`Suspend ${selected.size} account${selected.size === 1 ? '' : 's'}?`}
          body={<>This will immediately block the selected {selected.size === 1 ? 'account' : 'accounts'} from accessing Eventera.</>}
          confirmLabel={`Suspend ${selected.size}`}
          confirmDanger
          extraInput={{ label: 'Reason (optional)', placeholder: 'E.g. violated terms of service' }}
          onConfirm={reason => runBulk('suspend', reason)}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
      {bulkConfirm === 'unsuspend' && (
        <ConfirmDialog
          title={`Unsuspend ${selected.size} account${selected.size === 1 ? '' : 's'}?`}
          body={<>This will restore full access for the selected {selected.size === 1 ? 'account' : 'accounts'}.</>}
          confirmLabel={`Unsuspend ${selected.size}`}
          onConfirm={() => runBulk('unsuspend')}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
      {bulkConfirm === 'delete' && (
        <ConfirmDialog
          title={`Permanently delete ${selected.size} account${selected.size === 1 ? '' : 's'}?`}
          body={<>This cannot be undone. All events, cards, and data for the selected {selected.size === 1 ? 'account' : 'accounts'} will be permanently deleted.</>}
          confirmLabel={`Delete ${selected.size} permanently`}
          confirmDanger
          onConfirm={() => runBulk('delete')}
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
  if (filters.q)      params.set('q',      filters.q);
  if (filters.role)   params.set('role',   filters.role);
  if (filters.plan)   params.set('plan',   filters.plan);
  if (filters.status) params.set('status', filters.status);
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
