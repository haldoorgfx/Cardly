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

  return {
    date: dateFmt.format(start),
    time: timeFmt.format(start),
    endTime: timeFmt.format(end),
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
