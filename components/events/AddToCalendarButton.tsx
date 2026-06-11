'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface Props {
  pageId: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string | null;
  location: string;
  eventUrl: string;
}

/** Format ISO string → compact UTC string Google Calendar expects: YYYYMMDDTHHmmssZ */
function toGCal(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function AddToCalendarButton({
  pageId, title, description, startsAt, endsAt, timezone, location, eventUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Derive end time — fallback to start + 2 hours if no end set
  const endIso = endsAt ?? new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString();

  const gStart = toGCal(startsAt);
  const gEnd   = toGCal(endIso);

  const details = [description, eventUrl].filter(Boolean).join('\n\n');

  // Google Calendar — URL-based, opens in browser/app
  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${gStart}/${gEnd}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    (timezone ? `&ctz=${encodeURIComponent(timezone)}` : '');

  // Outlook web — URL-based
  const outlookUrl =
    `https://outlook.live.com/calendar/0/deeplink/compose?` +
    `subject=${encodeURIComponent(title)}` +
    `&body=${encodeURIComponent(details)}` +
    `&startdt=${encodeURIComponent(startsAt)}` +
    `&enddt=${encodeURIComponent(endIso)}` +
    `&location=${encodeURIComponent(location)}`;

  // Yahoo Calendar — URL-based
  const yahooUrl =
    `https://calendar.yahoo.com/?v=60` +
    `&title=${encodeURIComponent(title)}` +
    `&st=${gStart}` +
    `&et=${gEnd}` +
    `&desc=${encodeURIComponent(details)}` +
    `&in_loc=${encodeURIComponent(location)}`;

  // .ics file — handled by existing /api/calendar/[pageId] route
  // On iOS/Android, downloading .ics opens the native calendar picker
  const icsUrl = `/api/calendar/${pageId}`;

  const options: { label: string; sublabel: string; href: string; external?: boolean; download?: boolean }[] = [
    {
      label: 'Google Calendar',
      sublabel: 'Opens in browser',
      href: googleUrl,
      external: true,
    },
    {
      label: 'Apple Calendar',
      sublabel: 'iPhone, Mac, iPad',
      href: icsUrl,
      download: true,
    },
    {
      label: 'Outlook',
      sublabel: 'Outlook web',
      href: outlookUrl,
      external: true,
    },
    {
      label: 'Yahoo Calendar',
      sublabel: 'Opens in browser',
      href: yahooUrl,
      external: true,
    },
    {
      label: 'Other / iCal',
      sublabel: 'Downloads .ics file',
      href: icsUrl,
      download: true,
    },
  ];

  return (
    <div className="relative ml-auto" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity"
        style={{ color: '#1F4D3A' }}
        aria-label="Add to calendar"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Calendar size={13} strokeWidth={2} />
        Add to calendar
        <ChevronDown size={10} style={{ marginLeft: -2, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {open && (
        <>
          {/* Invisible backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div
            role="listbox"
            className="absolute right-0 top-8 z-50 rounded-2xl overflow-hidden"
            style={{
              minWidth: 220,
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              boxShadow: '0 8px 32px rgba(15,31,24,0.14)',
            }}
          >
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#6B7A72' }}>
                Add to calendar
              </p>
            </div>

            {options.map(opt => (
              <a
                key={opt.label}
                href={opt.href}
                target={opt.external ? '_blank' : undefined}
                rel={opt.external ? 'noopener noreferrer' : undefined}
                download={opt.download ? '' : undefined}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[#F5F2EC] group"
                style={{ textDecoration: 'none' }}
                onClick={() => setOpen(false)}
                role="option"
              >
                <div>
                  <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{opt.label}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{opt.sublabel}</div>
                </div>
                {opt.external ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9C3B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C9C3B1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
