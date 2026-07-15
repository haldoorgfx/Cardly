export function formatEventDateRange(
  startsAt: string,
  endsAt: string,
  timezone: string
): { date: string; time: string; endTime: string } {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  const tz = timezone || 'UTC';

  const dateFmt = new Intl.DateTimeFormat('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: tz,
  });
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz,
  });

  // Detect a multi-day event by comparing the calendar day IN THE EVENT'S TZ
  // (en-CA gives YYYY-MM-DD). A 3-day conference must not read as a single day.
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz }).format(d);
  const isMultiDay = !!endsAt && !Number.isNaN(end.getTime()) && dayKey(start) !== dayKey(end);

  if (isMultiDay) {
    const startShort = new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', timeZone: tz,
    }).format(start);
    const endLong = new Intl.DateTimeFormat('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: tz,
    }).format(end);
    // "Mon, Jul 13 – Wed, Jul 15, 2026 · from 9:00 AM" — endTime blanked so the
    // hero doesn't append a misleading same-day "– 5:00 PM".
    return { date: `${startShort} – ${endLong}`, time: timeFmt.format(start), endTime: '' };
  }

  return {
    date: dateFmt.format(start),
    time: timeFmt.format(start),
    endTime: timeFmt.format(end),
  };
}

/**
 * Convert a `datetime-local` input value ("YYYY-MM-DDTHH:mm", a wall-clock time
 * with no offset) into a UTC ISO string, interpreting those digits as local time
 * IN THE GIVEN IANA TIME ZONE — not the browser's own time zone.
 *
 * `new Date(localValue).toISOString()` (the naive approach) parses the string
 * using the browser/runtime's local time zone. That only produces the right
 * instant when the person filling in the form happens to be physically sitting
 * in the same zone as the event they're creating — for anyone else it's off by
 * the difference between the two zones. This walks the offset out via
 * Intl.DateTimeFormat so the selected event time zone is always what's used.
 */
export function zonedDatetimeToISO(localValue: string, timeZone: string): string {
  if (!localValue) return '';
  const [datePart, timePart] = localValue.split('T');
  if (!datePart || !timePart) return '';
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  if ([year, month, day, hour, minute].some(n => Number.isNaN(n))) return '';

  // Treat the wall-clock digits as if they were UTC — a starting guess.
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);

  // Ask what that instant reads as inside the target zone, then correct by
  // the difference (handles DST correctly since it's computed for this date).
  const zoned = getZonedParts(new Date(utcGuess), timeZone);
  const asUTC = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  const offset = asUTC - utcGuess;

  return new Date(utcGuess - offset).toISOString();
}

/**
 * Inverse of zonedDatetimeToISO: given a UTC ISO string, return the
 * `datetime-local` input value ("YYYY-MM-DDTHH:mm") representing that instant
 * as wall-clock time IN THE GIVEN IANA TIME ZONE — not the browser's zone.
 */
export function isoToZonedDatetimeValue(isoString: string | null, timeZone: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const { year, month, day, hour, minute } = getZonedParts(d, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function getZonedParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  // Some locales/zones render midnight as "24" for hour12: false.
  const hour = map.hour === '24' ? 0 : Number(map.hour);
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function formatShortDate(isoString: string, timezone = 'UTC'): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: timezone,
  }).format(new Date(isoString));
}

export function formatMinPrice(tickets: { price: number; currency?: string; is_visible: boolean }[]): string {
  const visible = tickets.filter(t => t.is_visible);
  if (visible.length === 0) return 'Free';
  const paid = visible.filter(t => t.price > 0);
  if (paid.length === 0) return 'Free';
  const cheapest = paid.reduce((a, b) => a.price <= b.price ? a : b);
  const currency = cheapest.currency ?? 'USD';
  try {
    return 'From ' + new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cheapest.price);
  } catch {
    return `From ${currency} ${cheapest.price}`;
  }
}

/**
 * Format a revenue amount with the given currency.
 * Returns '—' if amount is 0 or currency is unknown.
 */
export function formatRevenue(amount: number, currency: string | null | undefined): string {
  if (amount === 0 || !currency) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  { value: 'Africa/Accra', label: 'Accra (GMT)' },
  { value: 'Africa/Djibouti', label: 'Djibouti (EAT)' },
  { value: 'Africa/Dar_es_Salaam', label: 'Dar es Salaam (EAT)' },
  { value: 'Africa/Abidjan', label: 'Abidjan (GMT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'America/New_York', label: 'New York (ET)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];
