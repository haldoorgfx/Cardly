'use client';

import { useState } from 'react';

interface WaitlistEntry {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  created_at: string;
  status: string;
  ticket_types?: { name: string } | null;
}

interface Props {
  eventId: string;
  eventName: string;
  waitlist: WaitlistEntry[];
  totalRegs: number;
  capacity: number;
}

const GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#C9A45E,#1F4D3A)',
];

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TABS = [
  { id: 'queue',    label: 'Waitlist queue' },
  { id: 'groups',  label: 'Group bookings' },
  { id: 'capacity', label: 'Session capacity' },
];

export function WaitlistClient({ eventName, waitlist, totalRegs, capacity }: Props) {
  const [tab, setTab] = useState('queue');
  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const filled = capacity > 0 ? Math.round((totalRegs / capacity) * 100) : 0;
  const spotsLeft = Math.max(capacity - totalRegs, 0);

  async function releaseSpots() {
    setReleasing(true);
    await new Promise(r => setTimeout(r, 1000));
    setReleased(prev => prev + selected.length || 1);
    setSelected([]);
    setReleasing(false);
  }

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Waitlist</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Manage overflow · {eventName}</p>
        </div>
        <button onClick={releaseSpots} disabled={releasing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-cream transition-opacity"
          style={{ background: '#1F4D3A', opacity: releasing ? 0.7 : 1 }}>
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {releasing ? 'Releasing…' : selected.length > 0 ? `Release ${selected.length} spot${selected.length > 1 ? 's' : ''}` : 'Release spots'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'On waitlist', value: waitlist.length },
          { label: 'Capacity', value: capacity > 0 ? capacity : '—' },
          { label: 'Offers sent', value: released },
          { label: 'Converted', value: '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{s.label}</div>
            <div className="font-mono text-[24px] leading-none" style={{ color: '#1F4D3A' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      {capacity > 0 && (
        <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase" style={{ color: '#6B7A72' }}>Capacity usage</div>
            <div className="font-mono text-[12px]" style={{ color: '#3A4A42' }}>{totalRegs} / {capacity} · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available</div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(filled, 100)}%`, background: filled >= 90 ? '#B8423C' : filled >= 75 ? '#C97A2D' : '#1F4D3A' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="font-mono text-[10px]" style={{ color: '#9BA8A1' }}>0</span>
            <span className="font-mono text-[10px]" style={{ color: '#9BA8A1' }}>{filled}% full</span>
            <span className="font-mono text-[10px]" style={{ color: '#9BA8A1' }}>{capacity}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-5 w-fit" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap"
            style={tab === t.id ? { background: '#1F4D3A', color: 'white' } : { color: '#6B7A72' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Queue tab */}
      {tab === 'queue' && (
        waitlist.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
            <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3" style={{ background: '#E8EFEB' }}>
              <svg width={20} height={20} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>Waitlist is empty</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>No one is waiting. You can expand capacity to allow more registrations.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
              <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase" style={{ color: '#6B7A72' }}>
                {waitlist.length} waiting · oldest first
              </div>
              {selected.length > 0 && (
                <span className="font-mono text-[10.5px]" style={{ color: '#1F4D3A' }}>{selected.length} selected</span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.5)' }}>
              {waitlist.map((entry, i) => (
                <div key={entry.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ background: selected.includes(entry.id) ? 'rgba(232,239,235,0.6)' : 'transparent' }}>
                  <input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)}
                    className="w-4 h-4 rounded accent-[#1F4D3A] shrink-0 cursor-pointer" />
                  <div className="w-1 text-center font-mono text-[11px] shrink-0" style={{ color: '#9BA8A1' }}>
                    #{i + 1}
                  </div>
                  <span className="w-8 h-8 rounded-full grid place-items-center text-cream font-display text-[10px] font-semibold shrink-0"
                    style={{ background: GRADS[i % GRADS.length] }}>
                    {initials(entry.attendee_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>
                      {entry.attendee_name ?? '—'}
                    </div>
                    <div className="font-mono text-[11px] truncate" style={{ color: '#6B7A72' }}>
                      {entry.attendee_email ?? ''} · {entry.ticket_types?.name ?? 'General'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px]" style={{ color: '#9BA8A1' }}>{fmtDate(entry.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Group bookings tab */}
      {tab === 'groups' && (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
          <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3" style={{ background: '#E8EFEB' }}>
            <svg width={20} height={20} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>Group bookings</p>
          <p className="text-[13px]" style={{ color: '#6B7A72' }}>Manage organizations that reserved multiple spots.</p>
        </div>
      )}

      {/* Session capacity tab */}
      {tab === 'capacity' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
            <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase" style={{ color: '#6B7A72' }}>Session capacity</div>
          </div>
          <div className="p-5">
            <p className="text-[13.5px]" style={{ color: '#3A4A42' }}>
              Session-level capacity limits are configured in the <strong>Agenda</strong> section. Waitlist here shows overall event overflow.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
