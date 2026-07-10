/**
 * Shared calendar payload → Google / Outlook / .ics.
 *
 * Single source of truth for the "Add to calendar" feature (G7 / K01). Used by:
 *  - the public .ics route  (app/api/calendar/[pageId]/route.ts)
 *  - the confirmation pills  (components/registration/CalendarPills.tsx)
 *  - the reminder + confirmation emails (lib/registration/email.ts)
 *  - the public event page dropdown (components/events/AddToCalendarButton.tsx)
 *
 * The Flutter app mirrors this exact shape (lib/ics_export.dart +
 * lib/attendee/calendar_sheet.dart) so the SAME event produces the SAME UID and
 * the SAME UTC timestamps on both surfaces.
 *
 * Timezone handling: events are stored as `timestamptz` — i.e. a single absolute
 * instant. We emit that instant as a UTC "Z" stamp (`YYYYMMDDTHHMMSSZ`). Every
 * calendar client then renders it in the viewer's own local time, which is the
 * correct behaviour: "2pm in Nairobi" is one instant, shown as 2pm to a viewer
 * in Nairobi and the converted time to a viewer elsewhere. We do NOT emit local
 * `TZID` times (the previous route did, via an unreliable string round-trip).
 * The IANA `timezone` is passed to Google only, as a display hint (`ctz`).
 */

export interface CalendarEvent {
  title: string;
  description?: string | null;
  location?: string | null;
  /** ISO 8601 start (from a `timestamptz`). Required. */
  start: string;
  /** ISO 8601 end. When null/absent, defaults to start + `DEFAULT_DURATION_MS`. */
  end?: string | null;
  /** Public event URL (folded into the description so every client surfaces it). */
  url?: string | null;
  /** Stable, cross-platform unique id — e.g. `eventera-<slug>@eventera`. */
  uid: string;
  /**
   * All-day flag. The `events` table currently stores a real timestamp for every
   * event, so this defaults to `false` (a timed event). It exists so a future
   * all-day concept produces a `VALUE=DATE` event without another code path.
   */
  allDay?: boolean;
  /** IANA timezone (e.g. "Africa/Nairobi"). Used only as Google's `ctz` hint. */
  timezone?: string | null;
}

/** Events with no end time get a 2-hour default block. */
export const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** ISO string → RFC 5545 UTC timestamp: `YYYYMMDDTHHMMSSZ`. */
export function toUtcStamp(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}` +
    `T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}Z`
  );
}

/** ISO string → RFC 5545 all-day date value: `YYYYMMDD` (UTC). */
export function toDateStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

/** Add whole days to an ISO date and return a `YYYYMMDD` stamp (all-day DTEND is exclusive). */
function addDaysDateStamp(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
}

/** Escape a text value per RFC 5545 §3.3.11 (backslash, comma, semicolon, newlines). */
export function escapeText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold a content line to 75 octets max per RFC 5545 §3.1, with CRLF + a single
 * leading space on each continuation line. (We approximate "octet" with UTF-16
 * length, which is exact for the ASCII our fields normally carry.)
 */
export function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (i === 0) {
      parts.push(line.slice(0, 75));
      i = 75;
    } else {
      parts.push(' ' + line.slice(i, i + 74));
      i += 74;
    }
  }
  return parts.join('\r\n');
}

/** Resolve the effective end ISO — explicit end, or start + default duration. */
export function resolveEndIso(event: CalendarEvent): string {
  if (event.end) return new Date(event.end).toISOString();
  return new Date(new Date(event.start).getTime() + DEFAULT_DURATION_MS).toISOString();
}

/** Join description + URL the way every surface expects (link on its own line). */
function detailsText(event: CalendarEvent): string {
  return [event.description?.trim(), event.url?.trim()]
    .filter((s): s is string => !!s)
    .join('\n\n');
}

/** A filesystem-safe `.ics` filename derived from the event title. */
export function icsFilename(title: string): string {
  const base = title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-+|-+$/g, '');
  return `${base.slice(0, 60) || 'event'}.ics`;
}

/**
 * Build a complete VCALENDAR/VEVENT document as an RFC 5545 string:
 * CRLF line endings, folded long lines, a trailing CRLF, `DTSTAMP`, `UID`, and
 * UTC `Z` timestamps (or `VALUE=DATE` for all-day events).
 */
export function buildIcs(event: CalendarEvent): string {
  const details = detailsText(event);

  let dtStart: string;
  let dtEnd: string;
  if (event.allDay) {
    dtStart = `DTSTART;VALUE=DATE:${toDateStamp(event.start)}`;
    // All-day DTEND is exclusive → the day after the (explicit or start) end date.
    const endBase = event.end ?? event.start;
    dtEnd = `DTEND;VALUE=DATE:${addDaysDateStamp(endBase, 1)}`;
  } else {
    dtStart = `DTSTART:${toUtcStamp(event.start)}`;
    dtEnd = `DTEND:${toUtcStamp(resolveEndIso(event))}`;
  }

  const rawLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventera//Add to Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcStamp(new Date().toISOString())}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeText(event.title)}`,
    ...(details ? [`DESCRIPTION:${escapeText(details)}`] : []),
    ...(event.location?.trim() ? [`LOCATION:${escapeText(event.location.trim())}`] : []),
    ...(event.url?.trim() ? [`URL:${escapeText(event.url.trim())}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // RFC 5545 requires CRLF line endings and a closing CRLF.
  return rawLines.map(foldLine).join('\r\n') + '\r\n';
}

/** Google Calendar "render a new event" URL. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const dates = event.allDay
    ? `${toDateStamp(event.start)}/${addDaysDateStamp(event.end ?? event.start, 1)}`
    : `${toUtcStamp(event.start)}/${toUtcStamp(resolveEndIso(event))}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates,
  });
  const details = detailsText(event);
  if (details) params.set('details', details);
  if (event.location?.trim()) params.set('location', event.location.trim());
  if (event.timezone && !event.allDay) params.set('ctz', event.timezone);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Outlook (Outlook.com / live.com consumer) "compose new event" deep link.
 * `outlook.live.com` handles personal accounts; it also redirects Office 365
 * business users to their tenant, so a single endpoint covers both.
 */
export function outlookUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
  });

  if (event.allDay) {
    params.set('startdt', toDateStamp(event.start).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
    params.set('enddt', addDaysDateStamp(event.end ?? event.start, 1).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
    params.set('allday', 'true');
  } else {
    params.set('startdt', new Date(event.start).toISOString());
    params.set('enddt', new Date(resolveEndIso(event)).toISOString());
  }

  const details = detailsText(event);
  if (details) params.set('body', details);
  if (event.location?.trim()) params.set('location', event.location.trim());

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Build the stable, cross-platform UID from an event slug. */
export function uidForSlug(slug: string): string {
  return `eventera-${slug}@eventera`;
}
