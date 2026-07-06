import crypto from 'crypto';
import { validateWebhookUrl } from '@/lib/webhooks/ssrf';
import type { IntegrationProvider, IntegrationConfig } from '@/lib/integrations';

// Data we hand to every integration when a registration is confirmed.
export interface RegistrationPayload {
  eventName: string;
  eventSlug: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string | null;
  ticketType?: string | null;
  amountPaid?: number | null;
  currency?: string | null;
  registeredAt: string; // ISO
}

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? '', last: parts.slice(1).join(' ') };
}

const TIMEOUT_MS = 8000;

/** POST JSON to a user-supplied URL, after an SSRF check. Throws on failure. */
async function postJson(url: string, body: unknown): Promise<void> {
  const check = await validateWebhookUrl(url);
  if (!check.ok) throw new Error(check.reason);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Remote returned HTTP ${res.status}`);
}

// ── Per-provider senders ─────────────────────────────────────────────────────

async function sendSlack(config: IntegrationConfig, p: RegistrationPayload): Promise<void> {
  const paid = p.amountPaid && p.amountPaid > 0 ? ` · ${p.currency ?? ''} ${p.amountPaid}` : '';
  const text =
    `🎟️ *New registration* for *${p.eventName}*\n` +
    `${p.attendeeName} (${p.attendeeEmail})` +
    `${p.ticketType ? ` · ${p.ticketType}` : ''}${paid}`;
  await postJson(config.webhook_url!, { text });
}

async function sendZapier(config: IntegrationConfig, p: RegistrationPayload): Promise<void> {
  // Zapier catch-hooks accept arbitrary JSON — send the flat payload.
  await postJson(config.webhook_url!, {
    event: 'registration.confirmed',
    event_name: p.eventName,
    event_slug: p.eventSlug,
    attendee_name: p.attendeeName,
    attendee_email: p.attendeeEmail,
    attendee_phone: p.attendeePhone ?? '',
    ticket_type: p.ticketType ?? '',
    amount_paid: p.amountPaid ?? 0,
    currency: p.currency ?? '',
    registered_at: p.registeredAt,
  });
}

async function sendGoogleSheets(config: IntegrationConfig, p: RegistrationPayload): Promise<void> {
  // The Apps Script web app receives this and appends a row.
  await postJson(config.webhook_url!, {
    name: p.attendeeName,
    email: p.attendeeEmail,
    phone: p.attendeePhone ?? '',
    event: p.eventName,
    ticket: p.ticketType ?? '',
    amount: p.amountPaid ?? 0,
    currency: p.currency ?? '',
    registered_at: p.registeredAt,
  });
}

async function sendMailchimp(config: IntegrationConfig, p: RegistrationPayload): Promise<void> {
  const { first, last } = splitName(p.attendeeName);
  const hash = crypto.createHash('md5').update(p.attendeeEmail.toLowerCase()).digest('hex');
  const url = `https://${config.server_prefix}.api.mailchimp.com/3.0/lists/${config.audience_id}/members/${hash}`;
  // Basic auth: any username + the API key. PUT upserts the member.
  const auth = Buffer.from(`anystring:${config.api_key}`).toString('base64');
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({
      email_address: p.attendeeEmail,
      status_if_new: 'subscribed',
      merge_fields: { FNAME: first, LAST: last, LNAME: last },
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({})) as { detail?: string };
    throw new Error(detail?.detail ?? `Mailchimp returned HTTP ${res.status}`);
  }
}

async function sendHubSpot(config: IntegrationConfig, p: RegistrationPayload): Promise<void> {
  const { first, last } = splitName(p.attendeeName);
  const props = {
    email: p.attendeeEmail,
    firstname: first,
    lastname: last,
    phone: p.attendeePhone ?? '',
  };
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` };
  // Try to create; if the contact already exists (409), patch by email instead.
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ properties: props }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 409) {
    const patch = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(p.attendeeEmail)}?idProperty=email`,
      { method: 'PATCH', headers, body: JSON.stringify({ properties: props }), signal: AbortSignal.timeout(TIMEOUT_MS) },
    );
    if (!patch.ok) throw new Error(`HubSpot update returned HTTP ${patch.status}`);
    return;
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(detail?.message ?? `HubSpot returned HTTP ${res.status}`);
  }
}

const SENDERS: Record<IntegrationProvider, (c: IntegrationConfig, p: RegistrationPayload) => Promise<void>> = {
  slack: sendSlack,
  zapier: sendZapier,
  google_sheets: sendGoogleSheets,
  mailchimp: sendMailchimp,
  hubspot: sendHubSpot,
};

/** Send a registration to one provider. Throws on failure (caller records it). */
export function sendToProvider(
  provider: IntegrationProvider,
  config: IntegrationConfig,
  payload: RegistrationPayload,
): Promise<void> {
  return SENDERS[provider](config, payload);
}

/** A sample payload used by the "Send test" button. */
export function samplePayload(): RegistrationPayload {
  return {
    eventName: 'Test Event',
    eventSlug: 'test-event',
    attendeeName: 'Ada Lovelace',
    attendeeEmail: 'ada@example.com',
    attendeePhone: '+253000000',
    ticketType: 'General Admission',
    amountPaid: 0,
    currency: 'USD',
    registeredAt: new Date().toISOString(),
  };
}
