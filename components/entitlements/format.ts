/**
 * Tiny presentational helpers shared across the attendee-entitlement surface
 * (G02–G05). Pure functions, no JSX — safe to import from any client component.
 * NO monospace anywhere; device ids and timestamps render in the normal UI font.
 */

/** UTC ISO → short local "Mon 3, 14:20" (24h). */
export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/** A device id, trimmed for display (never shown in a mono font). */
export function shortDevice(id: string | null): string {
  if (!id) return 'Unknown device';
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

/** Up-to-two-letter initials for an attendee avatar. */
export function initials(name: string | null): string {
  const n = (name ?? '').trim();
  if (!n) return '?';
  return n.split(/\s+/).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';
}
