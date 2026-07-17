'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, Loader2, AlertTriangle, Ban, Trash2, RotateCcw, X, Download,
  MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import type { UserRow } from './page';
import type { UserRole } from '@/lib/auth/permissions';
import { toast } from '@/hooks/use-toast';
import { describeError } from '@/components/ui/status-state';

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  user:        { bg: 'rgba(107,122,114,0.10)', color: '#65736B' },
  studio:      { bg: 'rgba(31,77,58,0.10)',    color: '#1F4D3A' },
  admin:       { bg: 'rgba(232,197,126,0.20)', color: '#B58A34' },
  super_admin: { bg: 'rgba(184,66,60,0.10)',   color: '#B8423C' },
};

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  free:   { bg: '#F1EFE8',                color: '#65736B' },
  pro:    { bg: 'rgba(232,197,126,0.18)', color: '#B58A34' },
  studio: { bg: 'rgba(31,77,58,0.12)',    color: '#1F4D3A' },
};

// `studio` is a PLAN, not a role — it was previously offered as an assignable
// role but grants no extra permissions (identical to `user`) and collides with
// the studio plan in the UI. Roles are user / admin / super_admin only.
const ASSIGNABLE_BY_ADMIN: UserRole[] = ['user'];
const ASSIGNABLE_BY_SUPER: UserRole[] = ['user', 'admin', 'super_admin'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string | null, email: string | null) {
  const src = (name || email || '?').trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// Deterministic soft avatar tint from the id so each account reads distinct.
const AVATAR_TINTS = [
  { bg: '#E8EFEB', color: '#1F4D3A' },
  { bg: '#F5ECDD', color: '#B58A34' },
  { bg: '#EAF0F0', color: '#3A6A6A' },
  { bg: '#F1EBF0', color: '#7A4A72' },
  { bg: '#F1EFE8', color: '#65736B' },
];
function avatarTint(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

type SortKey = 'name' | 'plan' | 'role' | 'status' | 'joined';

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
  sort: string;
  dir: 'asc' | 'desc';
  defaultFilters: Filters;
}

// ── Confirm dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title, body, confirmLabel, confirmDanger, onConfirm, onCancel, extraInput,
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
      <div className="relative bg-white rounded-2xl shadow-lift border border-[#E5E0D4] p-6 max-w-sm w-full">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} strokeWidth={1.8} className="text-[#B8423C]" />
          </div>
          <div>
            <h3 className="font-semibold text-[15px] text-[#0F1F18]">{title}</h3>
            <div className="text-[13px] text-[#65736B] mt-1 leading-relaxed">{body}</div>
          </div>
        </div>
        {extraInput && (
          <div className="mb-4">
            <label className="text-[12px] text-[#65736B] mb-1.5 block">{extraInput.label}</label>
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
            className="px-4 py-2 rounded-lg text-[13px] text-[#65736B] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors"
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
  sort,
  dir,
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

  // Inline edit (name / plan / role)
  const [editPlan, setEditPlan] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string | null>(null);
  const [editName, setEditName] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');

  // Per-row overflow menu (one open at a time)
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const assignable = actorRole === 'super_admin' ? ASSIGNABLE_BY_SUPER : ASSIGNABLE_BY_ADMIN;
  const canSuspend = actorRole === 'super_admin';
  const canDelete  = actorRole === 'super_admin';
  const canSelect  = canSuspend || canDelete;

  // ── URL builder — merges current server-truth filters + sort + page ─────────
  const buildParams = useCallback((next: Partial<{
    q: string; role: string; plan: string; status: string; sort: string; dir: 'asc' | 'desc'; page: number;
  }>) => {
    const s = {
      q: defaultFilters.q, role: defaultFilters.role, plan: defaultFilters.plan,
      status: defaultFilters.status, sort, dir, page, ...next,
    };
    const p = new URLSearchParams();
    if (s.q)      p.set('q', s.q);
    if (s.role)   p.set('role', s.role);
    if (s.plan)   p.set('plan', s.plan);
    if (s.status) p.set('status', s.status);
    if (s.sort && s.sort !== 'joined') p.set('sort', s.sort);
    // Natural default direction: newest-first for dates, A→Z for everything else.
    const naturalDir = (s.sort === 'joined' || !s.sort) ? 'desc' : 'asc';
    if (s.dir && s.dir !== naturalDir) p.set('dir', s.dir);
    if (s.page && s.page > 1) p.set('page', String(s.page));
    return p.toString();
  }, [defaultFilters, sort, dir, page]);

  const go = useCallback((next: Parameters<typeof buildParams>[0]) => {
    const qs = buildParams(next);
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [buildParams, pathname, router]);

  const onSort = (key: SortKey) => {
    const naturalDir: 'asc' | 'desc' = key === 'joined' ? 'desc' : 'asc';
    const nextDir: 'asc' | 'desc' = sort === key ? (dir === 'asc' ? 'desc' : 'asc') : naturalDir;
    go({ sort: key, dir: nextDir, page: 1 });
  };

  const applySearch = () => go({ q: filters.q.trim(), page: 1 });

  const clearFilters = () => {
    setFilters({ q: '', role: '', plan: '', status: '' });
    router.push(pathname);
  };

  const hasActiveFilters = Object.values(defaultFilters).some(v => v !== '');

  // ── Mutations ───────────────────────────────────────────────────────────────

  const saveField = async (userId: string, patch: { full_name?: string; plan?: string }) => {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...('full_name' in patch ? { full_name: patch.full_name || null } : {}), ...('plan' in patch ? { plan: patch.plan! } : {}) } : u)));
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Update failed');
      }
      toast({ title: 'plan' in patch ? 'Plan updated' : 'Name updated', variant: 'success' });
    } catch (e) {
      const reason = e instanceof Error ? e.message : 'Update failed';
      toast({ title: 'Could not save the change', description: `${reason} Refresh to see the current value.`, variant: 'destructive' });
    }
  };

  const changeRole = async (userId: string, newRole: UserRole) => {
    setEditRole(null);
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
        toast({ title: 'Role updated', description: `Now ${role}.`, variant: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Could not change the role', description: data.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Could not change the role', description: describeError(e, 'the role change'), variant: 'destructive' });
    } finally {
      setChanging(null);
    }
  };

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
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, suspended: true, suspended_reason: reason ?? 'Suspended by administrator.' } : u));
        toast({ title: 'Account suspended', description: targetUser.email ?? undefined, variant: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Could not suspend the account', description: data.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Could not suspend the account', description: describeError(e, 'this account'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

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
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, suspended: false, suspended_reason: null } : u));
        toast({ title: 'Account unsuspended', description: targetUser.email ?? undefined, variant: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Could not unsuspend the account', description: data.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Could not unsuspend the account', description: describeError(e, 'this account'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

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
        toast({ title: 'Account deleted', description: targetUser.email ?? undefined, variant: 'success' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Could not delete the account', description: data.error || 'Please try again.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Could not delete the account', description: describeError(e, 'this account'), variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  // ── Bulk ────────────────────────────────────────────────────────────────────
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
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectableIds));

  const runBulk = async (action: 'suspend' | 'unsuspend' | 'delete', reason?: string) => {
    setBulkConfirm(null);
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch('/api/admin/users/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id }) })
            : fetch('/api/admin/users/suspend', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: id, suspend: action === 'suspend', reason }) }),
        ),
      );
      const okIds = ids.filter((_, i) => results[i].status === 'fulfilled' && (results[i] as PromiseFulfilledResult<Response>).value.ok);
      setUsers(prev =>
        action === 'delete'
          ? prev.filter(u => !okIds.includes(u.id))
          : prev.map(u => okIds.includes(u.id)
              ? { ...u, suspended: action === 'suspend', suspended_reason: action === 'suspend' ? (reason ?? 'Suspended by administrator.') : null }
              : u),
      );
      const verb = action === 'delete' ? 'Deleted' : action === 'suspend' ? 'Suspended' : 'Unsuspended';
      const failed = ids.length - okIds.length;
      if (okIds.length > 0) {
        toast({ title: `${verb} ${okIds.length} account${okIds.length === 1 ? '' : 's'}`, description: failed > 0 ? `${failed} could not be processed.` : undefined });
      }
      if (okIds.length === 0 && ids.length > 0) {
        toast({ title: `Could not ${action} any accounts`, description: `None of the ${ids.length} accounts could be processed. Please try again.`, variant: 'destructive' });
      }
      clearSelection();
    } catch (e) {
      toast({ title: `Could not ${action} the selected accounts`, description: describeError(e, 'the bulk action'), variant: 'destructive' });
    } finally {
      setBulkBusy(false);
    }
  };

  // ── Shared cell renderers (used by both table + mobile cards) ────────────────

  const renderPlan = (u: UserRow) => {
    const planStyle = PLAN_STYLES[u.plan] ?? PLAN_STYLES.free;
    return editPlan === u.id ? (
      <select
        autoFocus
        defaultValue={u.plan}
        onChange={e => { saveField(u.id, { plan: e.target.value }); setEditPlan(null); }}
        onBlur={() => setEditPlan(null)}
        className="h-7 px-2 rounded-lg border border-[#1F4D3A]/40 text-[12px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
      >
        <option value="free">free</option>
        <option value="pro">pro</option>
        <option value="studio">studio</option>
      </select>
    ) : (
      <button
        type="button"
        onClick={() => setEditPlan(u.id)}
        title="Click to change plan"
        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.08em] uppercase hover:ring-2 hover:ring-[#1F4D3A]/20 transition"
        style={planStyle}
      >
        {u.plan}
      </button>
    );
  };

  const renderRole = (u: UserRow) => {
    const roleStyle = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
    const isSelf = u.id === currentUserId;
    const isSuperA = u.role === 'super_admin';
    const editable = !isSelf && !isSuperA && assignable.length > 1;
    if (changing === u.id) return <Loader2 size={13} strokeWidth={2} className="animate-spin text-[#65736B]" />;
    return editRole === u.id && editable ? (
      <select
        autoFocus
        defaultValue={u.role}
        onChange={e => changeRole(u.id, e.target.value as UserRole)}
        onBlur={() => setEditRole(null)}
        className="h-7 px-2 rounded-lg border border-[#1F4D3A]/40 text-[12px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
      >
        {assignable.map(r => <option key={r} value={r}>{r}</option>)}
        {!assignable.includes(u.role as UserRole) && <option value={u.role} disabled>{u.role} (current)</option>}
      </select>
    ) : (
      <button
        type="button"
        onClick={() => editable && setEditRole(u.id)}
        title={editable ? 'Click to change role' : isSelf ? 'This is you' : 'Protected account'}
        disabled={!editable}
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-[0.08em] uppercase transition ${editable ? 'hover:ring-2 hover:ring-[#1F4D3A]/20 cursor-pointer' : 'cursor-default'}`}
        style={roleStyle}
      >
        {u.role.replace('_', ' ')}
      </button>
    );
  };

  const renderStatus = (u: UserRow) =>
    u.suspended ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-50 text-[#B8423C]">
        <Ban size={9} strokeWidth={2.2} /> Suspended
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
      </span>
    );

  const RowMenu = ({ u }: { u: UserRow }) => {
    const isSelf = u.id === currentUserId;
    const isSuperA = u.role === 'super_admin';
    const canActOnRow = !isSelf && !isSuperA;
    const open = openMenu === u.id;
    return (
      <div className="relative">
        <button
          onClick={() => setOpenMenu(open ? null : u.id)}
          aria-label="Row actions"
          className="h-10 w-10 grid place-items-center rounded-lg border border-[#E5E0D4] text-[#65736B] hover:bg-[#FAF6EE] hover:text-[#0F1F18] transition-colors"
        >
          {busy === u.id ? <Loader2 size={14} strokeWidth={2} className="animate-spin" /> : <MoreHorizontal size={15} strokeWidth={2} />}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[190]" onClick={() => setOpenMenu(null)} />
            <div className="absolute right-0 top-11 z-[200] w-52 rounded-xl border border-[#E5E0D4] bg-white shadow-lift py-1.5 text-[13px]">
              <Link
                href={`/admin/users/${u.id}`}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors"
                onClick={() => setOpenMenu(null)}
              >
                <ExternalLink size={14} strokeWidth={1.9} className="text-[#65736B]" /> View details
              </Link>
              {canSuspend && canActOnRow && (
                u.suspended ? (
                  <button
                    onClick={() => { setOpenMenu(null); setConfirmUnsuspend(u); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  >
                    <RotateCcw size={14} strokeWidth={1.9} /> Unsuspend
                  </button>
                ) : (
                  <button
                    onClick={() => { setOpenMenu(null); setConfirmSuspend(u); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#C97A2D] hover:bg-amber-50 transition-colors"
                  >
                    <Ban size={14} strokeWidth={1.9} /> Suspend
                  </button>
                )
              )}
              {canDelete && canActOnRow && (
                <>
                  <div className="my-1 border-t border-[#E5E0D4]" />
                  <button
                    onClick={() => { setOpenMenu(null); setConfirmDelete(u); }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#B8423C] hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.9} /> Delete account
                  </button>
                </>
              )}
              {!canActOnRow && (
                <div className="px-3.5 py-2 text-[12px] text-[#65736B]/70">{isSelf ? 'This is your account.' : 'Protected account.'}</div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const NameCell = ({ u }: { u: UserRow }) => {
    const isSelf = u.id === currentUserId;
    const tint = avatarTint(u.id);
    return (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full grid place-items-center shrink-0 text-[12px] font-semibold" style={{ background: tint.bg, color: tint.color }}>
          {initials(u.full_name, u.email)}
        </div>
        <div className="min-w-0">
          {editName === u.id ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={() => { saveField(u.id, { full_name: nameDraft.trim() }); setEditName(null); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { saveField(u.id, { full_name: nameDraft.trim() }); setEditName(null); }
                if (e.key === 'Escape') setEditName(null);
              }}
              className="w-[170px] border border-[#1F4D3A]/40 rounded-lg px-2 py-1 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20"
            />
          ) : (
            <button
              type="button"
              onClick={() => { setNameDraft(u.full_name ?? ''); setEditName(u.id); }}
              title="Click to edit name"
              className="block font-medium text-[13.5px] text-[#0F1F18] hover:text-[#1F4D3A] transition-colors text-left truncate max-w-[220px]"
            >
              {u.full_name ?? '—'}
              {isSelf && <span className="ml-1.5 text-[11.5px] font-normal text-[#65736B]/70">(you)</span>}
            </button>
          )}
          <Link href={`/admin/users/${u.id}`} className="block text-[12px] text-[#65736B] hover:text-[#1F4D3A] transition-colors truncate max-w-[220px]">
            {u.email}
          </Link>
        </div>
      </div>
    );
  };

  const SortTh = ({ label, sortKey, className = '' }: { label: string; sortKey: SortKey; className?: string }) => {
    const active = sort === sortKey;
    return (
      <th className={`text-left px-4 py-3 ${className}`}>
        <button
          onClick={() => onSort(sortKey)}
          className={`inline-flex items-center gap-1 text-[11px] tracking-[0.12em] uppercase font-semibold transition-colors ${active ? 'text-[#1F4D3A]' : 'text-[#65736B] hover:text-[#0F1F18]'}`}
        >
          {label}
          {active ? (
            dir === 'asc' ? <ArrowUp size={12} strokeWidth={2.4} /> : <ArrowDown size={12} strokeWidth={2.4} />
          ) : (
            <ChevronsUpDown size={12} strokeWidth={2} className="text-[#65736B]/40" />
          )}
        </button>
      </th>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Filter bar ───────────────────────────────────────── */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="flex items-center gap-2 h-10 px-3.5 rounded-xl border border-[#E5E0D4] bg-white flex-1 sm:max-w-[320px] focus-within:ring-2 focus-within:ring-[#1F4D3A]/15 transition">
          <Search size={15} strokeWidth={2} className="text-[#65736B] shrink-0" />
          <input
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            placeholder="Search by name or email…"
            className="outline-none bg-transparent flex-1 text-[13.5px] placeholder-[#65736B]/60 text-[#0F1F18]"
          />
          {filters.q && (
            <button onClick={() => { setFilters(f => ({ ...f, q: '' })); go({ q: '', page: 1 }); }} aria-label="Clear search" className="text-[#65736B] hover:text-[#0F1F18] transition-colors">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={defaultFilters.role} onChange={e => go({ role: e.target.value, page: 1 })} className="h-10 px-3 rounded-xl border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 cursor-pointer">
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select value={defaultFilters.plan} onChange={e => go({ plan: e.target.value, page: 1 })} className="h-10 px-3 rounded-xl border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 cursor-pointer">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
          </select>
          <select value={defaultFilters.status} onChange={e => go({ status: e.target.value, page: 1 })} className="h-10 px-3 rounded-xl border border-[#E5E0D4] bg-white text-[13px] text-[#0F1F18] outline-none focus:ring-2 focus:ring-[#1F4D3A]/15 cursor-pointer">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="h-10 px-3.5 rounded-xl text-[13px] text-[#65736B] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">
              Clear
            </button>
          )}

          <a
            href={`/api/admin/users/export?${new URLSearchParams(Object.fromEntries(Object.entries(defaultFilters).filter(([, v]) => v))).toString()}`}
            className="h-10 px-3.5 rounded-xl text-[13px] font-medium text-[#1F4D3A] border border-[#1F4D3A]/25 hover:bg-[#E8EFEB] transition-colors inline-flex items-center gap-1.5"
          >
            <Download size={14} strokeWidth={2} /> Export
          </a>
        </div>
      </div>

      {/* Count */}
      <div className="mb-3 text-[12.5px] text-[#65736B]">
        <span className="font-medium text-[#3A4A42]">{total.toLocaleString()}</span> {total === 1 ? 'account' : 'accounts'}
        {hasActiveFilters && ' matching filters'}
        {totalPages > 1 && ` · page ${page} of ${totalPages}`}
      </div>

      {/* ── Bulk action bar ──────────────────────────────────── */}
      {canSelect && selected.size > 0 && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB] sticky top-2 z-[80]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">{selected.size} selected</span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          {canSuspend && (
            <>
              <button disabled={bulkBusy} onClick={() => setBulkConfirm('suspend')} className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#C97A2D] hover:bg-amber-50 transition-colors disabled:opacity-50">Suspend</button>
              <button disabled={bulkBusy} onClick={() => setBulkConfirm('unsuspend')} className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50">Unsuspend</button>
            </>
          )}
          {canDelete && (
            <button disabled={bulkBusy} onClick={() => setBulkConfirm('delete')} className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50" style={{ background: '#B8423C' }}>Delete</button>
          )}
          <button disabled={bulkBusy} onClick={clearSelection} title="Clear selection" aria-label="Clear selection" className="h-10 w-10 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#65736B] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50">
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed border-[#E5E0D4]">
          <div className="mx-auto h-11 w-11 rounded-xl grid place-items-center mb-3" style={{ background: '#E8EFEB' }}>
            <Search size={17} strokeWidth={1.8} color="#1F4D3A" />
          </div>
          <div className="font-semibold text-[14px] text-[#0F1F18]">No accounts match these filters</div>
          <p className="text-[13px] text-[#65736B] mt-1">Try a different search or clear the filters.</p>
        </div>
      ) : (
        <>
          {/* ── Desktop table (md+) ────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E5E0D4]">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                  {canSelect && (
                    <th className="w-10 px-4 py-3">
                      <input type="checkbox" aria-label="Select all" checked={allSelected} onChange={toggleAll} disabled={selectableIds.length === 0} className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer disabled:cursor-not-allowed" />
                    </th>
                  )}
                  <SortTh label="Account" sortKey="name" />
                  <SortTh label="Plan" sortKey="plan" />
                  <SortTh label="Role" sortKey="role" />
                  <SortTh label="Status" sortKey="status" />
                  <SortTh label="Joined" sortKey="joined" />
                  <th className="w-14 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E5E0D4]">
                {users.map(u => {
                  const selectable = u.id !== currentUserId && u.role !== 'super_admin';
                  return (
                    <tr key={u.id} className={`transition-colors ${u.suspended ? 'opacity-60' : ''} ${selected.has(u.id) ? 'bg-[#E8EFEB]/50' : 'hover:bg-[#FAF6EE]/60'}`}>
                      {canSelect && (
                        <td className="w-10 px-4 py-3 align-middle">
                          {selectable && (
                            <input type="checkbox" aria-label={`Select ${u.email}`} checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer" />
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 align-middle"><NameCell u={u} /></td>
                      <td className="px-4 py-3 align-middle">{renderPlan(u)}</td>
                      <td className="px-4 py-3 align-middle">{renderRole(u)}</td>
                      <td className="px-4 py-3 align-middle">{renderStatus(u)}</td>
                      <td className="px-4 py-3 align-middle text-[12.5px] text-[#65736B]">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 align-middle text-right"><RowMenu u={u} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards (below md) ────────────────────────── */}
          <div className="md:hidden space-y-2.5">
            {users.map(u => {
              const selectable = u.id !== currentUserId && u.role !== 'super_admin';
              return (
                <div key={u.id} className={`rounded-xl border p-3.5 ${u.suspended ? 'opacity-70' : ''} ${selected.has(u.id) ? 'border-[#1F4D3A]/30 bg-[#E8EFEB]/40' : 'border-[#E5E0D4] bg-white'}`}>
                  <div className="flex items-start gap-2.5">
                    {canSelect && selectable && (
                      <input type="checkbox" aria-label={`Select ${u.email}`} checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="h-4 w-4 mt-1 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer shrink-0" />
                    )}
                    <div className="flex-1 min-w-0"><NameCell u={u} /></div>
                    <RowMenu u={u} />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-3">
                    {renderPlan(u)}
                    {renderRole(u)}
                    {renderStatus(u)}
                  </div>
                  <div className="mt-2.5 text-[12px] text-[#65736B]">Joined {formatDate(u.created_at)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={page <= 1}
            onClick={() => go({ page: page - 1 })}
            className="text-[13px] px-3.5 py-2 rounded-lg transition-colors disabled:text-[#65736B]/40 disabled:cursor-not-allowed enabled:text-[#1F4D3A] enabled:hover:bg-[#E8EFEB]"
          >
            ← Previous
          </button>
          <span className="text-[13px] text-[#65736B]">{page} / {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => go({ page: page + 1 })}
            className="text-[13px] px-3.5 py-2 rounded-lg transition-colors disabled:text-[#65736B]/40 disabled:cursor-not-allowed enabled:text-[#1F4D3A] enabled:hover:bg-[#E8EFEB]"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Confirm dialogs ──────────────────────────────────── */}
      {confirmSuspend && (
        <ConfirmDialog
          title="Suspend account?"
          body={<>This will immediately block <strong>{confirmSuspend.email}</strong> from accessing Eventera.</>}
          confirmLabel="Suspend" confirmDanger
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
          confirmLabel="Delete permanently" confirmDanger
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Bulk confirm dialogs ─────────────────────────────── */}
      {bulkConfirm === 'suspend' && (
        <ConfirmDialog
          title={`Suspend ${selected.size} account${selected.size === 1 ? '' : 's'}?`}
          body={<>This will immediately block the selected {selected.size === 1 ? 'account' : 'accounts'} from accessing Eventera.</>}
          confirmLabel={`Suspend ${selected.size}`} confirmDanger
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
          confirmLabel={`Delete ${selected.size} permanently`} confirmDanger
          onConfirm={() => runBulk('delete')}
          onCancel={() => setBulkConfirm(null)}
        />
      )}
    </div>
  );
}
