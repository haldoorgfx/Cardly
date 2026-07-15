'use client';

import { useState } from 'react';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  ink: '#0F1F18', muted: '#65736B', border: '#E5E0D4', primary: '#1F4D3A',
  primaryDark: '#163828', soft: '#E8EFEB', cream: '#FAF6EE', accent: '#E8C57E',
  codeBg: '#0F1F18', codeFg: '#E8EFEB', codeMuted: '#8FA89B',
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

type Lang = 'curl' | 'node' | 'python';
const LANGS: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
];

const NAV = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'quickstart', label: 'Quick start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'scopes', label: 'Scopes' },
  { id: 'rate-limits', label: 'Rate limits' },
  { id: 'errors', label: 'Errors' },
  { id: 'pagination', label: 'Pagination' },
  { id: 'events', label: 'Events' },
  { id: 'registrations', label: 'Registrations' },
  { id: 'checkin', label: 'Check-in' },
  { id: 'render', label: 'Card rendering' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'support', label: 'Support' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
      className="absolute top-2.5 right-2.5 text-[11px] px-2 py-1 rounded-md transition"
      style={{ background: 'rgba(232,239,235,0.1)', color: copied ? C.accent : C.codeMuted, border: '1px solid rgba(232,239,235,0.15)' }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function Code({ code }: { code: string }) {
  return (
    <div className="relative my-3">
      <pre className="rounded-xl p-4 pr-16 overflow-x-auto text-[12.5px] leading-relaxed"
        style={{ background: C.codeBg, color: C.codeFg, fontFamily: MONO }}>{code}</pre>
      <CopyButton text={code} />
    </div>
  );
}

// Request example that switches with the global language toggle.
function Request({ lang, samples }: { lang: Lang; samples: Record<Lang, string> }) {
  return <Code code={samples[lang]} />;
}

function Method({ m }: { m: string }) {
  const color = m === 'GET' ? '#2D7A4F' : m === 'POST' ? C.primary : '#C97A2D';
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded shrink-0" style={{ background: C.soft, color }}>{m}</span>;
}

function EndpointHeader({ m, path }: { m: string; path: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap mt-1 mb-2 p-2.5 rounded-lg" style={{ background: C.cream, border: `1px solid ${C.border}` }}>
      <Method m={m} />
      <code className="text-[13px] break-all" style={{ color: C.ink, fontFamily: MONO }}>{path}</code>
    </div>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="font-display text-[22px] font-semibold tracking-tight mt-12 mb-3 scroll-mt-20" style={{ color: C.ink }}>{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[15px] font-semibold mt-6 mb-1.5" style={{ color: C.ink }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-relaxed mb-3" style={{ color: C.muted }}>{children}</p>;
}
function InlineCode({ children }: { children: React.ReactNode }) {
  return <code className="text-[12.5px] px-1.5 py-0.5 rounded" style={{ background: C.cream, color: C.primary, fontFamily: MONO, border: `1px solid ${C.border}` }}>{children}</code>;
}

export function ApiDocs({ baseUrl, appUrl }: { baseUrl: string; appUrl: string }) {
  const [lang, setLang] = useState<Lang>('curl');
  const KEY = 'sk_live_your_key';

  // ---- reusable sample builders ----
  const listEvents: Record<Lang, string> = {
    curl: `curl "${baseUrl}/events?status=published&limit=20" \\\n  -H "Authorization: Bearer ${KEY}"`,
    node: `const res = await fetch("${baseUrl}/events?status=published&limit=20", {\n  headers: { Authorization: "Bearer ${KEY}" },\n});\nconst { data, pagination } = await res.json();`,
    python: `import requests\n\nres = requests.get(\n    "${baseUrl}/events",\n    params={"status": "published", "limit": 20},\n    headers={"Authorization": "Bearer ${KEY}"},\n)\ndata = res.json()`,
  };

  const getEvent: Record<Lang, string> = {
    curl: `curl "${baseUrl}/events/EVENT_ID" \\\n  -H "Authorization: Bearer ${KEY}"`,
    node: `const res = await fetch("${baseUrl}/events/EVENT_ID", {\n  headers: { Authorization: "Bearer ${KEY}" },\n});\nconst event = await res.json();`,
    python: `res = requests.get(\n    "${baseUrl}/events/EVENT_ID",\n    headers={"Authorization": "Bearer ${KEY}"},\n)`,
  };

  const listRegs: Record<Lang, string> = {
    curl: `curl "${baseUrl}/events/EVENT_ID/registrations?status=confirmed&limit=50" \\\n  -H "Authorization: Bearer ${KEY}"`,
    node: `const res = await fetch(\n  "${baseUrl}/events/EVENT_ID/registrations?status=confirmed&limit=50",\n  { headers: { Authorization: "Bearer ${KEY}" } },\n);\nconst { data, pagination } = await res.json();`,
    python: `res = requests.get(\n    "${baseUrl}/events/EVENT_ID/registrations",\n    params={"status": "confirmed", "limit": 50},\n    headers={"Authorization": "Bearer ${KEY}"},\n)`,
  };

  const getReg: Record<Lang, string> = {
    curl: `curl "${baseUrl}/registrations/REG_ID" \\\n  -H "Authorization: Bearer ${KEY}"`,
    node: `const res = await fetch("${baseUrl}/registrations/REG_ID", {\n  headers: { Authorization: "Bearer ${KEY}" },\n});`,
    python: `res = requests.get(\n    "${baseUrl}/registrations/REG_ID",\n    headers={"Authorization": "Bearer ${KEY}"},\n)`,
  };

  const checkin: Record<Lang, string> = {
    curl: `curl -X POST "${baseUrl}/checkin" \\\n  -H "Authorization: Bearer ${KEY}" \\\n  -H "Content-Type: application/json" \\\n  -d '{ "qr_code_token": "abc123" }'`,
    node: `const res = await fetch("${baseUrl}/checkin", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${KEY}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({ qr_code_token: "abc123" }),\n});`,
    python: `res = requests.post(\n    "${baseUrl}/checkin",\n    json={"qr_code_token": "abc123"},\n    headers={"Authorization": "Bearer ${KEY}"},\n)`,
  };

  const render: Record<Lang, string> = {
    curl: `curl -X POST "${baseUrl}/render" \\\n  -H "Authorization: Bearer ${KEY}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "variantId": "VARIANT_ID",\n    "fields": { "name": "Ada Lovelace", "title": "Speaker" }\n  }' --output card.png`,
    node: `const res = await fetch("${baseUrl}/render", {\n  method: "POST",\n  headers: {\n    Authorization: "Bearer ${KEY}",\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    variantId: "VARIANT_ID",\n    fields: { name: "Ada Lovelace", title: "Speaker" },\n  }),\n});\nconst pngBuffer = Buffer.from(await res.arrayBuffer());`,
    python: `res = requests.post(\n    "${baseUrl}/render",\n    json={\n        "variantId": "VARIANT_ID",\n        "fields": {"name": "Ada Lovelace", "title": "Speaker"},\n    },\n    headers={"Authorization": "Bearer ${KEY}"},\n)\nopen("card.png", "wb").write(res.content)`,
  };

  const verifyWebhook: Record<Lang, string> = {
    curl: `# Signature is sent in the X-Eventera-Signature header:\n#   sha256=<hex HMAC-SHA256 of the raw body using your webhook secret>`,
    node: `import crypto from "crypto";\n\nfunction verify(rawBody, signature, secret) {\n  const expected =\n    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");\n  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));\n}`,
    python: `import hmac, hashlib\n\ndef verify(raw_body: bytes, signature: str, secret: str) -> bool:\n    expected = "sha256=" + hmac.new(\n        secret.encode(), raw_body, hashlib.sha256\n    ).hexdigest()\n    return hmac.compare_digest(signature, expected)`,
  };

  return (
    <div className="mx-auto max-w-[1120px] px-5 lg:px-8 py-10 lg:py-14">
      {/* Hero */}
      <div className="mb-2">
        <span className="text-[11px] font-semibold tracking-[0.14em] uppercase" style={{ color: C.accent }}>Developers</span>
        <h1 className="font-display text-[34px] lg:text-[40px] font-semibold tracking-tight mt-2" style={{ color: C.ink }}>Eventera API</h1>
        <p className="text-[15.5px] leading-relaxed mt-3 max-w-[640px]" style={{ color: C.muted }}>
          A clean REST API to connect Eventera to your own systems — pull events and attendees into your
          CRM or data warehouse, check people in from your own app, and generate Eventera Cards on demand.
          Available on the <strong style={{ color: C.ink }}>Studio</strong> plan.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-12 mt-8">
        {/* Sidebar nav */}
        <aside className="hidden lg:block">
          <nav className="sticky top-8 space-y-0.5">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`}
                className="block text-[13px] py-1.5 px-3 rounded-lg transition hover:bg-[#F0EBE0]"
                style={{ color: C.muted }}>{n.label}</a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {/* Language toggle */}
          <div className="flex items-center gap-2 mb-4 sticky top-0 z-10 py-2 -mx-1 px-1" style={{ background: C.cream }}>
            <span className="text-[12px] mr-1" style={{ color: C.muted }}>Examples in:</span>
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition"
                style={{
                  background: lang === l.id ? C.primary : 'white',
                  color: lang === l.id ? 'white' : C.ink,
                  border: `1px solid ${lang === l.id ? C.primary : C.border}`,
                }}>{l.label}</button>
            ))}
          </div>

          <H2 id="introduction">Introduction</H2>
          <P>The Eventera API is organized around REST. It has predictable, resource-oriented URLs, returns JSON, and uses standard HTTP verbs and status codes. All requests are made over HTTPS to a single base URL:</P>
          <Code code={baseUrl} />
          <P>Every request must be authenticated with an API key and the account must be on the Studio plan. Data is always scoped to the key&apos;s owner — a key can only ever read or modify that account&apos;s own events and attendees.</P>

          <H2 id="quickstart">Quick start</H2>
          <P>1. Open <InlineCode>Settings → Developer</InlineCode> and create an API key. Copy it — it is shown only once. 2. Choose the scopes the key needs. 3. Make your first request:</P>
          <Request lang={lang} samples={listEvents} />

          <H2 id="authentication">Authentication</H2>
          <P>Authenticate by passing your secret key as a Bearer token in the <InlineCode>Authorization</InlineCode> header on every request. Keys look like <InlineCode>sk_live_…</InlineCode>. Keep them server-side and never expose them in browser or mobile client code.</P>
          <Code code={`Authorization: Bearer ${KEY}`} />
          <P>If a key is missing or revoked you get <InlineCode>401</InlineCode>. If the account is not on Studio you get <InlineCode>402</InlineCode>. You can rotate or revoke a key at any time from the dashboard; rotating immediately invalidates the old secret.</P>

          <H2 id="scopes">Scopes</H2>
          <P>Each key holds a set of scopes. A request that needs a scope the key doesn&apos;t have returns <InlineCode>403</InlineCode> with the required scope named in the body.</P>
          <div className="overflow-x-auto rounded-xl my-3" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-[13px]" style={{ minWidth: 460 }}>
              <tbody>
                {[
                  ['events:read', 'Read events and their ticket types'],
                  ['registrations:read', 'Read attendee registrations'],
                  ['analytics:read', 'Read aggregate stats'],
                  ['checkin:write', 'Check attendees in'],
                  ['full_access', 'All of the above, including card rendering'],
                ].map(([s, d], i) => (
                  <tr key={s} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', background: 'white' }}>
                    <td className="px-4 py-2.5 align-top w-[42%]"><code style={{ fontFamily: MONO, color: C.primary }}>{s}</code></td>
                    <td className="px-4 py-2.5" style={{ color: C.muted }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="rate-limits">Rate limits</H2>
          <P>Requests are rate-limited per IP address. When you exceed the limit you receive a <InlineCode>429 Too Many Requests</InlineCode> response with a <InlineCode>Retry-After</InlineCode> header (in seconds). Back off for that many seconds before retrying. Design bulk syncs to page steadily rather than firing many requests in parallel.</P>

          <H2 id="errors">Errors</H2>
          <P>Eventera uses conventional HTTP status codes. Errors return a JSON body with an <InlineCode>error</InlineCode> message (and sometimes extra context like <InlineCode>required_scope</InlineCode>).</P>
          <Code code={`{ "error": "This key is missing the required scope: checkin:write", "required_scope": "checkin:write" }`} />
          <div className="overflow-x-auto rounded-xl my-3" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-[13px]" style={{ minWidth: 460 }}>
              <tbody>
                {[
                  ['200 / 201', 'Success'],
                  ['400', 'Bad request — missing or invalid parameters'],
                  ['401', 'Missing or invalid API key'],
                  ['402', 'Account is not on the Studio plan'],
                  ['403', 'Key is missing the required scope'],
                  ['404', 'Resource not found or not owned by you'],
                  ['429', 'Rate limited — retry after the given delay'],
                  ['5xx', 'Something went wrong on our side'],
                ].map(([code, d], i) => (
                  <tr key={code} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', background: 'white' }}>
                    <td className="px-4 py-2.5 align-top w-[28%]"><code style={{ fontFamily: MONO, color: C.ink }}>{code}</code></td>
                    <td className="px-4 py-2.5" style={{ color: C.muted }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <H2 id="pagination">Pagination</H2>
          <P>List endpoints accept <InlineCode>limit</InlineCode> (default 50, max 100) and <InlineCode>offset</InlineCode> (default 0). Every list response includes a <InlineCode>pagination</InlineCode> object so you know when to stop.</P>
          <Code code={`{\n  "data": [ /* … */ ],\n  "pagination": { "limit": 50, "offset": 0, "total": 128 }\n}`} />
          <P>To fetch the next page, add <InlineCode>limit</InlineCode> to your current <InlineCode>offset</InlineCode>. Keep going while <InlineCode>offset + data.length &lt; total</InlineCode>.</P>

          {/* EVENTS */}
          <H2 id="events">Events</H2>
          <P>An event object includes its status, public slug, schedule, and view/download counts. The single-event endpoint also returns its ticket types.</P>

          <H3>List events</H3>
          <EndpointHeader m="GET" path="/events" />
          <P>Query parameters: <InlineCode>status</InlineCode> (draft · published · archived), <InlineCode>limit</InlineCode>, <InlineCode>offset</InlineCode>. Requires <InlineCode>events:read</InlineCode>.</P>
          <Request lang={lang} samples={listEvents} />
          <P>Response:</P>
          <Code code={`{\n  "data": [\n    {\n      "id": "e_123",\n      "name": "Tech Summit",\n      "slug": "tech-summit-a1b2",\n      "status": "published",\n      "title": "Tech Summit 2026",\n      "starts_at": "2026-09-01T09:00:00Z",\n      "ends_at": "2026-09-01T17:00:00Z",\n      "timezone": "Africa/Nairobi",\n      "venue_name": "Nairobi Expo",\n      "is_online": false,\n      "view_count": 1240,\n      "download_count": 312,\n      "created_at": "2026-06-01T10:00:00Z"\n    }\n  ],\n  "pagination": { "limit": 20, "offset": 0, "total": 1 }\n}`} />

          <H3>Retrieve an event</H3>
          <EndpointHeader m="GET" path="/events/{id}" />
          <P>Requires <InlineCode>events:read</InlineCode>. Returns the event plus its <InlineCode>ticket_types</InlineCode>.</P>
          <Request lang={lang} samples={getEvent} />
          <Code code={`{\n  "id": "e_123",\n  "name": "Tech Summit",\n  "slug": "tech-summit-a1b2",\n  "status": "published",\n  "title": "Tech Summit 2026",\n  "description": "A day of talks…",\n  "starts_at": "2026-09-01T09:00:00Z",\n  "venue_name": "Nairobi Expo",\n  "ticket_types": [\n    { "id": "t_1", "name": "General", "price": 25, "currency": "USD",\n      "quantity_total": 500, "quantity_sold": 188 }\n  ]\n}`} />

          {/* REGISTRATIONS */}
          <H2 id="registrations">Registrations</H2>
          <P>Registrations are the attendees who signed up for an event. Fields include contact details, ticket type, payment status, check-in time, and any custom form fields collected at registration.</P>

          <H3>List an event&apos;s registrations</H3>
          <EndpointHeader m="GET" path="/events/{id}/registrations" />
          <P>Query: <InlineCode>status</InlineCode> (pending · confirmed · checked_in · cancelled · refunded), <InlineCode>limit</InlineCode>, <InlineCode>offset</InlineCode>. Requires <InlineCode>registrations:read</InlineCode>.</P>
          <Request lang={lang} samples={listRegs} />
          <Code code={`{\n  "data": [\n    {\n      "id": "r_789",\n      "event_id": "e_123",\n      "attendee_name": "Ada Lovelace",\n      "attendee_email": "ada@example.com",\n      "attendee_phone": "+254700000000",\n      "status": "confirmed",\n      "payment_status": "paid",\n      "ticket_type": "General",\n      "amount_paid": 25,\n      "currency": "USD",\n      "checked_in_at": null,\n      "custom_fields": { "company": "Analytical Engines" },\n      "qr_code_token": "abc123",\n      "created_at": "2026-07-01T12:00:00Z"\n    }\n  ],\n  "pagination": { "limit": 50, "offset": 0, "total": 1 }\n}`} />

          <H3>Retrieve a registration</H3>
          <EndpointHeader m="GET" path="/registrations/{id}" />
          <P>Requires <InlineCode>registrations:read</InlineCode>. Returns the same shape as a list item.</P>
          <Request lang={lang} samples={getReg} />

          {/* CHECK-IN */}
          <H2 id="checkin">Check-in</H2>
          <P>Check an attendee in from your own scanner or kiosk. Identify them by their <InlineCode>qr_code_token</InlineCode> (from the ticket QR) or their <InlineCode>registration_id</InlineCode>. The call is idempotent — checking in someone who is already checked in returns <InlineCode>already_checked_in: true</InlineCode> with the original timestamp.</P>
          <EndpointHeader m="POST" path="/checkin" />
          <P>Requires <InlineCode>checkin:write</InlineCode>. Body: <InlineCode>{'{ qr_code_token }'}</InlineCode> or <InlineCode>{'{ registration_id }'}</InlineCode>.</P>
          <Request lang={lang} samples={checkin} />
          <Code code={`{\n  "ok": true,\n  "already_checked_in": false,\n  "registration_id": "r_789",\n  "attendee_name": "Ada Lovelace",\n  "checked_in_at": "2026-09-01T09:12:00Z"\n}`} />

          {/* RENDER */}
          <H2 id="render">Card rendering</H2>
          <P>Generate an Eventera Card as a PNG. Provide a card <InlineCode>variantId</InlineCode> and the <InlineCode>fields</InlineCode> to fill its text zones; optionally a <InlineCode>photoDataUrl</InlineCode> (base64) for a photo zone. The response body is the PNG binary. Requires <InlineCode>full_access</InlineCode>.</P>
          <EndpointHeader m="POST" path="/render" />
          <Request lang={lang} samples={render} />
          <P>Returns <InlineCode>Content-Type: image/png</InlineCode>. On error you get a JSON body with an <InlineCode>error</InlineCode> field instead.</P>

          {/* WEBHOOKS */}
          <H2 id="webhooks">Webhooks</H2>
          <P>Rather than polling, subscribe to events and Eventera will POST to your URL when they happen. Add a webhook in <InlineCode>Settings → Developer</InlineCode> and pick the events you want:</P>
          <div className="overflow-x-auto rounded-xl my-3" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-[13px]" style={{ minWidth: 460 }}>
              <tbody>
                {[
                  ['card.generated', 'An attendee generated an Eventera Card'],
                  ['event.published', 'You published an event'],
                  ['event.viewed', 'An attendee opened a public event page'],
                ].map(([e, d], i) => (
                  <tr key={e} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', background: 'white' }}>
                    <td className="px-4 py-2.5 align-top w-[42%]"><code style={{ fontFamily: MONO, color: C.primary }}>{e}</code></td>
                    <td className="px-4 py-2.5" style={{ color: C.muted }}>{d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>Each delivery is a JSON POST that includes an <InlineCode>X-Eventera-Signature</InlineCode> header — <InlineCode>sha256=</InlineCode> followed by the HMAC-SHA256 of the raw request body, keyed with your webhook secret. Verify it before trusting the payload:</P>
          <Request lang={lang} samples={verifyWebhook} />
          <P>Your endpoint should respond <InlineCode>2xx</InlineCode> quickly. Non-2xx responses count as failures and are surfaced in the dashboard; only HTTPS URLs that resolve to public hosts are accepted.</P>

          {/* SUPPORT */}
          <H2 id="support">Support</H2>
          <P>Questions or something not behaving as documented? Email <a href={`mailto:support@eventera.so`} className="underline" style={{ color: C.primary }}>support@eventera.so</a> or reach us from <a href={`${appUrl}/contact`} className="underline" style={{ color: C.primary }}>the contact page</a>. Manage your keys and webhooks any time in <InlineCode>Settings → Developer</InlineCode>.</P>

          <div className="mt-12 pt-6 flex flex-wrap gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <a href="/settings/developer" className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ background: C.primary, color: 'white' }}>Create an API key →</a>
            <a href="/pricing" className="text-[13px] font-semibold px-4 py-2.5 rounded-lg" style={{ background: 'white', color: C.ink, border: `1px solid ${C.border}` }}>See Studio plan</a>
          </div>
        </main>
      </div>
    </div>
  );
}
