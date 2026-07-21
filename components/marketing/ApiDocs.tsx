'use client';

import { useEffect, useRef, useState } from 'react';
import { AUTO_DISABLE_AFTER } from '@/lib/webhooks/constants';

// ── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#65736B', border: '#E5E0D4',
  primary: '#1F4D3A', primaryDark: '#163828', soft: '#E8EFEB', cream: '#FAF6EE',
  surface: '#FFFFFF', accent: '#E8C57E',
  codeBg: '#0F1F18', codeFg: '#E8EFEB', codeMuted: '#8FA89B',
  codeBar: '#17311F',
};
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

type Lang = 'curl' | 'node' | 'python';
const LANGS: { id: Lang; label: string }[] = [
  { id: 'curl', label: 'cURL' },
  { id: 'node', label: 'Node.js' },
  { id: 'python', label: 'Python' },
];

/**
 * Grouped, not a flat list of thirteen.
 *
 * The old nav was one undifferentiated column, which gave a first-time reader
 * no map: "Scopes" and "Check-in" looked like peers when one is something you
 * read once and the other is something you return to. Three groups match how
 * the page is actually used — set up, then look up, then reference.
 */
const NAV_GROUPS: { title: string; items: { id: string; label: string }[] }[] = [
  {
    title: 'Getting started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart', label: 'Quick start' },
      { id: 'authentication', label: 'Authentication' },
      { id: 'scopes', label: 'Scopes' },
    ],
  },
  {
    title: 'Endpoints',
    items: [
      { id: 'events', label: 'Events' },
      { id: 'registrations', label: 'Registrations' },
      { id: 'checkin', label: 'Check-in' },
      { id: 'render', label: 'Card rendering' },
      { id: 'webhooks', label: 'Webhooks' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { id: 'rate-limits', label: 'Rate limits' },
      { id: 'errors', label: 'Errors' },
      { id: 'pagination', label: 'Pagination' },
      { id: 'support', label: 'Support' },
    ],
  },
];
const ALL_IDS = NAV_GROUPS.flatMap(g => g.items.map(i => i.id));

// ── Primitives ───────────────────────────────────────────────────────────────

function CopyButton({ text, onDark = true }: { text: string; onDark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(text).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 1500); },
        () => {/* clipboard blocked — the code is still selectable */},
      )}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className="text-[11px] font-medium px-2 h-6 rounded-md transition shrink-0"
      style={
        onDark
          ? { background: 'rgba(232,239,235,0.08)', color: copied ? C.accent : C.codeMuted, border: '1px solid rgba(232,239,235,0.14)' }
          : { background: C.surface, color: copied ? C.primary : C.muted, border: `1px solid ${C.border}` }
      }
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

/**
 * Code sample with a header bar.
 *
 * Previously a bare dark rectangle with a copy button floating over the first
 * line — on a cream page that reads as a hole punched through the layout, and
 * the button collided with long first lines. The bar gives each sample a
 * caption ("Request · cURL", "Response") so you can tell at a glance whether
 * you are looking at something to send or something to expect.
 */
function Code({ code, label }: { code: string; label?: string }) {
  return (
    <div
      className="my-4 rounded-xl overflow-hidden"
      style={{ border: `1px solid ${C.border}` }}
    >
      <div
        className="flex items-center justify-between gap-3 px-3 h-9"
        style={{ background: C.codeBar, borderBottom: '1px solid rgba(232,239,235,0.10)' }}
      >
        <span
          className="text-[11px] font-medium tracking-[0.08em] uppercase truncate"
          style={{ color: C.codeMuted }}
        >
          {label ?? 'Example'}
        </span>
        <CopyButton text={code} />
      </div>
      <pre
        className="p-4 overflow-x-auto text-[12.5px] leading-[1.65] m-0"
        style={{ background: C.codeBg, color: C.codeFg, fontFamily: MONO }}
      >
        {code}
      </pre>
    </div>
  );
}

function Request({ lang, samples }: { lang: Lang; samples: Record<Lang, string> }) {
  const label = LANGS.find(l => l.id === lang)?.label ?? 'Request';
  return <Code code={samples[lang]} label={`Request · ${label}`} />;
}

