'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, X, Check } from 'lucide-react';

interface Attendee {
  id: string;
  attendee_name: string;
  eventera_card_url: string | null;
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  registrationId: string | null;
  qrToken?: string | null;
  /** Dashboard mode: chrome handled by the shell. */
  embedded?: boolean;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function hue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return 120 + (h % 80); // forest-adjacent greens
}

export function SpeedNetworkingClient({ eventId, eventName, eventSlug, registrationId, qrToken, embedded = false }: Props) {
  const [deck, setDeck] = useState<Attendee[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectedCount, setConnectedCount] = useState(0);
  const [fly, setFly] = useState<'left' | 'right' | null>(null);

  const canNetwork = !!registrationId;

  const load = useCallback(async () => {
    if (!canNetwork) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/connections?reg=${registrationId}&token=${qrToken ?? ''}`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'Could not load attendees');
      setDeck(Array.isArray(json.people) ? json.people : []);
      setIndex(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load attendees');
    } finally {
      setLoading(false);
    }
  }, [eventId, registrationId, qrToken, canNetwork]);

  useEffect(() => { load(); }, [load]);

  const current = deck[index];
  const behind1 = deck[index + 1];
  const behind2 = deck[index + 2];

  const advance = useCallback((dir: 'left' | 'right') => {
    setFly(dir);
    setTimeout(() => {
      setFly(null);
      setIndex(i => i + 1);
    }, 320);
  }, []);

  async function skip() {
    if (connecting || fly) return;
    advance('left');
  }

  async function connect() {
    if (connecting || fly || !current || !registrationId) return;
    setConnecting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/connections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requester_id: registrationId, recipient_id: current.id, qr_code_token: qrToken }),
      });
      if (res.ok) setConnectedCount(c => c + 1);
      // Advance regardless — a duplicate/failed request shouldn't trap the deck.
      advance('right');
    } finally {
      setConnecting(false);
    }
  }

  const done = !loading && !error && canNetwork && index >= deck.length && deck.length > 0;
  const empty = !loading && !error && canNetwork && deck.length === 0;

  return (
    <div style={embedded ? undefined : { background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header — hidden in the dashboard, where tabs provide context */}
      {!embedded && (
      <div
        className="px-5 py-4 border-b flex items-center gap-3"
        style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
      >
        <Link
          href={`/e/${eventSlug}`}
          className="flex items-center gap-1.5 text-[13px] transition hover:opacity-70"
          style={{ color: '#65736B', textDecoration: 'none' }}
        >
          <ArrowLeft size={15} /> {eventName}
        </Link>
      </div>
      )}

      <div className="max-w-sm mx-auto px-5 pt-8 pb-12 flex flex-col items-center">
        <div className="text-center mb-6">
          <h1
            className="font-display font-semibold text-[24px] leading-tight"
            style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
          >
            Meet people
          </h1>
          <p className="text-[13px] mt-1.5" style={{ color: '#65736B' }}>
            Skip or connect. Connected{' '}
            <strong style={{ color: '#0F1F18' }}>{connectedCount}</strong> so far.
          </p>
        </div>

        {/* Not registered */}
        {!canNetwork && (
          <div
            className="rounded-2xl p-8 text-center w-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <p className="text-[14px]" style={{ color: '#65736B', lineHeight: 1.6 }}>
              Register for this event to meet other attendees.
            </p>
            <Link
              href={`/e/${eventSlug}/register`}
              className="inline-block mt-4 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE', textDecoration: 'none' }}
            >
              Register
            </Link>
          </div>
        )}

        {/* Loading */}
        {canNetwork && loading && (
          <div
            className="rounded-2xl w-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', aspectRatio: '3 / 4.2' }}
          >
            <div className="h-full w-full animate-pulse rounded-2xl" style={{ background: '#F0EBE3' }} />
          </div>
        )}

        {/* Error */}
        {canNetwork && error && (
          <div
            className="rounded-2xl p-8 text-center w-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <p className="text-[14px] mb-4" style={{ color: '#B8423C' }}>{error}</p>
            <button
              onClick={load}
              className="px-5 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {empty && (
          <div
            className="rounded-2xl p-8 text-center w-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <p className="text-[14px]" style={{ color: '#65736B', lineHeight: 1.6 }}>
              No one new to meet yet. Check back once more attendees have joined.
            </p>
          </div>
        )}

        {/* Done */}
        {done && (
          <div
            className="rounded-2xl p-8 text-center w-full"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#E8EFEB' }}
            >
              <Check size={24} strokeWidth={2.5} color="#1F4D3A" />
            </div>
            <h2
              className="font-display font-normal text-[22px] mb-2"
              style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
            >
              That&rsquo;s everyone
            </h2>
            <p className="text-[13px]" style={{ color: '#65736B', lineHeight: 1.6 }}>
              You sent {connectedCount} connection{connectedCount === 1 ? '' : 's'}. They&rsquo;ll get an
              email and can accept from their own dashboard.
            </p>
            <button
              onClick={load}
              className="mt-5 px-5 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}
            >
              Refresh deck
            </button>
          </div>
        )}

        {/* Deck */}
        {canNetwork && !loading && !error && current && (
          <>
            <div className="relative w-full" style={{ aspectRatio: '3 / 4.2', maxWidth: 340 }}>
              {/* behind cards */}
              {behind2 && (
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    transform: 'scale(0.9) translateY(28px)',
                    opacity: 0.4,
                    zIndex: 1,
                  }}
                />
              )}
              {behind1 && (
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    transform: 'scale(0.95) translateY(14px)',
                    opacity: 0.7,
                    zIndex: 2,
                  }}
                />
              )}

              {/* top card */}
              <div
                className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  boxShadow: '0 18px 44px rgba(15,31,24,0.18)',
                  zIndex: 3,
                  transition: fly ? 'transform 0.32s ease, opacity 0.32s ease' : 'none',
                  transform: fly === 'left'
                    ? 'translateX(-120%) rotate(-14deg)'
                    : fly === 'right'
                      ? 'translateX(120%) rotate(14deg)'
                      : 'none',
                  opacity: fly ? 0 : 1,
                }}
              >
                {/* stamps */}
                <div
                  className="absolute top-6 left-5 px-4 py-1.5 rounded-lg font-display font-semibold text-[20px] tracking-wider"
                  style={{
                    color: '#2D7A4F',
                    border: '3px solid #2D7A4F',
                    transform: 'rotate(-12deg)',
                    opacity: fly === 'right' ? 1 : 0,
                    transition: 'opacity 0.15s',
                    zIndex: 5,
                  }}
                >
                  CONNECT
                </div>
                <div
                  className="absolute top-6 right-5 px-4 py-1.5 rounded-lg font-display font-semibold text-[20px] tracking-wider"
                  style={{
                    color: '#65736B',
                    border: '3px solid #65736B',
                    transform: 'rotate(12deg)',
                    opacity: fly === 'left' ? 1 : 0,
                    transition: 'opacity 0.15s',
                    zIndex: 5,
                  }}
                >
                  SKIP
                </div>

                {/* photo / placeholder */}
                <div className="flex-1 relative flex items-center justify-center" style={{ background: `hsl(${hue(current.id)}, 32%, 90%)` }}>
                  {current.eventera_card_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={current.eventera_card_url}
                      alt={current.attendee_name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center font-display font-semibold text-[30px]"
                      style={{ background: '#1F4D3A', color: '#E8C57E' }}
                    >
                      {initials(current.attendee_name)}
                    </div>
                  )}
                </div>

                {/* info */}
                <div className="p-5">
                  <div
                    className="font-display font-medium text-[20px]"
                    style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}
                  >
                    {current.attendee_name}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: '#65736B' }}>
                    Attendee at {eventName}
                  </div>
                </div>
              </div>
            </div>

            {/* controls */}
            <div className="flex items-center gap-5 mt-8">
              <button
                onClick={skip}
                disabled={connecting || !!fly}
                aria-label="Skip"
                className="w-16 h-16 rounded-full flex items-center justify-center transition hover:scale-105 disabled:opacity-50"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 2px 8px rgba(15,31,24,0.06)' }}
              >
                <X size={26} strokeWidth={2.2} color="#65736B" />
              </button>
              <button
                onClick={connect}
                disabled={connecting || !!fly}
                aria-label="Connect"
                className="w-16 h-16 rounded-full flex items-center justify-center transition hover:scale-105 disabled:opacity-50"
                style={{ background: '#1F4D3A', border: '1px solid #1F4D3A', boxShadow: '0 2px 8px rgba(15,31,24,0.12)' }}
              >
                <Heart size={24} strokeWidth={2.2} color="#E8C57E" fill="#E8C57E" />
              </button>
            </div>

            <p className="text-[12px] mt-4" style={{ color: '#65736B' }}>
              Skip stays private — they never know.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
