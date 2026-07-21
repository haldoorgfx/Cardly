/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/server';

// Valid API scopes. `full_access` satisfies every scope check.
export const API_SCOPES = [
  'events:read',
  'registrations:read',
  'analytics:read',
  'checkin:write',
  'full_access',
] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export function normalizeScopes(input: unknown): ApiScope[] {
  const arr = Array.isArray(input) ? input : [];
  const valid = arr.filter((s): s is ApiScope => (API_SCOPES as readonly string[]).includes(s));
  // Default to read-only if nothing valid was supplied.
  return valid.length > 0 ? Array.from(new Set(valid)) : ['events:read', 'registrations:read'];
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  scopes: ApiScope[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

/** Generate a new API key. Returns the plain-text key (only shown once) + the DB record. */
export async function createApiKey(
  userId: string,
  name: string,
  scopes: ApiScope[] = [],
): Promise<{ key: string; record: ApiKey }> {
  const rawKey = 'sk_live_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 16); // "sk_live_XXXXXXXX"

  const db = createAdminClient();
  const { data, error } = await (db as any)
    .from('api_keys')
    .insert({ user_id: userId, name, key_hash: keyHash, key_prefix: keyPrefix, scopes })
    .select('id, user_id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
    .single();

  if (error) throw new Error(error.message);
  return { key: rawKey, record: data as ApiKey };
}

export interface ValidatedKey { keyId: string; userId: string; scopes: ApiScope[]; }

/** Validate an incoming Bearer token. Returns { userId, scopes } or null if invalid/revoked. */
export async function validateApiKey(rawKey: string): Promise<ValidatedKey | null> {
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const db = createAdminClient();

  const { data } = await (db as any)
    .from('api_keys')
    .select('id, user_id, scopes, revoked_at')
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

  return {
    keyId: data.id as string,
    userId: data.user_id as string,
    scopes: (data.scopes as ApiScope[]) ?? [],
  };
}

/** List all active API keys for a user (hashes never returned). */
export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('api_keys')
    .select('id, user_id, name, key_prefix, scopes, created_at, last_used_at, revoked_at')
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

/**
 * Rotate a key: revoke the old one and issue a fresh key with the same name and
 * scopes. Returns the new plain-text key (shown once) + record, or null if the
 * key wasn't found / not owned.
 */
export async function rotateApiKey(id: string, userId: string): Promise<{ key: string; record: ApiKey } | null> {
  const db = createAdminClient();
  const { data: existing } = await (db as any)
    .from('api_keys')
    .select('name, scopes')
    .eq('id', id)
    .eq('user_id', userId)
    .is('revoked_at', null)
    .maybeSingle();
  if (!existing) return null;

  await revokeApiKey(id, userId);
  return createApiKey(userId, existing.name as string, (existing.scopes as ApiScope[]) ?? []);
}
