'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  location: string;
  eventUrl: string;
  /** 'link' = subtle inline link · 'solid' = filled pill button */
  variant?: 'link' | 'solid';
  className?: string;
  style?: React.CSSProperties;
}

/** Format ISO string → compact UTC string calendars expect: YYYYMMDDTHHmmssZ */
function toUtcStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** Escape text per RFC 5545 (backslash, comma, semicolon, newlines). */
function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/** Build a valid VCALENDAR/VEVENT string with UTC times. */
function buildIcs(p: {
  title: string;
  description: string | null;
  startsAt: string;
  endIso: string;
  location: string;
  eventUrl: string;
}): string {
  const uid = `event-${toUtcStamp(p.startsAt)}-${Math.random().toString(36).slice(2, 8)}@eventera`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventera//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    `DTSTART:${toUtcStamp(p.startsAt)}`,
    `DTEND:${toUtcStamp(p.endIso)}`,
    `SUMMARY:${escapeIcs(p.title)}`,
    ...(p.description ? [`DESCRIPTION:${escapeIcs(p.description.slice(0, 800))}`] : []),
    ...(p.location ? [`LOCATION:${escapeIcs(p.location)}`] : []),
    `URL:${escapeIcs(p.eventUrl)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

export function AddToCalendarButton({
  title, description, startsAt, endsAt, timezone, location, eventUrl,
  variant = 'link', className = '', style,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const endIso = endsAt ?? new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString();
  const details = [description, eventUrl].filter(Boolean).join('\n\n');

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${toUtcStamp(startsAt)}/${toUtcStamp(endIso)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    (timezone ? `&ctz=${encodeURIComponent(timezone)}` : '');

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  /** Generate the .ics and trigger a download the device opens in its calendar app. */
  function downloadIcs() {
    const ics = buildIcs({ title, description, startsAt, endIso, location, eventUrl });
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60) + '.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setOpen(false);
  }

  const triggerClass =
    variant === 'solid'
      ? `inline-flex items-center gap-2 rounded-full font-semibold transition hover:opacity-90 active:scale-[0.98] ${className}`
      : `flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity ${className}`;

  const triggerStyle: React.CSSProperties =
    variant === 'solid'
      ? {
          background: 'rgba(250,246,238,0.95)',
          color: '#1F4D3A',
          padding: '9px 16px',
          fontSize: 13,
          textDecoration: 'none',
          boxShadow: '0 2px 10px rgba(15,31,24,0.18)',
          cursor: 'pointer',
          border: 'none',
          ...style,
        }
      : { color: '#1F4D3A', textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0, ...style };

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button type="button" onClick={() => setOpen(v => !v)} className={triggerClass} style={triggerStyle}>
        <Calendar size={variant === 'solid' ? 15 : 13} strokeWidth={2} />
        Add to calendar
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 rounded-xl overflow-hidden"
          style={{
            top: '100%',
            right: 0,
            minWidth: 200,
            background: '#FFFFFF',
            border: '1px solid #E5E0D4',
            boxShadow: '0 12px 32px rgba(15,31,24,0.14)',
          }}
        >
          <button
            type="button"
            onClick={downloadIcs}
            className="w-full text-left px-4 py-2.5 text-[13px] font-medium transition hover:bg-[#FAF6EE]"
            style={{ color: '#0F1F18', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Apple / Outlook (.ics)
          </button>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[13px] font-medium transition hover:bg-[#FAF6EE]"
            style={{ color: '#0F1F18', textDecoration: 'none', borderTop: '1px solid #E5E0D4' }}
          >
            Google Calendar
          </a>
        </div>
      )}
    </div>
  );
}
