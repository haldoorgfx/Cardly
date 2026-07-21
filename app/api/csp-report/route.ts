import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Collector for Content-Security-Policy violation reports.
 *
 * WHY THIS EXISTS
 * next.config.mjs ships the CSP in Report-Only mode, and its comment says that
 * is deliberate: prove the allowlist, then switch to an enforcing policy. But
 * the header carried no `report-uri` and no `report-to`, so violations went
 * only to each individual visitor's browser console — where nobody on the team
 * ever sees them. The proving step could never finish, so the policy sat
 * permanently inert: no blocking, and no data either.
 *
 * With reports arriving here, real production traffic does the proving. When
 * this stays quiet across a full event cycle — checkout, check-in, the
 * dashboard — the policy can be flipped to enforcing with evidence instead of
 * hope.
 *
 * Deliberately unauthenticated: browsers send these with no credentials, and a
 * report that required a session would only ever capture signed-in users —
 * missing the public event and registration pages, which are the ones that
 * matter most. Middleware already rate-limits every /api/* route (unmatched
 * paths fall to 60/min per IP), so this cannot be used to flood the logs.
 */

/** Both the legacy report-uri shape and the newer Reporting API shape. */
interface CspBody {
  'csp-report'?: Record<string, unknown>;
  body?: Record<string, unknown>;
  type?: string;
}

/**
 * Keep the path, drop the query string.
 *
 * `document-uri` is a full URL, and this app puts bearer-ish tokens in query
 * strings — `?reg=<qr_code_token>` on the confirm and pay pages most of all.
 * Logging those verbatim would copy live ticket tokens into the log stream to
 * fix a security header, which is a poor trade.
 */
function safePath(value: unknown, keepOrigin = false): string | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    const u = new URL(value);
    return keepOrigin ? `${u.origin}${u.pathname}` : u.pathname;
  } catch {
    // `blocked-uri` is not always a URL — it can be "inline", "eval", "data".
    return value.split('?')[0].slice(0, 200);
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json().catch(() => null)) as CspBody | CspBody[] | null;
    if (!raw) return new NextResponse(null, { status: 204 });

    // The Reporting API posts an array; report-uri posts a single object.
    const entries = Array.isArray(raw) ? raw : [raw];

    for (const entry of entries.slice(0, 10)) {
      const r = (entry['csp-report'] ?? entry.body ?? entry) as Record<string, unknown>;
      console.warn(
        '[CSP]',
        JSON.stringify({
          directive: r['effective-directive'] ?? r['violated-directive'] ?? r.effectiveDirective ?? null,
          // Origin kept here and only here: which HOST was blocked is the entire
          // diagnostic value of a CSP report — "/x.js" tells you nothing,
          // "https://evil.example.com/x.js" tells you everything. The query
          // string is still dropped.
          blocked: safePath(r['blocked-uri'] ?? r.blockedURL, true),
          document: safePath(r['document-uri'] ?? r.documentURL),
          disposition: r.disposition ?? 'report',
        }),
      );
    }
  } catch {
    // A malformed report must never surface as an error to the browser, and
    // must never be retried.
  }

  // 204 regardless: the browser has nothing useful to do with any other status.
  return new NextResponse(null, { status: 204 });
}
