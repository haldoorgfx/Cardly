'use client';

import { useState } from 'react';
import { PageShell, PageHeader } from '@/components/dash';

interface WaitlistEntry {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
  status: string;           // waiting | invited | registered | expired
  notified_at?: string | null;
}

interface Props {
  eventId: string;
  eventName: string;
  waitlist: WaitlistEntry[];
  totalRegs: number;
  capacity: number;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function WaitlistClient({ eventId, eventName, waitlist, totalRegs, capacity }: Props) {
  const [releasing, setReleasing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [list, setList] = useState<WaitlistEntry[]>(waitlist);
  const [error, setError] = useState('');

  const waiting = list.filter(e => e.status === 'waiting');
  const invitedList = list.filter(e => e.status === 'invited');

  const filled = capacity > 0 ? Math.round((totalRegs / capacity) * 100) : 0;
  const spotsLeft = Math.max(capacity - totalRegs, 0);

  // Release = invite (waiting → invited + email), via the waitlist endpoint that
  // actually owns waitlist_entries. It used to PATCH /registrations with the
  // waitlist row's id, which could never match a registration — every click
  // silently failed. With a selection we invite those; with none, the next in queue.
  async function releaseSpots() {
    const ids = selected.length > 0 ? selected : (waiting[0] ? [waiting[0].id] : []);
    if (ids.length === 0) return;
    setReleasing(true);
    setError('');
    let lastError = '';
    for (const id of ids) {
      try {
        const res = await fetch(`/api/events/${eventId}/waitlist`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_id: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setList(prev => prev.map(w => (
            w.id === id ? { ...w, status: 'invited', notified_at: new Date().toISOString() } : w
          )));
        } else {
          lastError = data.error ?? 'Could not send that invite.';
        }
      } catch {
        lastError = 'Connection problem — please try again.';
      }
    }
    if (lastError) setError(lastError);
    setSelected([]);
    setReleasing(false);
  }

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title="Waitlist"
        subtitle={`Manage overflow · ${eventName}`}
        actions={
          <button onClick={releaseSpots} disabled={releasing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13.5px] font-medium text-cream transition-opacity"
            style={{ background: '#1F4D3A', opacity: releasing ? 0.7 : 1 }}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l-3-3m0 0l-3 3m3-3v7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {releasing ? 'Inviting…' : selected.length > 0 ? `Invite ${selected.length} ${selected.length > 1 ? 'people' : 'person'}` : 'Invite next in line'}
          </button>
        }
      />

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Waiting', value: waiting.length },
          { label: 'Capacity', value: capacity > 0 ? capacity : '—' },
          { label: 'Invited', value: invitedList.length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[11.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#65736B' }}>{s.label}</div>
            <div className=" text-[24px] leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Capacity bar */}
      {capacity > 0 && (
        <div className="bg-white rounded-2xl p-5 mb-5" style={{ border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between mb-3">
            <div className=" text-[11.5px] tracking-[0.14em] uppercase" style={{ color: '#65736B' }}>Capacity usage</div>
            <div className=" text-[12px]" style={{ color: '#3A4A42' }}>{totalRegs} / {capacity} · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} available</div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(filled, 100)}%`, background: filled >= 90 ? '#B8423C' : filled >= 75 ? '#C97A2D' : '#1F4D3A' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className=" text-[12px]" style={{ color: '#9BA8A1' }}>0</span>
            <span className=" text-[12px]" style={{ color: '#9BA8A1' }}>{filled}% full</span>
            <span className=" text-[12px]" style={{ color: '#9BA8A1' }}>{capacity}</span>
          </div>
        </div>
      )}

      {/* Waitlist queue */}
      {list.length === 0 ? (
          <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
            <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3" style={{ background: '#E8EFEB' }}>
              <svg width={20} height={20} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>Waitlist is empty</p>
            <p className="text-[13px]" style={{ color: '#65736B' }}>No one is waiting. You can expand capacity to allow more registrations.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <div className="px-5 py-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
              <div className=" text-[11.5px] tracking-[0.14em] uppercase" style={{ color: '#65736B' }}>
                {waiting.length} waiting · oldest first
              </div>
              {selected.length > 0 && (
                <span className=" text-[12px] shrink-0" style={{ color: '#65736B' }}>{selected.length} selected</span>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.5)' }}>
              {list.map((entry) => {
                // Queue number is the person's real place among those still
                // waiting — invited/registered rows stay visible but are not
                // numbered, so #1 always means "next up".
                const queueNo = entry.status === 'waiting' ? waiting.findIndex(w => w.id === entry.id) + 1 : null;
                const canInvite = entry.status === 'waiting';
                return (
                <div key={entry.id}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ background: selected.includes(entry.id) ? 'rgba(232,239,235,0.6)' : 'transparent' }}>
                  <input type="checkbox" checked={selected.includes(entry.id)} onChange={() => toggle(entry.id)}
                    disabled={!canInvite}
                    aria-label={`Select ${entry.name ?? 'entry'}`}
                    className="w-4 h-4 rounded accent-[#1F4D3A] shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" />
                  <div className="w-5 text-center  text-[12.5px] shrink-0" style={{ color: '#9BA8A1' }}>
                    {queueNo ? `#${queueNo}` : '—'}
                  </div>
                  <span className="w-8 h-8 rounded-full grid place-items-center text-cream font-display text-[12px] font-semibold shrink-0"
                    style={{ background: '#1F4D3A' }}>
                    {initials(entry.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>
                      {entry.name ?? '—'}
                    </div>
                    <div className=" text-[12.5px] truncate" style={{ color: '#65736B' }}>
                      {entry.email ?? ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    {entry.status !== 'waiting' && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: entry.status === 'registered' ? '#E8EFEB' : entry.status === 'expired' ? '#FAF6EE' : '#FDF3E6',
                          color: entry.status === 'registered' ? '#1F4D3A' : entry.status === 'expired' ? '#65736B' : '#C97A2D',
                        }}>
                        {entry.status}
                      </span>
                    )}
                    <div className=" text-[12.5px]" style={{ color: '#9BA8A1' }}>{fmtDate(entry.created_at)}</div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
    </PageShell>
  );
}
