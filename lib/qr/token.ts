/**
 * Extract a check-in token from scanned QR text. Tokens come in two formats:
 *   - 32-char hex (regular registrations, from crypto.randomUUID)
 *   - short alphanumeric (walk-ins / badge IDs, from Math.random().toString(36))
 * The QR may encode the raw token or a full URL (…/check-in?token=XXXX).
 * Returns the token string, or null if nothing token-like is found.
 *
 * Dependency-free so it's safe to import in client components.
 */
export function extractToken(scanned: string): string | null {
  const text = (scanned ?? '').trim();
  if (!text) return null;

  // URL form: pull the token query param
  const urlMatch = text.match(/[?&]token=([A-Za-z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1];

  // Raw token: a single alphanumeric chunk of a plausible length
  if (/^[A-Za-z0-9_-]{6,64}$/.test(text)) return text;

  return null;
}
