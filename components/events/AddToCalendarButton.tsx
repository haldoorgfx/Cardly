'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  buildIcs,
  googleCalendarUrl,
  outlookUrl,
  icsFilename,
  uidForSlug,
  type CalendarEvent,
} from '@/lib/calendar/ics';

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

/** Derive a stable UID from the public event URL's slug (…/e/<slug>). */
function uidFromUrl(eventUrl: string, startsAt: string): string {
  try {
    const parts = new URL(eventUrl).pathname.split('/').filter(Boolean);
    const slug = parts[parts.indexOf('e') + 1] ?? parts[parts.length - 1];
    if (slug) return uidForSlug(slug);
  } catch {
    /* fall through */
  }
  return uidForSlug(startsAt.replace(/[^0-9]/g, ''));
}

export function AddToCalendarButton({
  title, description, startsAt, endsAt, timezone, location, eventUrl,
  variant = 'link', className = '', style,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const event: CalendarEvent = {
    title,
    description,
    location,
    start: startsAt,
    end: endsAt,
    url: eventUrl,
    uid: uidFromUrl(eventUrl, startsAt),
    timezone,
  };

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
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = icsFilename(title);
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

  const menuItem = 'block w-full text-left px-4 py-2.5 text-[13px] font-medium transition hover:bg-[#FAF6EE]';

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
            minWidth: 208,
            background: '#FFFFFF',
            border: '1px solid #E5E0D4',
            boxShadow: '0 12px 32px rgba(15,31,24,0.14)',
          }}
        >
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={menuItem}
            style={{ color: '#0F1F18', textDecoration: 'none' }}
          >
            Google Calendar
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className={menuItem}
            style={{ color: '#0F1F18', background: 'none', border: 'none', borderTop: '1px solid #E5E0D4', cursor: 'pointer' }}
          >
            Apple Calendar (.ics)
          </button>
          <a
            href={outlookUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={menuItem}
            style={{ color: '#0F1F18', textDecoration: 'none', borderTop: '1px solid #E5E0D4' }}
          >
            Outlook
          </a>
          <button
            type="button"
            onClick={downloadIcs}
            className={menuItem}
            style={{ color: '#0F1F18', background: 'none', border: 'none', borderTop: '1px solid #E5E0D4', cursor: 'pointer' }}
          >
            Download .ics
          </button>
        </div>
      )}
    </div>
  );
}