function Method({ m }: { m: string }) {
  const color = m === 'GET' ? '#2D7A4F' : m === 'POST' ? C.primary : '#C97A2D';
  return (
    <span
      className="text-[11px] font-bold px-2 py-0.5 rounded shrink-0 tracking-wide"
      style={{ background: C.surface, color, border: `1px solid ${color}33` }}
    >
      {m}
    </span>
  );
}

function EndpointHeader({ m, path }: { m: string; path: string }) {
  return (
    <div
      className="flex items-center gap-2.5 flex-wrap mt-2 mb-3 px-3 py-2.5 rounded-lg"
      style={{ background: C.soft, border: `1px solid ${C.border}` }}
    >
      <Method m={m} />
      <code className="text-[13px] break-all" style={{ color: C.ink, fontFamily: MONO }}>{path}</code>
    </div>
  );
}

/** Section heading. The hairline above it is what gives the page rhythm —
 *  without it thirteen sections read as one uninterrupted scroll. */
function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="font-display text-[24px] font-bold tracking-[-0.02em] mt-16 mb-4 pt-10 scroll-mt-24 first:mt-0 first:pt-0"
      style={{ color: C.ink, borderTop: `1px solid ${C.border}` }}
    >
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[16px] font-semibold mt-8 mb-2" style={{ color: C.ink }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[14.5px] leading-[1.75] mb-4" style={{ color: C.inkSoft }}>{children}</p>;
}
function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="text-[12.5px] px-1.5 py-0.5 rounded"
      style={{ background: C.soft, color: C.primaryDark, fontFamily: MONO }}
    >
      {children}
    </code>
  );
}

