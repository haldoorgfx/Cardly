'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import type { UserRow } from './page';
import type { UserRole } from '@/lib/auth/permissions';

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  user:        { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72' },
  studio:      { bg: 'rgba(31,77,58,0.10)',    color: '#1F4D3A' },
  admin:       { bg: 'rgba(232,197,126,0.18)', color: '#C9A45E' },
  super_admin: { bg: 'rgba(184,66,60,0.10)',   color: '#B8423C' },
};

const PLAN_STYLES: Record<string, { bg: string; color: string }> = {
  free:   { bg: '#F5F5F4',              color: '#6B7A72' },
  pro:    { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  studio: { bg: 'rgba(31,77,58,0.12)',  color: '#1F4D3A' },
};

/** Roles an admin can assign (role-bounded server-side as well) */
const ASSIGNABLE_BY_ADMIN: UserRole[]       = ['user', 'studio'];
const ASSIGNABLE_BY_SUPER: UserRole[]       = ['user', 'studio', 'admin', 'super_admin'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface Props {
  users: UserRow[];
  count: number;
  page: number;
  totalPages: number;
  currentUserId: string;
  actorRole: string;
  defaultQ: string;
}

export function UsersAdminClient({
  users: initialUsers,
  count,
  page,
  totalPages,
  currentUserId,
  actorRole,
  defaultQ,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const [q, setQ]             = useState(defaultQ);
  const [users, setUsers]     = useState<UserRow[]>(initialUsers);
  const [changing, setChanging] = useState<string | null>(null);

  const assignable = actorRole === 'super_admin' ? ASSIGNABLE_BY_SUPER : ASSIGNABLE_BY_ADMIN;

  const search = useCallback(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`${pathname}?${params.toString()}`);
  }, [q, pathname, router]);

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

  return (
    <div>
      {/* Search bar */}
      <div className="mb-5 flex gap-3">
        <div
          className="flex items-center gap-2 h-9 px-3 rounded-lg border flex-1 max-w-[340px]"
          style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}
        >
          <Search size={13} strokeWidth={2} className="text-[#6B7A72] shrink-0" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search by email…"
            className="outline-none bg-transparent flex-1 text-[13px] placeholder-[#6B7A72]/60 text-[#0F1F18]"
          />
        </div>
        <button
          onClick={search}
          className="h-9 px-4 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          Search
        </button>
        {defaultQ && (
          <button
            onClick={() => { setQ(''); router.push(pathname); }}
            className="h-9 px-4 rounded-lg text-[13px] text-[#6B7A72] border transition hover:bg-[#FAF6EE]"
            style={{ borderColor: '#E5E0D4' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <div className="mb-4 text-[12px] font-mono text-[#6B7A72]">
        {count} {count === 1 ? 'user' : 'users'}
        {page > 1 && ` — page ${page} of ${totalPages}`}
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div className="py-16 text-center text-[14px] text-[#6B7A72]">No users found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#E5E0D4' }}>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">User</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Plan</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Role</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Joined</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Change role</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y" style={{ borderColor: '#E5E0D4' }}>
              {users.map(u => {
                const isSelf = u.id === currentUserId;
                const roleStyle = ROLE_STYLES[u.role] ?? ROLE_STYLES.user;
                const planStyle = PLAN_STYLES[u.plan] ?? PLAN_STYLES.free;
                return (
                  <tr key={u.id} className="hover:bg-[#FAF6EE]/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F1F18]">{u.full_name ?? '—'}</div>
                      <div className="text-[11px] font-mono text-[#6B7A72]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] tracking-[0.1em] uppercase"
                        style={planStyle}
                      >
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] tracking-[0.1em]"
                        style={roleStyle}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#6B7A72]">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-[11px] text-[#6B7A72]/50 font-mono">you</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={u.role}
                            key={u.role}
                            onChange={e => changeRole(u.id, e.target.value as UserRole)}
                            disabled={changing === u.id}
                            className="h-8 px-2 rounded-lg border text-[12px] bg-white outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 transition disabled:opacity-50"
                            style={{ borderColor: '#E5E0D4' }}
                          >
                            {assignable.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                            {/* Show current role even if not assignable (read-only context) */}
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
          <PagLink page={page - 1} disabled={page <= 1} label="← Previous" q={defaultQ} pathname={pathname} />
          <span className="text-[13px] text-[#6B7A72] font-mono">{page} / {totalPages}</span>
          <PagLink page={page + 1} disabled={page >= totalPages} label="Next →" q={defaultQ} pathname={pathname} />
        </div>
      )}

      <p className="mt-6 text-[12px] text-[#6B7A72]">
        Full user management (suspend, delete, advanced filters) is in Phase 2.
      </p>
    </div>
  );
}

function PagLink({ page, disabled, label, q, pathname }: {
  page: number; disabled: boolean; label: string; q: string; pathname: string;
}) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page));
  if (disabled) {
    return <span className="text-[13px] text-[#6B7A72]/40 font-mono px-3 py-1.5">{label}</span>;
  }
  return (
    <a
      href={`${pathname}?${params.toString()}`}
      className="text-[13px] font-mono text-[#1F4D3A] hover:underline px-3 py-1.5 rounded-lg hover:bg-[#E8EFEB] transition-colors"
    >
      {label}
    </a>
  );
}
