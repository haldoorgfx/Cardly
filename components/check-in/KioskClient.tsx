'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, X, Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props { eventId: string; eventName: string; }

type KioskState = 'scan' | 'search' | 'success' | 'error';

interface AttendeeResult {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string;
  ticket_types: { name: string } | null;
}

export function KioskClient({ eventId, eventName }: Props) {
  const [state, setState] = useState<KioskState>('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AttendeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkedInAttendee, setCheckedInAttendee] = useState<AttendeeResult | null>(null);
  const [countdown, setCountdown] = useState(6);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const startCountdown = useCallback(() => {
    setCountdown(6);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!);
          setState('scan');
          setCheckedInAttendee(null);
          setSearchQuery('');
          return 6;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  async function checkIn(regId: string) {
    const res = await fetch(`/api/events/${eventId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId: regId }),
    });
    if (res.ok) {
      const found = results.find(r => r.id === regId) ?? null;
      setCheckedInAttendee(found);
      setState('success');
      startCountdown();
    } else {
      setState('error');
      setTimeout(() => setState('scan'), 3000);
    }
  }

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/events/${eventId}/checkin?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data);
    }
    setSearching(false);
  }

  function openSearch() {
    setState('search');
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center select-none"
      style={{ background: 'linear-gradient(160deg, #0F1F18 0%, #1A3D2B 50%, #0F1F18 100%)' }}
      onClick={() => state === 'scan' && openSearch()}>

      {/* Back button */}
      <Link href={`/events/${eventId}/check-in`}
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition hover:opacity-70 z-10"
        style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)' }}
        onClick={e => e.stopPropagation()}>
        <ArrowLeft size={14} /> Exit kiosk
      </Link>

      {/* Event name */}
      <div className="absolute top-6 right-6 text-[12px] font-semibold tracking-[0.1em] uppercase z-10"
        style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {eventName}
      </div>

      {/* SCAN STATE */}
      {state === 'scan' && (
        <div className="flex flex-col items-center">
          {/* Scan frame */}
          <div className="relative mb-8" style={{ width: 260, height: 260 }}>
            {/* Animated corner brackets */}
            {[
              { top: 0, left: 0, borderTop: '3px solid #E8C57E', borderLeft: '3px solid #E8C57E', borderRadius: '12px 0 0 0' },
              { top: 0, right: 0, borderTop: '3px solid #E8C57E', borderRight: '3px solid #E8C57E', borderRadius: '0 12px 0 0' },
              { bottom: 0, left: 0, borderBottom: '3px solid #E8C57E', borderLeft: '3px solid #E8C57E', borderRadius: '0 0 0 12px' },
              { bottom: 0, right: 0, borderBottom: '3px solid #E8C57E', borderRight: '3px solid #E8C57E', borderRadius: '0 0 12px 0' },
            ].map((s, i) => (
              <div key={i} className="absolute" style={{ ...s, width: 40, height: 40 }} />
            ))}
            {/* Scanline */}
            <div className="absolute left-4 right-4" style={{ top: '50%', height: 2, background: 'rgba(232,197,126,0.5)', boxShadow: '0 0 12px rgba(232,197,126,0.6)', animation: 'scanline 2s ease-in-out infinite' }} />
            {/* Center QR placeholder */}
            <div className="absolute inset-8 flex items-center justify-center rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
              <svg viewBox="0 0 80 80" width={60} height={60} style={{ opacity: 0.15 }}>
                <rect x="4" y="4" width="32" height="32" rx="4" fill="none" stroke="#FAF6EE" strokeWidth="4"/>
                <rect x="44" y="4" width="32" height="32" rx="4" fill="none" stroke="#FAF6EE" strokeWidth="4"/>
                <rect x="4" y="44" width="32" height="32" rx="4" fill="none" stroke="#FAF6EE" strokeWidth="4"/>
                <rect x="12" y="12" width="16" height="16" fill="#FAF6EE"/>
                <rect x="52" y="12" width="16" height="16" fill="#FAF6EE"/>
                <rect x="12" y="52" width="16" height="16" fill="#FAF6EE"/>
                <rect x="48" y="48" width="8" height="8" fill="#FAF6EE"/>
                <rect x="60" y="48" width="8" height="8" fill="#FAF6EE"/>
                <rect x="48" y="60" width="8" height="8" fill="#FAF6EE"/>
                <rect x="60" y="60" width="8" height="8" fill="#FAF6EE"/>
              </svg>
            </div>
          </div>

          <h2 className="font-display font-bold text-[28px] mb-2" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            Scan your ticket
          </h2>
          <p className="text-[14px] mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Hold your QR code up to the camera
          </p>
          <button
            onClick={e => { e.stopPropagation(); openSearch(); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Search size={16} /> Search by name instead
          </button>
          <p className="text-[12px] mt-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Tap anywhere to search
          </p>
        </div>
      )}

      {/* SEARCH STATE */}
      {state === 'search' && (
        <div className="w-full max-w-lg px-6" onClick={e => e.stopPropagation()}>
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-11 pr-12 py-4 rounded-2xl text-[16px] outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(232,197,126,0.4)', color: '#FAF6EE' }}
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => { setState('scan'); setSearchQuery(''); setResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={18} />
            </button>
          </div>

          {searching && (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Searching…</div>
          )}

          {results.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {results.map((r, i) => (
                <button key={r.id} onClick={() => checkIn(r.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 transition hover:bg-white/5 text-left"
                  style={{ borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined, background: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0"
                    style={{ background: 'rgba(232,197,126,0.15)', color: '#E8C57E' }}>
                    {(r.attendee_name ?? 'A').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate" style={{ color: '#FAF6EE' }}>{r.attendee_name ?? 'Unknown'}</div>
                    <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.attendee_email} · {r.ticket_types?.name ?? 'General'}</div>
                  </div>
                  <div className="text-[11px] px-2 py-1 rounded-full" style={{
                    background: r.status === 'checked_in' ? 'rgba(45,122,79,0.2)' : 'rgba(232,197,126,0.15)',
                    color: r.status === 'checked_in' ? '#2D7A4F' : '#E8C57E',
                  }}>
                    {r.status === 'checked_in' ? 'Checked in' : 'Tap to check in'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && results.length === 0 && (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No registrations found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* SUCCESS STATE */}
      {state === 'success' && checkedInAttendee && (
        <div className="flex flex-col items-center text-center px-6" onClick={() => { clearInterval(countdownRef.current!); setState('scan'); setCheckedInAttendee(null); }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'rgba(45,122,79,0.2)', border: '2px solid #2D7A4F', animation: 'successPop 0.4s ease-out' }}>
            <Check size={36} style={{ color: '#2D7A4F' }} />
          </div>
          <h2 className="font-display font-bold text-[36px] mb-1" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            Welcome, {checkedInAttendee.attendee_name?.split(' ')[0] ?? 'friend'}!
          </h2>
          <p className="text-[16px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {checkedInAttendee.ticket_types?.name ?? 'General'} · Checked in
          </p>
          <p className="text-[13px] mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Returning to scan in {countdown}s · Tap to continue
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {state === 'error' && (
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(184,66,60,0.2)', border: '2px solid #B8423C' }}>
            <X size={36} style={{ color: '#B8423C' }} />
          </div>
          <h2 className="font-display font-bold text-[28px] mb-2" style={{ color: '#FAF6EE' }}>Check-in failed</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Please see a crew member for help.</p>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%, 100% { transform: translateY(-60px); }
          50% { transform: translateY(60px); }
        }
        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          80% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
