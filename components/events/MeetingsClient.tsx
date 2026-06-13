'use client';

import { useState } from 'react';

interface Props { eventId: string; eventName: string; }

const SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00'];
const TABLES = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5'];
const GRADS = [
  'linear-gradient(135deg,#C9A45E,#1F4D3A)',
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#1F4D3A,#163828)',
];
const INITIALS = ['AO','KM','TM','YB','FD','LT'];

function booked(r: number, c: number) { return ((r * 7 + c * 3 + r * c) % 5) > 1; }
function pair(r: number, c: number): [number, number] { return [(r + c) % 6, (r + c + 2) % 6]; }

const TABS = [
  { id: 'schedule',  label: 'Schedule' },
  { id: 'requests',  label: 'Requests' },
  { id: 'settings',  label: 'Settings' },
];

const SEED_REQUESTS = [
  { from: ['Amara Okeke', 0], to: ['David Mwangi', 1], topic: 'Discuss Series A for logistics', when: 'Day 1 · 11:00' },
  { from: ['Zainab Bello', 2], to: ['Kwame Mensah', 3], topic: 'Payments API integration', when: 'Day 1 · 14:30' },
];

export function MeetingsClient({ eventName }: Props) {
  const [tab, setTab] = useState('schedule');
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [meetingOn, setMeetingOn] = useState(true);

  function dismiss(i: number) { setRequests(rs => rs.filter((_, j) => j !== i)); }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>1:1 Meetings</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Attendee meeting scheduler · {eventName}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Meetings booked', value: '—' },
          { label: 'Acceptance rate', value: '—' },
          { label: 'Avg. per attendee', value: '—' },
          { label: 'No-shows', value: '—' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{s.label}</div>
            <div className=" text-[24px] leading-none" style={{ color: '#1F4D3A' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all"
            style={tab === t.id ? { background: '#1F4D3A', color: 'white' } : { color: '#6B7A72' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Schedule */}
      {tab === 'schedule' && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
            <div className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Day 1 · Meeting hall</div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border" style={{ background: 'rgba(45,122,79,0.08)', color: '#2D7A4F', borderColor: 'rgba(45,122,79,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />Live
            </span>
          </div>
          <div className="overflow-x-auto p-4">
            <div className="min-w-[640px]">
              <div className="grid items-center gap-2 mb-2" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
                <span />
                {TABLES.map((t, i) => (
                  <div key={i} className="text-center  text-[9.5px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{t}</div>
                ))}
              </div>
              {SLOTS.map((s, r) => (
                <div key={r} className="grid items-stretch gap-2 mb-2" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>
                  <span className=" text-[12px] flex items-center" style={{ color: '#3A4A42' }}>{s}</span>
                  {TABLES.map((_, c) => {
                    if (!booked(r, c)) {
                      return <div key={c} className="rounded-lg h-[44px]" style={{ border: '1px dashed #E5E0D4', background: 'rgba(250,246,238,0.4)' }} />;
                    }
                    const [ai, bi] = pair(r, c);
                    return (
                      <div key={c} className="rounded-lg h-[44px] flex items-center justify-center gap-1 px-1"
                        style={{ background: 'rgba(232,239,235,0.7)', border: '1px solid rgba(31,77,58,0.2)' }}>
                        <span className="w-6 h-6 rounded-full grid place-items-center text-cream font-display text-[9px] font-semibold"
                          style={{ background: GRADS[ai] }}>{INITIALS[ai]}</span>
                        <svg width={10} height={10} fill="none" stroke="#6B7A72" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span className="w-6 h-6 rounded-full grid place-items-center text-cream font-display text-[9px] font-semibold"
                          style={{ background: GRADS[bi] }}>{INITIALS[bi]}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="grid gap-3">
          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
              <p className="text-[13.5px]" style={{ color: '#6B7A72' }}>All caught up — no pending meeting requests.</p>
            </div>
          ) : requests.map((r, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4" style={{ border: '1px solid #E5E0D4' }}>
              <div className="flex items-center -space-x-2 shrink-0">
                {[r.from as [string, number], r.to as [string, number]].map(([, idx], j) => (
                  <span key={j} className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[11px] font-semibold"
                    style={{ background: GRADS[idx as number], outline: '2px solid white' }}>
                    {INITIALS[idx as number]}
                  </span>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px]" style={{ color: '#0F1F18' }}>
                  <span className="font-medium">{(r.from as [string, number])[0]}</span>
                  <span className="mx-1.5" style={{ color: '#6B7A72' }}>→</span>
                  <span className="font-medium">{(r.to as [string, number])[0]}</span>
                </div>
                <div className="text-[12.5px] mt-0.5" style={{ color: '#3A4A42' }}>{r.topic}</div>
                <div className=" text-[10.5px] tracking-[0.1em] uppercase mt-1" style={{ color: '#6B7A72' }}>{r.when}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => dismiss(i)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium border transition-colors"
                  style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>
                  Approve
                </button>
                <button onClick={() => dismiss(i)} className="px-3 py-2 rounded-xl border text-[12.5px] font-medium transition-colors"
                  style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C' }}>
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {tab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className="font-display text-[14px] font-semibold mb-4" style={{ color: '#0F1F18' }}>Availability</div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
              <div>
                <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>Meeting scheduler</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Enable 1:1 meetings for this event</div>
              </div>
              <button onClick={() => setMeetingOn(v => !v)}
                className="relative w-10 h-6 rounded-full transition-colors"
                style={{ background: meetingOn ? '#1F4D3A' : '#E5E0D4' }}>
                <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ transform: meetingOn ? 'translateX(16px)' : 'translateX(0)' }} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Meeting length', '30 min'], ['Tables', '5'], ['From', '10:00'], ['Until', '16:00']].map(([label, val]) => (
                <div key={label}>
                  <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>{label}</div>
                  <div className="border rounded-lg px-3 py-2.5 text-[13.5px]" style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'rgba(250,246,238,0.5)' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className="font-display text-[14px] font-semibold mb-4" style={{ color: '#0F1F18' }}>Rules</div>
            {[
              ['Let attendees book 1:1s', 'Attendees request meetings from each other\'s profiles', true],
              ['Require organizer approval', 'Review each meeting before it\'s confirmed', false],
              ['Auto-assign tables', 'Place confirmed meetings at the next free table', true],
              ['Block double-booking', 'Prevent overlapping meetings per attendee', true],
            ].map(([label, desc, on], i) => (
              <div key={i} className={`flex items-center justify-between gap-3 py-3 ${i < 3 ? 'border-b' : ''}`}
                style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{label as string}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{desc as string}</div>
                </div>
                <div className="relative w-10 h-6 rounded-full shrink-0" style={{ background: on ? '#1F4D3A' : '#E5E0D4' }}>
                  <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }} />
                </div>
              </div>
            ))}
            <button className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-cream" style={{ background: '#1F4D3A' }}>
              Save settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
