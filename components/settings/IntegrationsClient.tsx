'use client';

import { useEffect, useState, useCallback } from 'react';
import { BrandLogo } from '@/components/settings/BrandLogos';

type Provider = 'slack' | 'zapier' | 'google_sheets' | 'mailchimp' | 'hubspot';

interface PublicIntegration {
  provider: Provider;
  connected: boolean;
  enabled: boolean;
  last_used_at: string | null;
  last_error: string | null;
  hint: string | null;
}

interface StripeStatus {
  configured: boolean;
  connected: boolean;
  chargesEnabled: boolean;
}

interface Field { key: string; label: string; placeholder: string; }

interface Meta {
  provider: Provider;
  name: string;
  blurb: string;
  fields: Field[];
  help: string;
  link?: string;
  snippet?: string;
}

const META: Meta[] = [
  {
    provider: 'zapier', name: 'Zapier', blurb: 'Connect Eventera to 5,000+ apps without code.',
    fields: [{ key: 'webhook_url', label: 'Catch Hook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' }],
    help: 'In Zapier, create a Zap with the trigger “Webhooks by Zapier → Catch Hook”, then copy the custom webhook URL it gives you.',
    link: 'https://zapier.com/apps/webhook/integrations',
  },
  {
    provider: 'mailchimp', name: 'Mailchimp', blurb: 'Sync attendees directly to your email lists.',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'xxxxxxxxxxxx-us21' },
      { key: 'audience_id', label: 'Audience (List) ID', placeholder: 'a1b2c3d4e5' },
    ],
    help: 'Mailchimp → Account → Extras → API keys to create a key. Find the Audience ID under Audience → Settings → “Audience name and defaults”.',
    link: 'https://mailchimp.com/help/about-api-keys/',
  },
  {
    provider: 'slack', name: 'Slack', blurb: 'Get registration alerts in your Slack channels.',
    fields: [{ key: 'webhook_url', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }],
    help: 'In Slack, add the “Incoming Webhooks” app, pick a channel, and copy the Webhook URL.',
    link: 'https://api.slack.com/messaging/webhooks',
  },
  {
    provider: 'hubspot', name: 'HubSpot', blurb: 'Push registrant data into your CRM automatically.',
    fields: [{ key: 'token', label: 'Private App Token', placeholder: 'pat-na1-...' }],
    help: 'HubSpot → Settings → Integrations → Private Apps → Create a private app with the “crm.objects.contacts.write” scope, then copy its access token.',
    link: 'https://developers.hubspot.com/docs/api/private-apps',
  },
  {
    provider: 'google_sheets', name: 'Google Sheets', blurb: 'Export attendee data to a live spreadsheet.',
    fields: [{ key: 'webhook_url', label: 'Apps Script Web App URL', placeholder: 'https://script.google.com/macros/s/.../exec' }],
    help: 'In your Google Sheet: Extensions → Apps Script, paste the snippet below, then Deploy → New deployment → Web app (Execute as: Me, Access: Anyone). Copy the Web app URL.',
    link: 'https://developers.google.com/apps-script/guides/web',
    snippet:
`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var d = JSON.parse(e.postData.contents);
  sheet.appendRow([new Date(), d.name, d.email, d.phone, d.event, d.ticket, d.amount, d.currency]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}`,
  },
];

const C = {
  ink: '#0F1F18', muted: '#6B7A72', border: '#E5E0D4', primary: '#1F4D3A',
  soft: '#E8EFEB', cream: '#FAF6EE', danger: '#B8423C', success: '#2D7A4F',
};

