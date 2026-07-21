'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Search, X, Check, ArrowLeft, CameraOff, Clock, CloudOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { extractToken } from '@/lib/qr/token';

interface Props { eventId: string; eventSlug: string; eventName: string; }

type KioskState = 'scan' | 'search' | 'success' | 'already' | 'error';

interface AttendeeResult {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string;
  qr_code_token: string;
  ticket_types: { name: string } | null;
}

function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(); osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export function KioskClient({ eventId, eventSlug, eventName }: Props) {
  const [state, setState] = useState<KioskState>('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AttendeeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [checkedInAttendee, setCheckedInAttendee] = useState<{ name: string | null; ticket: string | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('Please see a crew member for help.');
  // 'ticket' = the server judged this ticket and said no. 'system' = we never
  // got a verdict. A guest must never read the second as the first.
  const [errorKind, setErrorKind] = useState<'ticket' | 'system'>('ticket');
  const [countdown, setCountdown] = useState(6);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [exitHold, setExitHold] = useState(0);
  const [alreadyIn, setAlreadyIn] = useState<{ name: string | null; at: string | null } | null>(null);

  const router = useRouter();
  const exitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchSeqRef = useRef(0);

  const startCountdown = useCallback(() => {
    setCountdown(6);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setState('scan');
          setCheckedInAttendee(null);
          setAlreadyIn(null);
          setSearchQuery('');
          setResults([]);
          return 6;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  // Check in by token (from camera) or by reg's token (from manual search)
  const checkInByToken = useCallback(async (token: string) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_token: token }),
      });
      const data = await res.json().catch(() => ({})) as {
        result?: string; message?: string; error?: string; attendee_name?: string;
        ticket_type?: string | null; checked_in_at?: string;
      };
      // No verdict in the response — a 500, or (on a tablet that has been
      // sitting in a lobby all day) the organizer's session finally expiring.
      // This used to fall through to the else branch below and tell a guest
      // holding a perfectly good ticket that it was "not recognised", while the
      // real fix was for a crew member to sign the tablet back in.
      if (!res.ok || !data.result) {
        beep(false);
        setErrorKind('system');
        setErrorMsg(
          res.status === 401
            ? 'This kiosk needs to be signed in again. Please see a crew member.'
            : 'We could not reach the check-in system. Please see a crew member — your ticket is fine.',
        );
        setState('error');
        setTimeout(() => setState('scan'), 3500);
      } else if (data.result === 'success') {
        beep(true);
        setCheckedInAttendee({ name: data.attendee_name ?? null, ticket: data.ticket_type ?? null });
        setState('success');
        startCountdown();
      } else if (data.result === 'already_checked_in') {
        // Previously this showed the same green "Welcome, X!" as a fresh
        // check-in. On an UNATTENDED kiosk that turns one screenshotted QR into
        // an unlimited entry pass — everybody who scans it gets waved in and
        // nobody is watching. Distinct amber state, and it points at a human.
        beep(false);
        setAlreadyIn({ name: data.attendee_name ?? null, at: data.checked_in_at ?? null });
        setState('already');
        startCountdown();
      } else {
        beep(false);
        setErrorKind('ticket');
        setErrorMsg(data.message ?? 'Ticket not recognised.');
        setState('error');
        setTimeout(() => setState('scan'), 3500);
      }
    } catch {
      beep(false);
      setErrorKind('system');
      setErrorMsg('No connection to the check-in system. Please see a crew member — your ticket is fine.');
      setState('error');
      setTimeout(() => setState('scan'), 3500);
    } finally {
      // brief debounce so one QR isn't read repeatedly
      setTimeout(() => { processingRef.current = false; }, 2500);
    }
  }, [eventId, startCountdown]);

  // kiosk=1: this screen stands unattended in a lobby, so the server returns a
  // short, masked result set (see the check-in route). Debounced and sequenced
  // so a lobby full of people typing does not put a request on the wire per
  // keystroke, and so a slow early response cannot repaint a later query.
  const KIOSK_MIN_QUERY = 3;
  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < KIOSK_MIN_QUERY) { setResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const seq = ++searchSeqRef.current;
      try {
        const res = await fetch(`/api/events/${eventId}/checkin?kiosk=1&q=${encodeURIComponent(q)}`);
        const data = await res.json().catch(() => ({ results: [] }));
        if (seq !== searchSeqRef.current) return;
        setResults(data.results ?? []);
      } catch {
        if (seq === searchSeqRef.current) setResults([]);
      } finally {
        if (seq === searchSeqRef.current) setSearching(false);
      }
    }, 300);
  }

  function openSearch() {
    setState('search');
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  // Camera lifecycle — only while in 'scan' state
  useEffect(() => {
    if (state !== 'scan') return;
    let cancelled = false;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    setCameraError(null);

    // Plain-http venue network, in-app webview, or an old browser — zxing
    // throws something unreadable here, so name the cause ourselves.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('unavailable');
      return;
    }

    const reader = new BrowserMultiFormatReader();
    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        if (cancelled) return;
        const deviceId =
          devices.find(d => /back|rear|environment/i.test(d.label))?.deviceId ?? devices[0]?.deviceId;
        return reader.decodeFromVideoDevice(deviceId ?? undefined, videoEl, (result) => {
          if (result) {
            const token = extractToken(result.getText());
            if (token) checkInByToken(token);
          }
        });
      })
      .then(controls => {
        if (cancelled) { controls?.stop(); return; }
        controlsRef.current = controls ?? null;
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : '';
        setCameraError(/denied|permission|not allowed/i.test(msg) ? 'blocked' : 'unavailable');
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [state, retry, checkInByToken]);

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

  // Hold-to-exit: 2s of sustained press before we leave for the dashboard.
  const EXIT_HOLD_MS = 2000;
  const beginExitHold = useCallback(() => {
    const startedAt = Date.now();
    exitTimerRef.current = setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / EXIT_HOLD_MS);
      setExitHold(progress);
      if (progress >= 1) {
        if (exitTimerRef.current) clearInterval(exitTimerRef.current);
        exitTimerRef.current = null;
        router.push(`/events/${eventSlug}/check-in`);
      }
    }, 50);
  }, [router, eventSlug]);

  const cancelExitHold = useCallback(() => {
    if (exitTimerRef.current) clearInterval(exitTimerRef.current);
    exitTimerRef.current = null;
    setExitHold(0);
  }, []);

  useEffect(() => () => { if (exitTimerRef.current) clearInterval(exitTimerRef.current); }, []);

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col items-center justify-center select-none"
      style={{ background: 'linear-gradient(160deg, #0F1F18 0%, #1A3D2B 50%, #0F1F18 100%)' }}>

      {/* Exit — press and HOLD.
          This tablet sits unattended in a lobby, signed in as the organizer. A
          plain link here meant any attendee could tap "Exit kiosk" once and land
          in the full organizer dashboard: every attendee's name, email and
          phone, plus settings and billing. Requiring a deliberate 2s hold (with
          visible progress) removes the casual tap without needing a PIN screen. */}
      <button
        onPointerDown={beginExitHold}
        onPointerUp={cancelExitHold}
        onPointerLeave={cancelExitHold}
        onPointerCancel={cancelExitHold}
        aria-label="Hold to exit kiosk mode"
        className="absolute top-6 left-6 flex items-center gap-2 px-3 min-h-[44px] rounded-xl text-[13px] font-medium transition z-30 overflow-hidden"
        style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', touchAction: 'none' }}>
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 pointer-events-none transition-none"
          style={{ width: `${exitHold * 100}%`, background: 'rgba(232,197,126,0.28)' }}
        />
        <ArrowLeft size={14} className="relative" />
        <span className="relative">{exitHold > 0 ? 'Keep holding…' : 'Hold to exit'}</span>
      </button>
      <div className="absolute top-6 right-6 text-[12px] font-semibold tracking-[0.1em] uppercase z-30"
        style={{ color: 'rgba(255,255,255,0.3)' }}>
        {eventName}
      </div>

      {/* SCAN STATE */}
      {state === 'scan' && (
        <div className="flex flex-col items-center w-full h-full justify-center">
          {/* Live camera */}
          {!cameraError && (
            <div className="relative rounded-3xl overflow-hidden mb-8" style={{ width: 320, height: 320, maxWidth: '80vw', maxHeight: '80vw' }}>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              {/* Corner brackets */}
              {(['tl','tr','bl','br'] as const).map(c => (
                <span key={c} className="absolute" style={{
                  width: 44, height: 44,
                  top: c.startsWith('t') ? 12 : 'auto', bottom: c.startsWith('b') ? 12 : 'auto',
                  left: c.endsWith('l') ? 12 : 'auto', right: c.endsWith('r') ? 12 : 'auto',
                  borderTop: c.startsWith('t') ? '3px solid #E8C57E' : 'none',
                  borderBottom: c.startsWith('b') ? '3px solid #E8C57E' : 'none',
                  borderLeft: c.endsWith('l') ? '3px solid #E8C57E' : 'none',
                  borderRight: c.endsWith('r') ? '3px solid #E8C57E' : 'none',
                  borderRadius: c === 'tl' ? '10px 0 0 0' : c === 'tr' ? '0 10px 0 0' : c === 'bl' ? '0 0 0 10px' : '0 0 10px 0',
                }} />
              ))}
            </div>
          )}

          {/* Camera blocked / unavailable */}
          {cameraError && (
            <div className="flex flex-col items-center mb-8 text-center px-6">
              <div className="w-16 h-16 rounded-full grid place-items-center mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <CameraOff size={26} style={{ color: 'rgba(255,255,255,0.4)' }} />
              </div>
              <div className="text-[16px] font-medium mb-1" style={{ color: '#FAF6EE' }}>
                {cameraError === 'blocked' ? 'Camera access blocked' : 'Camera unavailable'}
              </div>
              <p className="text-[13px] max-w-[280px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {cameraError === 'blocked'
                  ? 'Allow camera access in your browser, then tap Try again — or search by name.'
                  : 'Search attendees by name instead.'}
              </p>
              {/* Offered for BOTH causes. A camera that failed to start once —
                  another tab holding it, a tablet waking from sleep — used to
                  leave the kiosk search-only until someone reloaded the page,
                  and nobody is standing there to reload it. */}
              <button onClick={() => { setCameraError(null); setRetry(r => r + 1); }}
                className="mt-4 px-5 min-h-[44px] rounded-full text-[14px] font-semibold transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                Try again
              </button>
            </div>
          )}

          <h2 className="font-display font-bold text-[28px] mb-2 text-center px-6" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            {cameraError ? 'Find your registration' : 'Scan your ticket'}
          </h2>
          {!cameraError && (
            <p className="text-[14px] mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Hold your QR code up to the camera
            </p>
          )}
          <button onClick={openSearch}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Search size={16} /> Search by name instead
          </button>
        </div>
      )}

      {/* SEARCH STATE */}
      {state === 'search' && (
        <div className="w-full max-w-lg px-6">
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Type your full name…"
              aria-label="Search for your registration by name or email"
              className="w-full pl-11 pr-12 py-4 rounded-2xl text-[16px] outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(232,197,126,0.4)', color: '#FAF6EE' }}
            />
            <button onClick={() => { setState('scan'); setSearchQuery(''); setResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <X size={18} />
            </button>
          </div>

          {searching && <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Searching…</div>}

          {results.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {results.map((r, i) => (
                <button key={r.id} onClick={() => r.status !== 'checked_in' && checkInByToken(r.qr_code_token)}
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
                  <div className="text-[12.5px] px-2 py-1 rounded-full" style={{
                    background: r.status === 'checked_in' ? 'rgba(45,122,79,0.2)' : 'rgba(232,197,126,0.15)',
                    color: r.status === 'checked_in' ? '#2D7A4F' : '#E8C57E',
                  }}>
                    {r.status === 'checked_in' ? 'Checked in' : 'Tap to check in'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.trim().length > 0 && searchQuery.trim().length < KIOSK_MIN_QUERY && (
            <div className="text-center py-8 text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Keep typing your name…
            </div>
          )}

          {!searching && searchQuery.trim().length >= KIOSK_MIN_QUERY && results.length === 0 && (
            <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              No registrations found for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* SUCCESS STATE */}
      {state === 'success' && checkedInAttendee && (
        <div className="flex flex-col items-center text-center px-6"
          onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); setState('scan'); setCheckedInAttendee(null); }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'rgba(45,122,79,0.2)', border: '2px solid #2D7A4F', animation: 'successPop 0.4s ease-out' }}>
            <Check size={36} style={{ color: '#2D7A4F' }} />
          </div>
          <h2 className="font-display font-bold text-[36px] mb-1" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            Welcome, {checkedInAttendee.name?.split(' ')[0] ?? 'friend'}!
          </h2>
          <p className="text-[16px] mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {checkedInAttendee.ticket ?? 'General'} · Checked in
          </p>
          <p className="text-[13px] mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Returning to scan in {countdown}s · Tap to continue
          </p>
        </div>
      )}

      {/* ALREADY-CHECKED-IN STATE — deliberately NOT the green welcome. */}
      {state === 'already' && alreadyIn && (
        <div className="flex flex-col items-center text-center px-6"
          onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); setState('scan'); setAlreadyIn(null); }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: 'rgba(201,122,45,0.2)', border: '2px solid #C97A2D' }}>
            <Clock size={34} style={{ color: '#C97A2D' }} />
          </div>
          <h2 className="font-display font-bold text-[32px] mb-1" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
            Already checked in
          </h2>
          <p className="text-[16px] mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {alreadyIn.name ?? 'This ticket'}
            {alreadyIn.at && ` · ${new Date(alreadyIn.at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`}
          </p>
          <p className="text-[15px] mt-3 max-w-[320px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
            This ticket has already been used. Please see a crew member.
          </p>
          <p className="text-[13px] mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Returning to scan in {countdown}s · Tap to continue
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {state === 'error' && (
        <div className="flex flex-col items-center text-center px-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={errorKind === 'system'
              ? { background: 'rgba(201,122,45,0.2)', border: '2px solid #C97A2D' }
              : { background: 'rgba(184,66,60,0.2)', border: '2px solid #B8423C' }}>
            {errorKind === 'system'
              ? <CloudOff size={34} style={{ color: '#C97A2D' }} />
              : <X size={36} style={{ color: '#B8423C' }} />}
          </div>
          <h2 className="font-display font-bold text-[28px] mb-2" style={{ color: '#FAF6EE' }}>
            {errorKind === 'system' ? 'Check-in is offline' : "Couldn't check in"}
          </h2>
          <p className="max-w-[300px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{errorMsg}</p>
        </div>
      )}

      <style>{`
        @keyframes successPop {
          0% { transform: scale(0.6); opacity: 0; }
          80% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
