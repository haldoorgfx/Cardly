'use client';

import { useState, useTransition } from 'react';

interface Meeting {
  id: string;
  requester_name: string | null;
  requester_email: string | null;
  requested_time: string | null;
  scheduled_time: string | null;
  status: string;
  message: string | null;
  created_at: string;
}

interface Props {
  meetings: Meeting[];
  token: string;
}

function fmtDateTime(dt: string | null) {
  if (!dt) return null;
  const d = new Date(dt);
  return d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const grads = [
    'linear-gradient(135deg,#3E7E5E,#C9A45E)',
    'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  ];
  return (
    <span
      className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0 text-[13px]"
      style={{ width: 40, height: 40, background: grads[idx % 2] }}
    >
      {initials}
    </span>
  );
}

/* ── Propose-time modal ────────────────────────────────────────────────── */
function ProposeModal({
  meeting, token, onClose, onUpdated,
}: {
  meeting: Meeting;
  token: string;
  onClose: () => void;
  onUpdated: (m: Meeting) => void;
}) {
  // default to the requested time (as a local datetime-local value) or now+1h
  const seed = meeting.requested_time ? new Date(meeting.requested_time) : new Date(Date.now() + 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${seed.getFullYear()}-${pad(seed.getMonth() + 1)}-${pad(seed.getDate())}T${pad(seed.getHours())}:${pad(seed.getMinutes())}`;
  const [value, setValue] = useState(local);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!value) { setError('Pick a time'); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/exhibitor/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          meeting_id: meeting.id,
          action: 'propose',
          scheduled_time: new Date(value).toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Could not save'); return; }
      if (data.meeting) onUpdated(data.meeting);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[380px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Propose a time</div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="text-[13px]" style={{ color: '#3A4A42' }}>
            Suggest a new time to meet <b style={{ color: '#0F1F18' }}>{meeting.requester_name ?? 'this attendee'}</b> at your booth.
          </div>
          <input
            type="datetime-local"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none"
            style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
          />
          {error && <div className="text-[12.5px]" style={{ color: '#B8423C' }}>{error}</div>}
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-[13.5px] font-medium text-white transition"
            style={{ background: '#1F4D3A', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Sending…' : 'Propose time'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Meeting card ──────────────────────────────────────────────────────── */
function MeetingCard({
  meeting, idx, onAccept, onPropose, accepting,
}: {
  meeting: Meeting;
  idx: number;
  onAccept: (m: Meeting) => void;
  onPropose: (m: Meeting) => void;
  accepting: boolean;
}) {
  const name = meeting.requester_name ?? 'Attendee';
  const when = fmtDateTime(meeting.scheduled_time ?? meeting.requested_time);
  const isScheduled = meeting.status === 'scheduled';

  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}>
      <div className="flex items-center gap-3">
        <Avatar name={name} idx={idx} />
        <div className="flex-1 min-w-0">
          <div className="font-display text-[14.5px] font-semibold tracking-[-0.01em] truncate" style={{ color: '#0F1F18' }}>{name}</div>
          {(meeting.requester_email || meeting.message) && (
            <div className="text-[12px] truncate mt-0.5" style={{ color: '#6B7A72' }}>
              {meeting.message || meeting.requester_email}
            </div>
          )}
        </div>
      </div>

      {when && (
        <div className="flex items-center gap-2 mt-3 text-[12.5px]" style={{ color: '#3A4A42' }}>
          <svg width={15} height={15} fill="none" stroke="#1F4D3A" strokeWidth={1.9} viewBox="0 0 24 24" className="shrink-0">
            <rect x="3.5" y="5" width="17" height="15" rx="2" /><path strokeLinecap="round" d="M3.5 9.5h17M12 13v3l2 1" />
          </svg>
          {isScheduled ? 'Scheduled' : 'Requested'} <b style={{ color: '#0F1F18' }}>{when}</b> at your booth
        </div>
      )}

      {isScheduled ? (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ background: 'rgba(45,122,79,0.08)', color: '#2D7A4F', borderColor: 'rgba(45,122,79,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />
            Confirmed
          </span>
        </div>
      ) : (
        <div className="flex gap-2.5 mt-3.5">
          <button
            onClick={() => onPropose(meeting)}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium border transition-colors"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: '#FFFFFF' }}
          >
            Propose time
          </button>
          <button
            onClick={() => onAccept(meeting)}
            disabled={accepting}
            className="flex-1 py-2 rounded-xl text-[13px] font-medium text-white transition-colors"
            style={{ background: '#1F4D3A', opacity: accepting ? 0.6 : 1 }}
          >
            {accepting ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function MeetingsTab({ meetings: initial, token }: Props) {
  const [meetings, setMeetings] = useState(initial);
  const [tab, setTab] = useState<'requests' | 'scheduled'>('requests');
  const [proposing, setProposing] = useState<Meeting | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const requests  = meetings.filter(m => m.status === 'pending');
  const scheduled = meetings.filter(m => m.status === 'scheduled');
  const list = tab === 'requests' ? requests : scheduled;

  function handleUpdated(m: Meeting) {
    setMeetings(prev => prev.map(x => x.id === m.id ? m : x));
  }

  async function handleAccept(m: Meeting) {
    setAcceptingId(m.id);
    try {
      const res = await fetch('/api/exhibitor/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, meeting_id: m.id, action: 'accept' }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.meeting) handleUpdated(data.meeting);
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {proposing && (
        <ProposeModal
          meeting={proposing}
          token={token}
          onClose={() => setProposing(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* Segmented control */}
      <div className="inline-flex p-1 rounded-xl self-start" style={{ background: '#EFEBE1', border: '1px solid #E5E0D4' }}>
        {([
          { id: 'requests' as const,  label: 'Requests',  count: requests.length },
          { id: 'scheduled' as const, label: 'Scheduled', count: scheduled.length },
        ]).map(({ id, label, count }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
              style={{
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#1F4D3A' : '#6B7A72',
                boxShadow: active ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
              }}
            >
              {label}{' '}
              <span className="text-[11px]" style={{ color: active ? '#6B7A72' : '#9AA69E' }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border px-5 py-12 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto mb-3 grid place-items-center rounded-2xl" style={{ width: 56, height: 56, background: '#E8EFEB' }}>
            <svg width={26} height={26} fill="none" stroke="#1F4D3A" strokeWidth={1.6} viewBox="0 0 24 24">
              <rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path strokeLinecap="round" d="M3.5 9.5h17M8 3.5v4M16 3.5v4M12 13v3l2 1" />
            </svg>
          </div>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
            {tab === 'requests' ? 'No meeting requests' : 'No scheduled meetings'}
          </div>
          <p className="text-[13px] mt-1.5 max-w-[320px] mx-auto" style={{ color: '#6B7A72' }}>
            {tab === 'requests'
              ? 'When attendees request booth time, they’ll appear here to accept or reschedule.'
              : 'Accepted meetings drop into your agenda and the attendee’s — both get a reminder.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {list.map((m, i) => (
            <MeetingCard
              key={m.id}
              meeting={m}
              idx={i}
              onAccept={handleAccept}
              onPropose={setProposing}
              accepting={acceptingId === m.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
