'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, Search, ChevronDown, Shield, Users, Lock, Flag, Pencil, BarChart2, Phone } from 'lucide-react';
import type { Team, TeamMember, TeamInvite } from '@/lib/teams/queries';
import { PageShell, PageHeader } from '@/components/dash';

interface Props {
  userId: string;
  userEmail: string;
  userName: string | null;
  plan: 'free' | 'pro' | 'studio';
  team: Team | null;
  members: TeamMember[];
  invites: TeamInvite[];
}

const FEATURES = [
  { icon: <Users size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Unlimited team seats' },
  { icon: <Lock size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Role-based permissions' },
  { icon: <Flag size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Shared brand kit' },
  { icon: <Pencil size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Collaborative editing' },
  { icon: <BarChart2 size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Team analytics' },
  { icon: <Phone size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Priority support' },
];

function Avatar({ name, email }: { name: string | null; email: string | null }) {
  const initials = ((name ?? email ?? 'U')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase());
  return (
    <div
      className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
      style={{ background: '#1F4D3A' }}
    >
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    owner:         { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E',  border: 'rgba(232,197,126,0.4)' },
    admin:         { bg: 'rgba(31,77,58,0.08)',    color: '#1F4D3A',  border: 'rgba(31,77,58,0.2)' },
    editor:        { bg: 'transparent',            color: '#3A4A42',  border: '#E5E0D4' },
    member:        { bg: 'transparent',            color: '#3A4A42',  border: '#E5E0D4' },
    'check-in':    { bg: 'transparent',            color: '#3A4A42',  border: '#E5E0D4' },
  };
  const s = styles[role] ?? styles.member;
  const label =
    role === 'owner'     ? 'Owner'
    : role === 'admin'   ? 'Admin'
    : role === 'editor'  ? 'Editor'
    : role === 'check-in'? 'Check-in staff'
    : 'Editor';

  return (
    <span
      className="inline-flex items-center text-[13px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {role === 'owner' && <Shield size={9} strokeWidth={2.5} className="mr-1" />}
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: 'active' | 'pending' }) {
  if (status === 'active') {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{ background: '#F0FAF4', color: '#1F4D3A', border: '1px solid #A8D5B5' }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2D7A4F]" />
        Active
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1 rounded-full"
      style={{ background: '#FFF7ED', color: '#C97A2D', border: '1px solid #FBD5A0' }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#C97A2D]" />
      Pending
    </span>
  );
}

function UpsellCard() {
  return (
    <div className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
      <div style={{ height: 3, background: 'linear-gradient(90deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="h-11 w-11 rounded-xl grid place-items-center shrink-0 text-white"
            style={{ background: '#1F4D3A' }}
          >
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-display font-bold text-[17px] text-[#0F1F18]">Team collaboration</h2>
              <span
                className="text-[11.5px] tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(232,197,126,0.18)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.35)' }}
              >
                STUDIO
              </span>
            </div>
            <p className="text-[13px] text-[#6B7A72] leading-relaxed">
              Invite team members to collaborate on events, share designs, and manage your workspace together.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl p-4 mb-6" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
          {FEATURES.map(f => (
            <div key={f.label} className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded-md grid place-items-center shrink-0" style={{ background: 'rgba(31,77,58,0.08)' }}>
                {f.icon}
              </div>
              <span className="text-[12.5px] text-[#3A4A42]">{f.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 h-9 px-5 text-[13px] font-semibold text-white rounded-lg hover:bg-[#163828] transition"
            style={{ background: '#1F4D3A' }}
          >
            Start Studio trial →
          </Link>
          <span className="text-[12px] text-[#6B7A72]">14 days free · $49/mo after</span>
        </div>
      </div>
    </div>
  );
}

function InviteModal({ teamId, onClose, onInvited }: { teamId: string; onClose: () => void; onInvited: (invite: TeamInvite) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to send invite.'); return; }
      onInvited(json as TeamInvite);
      onClose();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lift w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-display font-bold text-[18px] text-[#0F1F18] mb-1">Invite member</h2>
        <p className="text-[13px] text-[#6B7A72] mb-5">They&apos;ll receive a link to join your team.</p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-[12.5px] tracking-widest text-[#6B7A72] uppercase mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="w-full h-10 px-3 rounded-lg border border-border text-[13.5px] focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
              required
            />
          </div>
          <div>
            <label className="block text-[12.5px] tracking-widest text-[#6B7A72] uppercase mb-1.5">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'member')}
              className="w-full h-10 px-3 rounded-lg border border-border text-[13.5px] outline-none transition cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="member">Editor</option>
            </select>
          </div>
          {error && <p className="text-[12px] text-[#B8423C]">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-10 rounded-lg border border-border text-[13.5px] font-medium text-[#3A4A42] hover:bg-cream transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="flex-1 h-10 rounded-xl text-[13.5px] font-semibold text-white bg-primary hover:opacity-95 disabled:opacity-50 transition"
            >
              {loading ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberSettingsModal({
  teamId, member, onClose, onRoleChanged, onRemoved,
}: {
  teamId: string;
  member: TeamMember;
  onClose: () => void;
  onRoleChanged: (userId: string, role: 'admin' | 'member') => void;
  onRemoved: (userId: string) => void;
}) {
  const [role, setRole] = useState<'admin' | 'member'>(member.role === 'admin' ? 'admin' : 'member');
  const [savingRole, setSavingRole] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState('');

  const name = member.profile.full_name ?? member.profile.email ?? 'this member';
  const roleDirty = role !== (member.role === 'admin' ? 'admin' : 'member');

  async function saveRole() {
    setSavingRole(true); setError('');
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Could not update role.'); }
      onRoleChanged(member.user_id, role);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update role.');
    } finally {
      setSavingRole(false);
    }
  }

  async function remove() {
    setRemoving(true); setError('');
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.user_id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? 'Could not remove member.'); }
      onRemoved(member.user_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove member.');
      setRemoving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-lift w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="font-display font-bold text-[18px] text-[#0F1F18] mb-1">Member settings</h2>
        <p className="text-[13px] text-[#6B7A72] mb-5">{name}</p>

        <label className="block text-[12.5px] tracking-widest text-[#6B7A72] uppercase mb-1.5">Role</label>
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'admin' | 'member')}
          className="w-full h-10 px-3 rounded-lg border border-border text-[13.5px] outline-none transition cursor-pointer mb-3"
        >
          <option value="admin">Admin</option>
          <option value="member">Editor</option>
        </select>

        {error && <p className="text-[12px] text-[#B8423C] mb-3">{error}</p>}

        <button
          onClick={saveRole}
          disabled={savingRole || !roleDirty}
          className="w-full h-10 rounded-xl text-[13.5px] font-semibold text-white bg-primary hover:opacity-95 disabled:opacity-50 transition mb-5"
        >
          {savingRole ? 'Saving…' : 'Save role'}
        </button>

        <div className="pt-4 border-t border-border">
          {!confirmRemove ? (
            <button
              onClick={() => setConfirmRemove(true)}
              className="w-full h-10 rounded-lg border text-[13.5px] font-medium transition"
              style={{ borderColor: 'rgba(184,66,60,0.4)', color: '#B8423C' }}
            >
              Remove from team
            </button>
          ) : (
            <div>
              <p className="text-[13px] text-[#3A4A42] mb-3">Remove <strong>{name}</strong> from the team? They&apos;ll lose access to all shared events.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmRemove(false)} className="flex-1 h-10 rounded-lg border border-border text-[13.5px] font-medium text-[#3A4A42] hover:bg-cream transition">
                  Cancel
                </button>
                <button
                  onClick={remove}
                  disabled={removing}
                  className="flex-1 h-10 rounded-xl text-[13.5px] font-semibold text-white disabled:opacity-50 transition"
                  style={{ background: '#B8423C' }}
                >
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="mt-4 w-full text-[13px] text-[#6B7A72] hover:text-[#0F1F18] transition">
          Close
        </button>
      </div>
    </div>
  );
}

export function TeamClient({
  userId,
  plan,
  team: initialTeam,
  members: initialMembers,
  invites: initialInvites,
}: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All roles');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [managingMember, setManagingMember] = useState<TeamMember | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const isOwner = initialTeam ? initialTeam.owner_id === userId : false;
  const totalCount = members.length;
  const pendingCount = invites.length;

  const ROLE_FILTERS = ['All roles', 'Owner', 'Admin', 'Editor'] as const;
  const memberDisplayRole = (m: TeamMember) =>
    m.user_id === (initialTeam?.owner_id ?? '') ? 'Owner' : m.role === 'admin' ? 'Admin' : 'Editor';

  // Filter members by search + role
  const filteredMembers = members.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch =
      (m.profile.full_name ?? '').toLowerCase().includes(q) ||
      (m.profile.email ?? '').toLowerCase().includes(q);
    if (!matchesSearch) return false;
    return roleFilter === 'All roles' || memberDisplayRole(m) === roleFilter;
  });

  if (plan !== 'studio') {
    return (
      <PageShell width="wide">
        <PageHeader
          title="Team"
          subtitle="Manage collaborators and workspace access."
          actions={
            <a
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-[13.5px] font-semibold text-white shrink-0 transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}
            >
              + Invite member
            </a>
          }
        />
        <UpsellCard />
      </PageShell>
    );
  }

  return (
    <PageShell width="wide">
      {showInviteModal && initialTeam && (
        <InviteModal
          teamId={initialTeam.id}
          onClose={() => setShowInviteModal(false)}
          onInvited={invite => {
            setInvites(prev => [invite, ...prev]);
            setShowInviteModal(false);
          }}
        />
      )}

      {managingMember && initialTeam && (
        <MemberSettingsModal
          teamId={initialTeam.id}
          member={managingMember}
          onClose={() => setManagingMember(null)}
          onRoleChanged={(userId, role) => {
            setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m));
          }}
          onRemoved={userId => {
            setMembers(prev => prev.filter(m => m.user_id !== userId));
            setManagingMember(null);
          }}
        />
      )}

      {/* Header */}
      <PageHeader
        title="Team"
        subtitle={
          <>
            {totalCount} member{totalCount !== 1 ? 's' : ''}
            {pendingCount > 0 && ` · ${pendingCount} pending invite${pendingCount !== 1 ? 's' : ''}`}
          </>
        }
        actions={
          isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-5 rounded-lg text-[13.5px] font-semibold text-white bg-primary hover:opacity-95 transition shrink-0"
            >
              + Invite member
            </button>
          )
        }
      />

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7A72]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-white text-[13px] text-[#0F1F18] placeholder:text-[#6B7A72]/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(o => !o)}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-white text-[13px] text-[#3A4A42] hover:bg-cream transition"
          >
            {roleFilter}
            <ChevronDown size={13} strokeWidth={2} />
          </button>
          {roleMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setRoleMenuOpen(false)} />
              <div className="absolute right-0 mt-1 z-20 w-40 rounded-lg border border-border bg-white shadow-lift p-1">
                {ROLE_FILTERS.map(r => (
                  <button
                    key={r}
                    onClick={() => { setRoleFilter(r); setRoleMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-cream transition"
                    style={{ color: roleFilter === r ? '#1F4D3A' : '#3A4A42', fontWeight: roleFilter === r ? 600 : 400 }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Members table */}
      <div className="overflow-x-auto rounded-2xl border border-border shadow-soft">
      <div className="bg-white" style={{ minWidth: 520 }}>
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 border-b border-border"
          style={{ gridTemplateColumns: '1fr 110px 120px 100px 36px' }}
        >
          {['MEMBER', 'ROLE', 'EVENT ACCESS', 'STATUS', ''].map(col => (
            <div key={col} className="text-[12px] tracking-widest text-[#6B7A72]">
              {col}
            </div>
          ))}
        </div>

        {/* Active members */}
        {filteredMembers.map(m => {
          const isMe = m.user_id === userId;
          const isTeamOwner = m.user_id === (initialTeam?.owner_id ?? '');
          const displayRole = isTeamOwner ? 'owner' : m.role === 'admin' ? 'admin' : 'editor';

          return (
            <div
              key={m.user_id}
              className="grid items-center px-5 py-3.5 border-b border-border last:border-0 hover:bg-cream/30 transition-colors"
              style={{ gridTemplateColumns: '1fr 110px 120px 100px 36px' }}
            >
              {/* Member */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={m.profile.full_name} email={m.profile.email} />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">
                    {m.profile.full_name ?? m.profile.email}
                    {isMe && <span className="ml-1.5 text-[12.5px] text-[#6B7A72] font-normal">(you)</span>}
                  </div>
                  {m.profile.full_name && (
                    <div className="text-[12px] text-[#6B7A72] truncate">{m.profile.email}</div>
                  )}
                </div>
              </div>

              {/* Role */}
              <div><RoleBadge role={displayRole} /></div>

              {/* Event access */}
              <div className="text-[13px] text-[#3A4A42]">
                {isTeamOwner || displayRole === 'admin' ? 'All events' : '—'}
              </div>

              {/* Status */}
              <div><StatusBadge status="active" /></div>

              {/* Settings gear */}
              <div className="flex justify-center">
                {isOwner && !isTeamOwner && (
                  <button
                    className="h-7 w-7 rounded-lg grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] hover:text-[#0F1F18] transition"
                    title="Member settings"
                    onClick={() => setManagingMember(m)}
                  >
                    <Settings size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Pending invites */}
        {invites.map(inv => (
          <div
            key={inv.id}
            className="grid items-center px-5 py-3.5 border-b border-border last:border-0 hover:bg-cream/30 transition-colors"
            style={{ gridTemplateColumns: '1fr 110px 120px 100px 36px' }}
          >
            {/* Member (pending) */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-9 w-9 rounded-full grid place-items-center shrink-0"
                style={{ background: '#FAF6EE', border: '1px dashed #C9C3B1' }}
              >
                <span className="text-[14px] text-[#6B7A72]">?</span>
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">{inv.email}</div>
                <div className="text-[12px] text-[#6B7A72]">Pending invite</div>
              </div>
            </div>

            {/* Role */}
            <div><RoleBadge role={inv.role === 'admin' ? 'admin' : 'editor'} /></div>

            {/* Event access */}
            <div className="text-[13px] text-[#6B7A72]">1 event</div>

            {/* Status */}
            <div><StatusBadge status="pending" /></div>

            {/* Settings gear */}
            <div className="flex justify-center">
              <button
                className="h-7 w-7 rounded-lg grid place-items-center text-[#6B7A72] hover:bg-[#E8EFEB] transition"
                title="Revoke invite"
                onClick={async () => {
                  if (!initialTeam) return;
                  await fetch(`/api/teams/${initialTeam.id}/invites/${inv.id}`, { method: 'DELETE' });
                  setInvites(prev => prev.filter(i => i.id !== inv.id));
                }}
              >
                <Settings size={14} strokeWidth={1.8} />
              </button>
            </div>
          </div>
        ))}

        {filteredMembers.length === 0 && invites.length === 0 && (
          <div className="px-5 py-10 text-center text-[13px] text-[#6B7A72]">
            No members found.
          </div>
        )}
      </div>
      </div>

      {/* Roles info banner */}
      <div
        className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-[12.5px] text-[#3A4A42]"
        style={{ background: '#F5F2EC', border: '1px solid #E5E0D4' }}
      >
        <Shield size={14} strokeWidth={1.8} className="shrink-0 mt-0.5 text-[#6B7A72]" />
        <span>
          <strong>Roles control access.</strong>{' '}
          Owners and Admins manage everything; Editors manage assigned events; Check-in staff can only scan attendees at the door.
        </span>
      </div>
    </PageShell>
  );
}
