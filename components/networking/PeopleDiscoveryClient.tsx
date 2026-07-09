'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface Person {
  id: string;
  attendee_name: string;
  custom_fields: Record<string, string> | null;
  karta_card_url: string | null;
  connection_status: string | null;
  ticket_type_id: string | null;
}

interface Props {
  eventId: string;
  registrationId: string | null;
  initialPeople: Person[];
}

type Filter = 'all' | 'connected' | 'pending';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarGradient(name: string) {
  const chars = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  const hue = (chars * 47) % 60; // keep in warm green range
  return `linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)`;
}

export default function PeopleDiscoveryClient({ eventId, registrationId, initialPeople }: Props) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [connecting, setConnecting] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let list = people;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.attendee_name.toLowerCase().includes(q));
    }
    if (filter === 'connected') {
      list = list.filter((p) => p.connection_status === 'accepted');
    } else if (filter === 'pending') {
      list = list.filter((p) => p.connection_status === 'pending');
    }
    return list;
  }, [people, search, filter]);

  async function handleConnect(personId: string) {
    if (!registrationId || connecting.has(personId)) return;
    setConnecting((prev) => new Set(prev).add(personId));

    try {
      const res = await fetch(`/api/events/${eventId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: registrationId, recipient_id: personId }),
      });
      if (res.ok) {
        setPeople((prev) =>
          prev.map((p) =>
            p.id === personId ? { ...p, connection_status: 'pending' } : p
          )
        );
      }
    } catch {
      // no-op
    } finally {
      setConnecting((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'connected', label: 'Connected' },
    { key: 'pending', label: 'Pending' },
  ];

  return (
    <div className="space-y-5">
      {/* Search */}
      <div
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border"
        style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}
      >
        <Search size={16} style={{ color: '#6B7A72' }} strokeWidth={1.8} />
        <input
          type="text"
          placeholder="Search attendees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-[14px] outline-none"
          style={{ color: '#0F1F18' }}
        />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
            style={
              filter === key
                ? { background: '#1F4D3A', color: '#fff', borderColor: '#1F4D3A' }
                : { background: '#fff', color: '#6B7A72', borderColor: '#E5E0D4' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* No-registration notice */}
      {!registrationId && (
        <div
          className="px-4 py-3 rounded-xl text-[13px] border"
          style={{
            background: '#FAF6EE',
            borderColor: '#E5E0D4',
            color: '#6B7A72',
          }}
        >
          Register for this event to network with attendees.
        </div>
      )}

      {/* People grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            {people.length === 0 ? 'No attendees yet.' : 'No results matching your search.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((person) => {
            const isSelf = person.id === registrationId;
            const status = person.connection_status;
            const isLoading = connecting.has(person.id);

            const roleField =
              person.custom_fields?.role ??
              person.custom_fields?.title ??
              person.custom_fields?.job_title ??
              null;

            return (
              <div
                key={person.id}
                className="bg-white border rounded-2xl p-4 flex flex-col gap-3"
                style={{ borderColor: '#E5E0D4' }}
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
                  >
                    <span
                      className="font-display font-medium text-white"
                      style={{ fontSize: 22 }}
                    >
                      {getInitials(person.attendee_name)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-display font-medium truncate"
                      style={{ fontSize: 15, color: '#0F1F18' }}
                    >
                      {person.attendee_name}
                    </p>
                    <p className="text-[13px] truncate" style={{ color: '#6B7A72' }}>
                      {roleField ?? 'Attendee'}
                    </p>
                  </div>
                </div>

                {/* Action */}
                {!isSelf && (
                  <div>
                    {status === 'accepted' ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border"
                        style={{
                          background: '#E8EFEB',
                          color: '#2D7A4F',
                          borderColor: '#2D7A4F',
                        }}
                      >
                        Connected ✓
                      </span>
                    ) : status === 'pending' ? (
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-medium border"
                        style={{
                          background: '#FAF6EE',
                          color: '#6B7A72',
                          borderColor: '#E5E0D4',
                        }}
                      >
                        Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(person.id)}
                        disabled={!registrationId || isLoading}
                        className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors disabled:opacity-50"
                        style={{
                          color: '#1F4D3A',
                          borderColor: '#1F4D3A',
                          background: 'transparent',
                        }}
                      >
                        {isLoading ? 'Connecting…' : 'Connect'}
                      </button>
                    )}
                  </div>
                )}
                {isSelf && (
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                  >
                    You
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
