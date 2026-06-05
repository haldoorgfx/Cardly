'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { X, Search, Check, Clock } from 'lucide-react';
import Link from 'next/link';

type ScanResult =
  | { kind: 'success'; name: string; email: string }
  | { kind: 'already_checked_in'; name: string; checked_in_at: string }
  | { kind: 'invalid'; message: string };

type SearchResult = {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string;
  checked_in_at: string | null;
  qr_code_token: string;
};

interface Props {
  eventId: string;
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

export function QRScanner({ eventId, eventName, totalRegistrations, initialCheckedIn, onCheckedIn, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [flash, setFlash] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
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
      };

      if (data.result === 'success') {
        beep('ok');
        setCheckedIn(c => c + 1);
        onCheckedIn?.();
        setFlash({ kind: 'success', name: data.attendee_name ?? '', email: data.attendee_email ?? '' });
      } else if (data.result === 'already_checked_in') {
        beep('warn');
        setFlash({ kind: 'already_checked_in', name: data.attendee_name ?? '', checked_in_at: data.checked_in_at ?? '' });
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
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    if (!videoRef.current) return;

    BrowserMultiFormatReader.listVideoInputDevices().then(devices => {
      const deviceId = devices.find(d => /back|rear|environment/i.test(d.label))?.deviceId ?? devices[0]?.deviceId;

      reader.decodeFromVideoDevice(deviceId ?? undefined, videoRef.current!, (result, err) => {
        if (result) {
          const text = result.getText();
          // Accept raw 32-hex token or full URL ending in the token
          const token = text.replace(/^.*\//, '').replace(/\?.*$/, '');
          if (/^[0-9a-f]{32}$/i.test(token)) {
            handleToken(token);
          } else if (/^[0-9a-f]{32}$/i.test(text)) {
            handleToken(text);
          }
        }
        if (err && err?.name !== 'NotFoundException') {
          console.error(err);
        }
      }).then(controls => {
        controlsRef.current = controls;
      }).catch(e => {
        setCameraError(e instanceof Error ? e.message : 'Camera not available');
      });
    }).catch(() => {
      setCameraError('Could not list camera devices');
    });

    return () => {
      controlsRef.current?.stop();
    };
  }, [handleToken]);

  if (cameraError && !manualMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ background: '#0A0F0C' }}>
        <div className="text-[15px] mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Camera unavailable</div>
        <div className="text-[13px] mb-6" style={{ color: 'rgba(255,255,255,0.35)' }}>{cameraError}</div>
        <button
          onClick={() => setManualMode(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium mb-3"
          style={{ background: '#1F4D3A', color: 'white' }}
        >
          <Search size={14} /> Search by name / email
        </button>
        <Link href={`/events/${eventId}/registrations`} className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
          <div className="font-mono text-[13px]" style={{ color: '#E8C57E' }}>{checkedIn}/{totalRegistrations}</div>
        </div>

        {/* Search input */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Search size={16} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name or email…"
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
                    <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{reg.attendee_email}</div>
                    {isCheckedIn && reg.checked_in_at && (
                      <div className="flex items-center gap-1 mt-1 text-[11px]" style={{ color: 'rgba(45,122,79,0.9)' }}>
                        <Clock size={10} /> {new Date(reg.checked_in_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
          <Link href={`/events/${eventId}/registrations`}>
            <button className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <X size={16} strokeWidth={1.8} /> Exit
            </button>
          </Link>
        )}

        <div className="text-center">
          <div className="font-display font-medium text-[14px] text-white truncate max-w-[200px]">{eventName}</div>
        </div>

        <div className="text-right">
          <div className="font-mono text-[13px]" style={{ color: '#E8C57E' }}>
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
              ? 'Checked in ✓'
              : flash.kind === 'already_checked_in'
              ? `Already checked in at ${new Date(flash.checked_in_at).toLocaleTimeString()}`
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
