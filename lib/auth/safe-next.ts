/**
 * Post-auth redirect destination validator.
 *
 * Every auth surface accepts a `?next=` destination and hands it to either
 * `redirect()` / `router.push()` (which follow absolute URLs straight off-site)
 * or string-concatenates it after an origin. Both are open-redirect sinks, and
 * an open redirect on a login/callback page is a phishing relay: the victim
 * lands on the attacker's page *immediately after a successful sign-in*, which
 * is the most convincing possible moment to show a fake "session expired" form.
 *
 * This used to be copy-pasted per file, and the copies drifted — the OAuth
 * callback and the attendee login never got one. One definition now, so a new
 * auth entry point can't silently ship without the check.
 *
 * Only same-origin absolute paths pass. Rejected:
 *   "https://evil.com"  — absolute URL, navigates off-site
 *   ".evil.com"         — `${origin}${next}` becomes https://eventera.so.evil.com
 *   "@evil.com"         — `${origin}${next}` becomes https://eventera.so@evil.com
 *                         (userinfo trick — the real host is evil.com)
 *   "//evil.com"        — protocol-relative, off-site via router.push()
 *   "/\evil.com"        — backslash is normalised to "/" by the URL parser
 */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;

  // Browsers strip tab/CR/LF from URLs before parsing, so "/\t/evil.com" would
  // become "//evil.com" downstream. Strip them here so we validate what the
  // browser will actually see.
  const path = value.replace(/[\t\r\n]/g, "");

  if (path.length === 0) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//") || path.startsWith("/\\")) return null;

  return path;
}