export function IntegrationsClient() {
  const [data, setData] = useState<Record<Provider, PublicIntegration> | null>(null);
  const [stripe, setStripe] = useState<StripeStatus | null>(null);
  const [open, setOpen] = useState<Provider | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    const [iRes, sRes] = await Promise.all([
      fetch('/api/integrations'),
      fetch('/api/integrations/stripe'),
    ]);
    if (iRes.ok) setData(await iRes.json());
    if (sRes.ok) setStripe(await sRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Surface the Stripe onboarding return (?stripe=connected|pending|error).
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('stripe');
    if (!p) return;
    if (p === 'connected') setBanner({ kind: 'success', text: 'Stripe connected — you can now accept card payments.' });
    else if (p === 'pending') setBanner({ kind: 'error', text: 'Stripe onboarding is incomplete. Finish the steps to start accepting payments.' });
    else if (p === 'error') setBanner({ kind: 'error', text: 'Something went wrong returning from Stripe. Please try again.' });
    window.history.replaceState({}, '', '/settings/integrations');
  }, []);

  async function startStripe() {
    setBanner(null);
    const res = await fetch('/api/integrations/stripe/connect', { method: 'POST' });
    const body = await res.json();
    if (res.ok && body.url) { window.location.href = body.url; return; }
    setBanner({ kind: 'error', text: body.error ?? 'Could not start Stripe onboarding.' });
  }

  async function disconnectStripe() {
    await fetch('/api/integrations/stripe', { method: 'DELETE' });
    load();
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[24px] tracking-tight" style={{ color: C.ink }}>Integrations</h1>
        <p className="mt-1.5 text-[14px]" style={{ color: C.muted }}>Connect Eventera to your existing tools and workflows.</p>
      </div>

      {banner && (
        <div className="mb-5 rounded-xl px-4 py-3 text-[13px] font-medium"
          style={{
            background: banner.kind === 'success' ? C.soft : '#FBEDEC',
            color: banner.kind === 'success' ? C.primary : C.danger,
            border: `1px solid ${banner.kind === 'success' ? C.border : '#F0CFCD'}`,
          }}>
          {banner.text}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {META.map(m => {
          const state = data?.[m.provider];
          const connected = !!state?.connected;
          return (
            <div key={m.provider} className="bg-white rounded-2xl p-5 flex flex-col" style={{ border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl grid place-items-center"
                  style={{ background: 'white', border: `1px solid ${C.border}` }}>
                  <BrandLogo id={m.provider} size={22} />
                </div>
                <StatusPill connected={connected} error={!!state?.last_error} />
              </div>
              <div className="font-display text-[14.5px] font-semibold mb-1" style={{ color: C.ink }}>{m.name}</div>
              <p className="text-[12.5px] mb-4 flex-1" style={{ color: C.muted }}>{m.blurb}</p>
              {connected && state?.hint && (
                <p className="text-[11px] mb-3 truncate" style={{ color: C.muted }} title={state.hint}>{state.hint}</p>
              )}
              {connected && state?.last_error && (
                <p className="text-[11px] mb-3" style={{ color: C.danger }}>Last delivery failed: {state.last_error}</p>
              )}
              <div className="flex gap-2">
                <button onClick={() => setOpen(m.provider)}
                  className="text-[12.5px] font-medium px-3 py-2 rounded-lg transition-colors"
                  style={{ background: connected ? 'white' : C.primary, color: connected ? C.ink : 'white', border: `1px solid ${connected ? C.border : C.primary}` }}>
                  {connected ? 'Manage' : 'Connect'}
                </button>
              </div>
            </div>
          );
        })}

        {/* Stripe — Connect onboarding, not a paste field */}
        <div className="bg-white rounded-2xl p-5 flex flex-col" style={{ border: `1px solid ${C.border}` }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl grid place-items-center"
              style={{ background: 'white', border: `1px solid ${C.border}` }}>
              <BrandLogo id="stripe" size={22} />
            </div>
            <StripePill stripe={stripe} />
          </div>
          <div className="font-display text-[14.5px] font-semibold mb-1" style={{ color: C.ink }}>Stripe</div>
          <p className="text-[12.5px] mb-4 flex-1" style={{ color: C.muted }}>Accept card payments for paid events. Funds settle to your own Stripe account.</p>
          {stripe && !stripe.configured && (
            <p className="text-[11px] mb-3" style={{ color: C.muted }}>Stripe isn’t enabled on the platform yet.</p>
          )}
          <div className="flex gap-2">
            {stripe?.chargesEnabled ? (
              <button onClick={disconnectStripe}
                className="text-[12.5px] font-medium px-3 py-2 rounded-lg"
                style={{ background: 'white', color: C.ink, border: `1px solid ${C.border}` }}>Disconnect</button>
            ) : (
              <button onClick={startStripe} disabled={!stripe?.configured}
                className="text-[12.5px] font-medium px-3 py-2 rounded-lg disabled:opacity-50"
                style={{ background: C.primary, color: 'white', border: `1px solid ${C.primary}` }}>
                {stripe?.connected ? 'Finish setup' : 'Connect Stripe'}
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <ConnectModal
          meta={META.find(m => m.provider === open)!}
          state={data?.[open] ?? null}
          onClose={() => setOpen(null)}
          onChanged={() => { setOpen(null); load(); }}
        />
      )}
    </div>
  );
}

function StatusPill({ connected, error }: { connected: boolean; error: boolean }) {
  const [bg, fg, label] = connected
    ? (error ? ['#FBEDEC', C.danger, 'Attention'] : [C.soft, C.primary, 'Connected'])
    : ['#F5F3EE', C.muted, 'Not connected'];
  return (
    <span className="text-[9.5px] tracking-[0.12em] uppercase px-2 py-1 rounded-full"
      style={{ background: bg, color: fg, border: `1px solid ${C.border}` }}>{label}</span>
  );
}

function StripePill({ stripe }: { stripe: StripeStatus | null }) {
  const label = !stripe?.configured ? 'Soon'
    : stripe.chargesEnabled ? 'Active'
    : stripe.connected ? 'Pending' : 'Not connected';
  const active = stripe?.chargesEnabled;
  return (
    <span className="text-[9.5px] tracking-[0.12em] uppercase px-2 py-1 rounded-full"
      style={{ background: active ? C.soft : '#F5F3EE', color: active ? C.primary : C.muted, border: `1px solid ${C.border}` }}>{label}</span>
  );
}

function ConnectModal({ meta, state, onClose, onChanged }: {
  meta: Meta; state: PublicIntegration | null; onClose: () => void; onChanged: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'save' | 'test' | 'disconnect' | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const connected = !!state?.connected;

  async function save() {
    setBusy('save'); setError(''); setOk('');
    const res = await fetch(`/api/integrations/${meta.provider}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(body.error ?? 'Could not save.'); return; }
    onChanged();
  }

  async function test() {
    setBusy('test'); setError(''); setOk('');
    const res = await fetch(`/api/integrations/${meta.provider}/test`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) { setError(body.error ?? 'Test failed.'); return; }
    setOk('Test sent — check your tool.');
  }

  async function disconnect() {
    setBusy('disconnect');
    await fetch(`/api/integrations/${meta.provider}`, { method: 'DELETE' });
    setBusy(null);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,31,24,0.45)' }} onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-[440px] max-h-[90vh] overflow-y-auto p-6" style={{ border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-[18px] font-semibold" style={{ color: C.ink }}>{meta.name}</h2>
          <button onClick={onClose} className="text-[20px] leading-none" style={{ color: C.muted }} aria-label="Close">×</button>
        </div>
        <p className="text-[13px] mb-4" style={{ color: C.muted }}>{meta.help}{' '}
          {meta.link && <a href={meta.link} target="_blank" rel="noreferrer" className="underline" style={{ color: C.primary }}>Learn how →</a>}
        </p>

        {meta.snippet && (
          <pre className="text-[10.5px] rounded-lg p-3 mb-4 overflow-x-auto" style={{ background: C.cream, color: C.ink, border: `1px solid ${C.border}` }}>{meta.snippet}</pre>
        )}

        {meta.fields.map(f => (
          <div key={f.key} className="mb-3">
            <label className="block text-[12px] font-medium mb-1" style={{ color: C.ink }}>{f.label}</label>
            <input
              type="text" placeholder={f.placeholder}
              value={values[f.key] ?? ''}
              onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
              className="w-full text-[13px] px-3 py-2 rounded-lg outline-none"
              style={{ border: `1px solid ${C.border}`, background: 'white', color: C.ink }}
            />
          </div>
        ))}

        {error && <p className="text-[12px] mb-3" style={{ color: C.danger }}>{error}</p>}
        {ok && <p className="text-[12px] mb-3" style={{ color: C.success }}>{ok}</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={save} disabled={busy !== null}
            className="text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-50"
            style={{ background: C.primary, color: 'white' }}>
            {busy === 'save' ? 'Saving…' : connected ? 'Update' : 'Connect'}
          </button>
          {connected && (
            <>
              <button onClick={test} disabled={busy !== null}
                className="text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-50"
                style={{ background: 'white', color: C.ink, border: `1px solid ${C.border}` }}>
                {busy === 'test' ? 'Sending…' : 'Send test'}
              </button>
              <button onClick={disconnect} disabled={busy !== null}
                className="text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-50 ml-auto"
                style={{ background: 'white', color: C.danger, border: `1px solid ${C.border}` }}>
                {busy === 'disconnect' ? 'Removing…' : 'Disconnect'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
