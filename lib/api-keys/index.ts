/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

/** Generate a new API key. Returns the plain-text key (only shown once) + the DB record. */
export async function createApiKey(
  userId: string,
  name: string,
): Promise<{ key: string; record: ApiKey }> {
  const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 16); // "sk_live_XXXXXXXX"

  const db = createAdminClient();
  const { data, error } = await (db as any)
    .from('api_keys')
    .insert({ user_id: userId, name, key_hash: keyHash, key_prefix: keyPrefix })
    .select('id, user_id, name, key_prefix, created_at, last_used_at, revoked_at')
    .single();

  if (error) throw new Error(error.message);
  return { key: rawKey, record: data as ApiKey };
}

/** Validate an incoming Bearer token. Returns userId on success, null if invalid/revoked. */
export async function validateApiKey(rawKey: string): Promise<string | null> {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const db = createAdminClient();

  const { data } = await (db as any)
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (!data) return null;

  // Update last_used_at asynchronously — don't block the request
  (db as any)
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  return data.user_id as string;
}

/** List all active API keys for a user (hashes never returned). */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('api_keys')
    .select('id, user_id, name, key_prefix, created_at, last_used_at, revoked_at')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  return (data as ApiKey[]) ?? [];
}

/** Soft-delete a key by setting revoked_at. */
export async function revokeApiKey(id: string, userId: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await (db as any)
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
