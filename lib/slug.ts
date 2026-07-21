/**
 * Slug utilities — shared across the platform.
 *
 * IMPORTANT: always fold accents to their base letter BEFORE stripping
 * non-ASCII, or accented characters get deleted entirely — e.g.
 * "Cérémonie des Diplômes" would become "crmonie-des-diplmes". Since our
 * primary markets are French-speaking (Djibouti, Ethiopia, Kenya…), that
 * mangles nearly every real event URL. `.normalize('NFD')` splits "é" into
 * "e" + combining accent, and the diacritic range strip removes the accent,
 * leaving the base "e".
 */

/** Turn any text into a clean, accent-safe slug base (no random suffix). */
export function slugifyBase(raw: string, max = 40): string {
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics, keep the base letter
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, max);
}

/**
 * generateSlug — event/page slug with a collision-resistant suffix.
 *
 * Format: {accent-safe-name-slug}-{8-char-uuid-hex}
 * 8 hex chars = 2^32 possible suffixes per name, making collisions negligible
 * while keeping URLs readable.
 *
 * EMPTY-BASE FALLBACK: `slugifyBase` keeps only [a-z0-9], so a title written
 * entirely in a non-Latin script — Arabic, Amharic, Somali in Osmanya, or a
 * title that is only emoji/punctuation — reduces to "". Without a fallback the
 * slug became "-3f9a2b71": a leading hyphen, and every Arabic-titled event in
 * Djibouti / Somalia / the UAE (primary markets) getting a URL indistinguishable
 * from every other one. Fall back to "event" so the URL is at least well-formed
 * and readable: eventera.so/e/event-3f9a2b71.
 */
export function generateSlug(name: string): string {
  const base = slugifyBase(name) || 'event';
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${base}-${suffix}`;
}
