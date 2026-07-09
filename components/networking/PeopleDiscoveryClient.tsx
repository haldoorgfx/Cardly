'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, UserCheck, Clock, UserPlus, Sparkles, Loader2,
  MessageCircle, ExternalLink, Users, Check, X, Inbox, Send,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────── */

interface Person {
  id: string;
  attendee_name: string;
  attendee_email?: string | null;
  ticket_type_id?: string | null;
  custom_fields: Record<string, string> | null;
  eventera_card_url: string | null;
  ticket_types?: { name: string } | null;
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

interface ConnectionRequest {
  connection_id: string;
  person_id: string;
  name: string;
  created_at: string;
}

interface Props {
  eventId: string;
  eventSlug: string;
  registrationId: string | null;
  /** Optional server-rendered attendees; the client refetches with connection status when a reg is present. */
  initialPeople?: Person[];
}

type Filter = 'all' | 'connected' | 'requests' | 'suggested';

/* ─── Helpers ───────────────────────────────────────────────────── */

/** Build a subtitle from custom fields (title · company), matching the mobile app. */
function subtitleFor(
  custom: Record<string, string> | null | undefined,
  ticketName?: string | null,
): string {
  const cf = custom ?? {};
  const title = (cf.title || cf.job_title || cf.role || '').trim();
  const company = (cf.company || cf.organization || cf.organisation || '').trim();
  if (title && company) return `${title} · ${company}`;
  if (title) return title;
  if (company) return company;
  return (ticketName ?? '').trim();
}

/* ─── Small building blocks ─────────────────────────────────────── */

function Avatar({ name, size = 48 }: { name: string; size?: number }) {
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
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
      style={{ background: '#F3ECDA', color: '#8A6A1F' }}
    >
      {Math.round(score)}% match
    </span>
  );
}

function StatusTag({ status }: { status: string }) {
  if (status === 'accepted') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
        <UserCheck size={12} /> Connected
      </span>
    );
  }
  if (status === 'declined') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#F5E9E1', color: '#C97A2D' }}>
        Declined
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full" style={{ background: '#F0EDE8', color: '#6B7A72' }}>
      <Clock size={12} /> Pending
    </span>
  );
}

/* ─── Component ─────────────────────────────────────────────────── */

