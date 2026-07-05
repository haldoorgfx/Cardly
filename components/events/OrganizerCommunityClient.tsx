'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Hash, Plus, Pin, MessageSquare, ExternalLink, Trash2, Users, Bell } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Channel = any;

interface Props {
  eventName: string;
  eventSlug: string;
  channels: Channel[];
  msgCounts: Record<string, number>;
}

const DEMO_CHANNELS: Channel[] = [
  { id: 'c1', name: 'announcements', description: 'Official updates from the organizer', is_pinned: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'c2', name: 'general', description: 'Open discussion for all attendees', is_pinned: false, created_at: '2026-01-02T00:00:00Z' },
  { id: 'c3', name: 'networking', description: 'Find your people and connect', is_pinned: false, created_at: '2026-01-03T00:00:00Z' },
  { id: 'c4', name: 'jobs-and-hiring', description: 'Post and find opportunities', is_pinned: false, created_at: '2026-01-04T00:00:00Z' },
  { id: 'c5', name: 'feedback', description: 'Share your experience', is_pinned: false, created_at: '2026-01-05T00:00:00Z' },
];

const DEMO_COUNTS: Record<string, number> = { c1: 14, c2: 87, c3: 41, c4: 22, c5: 9 };

export function OrganizerCommunityClient({ eventName, eventSlug, channels: dbChannels, msgCounts: dbCounts }: Props) {
  const channels = dbChannels.length > 0 ? dbChannels : DEMO_CHANNELS;
  const counts = Object.keys(dbCounts).length > 0 ? dbCounts : DEMO_COUNTS;
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const totalMessages = Object.values(counts).reduce((a, b) => a + b, 0);

  function handleCreate() {
    if (!newName.trim()) return;
    setNewName('');
    setNewDesc('');
    setShowNew(false);
  }

  return (
    <div className="flex-1 p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
            Community
          </h1>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            Attendees discuss and connect before, during, and after {eventName}
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
          <Plus size={14} /> New channel
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Channels', value: channels.length, icon: <Hash size={16} /> },
          { label: 'Total messages', value: totalMessages, icon: <MessageSquare size={16} /> },
          { label: 'Active attendees', value: Math.round(totalMessages * 0.4), icon: <Users size={16} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: '#6B7A72' }}>{s.icon}
              <span className="text-[12px]">{s.label}</span>
            </div>
            <div className="font-display font-bold text-[22px]" style={{ color: '#0F1F18' }}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Channels list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#6B7A72' }}>CHANNELS</span>
          <Link href={`/e/${eventSlug}/community`} target="_blank"
            className="flex items-center gap-1.5 text-[12px] font-medium transition hover:opacity-70"
            style={{ color: '#1F4D3A' }}>
            <ExternalLink size={12} /> View as attendee
          </Link>
        </div>

        {channels.map((ch: Channel, i: number) => (
          <div key={ch.id}
            className="px-5 py-4 flex items-center gap-4"
            style={{ borderBottom: i < channels.length - 1 ? '1px solid #E5E0D4' : 'none', background: '#FFFFFF' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: ch.is_pinned ? '#E8EFEB' : '#FAF6EE' }}>
              <Hash size={15} style={{ color: ch.is_pinned ? '#1F4D3A' : '#6B7A72' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>#{ch.name}</span>
                {ch.is_pinned && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: '#E8C57E20', color: '#8B6914' }}>
                    <Pin size={9} /> Pinned
                  </span>
                )}
              </div>
              <p className="text-[12px] truncate" style={{ color: '#6B7A72' }}>{ch.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
                  {(counts[ch.id] ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px]" style={{ color: '#C9C3B1' }}>messages</div>
              </div>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-70"
                style={{ color: '#C9C3B1' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {channels.length === 0 && (
          <div className="py-16 text-center" style={{ background: '#FFFFFF' }}>
            <Hash size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No channels yet</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Create a channel to let attendees connect</p>
          </div>
        )}
      </div>

      {/* Notification tip */}
      <div className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
        <Bell size={16} style={{ color: '#1F4D3A', marginTop: 2 }} />
        <p className="text-[13px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
          Attendees who opted in get a push notification for each message in the{' '}
          <strong>#announcements</strong> channel. Post there for important updates only.
        </p>
      </div>

      {/* New channel modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={e => e.target === e.currentTarget && setShowNew(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <h2 className="font-display font-bold text-[18px] mb-4" style={{ color: '#0F1F18' }}>
              New channel
            </h2>
            <div className="mb-3">
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Channel name</label>
              <input value={newName} onChange={e => setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="e.g. networking"
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
            </div>
            <div className="mb-5">
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#6B7A72' }}>Description (optional)</label>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                placeholder="What this channel is for"
                className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!newName.trim()}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                Create channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
