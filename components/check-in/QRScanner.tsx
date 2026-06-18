'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { X, Search, Check, Clock } from 'lucide-react';
import Link from 'next/link';
import { extractToken } from '@/lib/qr/token';

type ScanResult =
  | { kind: 'success'; name: string; email: string; ticket_type: string | null }
  | { kind: 'already_checked_in'; name: string; checked_in_at: string; ticket_type: string | null }
  | { kind: 'invalid'; message: string };

type SearchResult = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  status: string;
  checked_in_at: string | null;
  qr_code_token: string;
  ticket_types: { name: string } | null;
};

interface Props {
  eventId: string;
  eventSlug: string;
  eventName: string;
  totalRegistrations: number;
  initialCheckedIn: number;
  onCheckedIn?: () => void;
  onClose?: () => void;
}

function beep(type: 'ok' | 'warn' | 'err') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = type === 'ok' ? 880 : type === 'warn' ? 440 : 200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export function QRScanner({ eventId, eventSlug, eventName, totalRegistrations, initialCheckedIn, onCheckedIn, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [flash, setFlash] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [requesting, setRequesting] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [manualCheckingIn, setManualCheckingIn] = useState<string | null>(null);

  const handleToken = useCallback(async (token: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_token: token }),
      });
      const data = await res.json() as {
        result: string; message: string;
        attendee_name?: string; attendee_email?: string; checked_in_at?: string;
        ticket_type?: string | null;
      };

      if (data.result === 'success') {
        beep('ok');
        setCheckedIn(c => c + 1);
        onCheckedIn?.();
        setFlash({ kind: 'success', name: data.attendee_name ?? '', email: data.attendee_email ?? '', ticket_type: data.ticket_type ?? null });
      } else if (data.result === 'already_checked_in') {
        beep('warn');
        setFlash({ kind: 'already_checked_in', name: data.attendee_name ?? '', checked_in_at: data.checked_in_at ?? '', ticket_type: data.ticket_type ?? null });
      } else {
        beep('err');
        setFlash({ kind: 'invalid', message: data.message ?? 'Invalid QR code' });
      }
    } catch {
      beep('err');
      setFlash({ kind: 'invalid', message: 'Network error' });
    }

    // Show flash for 2.5 s then resume scanning
    setTimeout(() => {
      setFlash(null);
      processingRef.current = false;
    }, 2500);
  }, [eventId, onCheckedIn]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: SearchResult[] };
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [eventId]);

  const handleManualCheckin = useCallback(async (reg: SearchResult) => {
    if (reg.status === 'checked_in') return;
    setManualCheckingIn(reg.id);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code_token: reg.qr_code_token }),
      });
      const data = await res.json() as { result: string; attendee_name?: string };
      if (data.result === 'success') {
        beep('ok');
        setCheckedIn(c => c + 1);
        onCheckedIn?.();
        setSearchResults(prev => prev.map(r => r.id === reg.id ? { ...r, status: 'checked_in', checked_in_at: new Date().toISOString() } : r));
      }
    } catch {
      beep('err');
    } finally {
      setManualCheckingIn(null);
    }
  }, [eventId, onCheckedIn]);

  useEffect(() => {
    let cancelled = false;
    setCameraError(null);
    setRequesting(true);

    const videoEl = videoRef.current;
    if (!videoEl) { setRequesting(false); return; }

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then(devices => {
        if (cancelled) return;
        // Prefer rear/environment-facing camera on mobile
        const deviceId =
          devices.find(d => /back|rear|environment/i.test(d.label))?.deviceId ??
          devices[0]?.deviceId;

        return reader.decodeFromVideoDevice(
          deviceId ?? undefined,
          videoEl,
          (result, err) => {
            if (result) {
              const token = extractToken(result.getText());
              if (token) handleToken(token);
            }
            if (err && err?.name !== 'NotFoundException') console.error(err);
          },
        );
      })
      .then(controls => {
        if (cancelled) { controls?.stop(); return; }
        controlsRef.current = controls ?? null;
        setRequesting(false);
      })
      .catch(e => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Camera not available';
        setCameraError(/denied|permission|not allowed/i.test(msg) ? 'Permission denied' : msg);
        setRequesting(false);
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleToken, retryCount]);

  // Show a spinner while camera permission is being requested
  if (requesting && !cameraError && !manualMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0A0F0C' }}>
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: 'rgba(232,197,126,0.4)', borderTopColor: 'transparent' }} />
        <div className="text-[14px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Starting camera…</div>
      </div>
    );
  }

  if (cameraError && !manualMode) {
    const isDenied = /denied|permission|not allowed/i.test(cameraError);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#0A0F0C' }}>
        {/* Icon */}
        <div className="mb-5 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <line x1="1" y1="1" x2="23" y2="23" stroke="rgba(184,66,60,0.7)" strokeWidth="2"/>
          </svg>
        </div>

        <div className="text-[17px] font-medium mb-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {isDenied ? 'Camera access blocked' : 'Camera unavailable'}
        </div>
        <div className="text-[13px] mb-2 max-w-[260px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {isDenied
            ? 'Allow camera access in your browser settings, then tap Try again.'
            : cameraError}
        </div>
        {isDenied && (
          <div className="text-[11px] mb-6 max-w-[240px] px-3 py-2 rounded-xl" style={{ color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
            On iPhone: Settings → Safari → Camera → Allow<br/>
            On Android: tap the 🔒 in the address bar → Camera
          </div>
        )}
        {!isDenied && <div className="mb-6" />}

        {/* Primary: retry camera */}
        <button
          onClick={() => { setCameraError(null); setRetryCount(c => c + 1); }}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-medium mb-3 transition-opacity active:opacity-70"
          style={{ background: '#1F4D3A', color: 'white' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Try again
        </button>

        {/* Secondary: manual search */}
        <button
          onClick={() => setManualMode(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium mb-4"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <Search size={14} /> Search by name / email
        </button>

        <Link href={`/events/${eventSlug}/registrations`} className="text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Go to registrations list
        </Link>
      </div>
    );
  }

  if (manualMode) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0A0F0C' }}>
        {/* Manual mode header */}
        <div
          className="flex items-center justify-between px-5 shrink-0"
          style={{ paddingTop: 'env(safe-area-inset-top, 16px)', paddingBottom: 12, background: 'rgba(10,15,12,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <button onClick={() => { setManualMode(false); setSearchQuery(''); setSearchResults([]); }} className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <X size={16} strokeWidth={1.8} /> Close
          </button>
          <div className="font-display font-medium text-[14px] text-white">Manual check-in</div>
          <div className=" text-[13px]" style={{ color: '#E8C57E' }}>{checkedIn}/{totalRegistrations}</div>
        </div>

        {/* Search input */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Search size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Name, email, phone, or badge ID…"
              autoFocus
              className="flex-1 bg-transparent outline-none text-[15px]"
              style={{ color: 'white', caretColor: '#E8C57E' }}
            />
            {searching && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin shrink-0" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }} />}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <div className="text-center py-12 text-[14px]" style={{ color: 'rgba(255,255,255,0.35)' }}>No attendees found</div>
          )}
          {searchQuery.length < 2 && (
            <div className="text-center py-12 text-[14px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Type a name or email to search</div>
          )}
          <div className="space-y-2">
            {searchResults.map(reg => {
              const isCheckedIn = reg.status === 'checked_in';
              const isLoading = manualCheckingIn === reg.id;
              return (
                <div
                  key={reg.id}
                  className="flex items-center gap-4 rounded-2xl px-4 py-4"
                  style={{ background: isCheckedIn ? 'rgba(45,122,79,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isCheckedIn ? 'rgba(45,122,79,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[14px] truncate text-white">{reg.attendee_name ?? 'Unknown'}</div>
                    <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {[reg.ticket_types?.name, reg.attendee_email, reg.attendee_phone].filter(Boolean).join(' · ')}
                    </div>
                    {isCheckedIn && reg.checked_in_at && (
                      <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'rgba(45,122,79,0.9)' }}>
                        <Clock size={10} /> {new Date(reg.checked_in_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  {isCheckedIn ? (
                    <div className="w-8 h-8 rounded-full grid place-items-center shrink-0" style={{ background: 'rgba(45,122,79,0.25)' }}>
                      <Check size={14} strokeWidth={2.5} style={{ color: '#2D7A4F' }} />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleManualCheckin(reg)}
                      disabled={isLoading}
                      className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium text-white disabled:opacity-50"
                      style={{ background: '#1F4D3A' }}
                    >
                      {isLoading ? '…' : 'Check in'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#0A0F0C' }}>

      {/* ── Top bar ──────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5"
        style={{ paddingTop: 'env(safe-area-inset-top, 16px)', paddingBottom: 12, background: 'rgba(10,15,12,0.9)', backdropFilter: 'blur(8px)' }}
      >
        {onClose ? (
          <button onClick={onClose} className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <X size={16} strokeWidth={1.8} /> Exit
          </button>
        ) : (
          <Link href={`/events/${eventSlug}/registrations`}>
            <button className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <X size={16} strokeWidth={1.8} /> Exit
            </button>
          </Link>
        )}

        <div className="text-center">
          <div className="font-display font-medium text-[14px] text-white truncate max-w-[200px]">{eventName}</div>
        </div>

        <div className="text-right">
          <div className=" text-[13px]" style={{ color: '#E8C57E' }}>
            {checkedIn} / {totalRegistrations}
          </div>
          <div className="text-[10px] tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
            checked in
          </div>
        </div>
      </div>

      {/* ── Camera ───────────────────────────────────── */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ minHeight: '100svh' }}
        muted
        playsInline
      />

      {/* ── Scanning frame overlay ───────────────────── */}
      {!flash && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="relative" style={{ width: 240, height: 240 }}>
            {/* Dark vignette */}
            <div className="absolute inset-0 rounded-[16px]" style={{ boxShadow: '0 0 0 9999px rgba(10,15,12,0.55)' }} />
            {/* Corner brackets */}
            {(['tl','tr','bl','br'] as const).map(corner => (
              <div
                key={corner}
                className="absolute"
                style={{
                  width: 28, height: 28,
                  top: corner.startsWith('t') ? 0 : 'auto',
                  bottom: corner.startsWith('b') ? 0 : 'auto',
                  left: corner.endsWith('l') ? 0 : 'auto',
                  right: corner.endsWith('r') ? 0 : 'auto',
                  borderTop: corner.startsWith('t') ? '3px solid #E8C57E' : 'none',
                  borderBottom: corner.startsWith('b') ? '3px solid #E8C57E' : 'none',
                  borderLeft: corner.endsWith('l') ? '3px solid #E8C57E' : 'none',
                  borderRight: corner.endsWith('r') ? '3px solid #E8C57E' : 'none',
                  borderTopLeftRadius: corner === 'tl' ? 6 : 0,
                  borderTopRightRadius: corner === 'tr' ? 6 : 0,
                  borderBottomLeftRadius: corner === 'bl' ? 6 : 0,
                  borderBottomRightRadius: corner === 'br' ? 6 : 0,
                }}
              />
            ))}
            {/* Scanning line */}
            <div
              className="absolute left-[4px] right-[4px] h-[1.5px] rounded-full"
              style={{ background: 'rgba(232,197,126,0.6)', animation: 'scan-line 2s ease-in-out infinite' }}
            />
          </div>
          <div
            className="absolute bottom-[28%] left-0 right-0 flex flex-col items-center gap-3"
          >
            <div className="text-[14px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Point at attendee QR code
            </div>
            <button
              onClick={() => setManualMode(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium pointer-events-auto"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <Search size={13} /> Search manually
            </button>
          </div>
        </div>
      )}

      {/* ── Result flash ─────────────────────────────── */}
      {flash && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6"
          style={{
            background:
              flash.kind === 'success'
                ? 'rgba(31,77,58,0.95)'
                : flash.kind === 'already_checked_in'
                ? 'rgba(201,122,45,0.95)'
                : 'rgba(184,66,60,0.95)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="text-6xl mb-4" aria-hidden>
            {flash.kind === 'success' ? '✓' : flash.kind === 'already_checked_in' ? '↩' : '✗'}
          </div>
          <div className="font-display font-medium text-[26px] text-white mb-1">
            {flash.kind === 'success'
              ? flash.name
              : flash.kind === 'already_checked_in'
              ? flash.name
              : 'Not recognised'}
          </div>
          <div className="text-[15px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {flash.kind === 'success'
              ? (flash.ticket_type ? `${flash.ticket_type} · Checked in ✓` : 'Checked in ✓')
              : flash.kind === 'already_checked_in'
              ? `Already in${flash.ticket_type ? ` · ${flash.ticket_type}` : ''} at ${new Date(flash.checked_in_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
              : flash.message}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0%   { top: 4px; opacity: 0.6; }
          50%  { top: 230px; opacity: 1; }
          100% { top: 4px; opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
