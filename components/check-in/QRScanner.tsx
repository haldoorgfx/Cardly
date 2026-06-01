'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { X } from 'lucide-react';
import Link from 'next/link';

type ScanResult =
  | { kind: 'success'; name: string; email: string }
  | { kind: 'already_checked_in'; name: string; checked_in_at: string }
  | { kind: 'invalid'; message: string };

interface Props {
  eventId: string;
  eventName: string;
  totalRegistrations: number;
  initialCheckedIn: number;
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

export function QRScanner({ eventId, eventName, totalRegistrations, initialCheckedIn }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [flash, setFlash] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

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
  }, [eventId]);

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

  if (cameraError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center" style={{ background: '#0A0F0C' }}>
        <div className="text-[15px] mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>{cameraError}</div>
        <Link href={`/events/${eventId}/registrations`}>
          <button className="px-5 py-2.5 rounded-full text-[13px] font-medium" style={{ background: '#1F4D3A', color: 'white' }}>
            Go to registrations list instead
          </button>
        </Link>
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
        <Link href={`/events/${eventId}/registrations`}>
          <button className="flex items-center gap-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            <X size={16} strokeWidth={1.8} />
            Exit
          </button>
        </Link>

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
            className="absolute bottom-[28%] left-0 right-0 text-center text-[14px]"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Point at attendee QR code
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
