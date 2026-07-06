'use client';

import { useState, useTransition } from 'react';

interface Member {
  id: string;
  invited_email: string;
  role: string | null;
  status: string;
  user_id: string | null;
  /** SPO07 · who can scan leads. May be absent until migration 059 is applied. */
  scan_access?: boolean | null;
  profiles?: { full_name: string; email: string } | null;
}

interface Props {
  members: Member[];
  token: string;
}

const GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
];

function Avatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span
      className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0 text-[13px]"
      style={{ width: 38, height: 38, background: GRADS[idx % GRADS.length] }}
    >
      {initials}
    </span>
  );
}

function statusPill(status: string) {
  if (status === 'active') return null;
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ background: 'rgba(201,164,94,0.15)', color: '#C9A45E', borderColor: 'rgba(201,164,94,0.35)' }}>
      Invited
    </span>
  );
}

export function TeamTab({ members: initial, token }: Props) {
  const [members, setMembers] = useState(initial);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail]           = useState('');
  const [role, setRole]             = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRemove(id: string) {
    if (!confirm('Remove this team member?')) return;
    setRemovingId(id);
    startTransition(async () => {
      await fetch(`/api/exhibitor/team?id=${id}&token=${token}`, { method: 'DELETE' });
      setMembers(prev => prev.filter(m => m.id !== id));
      setRemovingId(null);
    });
  }

  function toggleScan(m: Member) {
    const next = !(m.scan_access ?? true);
    // Optimistic: flip immediately, revert if the API rejects (e.g. column not yet migrated).
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, scan_access: next } : x));
    fetch('/api/exhibitor/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, id: m.id, scan_access: next }),
    })
      .then(res => {
        if (!res.ok) {
          setMembers(prev => prev.map(x => x.id === m.id ? { ...x, scan_access: m.scan_access ?? true } : x));
        }
      })
      .catch(() => {
        setMembers(prev => prev.map(x => x.id === m.id ? { ...x, scan_access: m.scan_access ?? true } : x));
      });
  }

  function handleInvite() {
    if (!email) return;
    startTransition(async () => {
      const res = await fetch('/api/exhibitor/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, role }),
      });
      const data = await res.json();
      if (data.member) {
        setMembers(prev => [...prev, data.member]);
        setEmail(''); setRole(''); setShowInvite(false);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>Booth team</div>
        <button
          onClick={() => setShowInvite(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors border"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
        >
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Invite
        </button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div className="px-5 py-4 border-b grid gap-3" style={{ borderColor: 'rgba(229,224,212,0.7)', background: 'rgba(250,246,238,0.5)' }}>
          <input
            type="email" placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
          />
          <input
            type="text" placeholder="Role (e.g. Sales)" value={role} onChange={e => setRole(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
          />
          <div className="flex gap-2">
            <button
              onClick={handleInvite} disabled={isPending || !email}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-medium text-white"
              style={{ background: '#1F4D3A', opacity: !email ? 0.6 : 1 }}
            >
              {isPending ? 'Sending…' : 'Send invite'}
            </button>
            <button onClick={() => setShowInvite(false)} className="px-4 py-2 rounded-xl text-[13.5px] border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {members.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13.5px]" style={{ color: '#6B7A72' }}>
          No team members yet. Invite a colleague to manage the booth together.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
          {members.map((m, i) => {
            const displayName = m.profiles?.full_name ?? m.invited_email;
            const displayRole = m.role ?? '—';
            return (
              <div key={m.id} className="group flex items-center gap-3.5 px-5 py-3.5">
                <Avatar name={displayName} idx={i} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{displayName}</div>
                  <div className=" text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{displayRole}</div>
                </div>
                {/* SPO07 · scan-access toggle — who may scan attendee QR codes for leads */}
                {(() => {
                  const on = m.scan_access ?? true;
                  return (
                    <button
                      type="button"
                      onClick={() => toggleScan(m)}
                      className="inline-flex items-center gap-2 shrink-0"
                      title={on ? 'Can scan leads' : 'Cannot scan leads'}
                      aria-pressed={on}
                    >
                      <span className="hidden sm:inline text-[11px] font-medium" style={{ color: on ? '#1F4D3A' : '#9BA8A1' }}>
                        Scan
                      </span>
                      <span
                        className="relative inline-flex h-5 w-9 rounded-full transition-colors"
                        style={{ background: on ? '#1F4D3A' : '#E5E0D4' }}
                      >
                        <span
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                          style={{ left: 2, transform: on ? 'translateX(16px)' : 'translateX(0)' }}
                        />
                      </span>
                    </button>
                  );
                })()}
                {statusPill(m.status)}
                {/* "You" pill — first active member */}
                {i === 0 && m.status === 'active' && (
                  <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ background: '#E8EFEB', color: '#1F4D3A', borderColor: 'rgba(31,77,58,0.2)' }}>
                    You
                  </span>
                )}
                <button
                  onClick={() => handleRemove(m.id)}
                  disabled={removingId === m.id}
                  className="w-8 h-8 grid place-items-center rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                  style={{ color: '#B8423C' }}
                  title="Remove member"
                >
                  <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
