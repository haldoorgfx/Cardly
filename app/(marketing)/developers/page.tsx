import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference — Eventera',
  description: 'Integrate Eventera with your own systems. Read events and registrations, check attendees in, and generate Eventera Cards over a simple REST API.',
};

const BASE = `${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://karta.cre8so.com').replace(/\/$/, '')}/api/v1`;

const C = { ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A', soft: '#E8EFEB', cream: '#FAF6EE' };

function Code({ children }: { children: string }) {
  return (
    <pre className="rounded-xl p-4 overflow-x-auto text-[12.5px] leading-relaxed my-3"
      style={{ background: '#0F1F18', color: '#E8EFEB', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
      {children}
    </pre>
  );
}

function Endpoint({ method, path, scope, desc }: { method: string; path: string; scope: string; desc: string }) {
  const color = method === 'GET' ? '#2D7A4F' : '#1F4D3A';
  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: C.soft, color }}>{method}</span>
      <code className="text-[13px]" style={{ color: C.ink, fontFamily: 'ui-monospace, monospace' }}>{path}</code>
      <span className="text-[11px] px-2 py-0.5 rounded-full ml-auto" style={{ background: C.cream, color: C.muted, border: `1px solid ${C.border}` }}>{scope}</span>
      <span className="text-[12.5px] w-full" style={{ color: C.muted }}>{desc}</span>
    </div>
  );
}

export default function DevelopersPage() {
  return (
    <div className="max-w-[820px] mx-auto px-5 py-12" style={{ color: C.ink }}>
      <h1 className="font-display text-[32px] font-semibold tracking-tight mb-2">Eventera API</h1>
      <p className="text-[15px] mb-8" style={{ color: C.muted }}>
        A simple REST API to integrate Eventera with your own systems — read events and attendees,
        check people in, and generate Eventera Cards. Available on the <strong>Studio</strong> plan.
      </p>

      <Section title="Base URL">
        <Code>{BASE}</Code>
      </Section>

      <Section title="Authentication">
        <p style={{ color: C.muted }} className="text-[14px]">
          Create an API key in <strong>Settings → Developer</strong>. Pass it as a Bearer token on every request.
          Keep it secret — treat it like a password. Keys are shown once at creation.
        </p>
        <Code>{`curl ${BASE}/events \\
  -H "Authorization: Bearer sk_live_your_key_here"`}</Code>
      </Section>

      <Section title="Scopes">
        <p style={{ color: C.muted }} className="text-[14px] mb-2">Each key carries scopes. A request without the required scope returns <code>403</code>.</p>
        <ul className="text-[13.5px] space-y-1" style={{ color: C.ink }}>
          <li><code>events:read</code> — read events</li>
          <li><code>registrations:read</code> — read attendee registrations</li>
          <li><code>analytics:read</code> — read aggregate stats</li>
          <li><code>checkin:write</code> — check attendees in</li>
          <li><code>full_access</code> — all of the above</li>
        </ul>
      </Section>

      <Section title="Endpoints">
        <Endpoint method="GET" path="/events" scope="events:read" desc="List your events. Query: status, limit (≤100), offset." />
        <Endpoint method="GET" path="/events/{id}" scope="events:read" desc="A single event with its ticket types." />
        <Endpoint method="GET" path="/events/{id}/registrations" scope="registrations:read" desc="Paginated attendee list. Query: status, limit, offset." />
        <Endpoint method="GET" path="/registrations/{id}" scope="registrations:read" desc="A single registration." />
        <Endpoint method="POST" path="/checkin" scope="checkin:write" desc="Check an attendee in by qr_code_token or registration_id." />
        <Endpoint method="POST" path="/render" scope="full_access" desc="Generate an Eventera Card PNG." />
      </Section>

      <Section title="Example — list registrations">
        <Code>{`curl "${BASE}/events/EVENT_ID/registrations?status=confirmed&limit=50" \\
  -H "Authorization: Bearer sk_live_..."

{
  "data": [
    {
      "id": "…",
      "attendee_name": "Ada Lovelace",
      "attendee_email": "ada@example.com",
      "status": "confirmed",
      "ticket_type": "General Admission",
      "checked_in_at": null,
      "created_at": "2026-07-01T12:00:00Z"
    }
  ],
  "pagination": { "limit": 50, "offset": 0, "total": 1 }
}`}</Code>
      </Section>

      <Section title="Example — check someone in">
        <Code>{`curl -X POST ${BASE}/checkin \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "qr_code_token": "abc123" }'

{ "ok": true, "already_checked_in": false, "attendee_name": "Ada Lovelace", "checked_in_at": "…" }`}</Code>
      </Section>

      <Section title="Rate limits & errors">
        <p style={{ color: C.muted }} className="text-[14px]">
          Requests are rate-limited per IP; exceeding the limit returns <code>429</code> with a <code>Retry-After</code> header.
          Errors are JSON: <code>{'{ "error": "message" }'}</code>. Common codes: <code>401</code> (bad key),
          <code>402</code> (not on Studio), <code>403</code> (missing scope), <code>404</code> (not found).
        </p>
      </Section>

      <Section title="Webhooks">
        <p style={{ color: C.muted }} className="text-[14px]">
          Instead of polling, register a webhook in <strong>Settings → Developer</strong> to receive events
          (<code>card.generated</code>, <code>event.published</code>, <code>event.viewed</code>). Every delivery
          includes an <code>X-Eventera-Signature</code> header (HMAC-SHA256 of the body) so you can verify authenticity.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-[19px] font-semibold mb-3" style={{ color: C.ink }}>{title}</h2>
      {children}
    </section>
  );
}
