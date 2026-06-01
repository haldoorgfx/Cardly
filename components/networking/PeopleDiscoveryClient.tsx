'use client';

import { useState } from 'react';
import { Search, UserCheck, Clock, UserPlus } from 'lucide-react';

interface Person {
  id: string;
  attendee_name: string;
  custom_fields: Record<string, string> | null;
  karta_card_url: string | null;
  connection_status: string | null;
}

interface Props {
  eventId: string;
  registrationId: string | null;
  initialPeople: Person[];
}

type Filter = 'all' | 'connected' | 'pending';

function Avatar({ name, size = 64 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-display font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.33, background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
    >
      {initials}
    </div>
  );
}

export default function PeopleDiscoveryClient({ eventId, registrationId, initialPeople }: Props) {
  const [people, setPeople] = useState(initialPeople);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [connecting, setConnecting] = useState<string | null>(null);

  const filtered = people.filter(p => {
    const matchQ = !query || p.attendee_name.toLowerCase().includes(query.toLowerCase());
    const matchF =
      filter === 'all' ? true :
      filter === 'connected' ? p.connection_status === 'accepted' :
      filter === 'pending' ? p.connection_status === 'pending' : true;
    return matchQ && matchF;
  });

  const handleConnect = async (personId: string) => {
    if (!registrationId) return;
    setConnecting(personId);
    try {
      await fetch(`/api/events/${eventId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: registrationId, recipient_id: personId }),
      });
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, connection_status: 'pending' } : p));
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7A72' }} />
          <input
            type="text"
            placeholder="Search by name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-full pl-9 pr-4 py-2.5 text-[13px] outline-none"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'connected', 'pending'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors"
              style={{ background: filter === f ? '#1F4D3A' : 'white', color: filter === f ? 'white' : '#6B7A72', border: `1px solid ${filter === f ? '#1F4D3A' : '#E5E0D4'}` }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>No attendees match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(person => (
            <div key={person.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <div className="flex items-center gap-3">
                <Avatar name={person.attendee_name} size={48} />
                <div className="flex-1 min-w-0">
                  <div className="font-display font-medium text-[15px] truncate" style={{ color: '#0F1F18' }}>
                    {person.attendee_name}
                  </div>
                  <div className="text-[12px]" style={{ color: '#6B7A72' }}>Attendee</div>
                </div>
              </div>

              {registrationId && person.id !== registrationId && (
                <div>
                  {person.connection_status === 'accepted' ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
                      <UserCheck size={12} /> Connected
                    </span>
                  ) : person.connection_status === 'pending' ? (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                      <Clock size={12} /> Pending
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(person.id)}
                      disabled={connecting === person.id}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-opacity"
                      style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', opacity: connecting === person.id ? 0.5 : 1 }}
                    >
                      <UserPlus size={12} />
                      {connecting === person.id ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                </div>
              )}
              {!registrationId && (
                <p className="text-[11px]" style={{ color: '#6B7A72' }}>Register to connect</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
