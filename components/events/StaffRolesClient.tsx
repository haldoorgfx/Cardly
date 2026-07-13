'use client';

import { useState } from 'react';
import { X, UserPlus, Send, Trash2, Crown, Check } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Staff = any;

interface Props {
  eventId: string;
  eventName: string;
  initialStaff: Staff[];
  ownerEmail: string;
}

const ROLES = [
  { id: 'check_in', label: 'Check-in only',   desc: 'Door staff — scanner + walk-ins',         can: 'Scan QR codes, add walk-ins',                   cant: 'No revenue, exports or attendee emails' },
  { id: 'moderator', label: 'Moderator',       desc: 'Q&A, threads, photo wall',                 can: 'Moderate Q&A, polls, photo wall, live display', cant: 'No registrations, money or settings' },
  { id: 'finance',   label: 'Finance',         desc: 'Orders, refunds, payouts',                 can: 'View orders, issue refunds, see payout data',   cant: 'No content, check-in or attendee messaging' },
  { id: 'manager',   label: 'Event manager',   desc: 'Everything in this event',                 can: 'All event tools except org settings',           cant: 'No org settings, billing or other events' },
];

const EXPIRES_OPTIONS = [
  { id: '24h_after', label: '24h after event ends' },
  { id: 'on_end',    label: 'Immediately after event' },
  { id: 'never',     label: 'Never (until removed)' },
];

function roleLabel(role: string) {
  return ROLES.find(r => r.id === role)?.label ?? role;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function StaffRolesClient({ eventId, eventName, initialStaff, ownerEmail }: Props) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Invite form state
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('check_in');
  const [invExpires, setInvExpires] = useState('24h_after');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function invite() {
    if (!invEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    const res = await fetch(`/api/events/${eventId}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invEmail.trim(), role: invRole, expires: invExpires }),
    });
    if (res.ok) {
      const newMember = await res.json();
      setStaff(prev => [...prev, newMember]);
      setInvEmail('');
      setInvRole('check_in');
      setInvExpires('24h_after');
      setShowModal(false);
    } else {
      const data = await res.json() as { error?: string };
      setInviteError(data.error ?? 'Invite failed. Please try again.');
    }
    setInviting(false);
  }

  async function doAction(staffId: string, action: string, role?: string) {
    setBusy(staffId + action);
    const res = await fetch(`/api/events/${eventId}/staff`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffId, action, role }),
    });
    if (res.ok) {
      if (action === 'remove') {
        setStaff(prev => prev.filter(s => s.id !== staffId));
      } else if (action === 'update_role') {
        const updated = await res.json();
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, ...updated } : s));
      } else if (action === 'resend') {
        setStaff(prev => prev.map(s => s.id === staffId ? { ...s, invited_at: new Date().toISOString() } : s));
      }
    }
    setBusy(null);
  }

  return (
    <>
      <div className="max-w-[860px] mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.16em] uppercase mb-2 font-medium" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
              Configure
            </p>
            <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Event staff
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              Invite team members to help run <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span>. Scoped to this event only.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}
          >
            <UserPlus size={14} />
            Invite staff
          </button>
        </div>

        {/* Staff list */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
          {/* Owner row */}
          <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid #F0EDE6' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              {(ownerEmail[0] ?? 'O').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>You</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>{ownerEmail} · Owner · full access, all events</div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: '#163828', color: '#E8C57E', fontFamily: 'Inter, system-ui, sans-serif' }}>
              <Crown size={10} /> ORG ADMIN
            </span>
          </div>

          {staff.length === 0 ? (
            <div className="py-14 flex flex-col items-center" style={{ color: '#6B7A72' }}>
              <UserPlus size={28} style={{ color: '#C9C3B1' }} className="mb-3" />
              <p className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>No staff invited yet</p>
              <p className="text-[13px] mt-1">Invite team members to help you run this event.</p>
            </div>
          ) : (
            staff.map((s, i) => {
              const isPending = s.status === 'pending';
              const isBusy = busy?.startsWith(s.id);
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: i < staff.length - 1 ? '1px solid #F0EDE6' : undefined, opacity: isPending ? 0.75 : 1 }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {(s.email[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>
                      {isPending ? s.email : s.email}
                    </div>
                    <div className="text-[12px]" style={{ color: '#6B7A72' }}>
                      {isPending ? `Invite pending · sent ${relativeTime(s.invited_at)}` : `This event only`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {roleLabel(s.role)} · pending
                        </span>
                        <button
                          onClick={() => doAction(s.id, 'resend')}
                          disabled={!!isBusy}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-80 disabled:opacity-40"
                          style={{ background: '#F0EDE6', color: '#3A4A42' }}
                        >
                          <Send size={11} /> Resend
                        </button>
                      </>
                    ) : (
                      <select
                        value={s.role}
                        onChange={e => doAction(s.id, 'update_role', e.target.value)}
                        disabled={!!isBusy}
                        className="text-[12px] px-2 py-1.5 rounded-lg border outline-none"
                        style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#FAFAF8' }}
                      >
                        {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                      </select>
                    )}
                    <button
                      onClick={() => doAction(s.id, 'remove')}
                      disabled={!!isBusy}
                      className="p-1.5 rounded-lg transition hover:opacity-70 disabled:opacity-40"
                      style={{ color: '#B8423C' }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Role definitions grid */}
        <h2 className="text-[13px] font-semibold mb-4" style={{ color: '#6B7A72', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Inter, system-ui, sans-serif' }}>
          What each role can do
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ROLES.map(r => (
            <div key={r.id} className="rounded-xl p-4" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
              <div className="font-semibold text-[14px] mb-2" style={{ color: '#0F1F18' }}>{r.label}</div>
              <p className="text-[12px] mb-1 flex items-center gap-1.5" style={{ color: '#2D7A4F' }}><Check size={14} strokeWidth={1.8} className="shrink-0" /> {r.can}</p>
              <p className="text-[12px] flex items-center gap-1.5" style={{ color: '#B8423C' }}><X size={14} strokeWidth={1.8} className="shrink-0" /> {r.cant}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,31,24,0.45)' }} onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-[18px]" style={{ color: '#0F1F18' }}>Invite staff to this event</h3>
                <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Scoped to {eventName} only — they never see your other events.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: '#6B7A72' }}>
                <X size={18} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Email or phone</label>
              <input
                value={invEmail}
                onChange={e => setInvEmail(e.target.value)}
                placeholder="name@email.com or +253 …"
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] outline-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                onKeyDown={e => e.key === 'Enter' && invite()}
              />
            </div>

            <div className="mb-4">
              <label className="block text-[12px] font-medium mb-2" style={{ color: '#3A4A42' }}>Role</label>
              <div className="space-y-2">
                {ROLES.map(r => (
                  <label key={r.id} className="flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition"
                    style={{ borderColor: invRole === r.id ? '#1F4D3A' : '#E5E0D4', background: invRole === r.id ? '#E8EFEB' : '#FFFFFF' }}>
                    <input type="radio" name="inv_role" value={r.id} checked={invRole === r.id} onChange={() => setInvRole(r.id)} className="mt-0.5" />
                    <div>
                      <div className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>{r.label}</div>
                      <div className="text-[12px]" style={{ color: '#6B7A72' }}>{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Access expires</label>
              <select
                value={invExpires}
                onChange={e => setInvExpires(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-[14px] outline-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              >
                {EXPIRES_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>

            {inviteError && (
              <div className="mb-4 px-3 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                {inviteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition hover:opacity-80"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                Cancel
              </button>
              <button
                onClick={invite}
                disabled={inviting || !invEmail.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
