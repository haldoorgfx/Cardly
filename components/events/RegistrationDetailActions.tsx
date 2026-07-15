'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Pencil } from 'lucide-react';

type Status = 'pending' | 'pending_approval' | 'confirmed' | 'checked_in' | 'cancelled' | 'refunded';

interface Props {
  regId: string;
  eventId: string;
  currentStatus: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
}

/* ── Edit attendee modal ────────────────────────────────────────────────── */
function EditAttendeeModal({
  regId, eventId, attendeeName, attendeeEmail, attendeePhone,
  onClose, onSaved,
}: {
  regId: string; eventId: string;
  attendeeName: string; attendeeEmail: string; attendeePhone: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name,  setName]  = useState(attendeeName);
  const [email, setEmail] = useState(attendeeEmail);
  const [phone, setPhone] = useState(attendeePhone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSave() {
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: regId,
          attendee_name:  name.trim(),
          attendee_email: email.trim(),
          attendee_phone: phone.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed to save'); return; }
      onSaved();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl overflow-hidden w-full max-w-[400px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Edit attendee</div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-5 space-y-4">
          {error && <p className="text-[13px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B8423C' }}>{error}</p>}
          <div>
            <label className="block  text-[12px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Full name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none border" style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
          </div>
          <div>
            <label className="block  text-[12px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none border" style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
          </div>
          <div>
            <label className="block  text-[12px] tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Phone (optional)</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none border" style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg text-[13px] border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
            style={{ background: '#1F4D3A' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export function RegistrationDetailActions({
  regId, eventId, currentStatus, attendeeName, attendeeEmail, attendeePhone,
}: Props) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [status, setStatus]     = useState(currentStatus);
  const [loading, setLoading]   = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  async function changeStatus(newStatus: Status) {
    setLoading(true);
    setStatusError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setStatusError(data.error ?? 'Action failed. Please try again.');
      }
    } catch {
      setStatusError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const isCancelled        = status === 'cancelled';
  const isRefunded         = status === 'refunded';
  const isCheckedIn        = status === 'checked_in';
  const isPendingApproval  = status === 'pending_approval';

  return (
    <>
      {showEdit && (
        <EditAttendeeModal
          regId={regId} eventId={eventId}
          attendeeName={attendeeName} attendeeEmail={attendeeEmail} attendeePhone={attendeePhone}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); router.refresh(); }}
        />
      )}

      {statusError && (
        <p className="w-full text-[13px] px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
          {statusError}
        </p>
      )}

      {/* Edit info */}
      <button
        onClick={() => setShowEdit(true)}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all disabled:opacity-50"
        style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
      >
        <Pencil size={13} />
        Edit
      </button>

      {/* Approve — only shown for pending_approval registrations */}
      {isPendingApproval && (
        <button
          onClick={() => changeStatus('confirmed')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all disabled:opacity-50"
          style={{ borderColor: 'rgba(31,77,58,0.35)', color: '#1F4D3A', background: '#E8EFEB' }}
        >
          Approve
        </button>
      )}

      {/* Status actions */}
      {!isCancelled && !isRefunded && (
        <button
          onClick={() => changeStatus('cancelled')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all disabled:opacity-50"
          style={{ borderColor: 'rgba(201,122,45,0.35)', color: '#C97A2D', background: 'rgba(201,122,45,0.06)' }}
        >
          Cancel registration
        </button>
      )}
      {(isCheckedIn || status === 'confirmed') && (
        <button
          onClick={() => changeStatus('refunded')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all disabled:opacity-50"
          style={{ borderColor: 'rgba(58,107,140,0.35)', color: '#3A6B8C', background: 'rgba(58,107,140,0.06)' }}
        >
          Mark refunded
        </button>
      )}
      {isCancelled && (
        <button
          onClick={() => changeStatus('confirmed')}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium border transition-all disabled:opacity-50"
          style={{ borderColor: 'rgba(31,77,58,0.35)', color: '#1F4D3A', background: '#E8EFEB' }}
        >
          Restore
        </button>
      )}
    </>
  );
}
