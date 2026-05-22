'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Copy, Check, Trash2, Crown,
  Shield, User, Clock, Mail, ChevronDown,
  Lock, Flag, Pencil, BarChart2, Phone,
} from 'lucide-react';
import type { Team, TeamMember, TeamInvite } from '@/lib/teams/queries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  userEmail: string;
  userName: string | null;
  plan: 'free' | 'pro' | 'studio';
  team: Team | null;
  members: TeamMember[];
  invites: TeamInvite[];
}

// ─── Upsell features list ─────────────────────────────────────────────────────

const FEATURES: { icon: React.ReactNode; label: string }[] = [
  { icon: <Users size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Unlimited team seats' },
  { icon: <Lock size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Role-based permissions' },
  { icon: <Flag size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Shared brand kit' },
  { icon: <Pencil size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Collaborative editing' },
  { icon: <BarChart2 size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Team analytics' },
  { icon: <Phone size={11} strokeWidth={2} color="#1F4D3A" />, label: 'Priority support' },
];

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === 'owner') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(232,197,126,0.18)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.35)' }}
      >
        <Crown size={9} strokeWidth={2.5} /> Owner
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2.5 py-1 rounded-full"
        style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}
      >
        <Shield size={9} strokeWidth={2.5} /> Admin
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2.5 py-1 rounded-full"
      style={{ background: '#F5F5F0', color: '#6B7A72', border: '1px solid #E5E0D4' }}
    >
      <User size={9} strokeWidth={2.5} /> Member
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, email }: { name: string | null; email: string | null }) {
  const letter = (name ?? email ?? 'U')[0].toUpperCase();
  return (
    <div
      className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
    >
      {letter}
    </div>
  );
}

// ─── Copy-to-clipboard button ─────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      title="Copy invite link"
      className="h-7 w-7 rounded-md grid place-items-center transition-colors hover:bg-[#E8EFEB]"
      style={{ color: copied ? '#1F4D3A' : '#6B7A72' }}
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
    </button>
  );
}

// ─── Non-studio upsell ────────────────────────────────────────────────────────

function UpsellCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      <div style={{ height: 3, background: 'linear-gradient(90deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="h-11 w-11 rounded-xl grid place-items-center shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}
          >
            <Users size={20} strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="font-display font-bold text-[17px] text-[#0F1F18]">Team collaboration</h2>
              <span
                className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full"
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
        <div
          className="grid grid-cols-2 gap-3 rounded-xl p-4 mb-6"
          style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
        >
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
            className="inline-flex items-center gap-2 h-9 px-5 text-[13px] font-semibold text-white rounded-lg hover:opacity-90 transition"
            style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
          >
            Start Studio trial →
          </Link>
          <span className="text-[12px] text-[#6B7A72]">14 days free · $49/mo after · cancel anytime</span>
        </div>
      </div>
    </div>
  );
}

// ─── Create team form ─────────────────────────────────────────────────────────

function CreateTeamForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to create team.'); return; }
      window.location.reload();
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      <div className="p-6">
        <h2 className="font-display font-bold text-[17px] text-[#0F1F18] mb-1">Create your team</h2>
        <p className="text-[13px] text-[#6B7A72] mb-5">Give your workspace a name to get started.</p>
        <form onSubmit={submit} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Acme Events"
            maxLength={80}
            className="flex-1 h-9 px-3 text-[13.5px] rounded-lg border outline-none transition focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="h-9 px-5 text-[13px] font-semibold rounded-lg text-white transition disabled:opacity-50"
            style={{ background: '#1F4D3A' }}
          >
            {loading ? 'Creating…' : 'Create team'}
          </button>
        </form>
        {error && <p className="mt-2 text-[12px] text-[#B8423C]">{error}</p>}
      </div>
    </div>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  isCurrentUser,
  isOwner,
  teamId,
  ownerId,
  onUpdate,
}: {
  member: TeamMember;
  isCurrentUser: boolean;
  isOwner: boolean;
  teamId: string;
  ownerId: string;
  onUpdate: () => void;
}) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const canChangeRole = isOwner && member.user_id !== ownerId;
  const canRemove = isOwner || isCurrentUser;

  async function changeRole(role: 'admin' | 'member') {
    setRoleOpen(false);
    setBusy(true);
    await fetch(`/api/teams/${teamId}/members/${member.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    onUpdate();
    setBusy(false);
  }

  async function remove() {
    if (!confirm(isCurrentUser ? 'Leave this team?' : `Remove ${member.profile.email} from the team?`)) return;
    setBusy(true);
    await fetch(`/api/teams/${teamId}/members/${member.user_id}`, { method: 'DELETE' });
    onUpdate();
    setBusy(false);
  }

  const isTeamOwner = member.user_id === ownerId;

  return (
    <div className="flex items-center gap-3 px-6 py-3.5 border-b last:border-b-0" style={{ borderColor: '#E5E0D4', opacity: busy ? 0.5 : 1 }}>
      <Avatar name={member.profile.full_name} email={member.profile.email} />
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">
          {member.profile.full_name ?? member.profile.email}
          {isCurrentUser && <span className="ml-1.5 text-[11px] text-[#6B7A72]">(you)</span>}
        </div>
        {member.profile.full_name && (
          <div className="text-[12px] text-[#6B7A72] truncate">{member.profile.email}</div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Role badge / dropdown */}
        {canChangeRole ? (
          <div className="relative">
            <button
              onClick={() => setRoleOpen(o => !o)}
              className="inline-flex items-center gap-1 text-[10.5px] font-mono px-2.5 py-1 rounded-full transition hover:opacity-80"
              style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.15)' }}
            >
              {member.role === 'admin' ? <Shield size={9} strokeWidth={2.5} /> : <User size={9} strokeWidth={2.5} />}
              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              <ChevronDown size={9} strokeWidth={2.5} />
            </button>
            {roleOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-32 rounded-xl overflow-hidden z-10"
                style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.1)' }}
              >
                {(['admin', 'member'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => changeRole(r)}
                    className="w-full text-left px-3 py-2.5 text-[12.5px] hover:bg-[#FAF6EE] transition"
                    style={{ color: r === member.role ? '#1F4D3A' : '#3A4A42' }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                    {r === member.role && ' ✓'}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <RoleBadge role={isTeamOwner ? 'owner' : member.role} />
        )}

        {/* Remove button */}
        {canRemove && !isTeamOwner && (
          <button
            onClick={remove}
            title={isCurrentUser ? 'Leave team' : 'Remove member'}
            className="h-7 w-7 rounded-md grid place-items-center transition-colors hover:bg-red-50"
            style={{ color: '#B8423C' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Invite form ──────────────────────────────────────────────────────────────

function InviteForm({ teamId, onInvited }: { teamId: string; onInvited: (invite: TeamInvite) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to send invite.'); return; }
      setEmail('');
      onInvited(json as TeamInvite);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="colleague@email.com"
        className="flex-1 h-9 px-3 text-[13px] rounded-lg border outline-none transition focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
        style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
      />
      <select
        value={role}
        onChange={e => setRole(e.target.value as 'admin' | 'member')}
        className="h-9 px-2 text-[12.5px] rounded-lg border outline-none transition focus:border-[#1F4D3A] cursor-pointer"
        style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={loading || !email.trim()}
        className="h-9 px-4 text-[13px] font-semibold rounded-lg text-white transition disabled:opacity-50"
        style={{ background: '#1F4D3A' }}
      >
        {loading ? 'Sending…' : 'Invite'}
      </button>
      {error && <p className="mt-1 text-[12px] text-[#B8423C]">{error}</p>}
    </form>
  );
}

// ─── Invite row ───────────────────────────────────────────────────────────────

function InviteRow({ invite, baseUrl, teamId, onRevoked }: { invite: TeamInvite; baseUrl: string; teamId: string; onRevoked: (id: string) => void }) {
  const link = `${baseUrl}/team/invite/${invite.token}`;
  const [revoking, setRevoking] = useState(false);

  async function revoke() {
    if (!confirm(`Revoke invite for ${invite.email}?`)) return;
    setRevoking(true);
    await fetch(`/api/teams/${teamId}/invites/${invite.id}`, { method: 'DELETE' });
    onRevoked(invite.id);
    setRevoking(false);
  }

  return (
    <div className="flex items-center gap-3 px-6 py-3.5 border-b last:border-b-0" style={{ borderColor: '#E5E0D4', opacity: revoking ? 0.5 : 1 }}>
      <div
        className="h-9 w-9 rounded-full grid place-items-center shrink-0"
        style={{ background: '#FAF6EE', border: '1px dashed #C9C3B1' }}
      >
        <Mail size={14} strokeWidth={1.8} color="#6B7A72" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">{invite.email}</div>
        <div className="text-[11.5px] text-[#6B7A72] flex items-center gap-1">
          <Clock size={10} strokeWidth={2} />
          Pending invite · expires {new Date(invite.expires_at).toLocaleDateString()}
        </div>
      </div>
      <RoleBadge role={invite.role} />
      <CopyButton text={link} />
      <button
        onClick={revoke}
        title="Revoke invite"
        className="h-7 w-7 rounded-md grid place-items-center transition-colors hover:bg-red-50"
        style={{ color: '#B8423C' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeamClient({
  userId,
  plan,
  team: initialTeam,
  members: initialMembers,
  invites: initialInvites,
}: Props) {
  const [team] = useState(initialTeam);
  const [members] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);

  function reload() { window.location.reload(); }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const isOwner = team ? team.owner_id === userId : false;

  return (
    <div className="min-h-full flex flex-col" style={{ background: '#FAF6EE' }}>
      {/* Page header */}
      <div
        className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0"
        style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-50%', right: '-5%', width: 260, height: 260, background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span><span>/</span><span className="text-[#6B7A72]">Team</span>
          </div>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">
                {team ? team.name : 'Team'}
              </h1>
              <p className="text-[13px] text-[#6B7A72] mt-1">
                {team
                  ? `${members.length} member${members.length !== 1 ? 's' : ''} · ${invites.length} pending invite${invites.length !== 1 ? 's' : ''}`
                  : 'Manage collaborators and workspace access.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <div className="max-w-2xl flex flex-col gap-5">

          {/* Non-studio: upsell */}
          {plan !== 'studio' && <UpsellCard />}

          {/* Studio, no team: create form */}
          {plan === 'studio' && !team && <CreateTeamForm />}

          {/* Studio, has team: full management */}
          {plan === 'studio' && team && (
            <>
              {/* Members card */}
              <div
                className="rounded-2xl"
                style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
              >
                <div
                  className="flex items-center justify-between px-6 py-4 border-b"
                  style={{ borderColor: '#E5E0D4' }}
                >
                  <div>
                    <div className="text-[10.5px] font-mono tracking-widest text-[#6B7A72]/60 uppercase mb-0.5">Members</div>
                    <div className="text-[13.5px] font-semibold text-[#0F1F18]">{members.length} member{members.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>

                {members.length === 0 && (
                  <div className="mx-6 my-6 rounded-xl border border-dashed flex flex-col items-center py-8 gap-2"
                    style={{ borderColor: 'rgba(31,77,58,0.2)', background: 'rgba(31,77,58,0.02)' }}>
                    <Users size={20} strokeWidth={1.6} color="#1F4D3A" style={{ opacity: 0.45 }} />
                    <div className="text-[13px] text-[#6B7A72]">No members yet.</div>
                  </div>
                )}

                {members.map(m => (
                  <MemberRow
                    key={m.user_id}
                    member={m}
                    isCurrentUser={m.user_id === userId}
                    isOwner={isOwner}
                    teamId={team.id}
                    ownerId={team.owner_id}
                    onUpdate={reload}
                  />
                ))}
              </div>

              {/* Invite form card */}
              {isOwner && (
                <div
                  className="rounded-2xl"
                  style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
                >
                  <div className="px-6 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
                    <div className="text-[10.5px] font-mono tracking-widest text-[#6B7A72]/60 uppercase mb-0.5">Invite member</div>
                    <div className="text-[13px] text-[#6B7A72]">They&apos;ll receive a link to join your team.</div>
                  </div>
                  <div className="px-6 py-4">
                    <InviteForm
                      teamId={team.id}
                      onInvited={invite => setInvites(prev => [invite, ...prev])}
                    />
                  </div>

                  {/* Pending invites */}
                  {invites.length > 0 && (
                    <>
                      <div className="px-6 pt-2 pb-2 border-t" style={{ borderColor: '#E5E0D4' }}>
                        <div className="text-[10.5px] font-mono tracking-widest text-[#6B7A72]/60 uppercase">Pending invites</div>
                      </div>
                      {invites.map(inv => (
                        <InviteRow
                          key={inv.id}
                          invite={inv}
                          baseUrl={baseUrl}
                          teamId={team.id}
                          onRevoked={id => setInvites(prev => prev.filter(i => i.id !== id))}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* Danger zone */}
              {isOwner && (
                <div
                  className="rounded-2xl"
                  style={{ background: 'white', border: '1px solid rgba(184,66,60,0.2)' }}
                >
                  <div className="px-6 py-4">
                    <div className="text-[13.5px] font-semibold text-[#0F1F18] mb-0.5">Delete team</div>
                    <p className="text-[12.5px] text-[#6B7A72] mb-4">
                      This will remove all members and cannot be undone.
                    </p>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${team.name}"? This cannot be undone.`)) return;
                        await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
                        window.location.reload();
                      }}
                      className="h-8 px-4 text-[12.5px] font-semibold rounded-lg border transition hover:bg-red-50"
                      style={{ borderColor: 'rgba(184,66,60,0.35)', color: '#B8423C' }}
                    >
                      Delete team
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer note */}
          <div className="flex items-center gap-2 text-[12px] text-[#6B7A72]/60 px-1">
            <Clock size={12} strokeWidth={2} />
            Team roles, audit log, and SSO are coming in a future release.
          </div>

        </div>
      </div>
    </div>
  );
}
