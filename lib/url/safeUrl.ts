/**
 * Scheme-safe handling of URLs that came from a user and are rendered back as
 * a clickable `href`.
 *
 * WHY THIS EXISTS: `z.string().url()` is NOT a safety check. Zod's `.url()`
 * only asks whether `new URL(value)` parses, and `new URL('javascript:alert(1)')`
 * parses perfectly well — so does `data:text/html,...`. A value that passes
 * `.url()` and is then rendered as `<a href={value}>` is a stored-XSS sink:
 * the payload is saved once and executes for every later visitor.
 *
 * That is exactly the shape of the exhibitor booth. An exhibitor holding only
 * an invite token sets `website_url` on their own booth, and that value is
 * rendered as an `href` on the PUBLIC event booth page, where every attendee
 * clicks it.
 *
 * Only `http:` and `https:` are ever safe here. `mailto:`/`tel:` are handled by
 * their own dedicated fields and are deliberately NOT allowed through, so this
 * helper has exactly one meaning at every call site.
 *
 * Use `safeExternalUrl` at RENDER time (it defends against rows already in the
 * database) and `zSafeUrl` at INPUT time (it stops new bad rows being written).
 */

import { z } from 'zod';

/** Schemes that are safe to put in an `href` we did not author. */
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Normalise a stored URL to something safe to use as an `href`, or `null`.
 *
 * Values are commonly stored without a scheme (`example.com`), which is both
 * how the existing display helper behaves and how users type them, so a bare
 * value is upgraded to `https://`. Anything that still fails to parse, or that
 * parses to a scheme outside the allowlist, returns `null` — callers must treat
 * `null` as "render no link at all" rather than falling back to the raw string,
 * which would reintroduce the sink.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // A bare host gets https://. Note the test is for a scheme we allow, NOT for
  // "contains ://" — `javascript:` has no slashes and must not slip through as
  // an already-schemed value.
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!ALLOWED_PROTOCOLS.has(url.protocol.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** Display-only hostname for a stored URL, or `null` when it isn't safe. */
export function safeUrlHostname(value: string | null | undefined): string | null {
  const safe = safeExternalUrl(value);
  if (!safe) return null;
  try {
    return new URL(safe).hostname;
  } catch {
    return null;
  }
}

/**
 * Zod schema for a user-supplied external URL: normalises to a safe absolute
 * `https?:` URL, or rejects. Empty string and `null` both normalise to `null`
 * so a cleared field round-trips as "unset" rather than as a validation error.
 */
export const zSafeUrl = z
  .string()
  .max(2000)
  .trim()
  .nullable()
  .optional()
  .transform(v => (v == null || v === '' ? null : v))
  .superRefine((v, ctx) => {
    if (v == null) return;
    if (safeExternalUrl(v) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Must be a valid http(s) URL',
      });
    }
  })
  .transform(v => (v == null ? null : safeExternalUrl(v)));