export default function PeopleDiscoveryClient({ eventId, eventSlug, registrationId, initialPeople = [] }: Props) {
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [sent, setSent] = useState<ConnectionRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const messagesHref = registrationId
    ? `/e/${eventSlug}/messages?reg=${registrationId}`
    : `/e/${eventSlug}/messages`;

  /* Load the directory (with connection status) once we know the viewer's reg. */
  const loadPeople = useCallback(async () => {
    if (!registrationId) return;
    setLoadingPeople(true);
    setPeopleError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/people?reg=${registrationId}`);
      if (!res.ok) throw new Error('failed');
      const data = await res.json() as { people: Person[] };
      setPeople(data.people ?? []);
    } catch {
      setPeopleError('Could not load the directory. Please try again.');
    } finally {
      setLoadingPeople(false);
    }
  }, [eventId, registrationId]);

  useEffect(() => {
    if (registrationId) loadPeople();
  }, [registrationId, loadPeople]);

  /* Load AI matches once, up front, so we can surface a suggested section. */
  useEffect(() => {
    if (!registrationId || suggestionsLoaded) return;
    setLoadingSuggestions(true);
    fetch(`/api/events/${eventId}/matches?registration_id=${registrationId}`)
      .then(r => r.ok ? r.json() : { matches: [] })
      .then((data: { matches?: MatchSuggestion[] }) => setSuggestions(data.matches ?? []))
      .catch(() => setSuggestions([]))
      .finally(() => { setLoadingSuggestions(false); setSuggestionsLoaded(true); });
  }, [eventId, registrationId, suggestionsLoaded]);

  const handleConnect = async (personId: string) => {
    if (!registrationId) return;
    setConnecting(personId);
    setConnectError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: registrationId, recipient_id: personId }),
      });
      if (!res.ok) throw new Error('failed');
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, connection_status: 'pending' } : p));
      setRequestsLoaded(false); // let the Requests tab re-fetch the new sent request
    } catch {
      setConnectError('Could not send request. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  /* Load pending connection requests (incoming + sent) for the Requests tab. */
  const loadRequests = useCallback(async () => {
    if (!registrationId) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/events/${eventId}/connections/requests?reg=${registrationId}`);
      if (!res.ok) throw new Error('failed');
      const data = await res.json() as { incoming: ConnectionRequest[]; sent: ConnectionRequest[] };
      setIncoming(data.incoming ?? []);
      setSent(data.sent ?? []);
    } catch {
      setIncoming([]);
      setSent([]);
    } finally {
      setLoadingRequests(false);
      setRequestsLoaded(true);
    }
  }, [eventId, registrationId]);

  useEffect(() => {
    if (filter === 'requests' && registrationId && !requestsLoaded) loadRequests();
  }, [filter, registrationId, requestsLoaded, loadRequests]);

  const handleRespond = async (connectionId: string, action: 'accept' | 'decline') => {
    if (!registrationId) return;
    setRespondingTo(connectionId);
    setConnectError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/connections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, action, registration_id: registrationId }),
      });
      if (!res.ok) throw new Error('failed');
      const accepted = incoming.find(r => r.connection_id === connectionId);
      setIncoming(prev => prev.filter(r => r.connection_id !== connectionId));
      // Reflect an accepted request in the directory immediately.
      if (action === 'accept' && accepted) {
        setPeople(prev => prev.map(p => p.id === accepted.person_id ? { ...p, connection_status: 'accepted' } : p));
      }
    } catch {
      setConnectError('Could not update the request. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  /* Not registered → gate, matching the mobile "Register to network" prompt. */
  if (!registrationId) {
    return (
      <div className="rounded-2xl py-16 px-6 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <Users size={36} strokeWidth={1.4} style={{ color: '#C9C3B1', margin: '0 auto 14px' }} />
        <p className="font-display font-semibold text-[16px] mb-1.5" style={{ color: '#0F1F18' }}>Register to network</p>
        <p className="text-[14px] max-w-sm mx-auto" style={{ color: '#6B7A72' }}>
          Register for this event to see who else is attending, get AI-matched, and start connecting.
        </p>
      </div>
    );
  }

  const connStatus = (id: string) => people.find(p => p.id === id)?.connection_status ?? null;

  const filteredPeople = people.filter(p => {
    const matchQ = !query || p.attendee_name.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === 'connected' ? p.connection_status === 'accepted' : true;
    return matchQ && matchF;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'connected', label: 'Connected' },
    { key: 'requests', label: 'Requests' },
    { key: 'suggested', label: 'Suggested' },
  ];

  function ConnectAction({ personId }: { personId: string }) {
    const status = connStatus(personId);
    if (status) return <StatusTag status={status} />;
    return (
      <button
        onClick={() => handleConnect(personId)}
        disabled={connecting === personId}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-opacity"
        style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', opacity: connecting === personId ? 0.5 : 1 }}
      >
        {connecting === personId ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
        {connecting === personId ? 'Sending…' : 'Connect'}
      </button>
    );
  }

  return (
    <div>
      {/* Header + Messages link */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-title font-bold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>People</h2>
        <Link
          href={messagesHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-full transition-colors"
          style={{ background: '#E8EFEB', color: '#1F4D3A', textDecoration: 'none' }}
        >
          <MessageCircle size={14} /> Messages
        </Link>
      </div>

      {/* Search + filter chips */}
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
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 shrink-0"
              style={{
                background: filter === t.key ? '#1F4D3A' : 'white',
                color: filter === t.key ? 'white' : '#6B7A72',
                border: `1px solid ${filter === t.key ? '#1F4D3A' : '#E5E0D4'}`,
              }}
            >
              {t.key === 'suggested' && <Sparkles size={12} />}
              {t.key === 'requests' && <Inbox size={12} />}
              {t.label}
              {t.key === 'requests' && incoming.length > 0 && (
                <span
                  className="inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-1.5 min-w-[18px] h-[18px]"
                  style={{
                    background: filter === 'requests' ? '#E8C57E' : '#1F4D3A',
                    color: filter === 'requests' ? '#163828' : 'white',
                  }}
                >
                  {incoming.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {connectError && (
        <p className="text-[12px] mb-3" style={{ color: '#B8423C' }}>{connectError}</p>
      )}

      {/* ── Requests (incoming / sent pending) ─────────────────── */}
      {filter === 'requests' ? (
        loadingRequests && !requestsLoaded ? (
          <div className="rounded-2xl py-16 flex flex-col items-center justify-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#1F4D3A' }} />
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Loading requests…</p>
          </div>
        ) : incoming.length === 0 && sent.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <Inbox size={24} className="mx-auto mb-3" style={{ color: '#6B7A72' }} />
            <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>No pending requests</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Requests you send or receive will appear here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Incoming */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Inbox size={15} style={{ color: '#1F4D3A' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6B7A72' }}>
                  Incoming · {incoming.length}
                </span>
              </div>
              {incoming.length === 0 ? (
                <p className="text-[13px]" style={{ color: '#6B7A72' }}>No incoming requests right now.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {incoming.map(r => (
                    <div key={r.connection_id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.name} size={48} />
                        <div className="flex-1 min-w-0">
                          <div className="font-display font-medium text-[15px] truncate" style={{ color: '#0F1F18' }}>{r.name}</div>
                          <div className="text-[12px]" style={{ color: '#6B7A72' }}>Wants to connect</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespond(r.connection_id, 'accept')}
                          disabled={respondingTo === r.connection_id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-full transition-opacity"
                          style={{ background: '#1F4D3A', color: 'white', opacity: respondingTo === r.connection_id ? 0.5 : 1 }}
                        >
                          {respondingTo === r.connection_id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleRespond(r.connection_id, 'decline')}
                          disabled={respondingTo === r.connection_id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-full transition-opacity"
                          style={{ border: '1px solid #E5E0D4', color: '#6B7A72', opacity: respondingTo === r.connection_id ? 0.5 : 1 }}
                        >
                          <X size={12} /> Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Send size={15} style={{ color: '#6B7A72' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6B7A72' }}>
                  Sent · {sent.length}
                </span>
              </div>
              {sent.length === 0 ? (
                <p className="text-[13px]" style={{ color: '#6B7A72' }}>You haven&apos;t sent any requests yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sent.map(r => (
                    <div key={r.connection_id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                      <Avatar name={r.name} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-medium text-[15px] truncate" style={{ color: '#0F1F18' }}>{r.name}</div>
                        <div className="text-[12px]" style={{ color: '#6B7A72' }}>Request sent</div>
                      </div>
                      <StatusTag status="pending" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      ) : filter === 'suggested' ? (
        loadingSuggestions ? (
          <div className="rounded-2xl py-16 flex flex-col items-center justify-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: '#1F4D3A' }} />
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Finding your best matches…</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <Sparkles size={24} className="mx-auto mb-3" style={{ color: '#6B7A72' }} />
            <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>No suggestions yet</p>
            <p className="text-[13px]" style={{ color: '#6B7A72' }}>Check back once more attendees have registered.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map(s => (
              <MatchCard key={s.matched_registration_id} match={s} onConnect={handleConnect} connecting={connecting} status={connStatus(s.matched_registration_id)} />
            ))}
          </div>
        )
      ) : (
        <>
          {/* Inline AI matches strip on the "All" view (parity with mobile "Suggested for you"). */}
          {filter === 'all' && suggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} style={{ color: '#C97A2D' }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#C97A2D' }}>Suggested for you</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.map(s => (
                  <MatchCard key={s.matched_registration_id} match={s} onConnect={handleConnect} connecting={connecting} status={connStatus(s.matched_registration_id)} />
                ))}
              </div>
            </div>
          )}

          {/* Directory */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#6B7A72' }}>
              All attendees · {people.length}
            </span>
            <div className="flex-1 h-px" style={{ background: '#E5E0D4' }} />
          </div>

          {loadingPeople && people.length === 0 ? (
            <div className="rounded-2xl py-16 flex flex-col items-center justify-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <Loader2 size={24} className="animate-spin" style={{ color: '#1F4D3A' }} />
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>Loading attendees…</p>
            </div>
          ) : peopleError ? (
            <div className="rounded-2xl py-14 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <p className="text-[14px] mb-3" style={{ color: '#B8423C' }}>{peopleError}</p>
              <button onClick={loadPeople} className="text-[13px] font-medium px-4 py-2 rounded-full" style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}>
                Retry
              </button>
            </div>
          ) : filteredPeople.length === 0 ? (
            <div className="rounded-2xl py-16 text-center" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
              <Users size={24} className="mx-auto mb-3" style={{ color: '#6B7A72' }} />
              <p className="text-[14px]" style={{ color: '#6B7A72' }}>
                {query || filter !== 'all' ? 'No attendees match your filter.' : 'No one here yet — check back soon.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPeople.map(person => {
                const subtitle = subtitleFor(person.custom_fields, person.ticket_types?.name);
                return (
                  <div key={person.id} className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                    <div className="flex items-center gap-3">
                      <Avatar name={person.attendee_name} size={48} />
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-medium text-[15px] truncate" style={{ color: '#0F1F18' }}>
                          {person.attendee_name}
                        </div>
                        <div className="text-[12px] truncate" style={{ color: '#6B7A72' }}>
                          {subtitle || 'Attendee'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <ConnectAction personId={person.id} />
                      <Link
                        href={`${messagesHref}${messagesHref.includes('?') ? '&' : '?'}to=${person.id}&name=${encodeURIComponent(person.attendee_name)}`}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors"
                        style={{ background: '#F0EDE8', color: '#3A4A42', textDecoration: 'none' }}
                      >
                        <MessageCircle size={12} /> Message
                      </Link>
                      {person.eventera_card_url && (
                        <a
                          href={person.eventera_card_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors"
                          style={{ color: '#1F4D3A', textDecoration: 'none' }}
                        >
                          <ExternalLink size={12} /> Card
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── AI match card ─────────────────────────────────────────────── */

function MatchCard({
  match, onConnect, connecting, status,
}: {
  match: MatchSuggestion;
  onConnect: (id: string) => void;
  connecting: string | null;
  status: string | null;
}) {
  const name = match.registration?.attendee_name ?? 'Attendee';
  const subtitle = subtitleFor(match.registration?.custom_fields);
  const personId = match.matched_registration_id;

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'white', border: '1.5px solid #E8C57E' }}>
      <div className="flex items-start gap-3">
        <Avatar name={name} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="font-display font-medium text-[15px] truncate flex-1" style={{ color: '#0F1F18' }}>{name}</div>
            <ScoreBadge score={match.score} />
          </div>
          {subtitle && <div className="text-[12px] truncate mt-0.5" style={{ color: '#6B7A72' }}>{subtitle}</div>}
        </div>
      </div>

      {match.reason && (
        <p className="text-[12px] leading-relaxed px-3 py-2 rounded-xl" style={{ background: '#FBF5E8', color: '#3A4A42' }}>
          {match.reason}
        </p>
      )}

      <div>
        {status ? (
          <StatusTag status={status} />
        ) : (
          <button
            onClick={() => onConnect(personId)}
            disabled={connecting === personId}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-opacity"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', opacity: connecting === personId ? 0.5 : 1 }}
          >
            {connecting === personId ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
            {connecting === personId ? 'Sending…' : 'Connect'}
          </button>
        )}
      </div>
    </div>
  );
}