/** Two-column reference table — used for scopes, status codes and webhooks. */
function RefTable({ rows, codeColor }: { rows: [string, string][]; codeColor: string }) {
  return (
    <div className="overflow-x-auto rounded-xl my-4" style={{ border: `1px solid ${C.border}` }}>
      <table className="w-full text-[13.5px]" style={{ minWidth: 460 }}>
        <tbody>
          {rows.map(([k, d], i) => (
            <tr key={k} style={{ borderTop: i ? `1px solid ${C.border}` : 'none', background: C.surface }}>
              <td className="px-4 py-3 align-top w-[38%]">
                <code style={{ fontFamily: MONO, color: codeColor }}>{k}</code>
              </td>
              <td className="px-4 py-3" style={{ color: C.muted }}>{d}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function ApiDocs({ baseUrl, appUrl }: { baseUrl: string; appUrl: string }) {
  const [lang, setLang] = useState<Lang>('curl');
  const [activeId, setActiveId] = useState<string>(ALL_IDS[0]);
  const navRef = useRef<HTMLElement>(null);
  const KEY = 'sk_live_your_key';

  /**
   * Scroll-spy. A thirteen-section reference with no position indicator leaves
   * you unable to answer "where am I" without scrolling back to the last
   * heading — the single biggest usability gap on the old page.
   *
   * rootMargin pins the trigger line near the top of the viewport so the
   * highlighted item matches the heading you are actually reading rather than
   * whatever happens to be centred.
   */
  useEffect(() => {
    const headings = ALL_IDS
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-88px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  // Keep the active nav item in view when the sidebar is taller than its slot.
  useEffect(() => {
    const el = navRef.current?.querySelector(`[data-nav="${activeId}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeId]);

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
    node: `import crypto from "crypto";\n\nfunction verify(rawBody, signature, secret) {\n  const expected =\n    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");\n  const a = Buffer.from(signature || "", "utf8");\n  const b = Buffer.from(expected, "utf8");\n  // Length check first: timingSafeEqual THROWS on mismatched lengths, so a\n  // forged header would crash your handler instead of being rejected.\n  if (a.length !== b.length) return false;\n  return crypto.timingSafeEqual(a, b);\n}`,
    python: `import hmac, hashlib\n\ndef verify(raw_body: bytes, signature: str, secret: str) -> bool:\n    expected = "sha256=" + hmac.new(\n        secret.encode(), raw_body, hashlib.sha256\n    ).hexdigest()\n    return hmac.compare_digest(signature, expected)`,
  };

  const navLink = (item: { id: string; label: string }) => {
    const active = activeId === item.id;
    return (
      <a
        key={item.id}
        href={`#${item.id}`}
        data-nav={item.id}
        aria-current={active ? 'true' : undefined}
        className="block text-[13.5px] py-1.5 px-3 rounded-lg transition"
        style={{
          color: active ? C.primary : C.muted,
          background: active ? C.soft : 'transparent',
          fontWeight: active ? 600 : 400,
          textDecoration: 'none',
        }}
      >
        {item.label}
      </a>
    );
  };

  const langToggle = (
    <div
      className="inline-flex items-center p-0.5 rounded-lg"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}
    >
      {LANGS.map(l => (
        <button
          key={l.id}
          type="button"
          onClick={() => setLang(l.id)}
          aria-pressed={lang === l.id}
          className="text-[12.5px] font-medium px-3 h-8 rounded-md transition"
          style={{
            background: lang === l.id ? C.primary : 'transparent',
            color: lang === l.id ? '#FFFFFF' : C.inkSoft,
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ background: C.cream }}>
      {/* ── Hero ───────────────────────────────────────────────────────────
          Developers arriving here want three things immediately: what this
          is, the base URL, and a key. The old hero gave the first and buried
          the other two — the base URL sat inside the prose and the only CTA
          was 1,200px down at the very bottom of the page. */}
      <header style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div className="mx-auto max-w-[1180px] px-5 lg:px-8 py-12 lg:py-16">
          <span
            className="text-[11px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: C.muted }}
          >
            Developers
          </span>
          <h1
            className="font-display text-[36px] lg:text-[46px] font-bold tracking-[-0.03em] mt-3"
            style={{ color: C.ink }}
          >
            Eventera API
          </h1>
          <p className="text-[16px] leading-[1.7] mt-4 max-w-[620px]" style={{ color: C.inkSoft }}>
            A clean REST API to connect Eventera to your own systems — pull events and attendees into
            your CRM or data warehouse, check people in from your own app, and generate Eventera Cards
            on demand.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-7">
            <a
              href="/settings/developer"
              className="inline-flex items-center h-11 px-5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: C.primary, color: '#FFFFFF', textDecoration: 'none' }}
            >
              Create an API key
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center h-11 px-5 rounded-xl text-[14px] font-semibold transition hover:opacity-80"
              style={{ background: C.surface, color: C.ink, border: `1px solid ${C.border}`, textDecoration: 'none' }}
            >
              Studio plan
            </a>
            <span className="text-[13px]" style={{ color: C.muted }}>
              Available on Studio
            </span>
          </div>

          {/* The one string every reader needs before anything else. */}
          <div
            className="inline-flex items-center gap-3 mt-8 pl-3 pr-2 h-11 rounded-xl max-w-full"
            style={{ background: C.codeBg }}
          >
            <span
              className="text-[11px] font-medium tracking-[0.08em] uppercase shrink-0"
              style={{ color: C.codeMuted }}
            >
              Base URL
            </span>
            <code
              className="text-[13px] truncate"
              style={{ color: C.codeFg, fontFamily: MONO }}
            >
              {baseUrl}
            </code>
            <CopyButton text={baseUrl} />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1180px] px-5 lg:px-8 pb-24">
        {/* Mobile contents — the old sidebar was `hidden lg:block`, so on a
            phone the page had no navigation at all: thirteen sections and
            nothing but scrolling. */}
        <details
          className="lg:hidden mt-6 rounded-xl"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <summary
            className="cursor-pointer list-none px-4 h-12 flex items-center text-[14px] font-semibold"
            style={{ color: C.ink }}
          >
            On this page
          </summary>
          <div className="px-2 pb-3">
            {NAV_GROUPS.map(g => (
              <div key={g.title} className="mt-2">
                <div
                  className="text-[11px] font-semibold tracking-[0.12em] uppercase px-3 py-1"
                  style={{ color: C.muted }}
                >
                  {g.title}
                </div>
                {g.items.map(navLink)}
              </div>
            ))}
          </div>
        </details>

        <div className="lg:grid lg:grid-cols-[224px_1fr] lg:gap-14 mt-8 lg:mt-10">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav
              ref={navRef}
              className="sticky top-8 overflow-y-auto pr-1"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
              aria-label="API reference sections"
            >
              {NAV_GROUPS.map(g => (
                <div key={g.title} className="mb-5">
                  <div
                    className="text-[11px] font-semibold tracking-[0.12em] uppercase px-3 mb-1.5"
                    style={{ color: C.muted }}
                  >
                    {g.title}
                  </div>
                  {g.items.map(navLink)}
                </div>
              ))}
            </nav>
          </aside>

          {/* Content — capped measure. Long code samples still scroll on their
              own; prose that runs the full width of a 1180px page is simply
              hard to read. */}
          <main className="min-w-0 max-w-[760px]">
            <div
              className="flex items-center gap-3 flex-wrap sticky top-0 z-10 py-3 -mx-1 px-1"
              style={{ background: C.cream }}
            >
              <span className="text-[12.5px]" style={{ color: C.muted }}>Examples in</span>
              {langToggle}
            </div>

            <H2 id="introduction">Introduction</H2>
            <P>The Eventera API is organized around REST. It has predictable, resource-oriented URLs, returns JSON, and uses standard HTTP verbs and status codes. All requests are made over HTTPS to a single base URL:</P>
            <Code code={baseUrl} label="Base URL" />
            <P>Every request must be authenticated with an API key and the account must be on the Studio plan. Data is always scoped to the key&apos;s owner — a key can only ever read or modify that account&apos;s own events and attendees.</P>

            <H2 id="quickstart">Quick start</H2>
            <P>1. Open <InlineCode>Settings → Developer</InlineCode> and create an API key. Copy it — it is shown only once. 2. Choose the scopes the key needs. 3. Make your first request:</P>
            <Request lang={lang} samples={listEvents} />

            <H2 id="authentication">Authentication</H2>
            <P>Authenticate by passing your secret key as a Bearer token in the <InlineCode>Authorization</InlineCode> header on every request. Keys look like <InlineCode>sk_live_…</InlineCode>. Keep them server-side and never expose them in browser or mobile client code.</P>
            <Code code={`Authorization: Bearer ${KEY}`} label="Header" />
            <P>If a key is missing or revoked you get <InlineCode>401</InlineCode>. If the account is not on Studio you get <InlineCode>402</InlineCode>. You can rotate or revoke a key at any time from the dashboard; rotating immediately invalidates the old secret.</P>

            <H2 id="scopes">Scopes</H2>
            <P>Each key holds a set of scopes. A request that needs a scope the key doesn&apos;t have returns <InlineCode>403</InlineCode> with the required scope named in the body.</P>
            <RefTable
              codeColor={C.primary}
              rows={[
                ['events:read', 'Read events and their ticket types'],
                ['registrations:read', 'Read attendee registrations'],
                ['analytics:read', 'Reserved — no endpoint requires it yet. View and download counts come back with events:read.'],
                ['checkin:write', 'Check attendees in'],
                ['full_access', 'All of the above, including card rendering'],
              ]}
            />

            {/* EVENTS */}
            <H2 id="events">Events</H2>
            <P>An event object includes its status, public slug, schedule, and view/download counts. The single-event endpoint also returns its ticket types.</P>

            <H3>List events</H3>
            <EndpointHeader m="GET" path="/events" />
            <P>Query parameters: <InlineCode>status</InlineCode> (draft · published · archived), <InlineCode>limit</InlineCode>, <InlineCode>offset</InlineCode>. Requires <InlineCode>events:read</InlineCode>.</P>
            <Request lang={lang} samples={listEvents} />
            <Code label="Response" code={`{\n  "data": [\n    {\n      "id": "e_123",\n      "name": "Tech Summit",\n      "slug": "tech-summit-a1b2",\n      "status": "published",\n      "title": "Tech Summit 2026",\n      "starts_at": "2026-09-01T09:00:00Z",\n      "ends_at": "2026-09-01T17:00:00Z",\n      "timezone": "Africa/Nairobi",\n      "venue_name": "Nairobi Expo",\n      "is_online": false,\n      "view_count": 1240,\n      "download_count": 312,\n      "created_at": "2026-06-01T10:00:00Z"\n    }\n  ],\n  "pagination": { "limit": 20, "offset": 0, "total": 1 }\n}`} />

            <H3>Retrieve an event</H3>
            <EndpointHeader m="GET" path="/events/{id}" />
            <P>Requires <InlineCode>events:read</InlineCode>. Returns the event plus its <InlineCode>ticket_types</InlineCode>.</P>
            <Request lang={lang} samples={getEvent} />
            <Code label="Response" code={`{\n  "id": "e_123",\n  "name": "Tech Summit",\n  "slug": "tech-summit-a1b2",\n  "status": "published",\n  "title": "Tech Summit 2026",\n  "description": "A day of talks…",\n  "starts_at": "2026-09-01T09:00:00Z",\n  "venue_name": "Nairobi Expo",\n  "ticket_types": [\n    { "id": "t_1", "name": "General", "price": 25, "currency": "USD",\n      "quantity_total": 500, "quantity_sold": 188 }\n  ]\n}`} />

            {/* REGISTRATIONS */}
            <H2 id="registrations">Registrations</H2>
            <P>Registrations are the attendees who signed up for an event. Fields include contact details, ticket type, payment status, check-in time, and any custom form fields collected at registration.</P>

            <H3>List an event&apos;s registrations</H3>
            <EndpointHeader m="GET" path="/events/{id}/registrations" />
            <P>Query: <InlineCode>status</InlineCode> (pending · confirmed · checked_in · cancelled · refunded), <InlineCode>limit</InlineCode>, <InlineCode>offset</InlineCode>. Requires <InlineCode>registrations:read</InlineCode>.</P>
            <Request lang={lang} samples={listRegs} />
            <Code label="Response" code={`{\n  "data": [\n    {\n      "id": "r_789",\n      "event_id": "e_123",\n      "attendee_name": "Ada Lovelace",\n      "attendee_email": "ada@example.com",\n      "attendee_phone": "+254700000000",\n      "status": "confirmed",\n      "payment_status": "paid",\n      "ticket_type": "General",\n      "amount_paid": 25,\n      "currency": "USD",\n      "checked_in_at": null,\n      "custom_fields": { "company": "Analytical Engines" },\n      "qr_code_token": "abc123",\n      "created_at": "2026-07-01T12:00:00Z"\n    }\n  ],\n  "pagination": { "limit": 50, "offset": 0, "total": 1 }\n}`} />

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
            <Code label="Response" code={`{\n  "ok": true,\n  "already_checked_in": false,\n  "registration_id": "r_789",\n  "attendee_name": "Ada Lovelace",\n  "checked_in_at": "2026-09-01T09:12:00Z"\n}`} />

            {/* RENDER */}
            <H2 id="render">Card rendering</H2>
            <P>Generate an Eventera Card as a PNG. Provide a card <InlineCode>variantId</InlineCode> and the <InlineCode>fields</InlineCode> to fill its text zones; optionally a <InlineCode>photoDataUrl</InlineCode> (base64) for a photo zone. The response body is the PNG binary. Requires <InlineCode>full_access</InlineCode>.</P>
            <EndpointHeader m="POST" path="/render" />
            <Request lang={lang} samples={render} />
            <P>Returns <InlineCode>Content-Type: image/png</InlineCode>. On error you get a JSON body with an <InlineCode>error</InlineCode> field instead.</P>

            {/* WEBHOOKS */}
            <H2 id="webhooks">Webhooks</H2>
            <P>Rather than polling, subscribe to events and Eventera will POST to your URL when they happen. Add a webhook in <InlineCode>Settings → Developer</InlineCode> and pick the events you want:</P>
            <RefTable
              codeColor={C.primary}
              rows={[
                ['card.generated', 'An attendee generated an Eventera Card'],
                ['event.published', 'You published an event'],
                ['event.viewed', 'An attendee opened a public event page'],
              ]}
            />
            <P>Each delivery is a JSON POST that includes an <InlineCode>X-Eventera-Signature</InlineCode> header — <InlineCode>sha256=</InlineCode> followed by the HMAC-SHA256 of the raw request body, keyed with your webhook secret. The secret is shown once when you add the webhook; if you lose it, use <InlineCode>Rotate secret</InlineCode> in <InlineCode>Settings → Developer</InlineCode> to issue a new one. Verify it before trusting the payload:</P>
            <Request lang={lang} samples={verifyWebhook} />
            <P>Your endpoint should respond <InlineCode>2xx</InlineCode> quickly. Non-2xx responses count as failures and are surfaced in the dashboard; only HTTPS URLs that resolve to public hosts are accepted.</P>

            {/* REFERENCE */}
            <P>A delivery is attempted up to three times with a short backoff, and is retried only on a timeout, a network error, or a <InlineCode>408</InlineCode>/<InlineCode>425</InlineCode>/<InlineCode>429</InlineCode>/<InlineCode>5xx</InlineCode> response — any other <InlineCode>4xx</InlineCode> is treated as a deliberate rejection. Respond <InlineCode>2xx</InlineCode> within 4 seconds; do your work after acknowledging. After {AUTO_DISABLE_AFTER} consecutive failures the endpoint is switched off and you&apos;ll see it disabled in <InlineCode>Settings → Developer</InlineCode>. Webhooks are a best-effort notification, not a guaranteed log — reconcile with the REST endpoints if you need completeness.</P>

            <H2 id="rate-limits">Rate limits</H2>
            <P>Requests are rate-limited per API key: 120 requests per minute, and 20 per minute for <InlineCode>POST /render</InlineCode>, which is far more expensive than the read endpoints. A separate per-IP limit also applies. When you exceed either you receive a <InlineCode>429 Too Many Requests</InlineCode> response with a <InlineCode>Retry-After</InlineCode> header (in seconds). Back off for that many seconds before retrying. Design bulk syncs to page steadily rather than firing many requests in parallel.</P>

            <H2 id="errors">Errors</H2>
            <P>Eventera uses conventional HTTP status codes. Errors return a JSON body with an <InlineCode>error</InlineCode> message (and sometimes extra context like <InlineCode>required_scope</InlineCode>).</P>
            <Code label="Error body" code={`{ "error": "This key is missing the required scope: checkin:write", "required_scope": "checkin:write" }`} />
            <RefTable
              codeColor={C.ink}
              rows={[
                ['200 / 201', 'Success'],
                ['400', 'Bad request — missing or invalid parameters'],
                ['401', 'Missing or invalid API key'],
                ['402', 'Account is not on the Studio plan'],
                ['403', 'Key is missing the required scope'],
                ['404', 'Resource not found or not owned by you'],
                ['429', 'Rate limited — retry after the given delay'],
                ['5xx', 'Something went wrong on our side'],
              ]}
            />

            <H2 id="pagination">Pagination</H2>
            <P>List endpoints accept <InlineCode>limit</InlineCode> (default 50, max 100) and <InlineCode>offset</InlineCode> (default 0). Every list response includes a <InlineCode>pagination</InlineCode> object so you know when to stop.</P>
            <Code label="Response shape" code={`{\n  "data": [ /* … */ ],\n  "pagination": { "limit": 50, "offset": 0, "total": 128 }\n}`} />
            <P>To fetch the next page, add <InlineCode>limit</InlineCode> to your current <InlineCode>offset</InlineCode>. Keep going while <InlineCode>offset + data.length &lt; total</InlineCode>.</P>

            {/* SUPPORT */}
            <H2 id="support">Support</H2>
            <P>Questions or something not behaving as documented? Email <a href="mailto:support@eventera.so" className="underline" style={{ color: C.primary }}>support@eventera.so</a> or reach us from <a href={`${appUrl}/contact`} className="underline" style={{ color: C.primary }}>the contact page</a>. Manage your keys and webhooks any time in <InlineCode>Settings → Developer</InlineCode>.</P>

            <div
              className="mt-10 p-6 rounded-2xl flex flex-wrap items-center gap-4 justify-between"
              style={{ background: C.soft, border: `1px solid ${C.border}` }}
            >
              <div className="min-w-0">
                <div className="font-display font-semibold text-[16px]" style={{ color: C.ink }}>
                  Ready to build?
                </div>
                <div className="text-[13.5px] mt-0.5" style={{ color: C.muted }}>
                  Create a key in Settings → Developer and make your first call.
                </div>
              </div>
              <a
                href="/settings/developer"
                className="inline-flex items-center h-11 px-5 rounded-xl text-[14px] font-semibold shrink-0 transition hover:opacity-90"
                style={{ background: C.primary, color: '#FFFFFF', textDecoration: 'none' }}
              >
                Create an API key
              </a>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
