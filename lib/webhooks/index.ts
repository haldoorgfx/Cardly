/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

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

/**
 * Fire all enabled webhooks for a user that subscribe to the given event.
 * Failures are logged to `failure_count` but do NOT throw.
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
      const sig = sign(hook.secret, body);
      try {
        const res = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Karta-Signature': sig,
            'X-Karta-Event': event,
            'User-Agent': 'Karta-Webhook/1.0',
          },
          body,
          signal: AbortSignal.timeout(8000),
        });

        const db = createAdminClient();
        if (res.ok) {
          await (db as any)
            .from('webhooks')
            .update({ last_fired_at: new Date().toISOString(), failure_count: 0 })
            .eq('id', hook.id);
        } else {
          await (db as any)
            .from('webhooks')
            .update({ failure_count: hook.failure_count + 1 })
            .eq('id', hook.id);
        }
      } catch {
        const db = createAdminClient();
        await (db as any)
          .from('webhooks')
          .update({ failure_count: hook.failure_count + 1 })
          .eq('id', hook.id);
      }
    }),
  );
}
