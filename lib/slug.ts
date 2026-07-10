/**
 * generateSlug — shared slug utility.
 *
 * Format: {lowercased-name-slug}-{8-char-uuid-hex}
 * 8 hex chars = 2^32 possible suffixes per name, making collisions negligible
 * while keeping URLs readable.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40);
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${base}-${suffix}`;
}
