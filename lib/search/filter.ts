/**
 * Building PostgREST filter strings from user input.
 *
 * `.ilike('col', pattern)` is parameterised and safe on its own, but it does
 * NOT treat the pattern as literal text — `%` and `_` are LIKE wildcards, so a
 * search for "100%" or "a_b" silently means something else.
 *
 * `.or(...)` is worse: the whole thing is ONE string, and `,` `.` `(` `)`
 * are the syntax that separates conditions. Interpolating a raw query into it
 * lets a searcher inject filter clauses — which on a public search page means
 * adding conditions the query never intended, such as matching unpublished
 * rows.
 *
 * These two helpers exist because there was no escaping helper anywhere in the
 * codebase, so every call site had to remember, and several did not.
 */

/**
 * Escape LIKE wildcards so the pattern matches the literal characters.
 * Postgres LIKE/ILIKE treats `%` and `_` as wildcards and `\` as the escape.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, m => `\\${m}`);
}

/**
 * Render one `col.ilike.<value>` condition safe for use inside `.or()`.
 *
 * PostgREST lets a value be double-quoted, which is what makes reserved
 * characters (notably the comma that separates conditions) harmless. Inside
 * those quotes a literal `"` or `\` must itself be escaped, and that escaping
 * has to happen AFTER the LIKE escaping or the backslashes it adds get
 * mangled.
 */
export function ilikeCondition(column: string, value: string): string {
  const pattern = escapeLikePattern(value);
  const quoted = pattern.replace(/["\\]/g, m => `\\${m}`);
  return `${column}.ilike."%${quoted}%"`;
}

/**
 * Like {@link ilikeCondition}, but anchored at the start of the column —
 * `col ILIKE 'value%'`. Used for prefix lookups such as a badge ID typed off a
 * printed badge, where a contains-match would return unrelated attendees.
 * Same escaping rules, same quoting; only the wildcard placement differs.
 */
export function ilikePrefixCondition(column: string, value: string): string {
  const pattern = escapeLikePattern(value);
  const quoted = pattern.replace(/["\\]/g, m => `\\${m}`);
  return `${column}.ilike."${quoted}%"`;
}

/**
 * An `.or()` string matching `value` across several columns.
 * Returns null for a blank query so callers can skip the filter entirely
 * rather than building `or=()`, which PostgREST rejects.
 */
export function orIlikeAcross(columns: string[], value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return columns.map(c => ilikeCondition(c, trimmed)).join(',');
}

/** Minimum shape rankByRelevance needs; extra fields pass through untouched. */
export interface RankableEvent {
  title?: string | null;
  description?: string | null;
  venue_name?: string | null;
  city?: string | null;
  category?: string | null;
}

/**
 * Order search hits by how well they match, strongest signal first, falling
 * back to the caller's existing order (date) within a band.
 *
 * Deliberately simple and readable rather than a scoring formula nobody can
 * predict: an exact title beats a title that starts with the query, which
 * beats a title containing it, which beats a match anywhere else. Postgres
 * full-text search would be better, but it needs a tsvector column and a
 * migration — this is a real improvement without one.
 */
export function rankByRelevance<T extends RankableEvent>(rows: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;

  const score = (r: T): number => {
    const title = (r.title ?? '').toLowerCase();
    if (title === q) return 0;
    if (title.startsWith(q)) return 1;
    if (title.includes(q)) return 2;
    if ((r.venue_name ?? '').toLowerCase().includes(q)) return 3;
    if ((r.city ?? '').toLowerCase().includes(q)) return 4;
    if ((r.category ?? '').toLowerCase().includes(q)) return 5;
    return 6; // description-only match
  };

  // Stable sort: equal scores keep the incoming chronological order.
  return rows
    .map((row, i) => ({ row, i, s: score(row) }))
    .sort((a, b) => (a.s - b.s) || (a.i - b.i))
    .map(x => x.row);
}
