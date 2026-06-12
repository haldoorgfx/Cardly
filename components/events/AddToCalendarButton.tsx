'use client';

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

/** Format ISO string → compact UTC string Google Calendar expects: YYYYMMDDTHHmmssZ */
function toGCal(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function AddToCalendarButton({
  title, description, startsAt, endsAt, timezone, location, eventUrl,
  variant = 'link', className = '', style,
}: Props) {
  const endIso = endsAt ?? new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString();
  const details = [description, eventUrl].filter(Boolean).join('\n\n');

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${toGCal(startsAt)}/${toGCal(endIso)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(location)}` +
    (timezone ? `&ctz=${encodeURIComponent(timezone)}` : '');

  if (variant === 'solid') {
    return (
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 rounded-full font-semibold transition hover:opacity-90 active:scale-[0.98] ${className}`}
        style={{
          background: 'rgba(250,246,238,0.95)',
          color: '#1F4D3A',
          padding: '9px 16px',
          fontSize: 13,
          textDecoration: 'none',
          boxShadow: '0 2px 10px rgba(15,31,24,0.18)',
          ...style,
        }}
      >
        <Calendar size={15} strokeWidth={2} />
        Add to calendar
      </a>
    );
  }

  return (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity ${className}`}
      style={{ color: '#1F4D3A', textDecoration: 'none' }}
    >
      <Calendar size={13} strokeWidth={2} />
      Add to calendar
    </a>
  );
}
