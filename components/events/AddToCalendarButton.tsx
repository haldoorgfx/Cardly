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

  return (
    <a
      href={googleUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-auto flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity"
      style={{ color: '#1F4D3A', textDecoration: 'none' }}
    >
      <Calendar size={13} strokeWidth={2} />
      Add to calendar
    </a>
  );
}
