// RFC 5545 (iCalendar) construction.
//
// This file is deliberately pure and dependency-free so the output can be
// asserted byte-for-byte in a test harness. Everything here is opened by
// strict third-party parsers — Google Calendar, Apple Calendar, Outlook — so
// "looks about right" is not good enough.
//
// Three rules drive the implementation:
//   1. Content lines are delimited by CRLF, never bare LF   (RFC 5545 §3.1)
//   2. Lines fold at 75 OCTETS, not 75 characters           (RFC 5545 §3.1)
//   3. TEXT values escape \ ; , and newlines                (RFC 5545 §3.3.11)

/**
 * Escape a value for an iCalendar TEXT property.
 *
 * Order matters: backslash must be escaped first, otherwise the backslashes
 * introduced by the later replacements get double-escaped.
 *
 * CR is handled explicitly. Escaping only `\n` (the previous behaviour) left a
 * bare CR in the value for any description pasted out of Windows or a rich
 * text editor, which the parser then reads as a real line break — silently
 * truncating the event or corrupting the file from that point on.
 */
export function escapeIcsText(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
    // Strip any remaining control characters. They are invalid in a TEXT
    // value and are the classic vector for injecting a forged property line.
    // Done as a code-point filter rather than a control-character regex so
    // the literal bytes never end up in this source file.
    .replace(/[\s\S]/g, (ch) => {
      const cp = ch.codePointAt(0)!;
      return cp < 0x20 || cp === 0x7f ? '' : ch;
    });
}

/**
 * Fold a content line to 75 octets per RFC 5545 §3.1.
 *
 * Two things the naive character-count version got wrong:
 *   - Arabic and Amharic are 2–3 UTF-8 bytes per character, so a 75-character
 *     line is up to 225 octets — well over the limit.
 *   - Slicing by UTF-16 index can cut an emoji's surrogate pair in half,
 *     emitting invalid UTF-8.
 *
 * Iterating the string with for..of walks code points, so a character is never
 * split. The leading space on a continuation line counts toward its 75 octets.
 */
export function foldIcsLine(line: string): string {
  if (Buffer.byteLength(line, 'utf8') <= 75) return line;

  const out: string[] = [];
  let current = '';
  let bytes = 0;

  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8');
    if (bytes + size > 75) {
      out.push(current);
      current = ' ';
      bytes = 1;
    }
    current += char;
    bytes += size;
  }
  if (current) out.push(current);

  return out.join('\r\n');
}

/**
 * Format an instant as an iCalendar UTC date-time (YYYYMMDDTHHMMSSZ).
 *
 * Returns null for an unparseable input rather than emitting "NaNNaNNaN" into
 * the file — a malformed DTSTART makes the whole calendar unopenable.
 *
 * We deliberately emit UTC rather than a local time plus TZID. A TZID
 * reference is only valid if the calendar also carries a matching VTIMEZONE
 * component defining that zone's offsets and DST rules; without one, Outlook
 * in particular treats the time as floating. A UTC instant needs no VTIMEZONE,
 * is unambiguous, and every client renders it in the viewer's own zone — which
 * is the behaviour an attendee actually wants when they add a Nairobi event to
 * a calendar they read in Dubai.
 */
export function toIcsUtc(value: string | Date): string | null {
  const d = value instanceof Date ? value : new Date(value);
  const time = d.getTime();
  if (Number.isNaN(time)) return null;

  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

/**
 * Truncate by code point, so the cut never lands inside a surrogate pair.
 * Applied before escaping — truncating afterwards could sever an escape
 * sequence and leave a trailing backslash.
 */
export function truncateByCodePoint(input: string, max: number): string {
  const chars = Array.from(input);
  return chars.length <= max ? input : chars.slice(0, max).join('');
}

/** Host portion of NEXT_PUBLIC_APP_URL, for building a qualified UID. */
function appHost(): string {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (url) return new URL(url).host;
  } catch {
    /* fall through */
  }
  return 'eventera.local';
}

/**
 * Build a Content-Disposition value that survives a non-Latin title.
 *
 * The ASCII slug of an Arabic or Amharic title is empty, which previously
 * produced `filename="-.ics"`. RFC 5987's `filename*` carries the real title
 * for every modern browser, with the ASCII `filename` kept as the fallback.
 */
export function icsContentDisposition(title: string): string {
  const ascii =
    title
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'event';

  const utf8 = encodeURIComponent(`${truncateByCodePoint(title, 60)}.ics`);
  return `attachment; filename="${ascii}.ics"; filename*=UTF-8''${utf8}`;
}

export interface IcsEventInput {
  /** Stable identifier — the UID must not change between downloads. */
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  url?: string | null;
}

/**
 * Build a complete VCALENDAR document. Returns null when the event has no
 * usable start, so the caller can answer 400 instead of serving a broken file.
 */
export function buildEventIcs(input: IcsEventInput): string | null {
  const dtstart = toIcsUtc(input.startsAt);
  if (!dtstart) return null;

  // Default to a two-hour block when the organizer left the end time blank.
  const end =
    input.endsAt ?? new Date(new Date(input.startsAt).getTime() + 2 * 3600_000).toISOString();
  const dtend = toIcsUtc(end);
  if (!dtend) return null;

  const dtstamp = toIcsUtc(new Date())!;
  const title = (input.title || '').trim() || 'Event';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventera//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${input.id}@${appHost()}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcsText(title)}`,
  ];

  if (input.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(truncateByCodePoint(input.description, 800))}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeIcsText(input.location)}`);
  }
  if (input.url) {
    lines.push(`URL:${input.url}`);
  }

  lines.push('SEQUENCE:0', 'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT', 'END:VCALENDAR');

  // Fold every line, then join with CRLF. A trailing CRLF closes the final
  // content line — some parsers drop an unterminated last line.
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}
