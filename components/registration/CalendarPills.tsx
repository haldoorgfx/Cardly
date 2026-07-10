'use client';

import { CalendarPlus, Calendar, CalendarDays, Download } from 'lucide-react';
import { googleCalendarUrl, outlookUrl, type CalendarEvent } from '@/lib/calendar/ics';

interface Props {
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  eventUrl: string;
  uid: string;
  /** Public `.ics` route (…/api/calendar/<id>). Serves Apple + any ICS client. */
  icsHref: string;
}

/**
 * The four "Add to calendar" pills on the registration confirmation page (K01):
 * Google · Apple · Outlook · .ics. White cards with hairline borders — no
 * Google/Apple/Outlook brand colors, per the Eventera design contract.
 *
 * Google + Outlook open the provider's compose flow in a new tab. Apple + .ics
 * both point at the public `.ics` route: on Apple devices the file opens in
 * Calendar, elsewhere the browser downloads it for import.
 */
export function CalendarPills({
  title, description, location, startsAt, endsAt, timezone, eventUrl, uid, icsHref,
}: Props) {
  // No start date → nothing to add. Render nothing rather than a broken pill.
  if (!startsAt) return null;

  const event: CalendarEvent = {
    title,
    description,
    location,
    start: startsAt,
    end: endsAt,
    url: eventUrl,
    uid,
    timezone,
  };

  const pills: { key: string; label: string; icon: React.ReactNode; href: string; download?: string; newTab?: boolean }[] = [
    { key: 'google', label: 'Google', icon: <CalendarPlus size={14} strokeWidth={2} />, href: googleCalendarUrl(event), newTab: true },
    { key: 'apple', label: 'Apple', icon: <Calendar size={14} strokeWidth={2} />, href: icsHref },
    { key: 'outlook', label: 'Outlook', icon: <CalendarDays size={14} strokeWidth={2} />, href: outlookUrl(event), newTab: true },
    { key: 'ics', label: '.ics', icon: <Download size={14} strokeWidth={2} />, href: icsHref, download: icsHref },
  ];

  return (
    <div>
      <p className="text-[11px] font-medium text-center mb-2.5" style={{ color: '#6B7A72' }}>
        Add to calendar
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {pills.map(p => (
          <a
            key={p.key}
            href={p.href}
            {...(p.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            {...(p.download ? { download: '' } : {})}
            className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-medium transition"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#0F1F18', padding: '7px 13px', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F4D3A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D4'; }}
          >
            <span style={{ color: '#1F4D3A', display: 'inline-flex' }}>{p.icon}</span>
            {p.label}
          </a>
        ))}
      </div>
    </div>
  );
}
