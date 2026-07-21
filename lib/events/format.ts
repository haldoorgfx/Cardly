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

/**
 * Session-time helpers. Every agenda surface must render session times in the
 * EVENT's time zone (event_pages.timezone) — never the server's and never the
 * viewer's.
 *
 * Why both are wrong:
 *  • In a SERVER component, `toLocaleTimeString(undefined, …)` uses the Node
 *    process zone. On Vercel that is UTC, so a 09:00 Nairobi talk printed as
 *    "06:00" for every viewer on earth, including the organizer standing in
 *    the room.
 *  • In a CLIENT component it uses the browser zone, so a Nairobi attendee and
 *    a London attendee see two different start times for the same talk — and
 *    the one who travels sees the agenda shift under them mid-conference.
 *
 * Times are rendered 24h to match the existing agenda surfaces.
 */
export function formatZonedTime(isoString: string | null | undefined, timezone: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone || 'UTC',
  }).format(d);
}

/**
 * Minutes since midnight for an instant, IN THE EVENT'S ZONE.
 *
 * The organizer agenda timeline positions each session block by
 * `new Date(starts_at).getHours()`, which is the browser's zone. For an
 * organizer who is not sitting in the event's own zone the whole grid slides —
 * a 09:00 Nairobi keynote drew at 06:00 on a London laptop, the hour axis
 * relabelled itself, and clicking an empty slot created a session at the
 * clicked wall-clock time interpreted in the WRONG zone.
 */
export function zonedMinutesOfDay(isoString: string, timezone: string): number {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return 0;
  const { hour, minute } = getZonedParts(d, timezone || 'UTC');
  return hour * 60 + minute;
}

/**
 * Stable per-day bucket key for an instant, computed in the event's zone.
 * `en-CA` yields YYYY-MM-DD, which sorts lexicographically.
 *
 * Bucketing on `new Date(iso).toDateString()` (the previous approach) uses the
 * runtime's zone, so a 09:00 Nairobi session lands in the PREVIOUS calendar day
 * for a viewer in the Americas — the agenda grows a phantom extra day and the
 * "Day 1 / Day 2" tabs stop matching the printed programme.
 */
export function zonedDayKey(isoString: string, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone || 'UTC',
  }).format(new Date(isoString));
}

/** The discovery date filters offered on the feed, city and category pages. */
export type DiscoveryDateWindow = 'any' | 'today' | 'weekend' | 'week' | 'month';

/** A `YYYY-MM-DD` key for a Date that was anchored at noon UTC (DST-safe). */
function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse a `YYYY-MM-DD` key back to a Date at noon UTC, away from any edge. */
function dayKeyToUTCNoon(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

/**
 * Does an event fall inside a discovery date window ("Today", "This weekend",
 * "This week", "This month")?
 *
 * Every comparison happens on calendar-day keys computed in the EVENT's own
 * time zone. Discovery previously compared the raw instant against the
 * viewer's `new Date()`, which is wrong in both directions on a marketplace
 * that spans zones: a 01:00 Djibouti (UTC+3) event is 22:00 UTC the day
 * before, so a London visitor filtering "Today" never saw it, while a Los
 * Angeles visitor saw tomorrow's Nairobi events under "Today". In a thin
 * market a single wrongly-filtered event is most of the inventory.
 */
export function matchesDiscoveryDateWindow(
  startsAt: string | null | undefined,
  timezone: string | null | undefined,
  window: DiscoveryDateWindow,
  now: Date = new Date()
): boolean {
  if (window === 'any') return true;
  if (!startsAt) return false;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;

  const tz = timezone || 'UTC';
  const eventKey = zonedDayKey(startsAt, tz);
  const todayKey = zonedDayKey(now.toISOString(), tz);

  // "Today" includes an event that already started today — on a feed that
  // keeps ongoing events visible, dropping it would hide the live ones.
  if (window === 'today') return eventKey === todayKey;

  // Every other window looks forward only.
  if (eventKey < todayKey) return false;

  const today = dayKeyToUTCNoon(todayKey);

  if (window === 'week') {
    const end = new Date(today);
    end.setUTCDate(end.getUTCDate() + 7);
    return eventKey < utcDayKey(end);
  }

  if (window === 'weekend') {
    // Sunday counts as part of the weekend already in progress, not as the
    // start of a wait for the next one six days out.
    const day = today.getUTCDay(); // 0 Sun .. 6 Sat
    const sat = new Date(today);
    sat.setUTCDate(sat.getUTCDate() + (day === 0 ? -1 : 6 - day));
    const mon = new Date(sat);
    mon.setUTCDate(mon.getUTCDate() + 2);
    return eventKey >= utcDayKey(sat) && eventKey < utcDayKey(mon);
  }

  // "This month" — same calendar month, in the event's zone.
  return eventKey.slice(0, 7) === todayKey.slice(0, 7);
}

/**
 * Is an event within the next `days` calendar days, in its own zone? Used to
 * split "Happening soon" from the later sections.
 */
export function isWithinDaysZoned(
  startsAt: string | null | undefined,
  timezone: string | null | undefined,
  days: number,
  now: Date = new Date()
): boolean {
  if (!startsAt) return false;
  const tz = timezone || 'UTC';
  const eventKey = zonedDayKey(startsAt, tz);
  const todayKey = zonedDayKey(now.toISOString(), tz);
  const end = dayKeyToUTCNoon(todayKey);
  end.setUTCDate(end.getUTCDate() + days);
  return eventKey < utcDayKey(end);
}

/** Human day heading for an instant, in the event's zone. */
export function formatZonedDayLabel(
  isoString: string,
  timezone: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }
): string {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: timezone || 'UTC' })
    .format(new Date(isoString));
}

/**
 * Group sessions into calendar days using the event's zone, preserving the
 * chronological order. Returns the ISO of the first session in each day so
 * callers can label the day without re-parsing a formatted string.
 */
export function groupSessionsByZonedDay<T extends { starts_at: string | null }>(
  sessions: T[],
  timezone: string
): { key: string; firstStartsAt: string; sessions: T[] }[] {
  const map = new Map<string, T[]>();
  const sorted = [...sessions]
    .filter(s => !!s.starts_at)
    .sort((a, b) => new Date(a.starts_at!).getTime() - new Date(b.starts_at!).getTime());
  for (const s of sorted) {
    const key = zonedDayKey(s.starts_at!, timezone);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([key, daySessions]) => ({
    key,
    firstStartsAt: daySessions[0].starts_at!,
    sessions: daySessions,
  }));
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
