/**
 * Deterministic visual placeholders derived from a stable seed (event id/slug),
 * so each event gets its own consistent colors when it has no uploaded artwork.
 * All palettes stay within the forest + cream brand family.
 */

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Brand-aligned gradient pairs for event banner placeholders. */
const BANNER_GRADIENTS: string[] = [
  'linear-gradient(150deg, #0D2018 0%, #1F4D3A 55%, #2A6A50 100%)',
  'linear-gradient(150deg, #14241C 0%, #1F4D3A 50%, #C9A45E 130%)',
  'linear-gradient(150deg, #102A20 0%, #2A6A50 60%, #4F9A78 110%)',
  'linear-gradient(150deg, #1A1208 0%, #6B4D1E 55%, #C9A45E 110%)',
  'linear-gradient(150deg, #0F1F18 0%, #2C5BAA 130%)',
  'linear-gradient(150deg, #1A0E1E 0%, #4A2D52 55%, #6B4D9E 120%)',
  'linear-gradient(150deg, #221016 0%, #6B2E3C 60%, #C0436B 120%)',
  'linear-gradient(150deg, #0D2018 0%, #245446 50%, #D2853A 130%)',
];

export function bannerGradientFor(seed: string): string {
  return BANNER_GRADIENTS[hashSeed(seed) % BANNER_GRADIENTS.length];
}

/** Solid avatar colors for initials placeholders. */
export const AVATAR_COLORS = ['#1F4D3A', '#6B4D9E', '#C0436B', '#2C5BAA', '#D2853A', '#7C4DC4', '#2D7A4F', '#3A6B8C'];

export function avatarColorFor(seed: string): string {
  return AVATAR_COLORS[hashSeed(seed) % AVATAR_COLORS.length];
}

/** Two-letter initials from a name, e.g. "Amina Osman" → "AO". */
export function initialsOf(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic placeholder initials for the "people are attending" stack when
 * there are no real registrations yet — varied letters, not A/B/C/D.
 */
export function placeholderInitials(seed: string, count: number): string[] {
  const LETTERS = 'ABCDEFGHJKLMNPRSTUVWY';
  const base = hashSeed(seed);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const a = LETTERS[(base + i * 7) % LETTERS.length];
    const b = LETTERS[(base + i * 13 + 5) % LETTERS.length];
    out.push(a + b);
  }
  return out;
}
