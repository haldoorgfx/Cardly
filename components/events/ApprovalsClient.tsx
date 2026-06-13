'use client';

import { useState } from 'react';
import { Check, X, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reg = any;

interface Props {
  eventId: string;
  eventName: string;
  initialRegs: Reg[];
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
    d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  pending_approval: { label: 'Pending',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  confirmed:        { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  rejected:         { label: 'Rejected', cls: 'bg-red-50 text-red-600 border border-red-200' },
};

export function ApprovalsClient({ eventId, eventName, initialRegs }: Props) {
  const [regs, setRegs] = useState<Reg[]>(initialRegs);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'confirmed' | 'rejected'>('all');

  const pending   = regs.filter(r => r.status === 'pending_approval').length;
  const approved  = regs.filter(r => r.status === 'confirmed').length;
  const rejected  = regs.filter(r => r.status === 'rejected').length;

  const visible = filter === 'all' ? regs : regs.filter(r => r.status === filter);

  async function act(regId: string, action: 'approve' | 'reject') {
    setBusy(regId);
    setActionError(null);
    const res = await fetch(`/api/events/${eventId}/approvals`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: regId, action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRegs(prev => prev.map(r => r.id === regId ? { ...r, status: updated.status } : r));
    } else {
      const data = await res.json() as { error?: string };
      setActionError(data.error ?? 'Action failed. Please try again.');
    }
    setBusy(null);
  }

  return (
    <div className="max-w-[860px] mx-auto px-5 py-10">
      {actionError && (
        <div className="mb-5 px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
          {actionError}
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.16em] uppercase mb-2 font-medium" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
          Manage
        </p>
        <h1 className="font-display font-semibold text-[26px] tracking-tight mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Approvals
        </h1>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>
          Review and approve attendee applications for <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span>.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Pending',  value: pending,  icon: <Clock size={16} style={{ color: '#C9A45E' }} /> },
          { label: 'Approved', value: approved, icon: <CheckCircle2 size={16} style={{ color: '#2D7A4F' }} /> },
          { label: 'Rejected', value: rejected, icon: <XCircle size={16} style={{ color: '#B8423C' }} /> },
        ].map(s => (
          <div key={s.label} className="rounded-xl px-4 py-4 flex items-center gap-3" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            {s.icon}
            <div>
              <div className="font-semibold text-[20px] font-display" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {(['all', 'pending_approval', 'confirmed', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
            style={{
              background: filter === f ? '#1F4D3A' : '#FFFFFF',
              color: filter === f ? '#FAF6EE' : '#3A4A42',
              borderColor: filter === f ? '#1F4D3A' : '#E5E0D4',
            }}>
            {f === 'all' ? 'All' : f === 'pending_approval' ? 'Pending' : f === 'confirmed' ? 'Approved' : 'Rejected'}
          </button>
        ))}
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-2xl flex flex-col items-center justify-center py-20" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <Users size={32} style={{ color: '#C9C3B1' }} className="mb-3" />
          <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>No applications yet</p>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Applications appear here when attendees apply to attend.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(r => {
            const pill = STATUS_PILL[r.status] ?? STATUS_PILL.pending_approval;
            const isPending = r.status === 'pending_approval';
            const isBusy = busy === r.id;

            return (
              <div key={r.id} className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <div className="flex items-start justify-between gap-4">
                  {/* Left: avatar + info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      {(r.attendee_name ?? 'A').slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{r.attendee_name ?? 'Unknown'}</div>
                      <div className="text-[12px] truncate" style={{ color: '#6B7A72' }}>{r.attendee_email}</div>
                      {r.ticket_types?.name && (
                        <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                          {r.ticket_types.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pill.cls}`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {pill.label}
                    </span>
                    {isPending && (
                      <>
                        <button
                          onClick={() => act(r.id, 'approve')}
                          disabled={isBusy}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                        >
                          <Check size={12} /> Approve
                        </button>
                        <button
                          onClick={() => act(r.id, 'reject')}
                          disabled={isBusy}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}
                        >
                          <X size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom answers */}
                {r.attendee_data?.answers && Object.keys(r.attendee_data.answers).length > 0 && (
                  <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid #F0EDE6' }}>
                    {Object.entries(r.attendee_data.answers as Record<string, string>).map(([q, a]) => (
                      <div key={q}>
                        <div className="text-[11px] font-medium mb-0.5" style={{ color: '#6B7A72' }}>{q}</div>
                        <div className="text-[13px]" style={{ color: '#0F1F18' }}>{a}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[11px]" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Applied {fmtTime(r.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
