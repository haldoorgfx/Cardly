'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, UserPlus, Sparkles, Loader2 } from 'lucide-react';

interface Person {
  id: string;
  attendee_name: string;
  custom_fields: Record<string, string> | null;
  karta_card_url: string | null;
  connection_status: string | null;
}

interface MatchSuggestion {
  matched_registration_id: string;
  score: number;
  reason: string;
  registration: {
    id: string;
    attendee_name: string;
    custom_fields: Record<string, string> | null;
  } | null;
}

interface Props {
  eventId: string;
  registrationId: string | null;
  initialPeople: Person[];
}

type Filter = 'all' | 'connected' | 'pending' | 'suggested';

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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#2D7A4F' : score >= 60 ? '#C97A2D' : '#6B7A72';
  const bg = score >= 80 ? '#DCFCE7' : score >= 60 ? '#FEF3C7' : '#F3F4F6';
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color }}
    >
      {score}% match
    </span>
  );
}

export default function PeopleDiscoveryClient({ eventId, registrationId, initialPeople }: Props) {
  const [people, setPeople] = useState(initialPeople);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  useEffect(() => {
    // AI matching is not yet enabled — skip the fetch
  }, [filter, registrationId, eventId, suggestionsLoaded]);

  const filtered = people.filter(p => {
    if (filter === 'suggested') return false;
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

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'connected', label: 'Connected' },
    { key: 'pending', label: 'Pending' },
    ...(registrationId ? [{ key: 'suggested' as Filter, label: 'Suggested' }] : []),
  ];

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filter !== 'suggested' && (
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
        )}
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
              style={{
                background: filter === t.key ? '#1F4D3A' : 'white',
                color: filter === t.key ? 'white' : '#6B7A72',
                border: `1px solid ${filter === t.key ? '#1F4D3A' : '#E5E0D4'}`,
              }}
            >
              {t.key === 'suggested' && <Sparkles size={12} />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested view */}
      {filter === 'suggested' && (
        <div>
          {loadingSuggestions ? (
            <div className="rounded-2xl py-16 flex flex-col items-center justify-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#1F4D3A' }} />
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>Finding your best matches…</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <Sparkles size={24} className="mx-auto mb-3" style={{ color: '#E8C57E' }} />
              <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>AI matching — coming soon</p>
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>We&apos;ll suggest the best people for you to meet based on your profile.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map(s => {
                const name = s.registration?.attendee_name ?? 'Attendee';
                const personId = s.matched_registration_id;
                const existingPerson = people.find(p => p.id === personId);
                const connectionStatus = existingPerson?.connection_status ?? null;

                return (
                  <div key={personId} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                    <div className="flex items-start gap-3">
                      <Avatar name={name} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-medium text-[15px] truncate mb-1" style={{ color: '#0F1F18' }}>
                          {name}
                        </div>
                        <ScoreBadge score={s.score} />
                      </div>
                    </div>

                    <p className="text-[12px] leading-relaxed" style={{ color: '#3A4A42' }}>
                      {s.reason}
                    </p>

                    {connectionStatus === 'accepted' ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
                        <UserCheck size={12} /> Connected
                      </span>
                    ) : connectionStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>
                        <Clock size={12} /> Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(personId)}
                        disabled={connecting === personId}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-opacity"
                        style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', opacity: connecting === personId ? 0.5 : 1 }}
                      >
                        <UserPlus size={12} />
                        {connecting === personId ? 'Connecting…' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Standard people grid */}
      {filter !== 'suggested' && (
        filtered.length === 0 ? (
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
        )
      )}
    </div>
  );
}
