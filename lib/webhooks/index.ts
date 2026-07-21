/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';
import { validateWebhookUrl } from '@/lib/webhooks/ssrf';
import { AUTO_DISABLE_AFTER } from '@/lib/webhooks/constants';

export type WebhookEvent =
  | 'card.generated'
  | 'event.published'
  | 'event.viewed';

export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  enabled: boolean;
  created_at: string;
  last_fired_at: string | null;
  failure_count: number;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function listWebhooks(userId: string): Promise<Webhook[]> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data as Webhook[]) ?? [];
}

export async function createWebhook(
  userId: string,
  url: string,
  events: WebhookEvent[],
): Promise<Webhook> {
  const db = createAdminClient();
  const { data, error } = await (db as any)
    .from('webhooks')
    .insert({ user_id: userId, url, events })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Webhook;
}

export async function updateWebhook(
  id: string,
  userId: string,
  patch: Partial<Pick<Webhook, 'url' | 'events' | 'enabled'>>,
): Promise<void> {
  const db = createAdminClient();
  const { error } = await (db as any)
    .from('webhooks')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

/**
 * Issue a fresh signing secret for a webhook and return it in full.
 *
 * The secret is the ONLY thing that makes X-Eventera-Signature meaningful, and
 * until now there was no path to it: createWebhook returns the row once, and
 * the list endpoint truncates `secret` to eight characters. An organizer who
 * did not capture it at creation — which the UI never showed them — could
 * never verify a delivery again, so the documented verification snippet was
 * unusable. Rotating is the safe way back: it hands over a value the caller
 * demonstrably owns rather than re-serving a stored secret on demand.
 *
 * Returns null if the webhook isn't found or isn't owned by this user.
 */
export async function rotateWebhookSecret(id: string, userId: string): Promise<string | null> {
  const db = createAdminClient();
  const secret = crypto.randomBytes(24).toString('hex');
  const { data, error } = await (db as any)
    .from('webhooks')
    .update({ secret })
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? secret : null;
}

export async function deleteWebhook(id: string, userId: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await (db as any)
    .from('webhooks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// ─── Firing ──────────────────────────────────────────────────────────────────

/** Sign the payload with HMAC-SHA256 using the webhook secret. */
function sign(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/** Total attempts per delivery (1 initial + 2 retries). */
const MAX_ATTEMPTS = 3;
/** Per-attempt timeout. Deliberately tighter than the old single 8s try:
 *  with retries the worst case has to stay bounded, because the caller does
 *  not await this and a serverless function can be frozen on response. */
const ATTEMPT_TIMEOUT_MS = 4000;
const BACKOFF_MS = [250, 750];
/** Consecutive failures before the endpoint is switched off. Imported so the
 *  organizer-facing copy cannot drift from the value acted on here. */
const MAX_CONSECUTIVE_FAILURES = AUTO_DISABLE_AFTER;

/**
 * Record a failed delivery.
 *
 * Compare-and-set on failure_count rather than a blind write. The previous
 * code did `failure_count: hook.failure_count + 1` from a value read before
 * the HTTP call — two deliveries in flight together both read 3 and both wrote
 * 4, so a persistently broken endpoint under load undercounted forever and
 * could never reach any threshold. If the CAS matches no rows another delivery
 * already counted this round, which is the outcome we wanted anyway.
 *
 * At MAX_CONSECUTIVE_FAILURES the endpoint is disabled. Until now nothing in
 * the product ever READ failure_count except to print it: a webhook pointing
 * at a dead host retried on every single event, forever, burning function time
 * on every card generated and every page viewed.
 */
async function recordFailure(hook: Webhook): Promise<void> {
  const next = hook.failure_count + 1;
  const db = createAdminClient();
  const patch: Record<string, unknown> = { failure_count: next };
  if (next >= MAX_CONSECUTIVE_FAILURES) patch.enabled = false;

  await (db as any)
    .from('webhooks')
    .update(patch)
    .eq('id', hook.id)
    .eq('failure_count', hook.failure_count);
}

/** 4xx means the receiver understood and rejected us — retrying just repeats
 *  the same rejection. Only transient conditions are worth another attempt. */
function isRetryable(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/**
 * Fire all enabled webhooks for a user that subscribe to the given event.
 * Failures are recorded to `failure_count` but never throw.
 *
 * NOT guaranteed delivery. Callers do not await this (see the call sites —
 * event.viewed fires on every public page view, and blocking a request on a
 * third-party HTTP round trip is worse than dropping a beacon), so on
 * serverless a delivery can still be lost if the function is frozen on
 * response. Closing that hole properly needs a durable queue, which the
 * project's locked stack deliberately excludes. Retries below fix the far more
 * common case: a receiver that blipped, restarted, or rate-limited us.
 */
export async function fireWebhooks(
  userId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const hooks = await listWebhooks(userId);
  const eligible = hooks.filter(h => h.enabled && h.events.includes(event));
  if (eligible.length === 0) return;

  const body = JSON.stringify({ event, data: payload, fired_at: new Date().toISOString() });

  await Promise.allSettled(
    eligible.map(async hook => {
      // Re-validate at fire time — guards against DNS-rebind (a URL that passed
      // at registration could later re-point at an internal address).
      const urlCheck = await validateWebhookUrl(hook.url);
      if (!urlCheck.ok) {
        await recordFailure(hook);
        return;
      }

      const sig = sign(hook.secret, body);

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, BACKOFF_MS[attempt - 1] ?? 750));
        }
        try {
          const res = await fetch(hook.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Eventera-Signature': sig,
              'X-Eventera-Event': event,
              'X-Eventera-Delivery-Attempt': String(attempt + 1),
              'User-Agent': 'Eventera-Webhook/1.0',
            },
            body,
            signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          });

          if (res.ok) {
            const db = createAdminClient();
            await (db as any)
              .from('webhooks')
              .update({ last_fired_at: new Date().toISOString(), failure_count: 0 })
              .eq('id', hook.id);
            return;
          }

          if (!isRetryable(res.status) || attempt === MAX_ATTEMPTS - 1) {
            await recordFailure(hook);
            return;
          }
        } catch {
          // Network error or timeout — always transient, so retry until spent.
          if (attempt === MAX_ATTEMPTS - 1) {
            await recordFailure(hook);
            return;
          }
        }
      }
    }),
  );
}
