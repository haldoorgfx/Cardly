/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server';

// ── Paste-credential integrations ────────────────────────────────────────────
// Each provider works once the organizer pastes a single credential from their
// own account — no OAuth app registration or marketplace review on our side.

export type IntegrationProvider =
  | 'slack'
  | 'zapier'
  | 'google_sheets'
  | 'mailchimp'
  | 'hubspot';

export const PROVIDERS: IntegrationProvider[] = [
  'slack', 'zapier', 'google_sheets', 'mailchimp', 'hubspot',
];

// Provider-specific config stored in user_integrations.config (jsonb).
export interface IntegrationConfig {
  // slack / zapier / google_sheets
  webhook_url?: string;
  // mailchimp
  api_key?: string;
  audience_id?: string;
  server_prefix?: string; // e.g. "us21" — derived from the api key suffix
  // hubspot
  token?: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  config: IntegrationConfig;
  enabled: boolean;
  last_used_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// What the client is allowed to see — never the raw secret.
export interface IntegrationPublic {
  provider: IntegrationProvider;
  connected: boolean;
  enabled: boolean;
  last_used_at: string | null;
  last_error: string | null;
  // A masked hint so the user can confirm which credential is stored.
  hint: string | null;
}

// ── Validation ───────────────────────────────────────────────────────────────

const HTTPS_URL = (v: unknown): v is string =>
  typeof v === 'string' && /^https:\/\/.+/i.test(v.trim());

/**
 * Validate + normalize the config a user submitted for a provider.
 * Returns the cleaned config or an error message.
 */
export function validateConfig(
  provider: IntegrationProvider,
  raw: IntegrationConfig,
): { ok: true; config: IntegrationConfig } | { ok: false; error: string } {
  switch (provider) {
    case 'slack':
      if (!HTTPS_URL(raw.webhook_url)) return { ok: false, error: 'Paste a valid Slack Incoming Webhook URL (https://hooks.slack.com/...).' };
      return { ok: true, config: { webhook_url: raw.webhook_url!.trim() } };

    case 'zapier':
      if (!HTTPS_URL(raw.webhook_url)) return { ok: false, error: 'Paste a valid Zapier Catch Hook URL (https://hooks.zapier.com/...).' };
      return { ok: true, config: { webhook_url: raw.webhook_url!.trim() } };

    case 'google_sheets':
      if (!HTTPS_URL(raw.webhook_url)) return { ok: false, error: 'Paste the Apps Script web-app URL (https://script.google.com/macros/s/...).' };
      return { ok: true, config: { webhook_url: raw.webhook_url!.trim() } };

    case 'mailchimp': {
      const key = (raw.api_key ?? '').trim();
      const audience = (raw.audience_id ?? '').trim();
      // Mailchimp keys look like "xxxxxxxx-us21" — the suffix is the server prefix.
      const dash = key.lastIndexOf('-');
      const prefix = dash > 0 ? key.slice(dash + 1) : '';
      if (!key || dash <= 0 || !/^[a-z]+\d+$/.test(prefix)) {
        return { ok: false, error: 'Paste your Mailchimp API key (it ends in something like "-us21").' };
      }
      if (!audience) return { ok: false, error: 'Enter your Mailchimp Audience (List) ID.' };
      return { ok: true, config: { api_key: key, audience_id: audience, server_prefix: prefix } };
    }

    case 'hubspot': {
      const token = (raw.token ?? '').trim();
      if (!token || token.length < 20) return { ok: false, error: 'Paste your HubSpot Private App access token.' };
      return { ok: true, config: { token } };
    }

    default:
      return { ok: false, error: 'Unknown integration.' };
  }
}

/** A masked hint for display — never returns the full secret. */
function hintFor(provider: IntegrationProvider, config: IntegrationConfig): string | null {
  switch (provider) {
    case 'slack':
    case 'zapier':
    case 'google_sheets': {
      const url = config.webhook_url ?? '';
      try { return new URL(url).host; } catch { return url ? '••••' : null; }
    }
    case 'mailchimp':
      return config.audience_id ? `List ${config.audience_id} · ${config.server_prefix ?? ''}` : null;
    case 'hubspot': {
      const t = config.token ?? '';
      return t ? `••••${t.slice(-4)}` : null;
    }
    default:
      return null;
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function listIntegrations(userId: string): Promise<Integration[]> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId);
  return (data as Integration[]) ?? [];
}

export async function getIntegration(
  userId: string,
  provider: IntegrationProvider,
): Promise<Integration | null> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle();
  return (data as Integration) ?? null;
}

/** Redact every integration into its client-safe public shape. */
export function toPublic(all: Integration[]): Record<IntegrationProvider, IntegrationPublic> {
  const base = {} as Record<IntegrationProvider, IntegrationPublic>;
  for (const p of PROVIDERS) {
    base[p] = { provider: p, connected: false, enabled: false, last_used_at: null, last_error: null, hint: null };
  }
  for (const row of all) {
    base[row.provider] = {
      provider: row.provider,
      connected: true,
      enabled: row.enabled,
      last_used_at: row.last_used_at,
      last_error: row.last_error,
      hint: hintFor(row.provider, row.config),
    };
  }
  return base;
}

export async function upsertIntegration(
  userId: string,
  provider: IntegrationProvider,
  config: IntegrationConfig,
  enabled = true,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await (db as any)
    .from('user_integrations')
    .upsert(
      { user_id: userId, provider, config, enabled, last_error: null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,provider' },
    );
  if (error) throw new Error(error.message);
}

export async function deleteIntegration(
  userId: string,
  provider: IntegrationProvider,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await (db as any)
    .from('user_integrations')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider);
  if (error) throw new Error(error.message);
}

export async function recordResult(
  userId: string,
  provider: IntegrationProvider,
  error: string | null,
): Promise<void> {
  const db = createAdminClient();
  await (db as any)
    .from('user_integrations')
    .update({ last_used_at: new Date().toISOString(), last_error: error })
    .eq('user_id', userId)
    .eq('provider', provider);
}
