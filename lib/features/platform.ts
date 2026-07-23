import { createAdminClient } from '@/lib/supabase/server';
import {
  PLATFORM_FEATURE_KEYS,
  PLATFORM_FEATURE_META,
  platformFlagName,
  type PlatformFeatureKey,
  type PlatformFeatureFlagRow,
} from './platformFeatureMeta';

/**
 * Platform-wide, super-admin-only kill-switches for whole optional features
 * (Q&A, Sponsors, ...). Separate from lib/events/sectionGate.ts, which is the
 * PER-EVENT organizer toggle for a subset of these same areas — a feature is
 * only actually usable when BOTH the platform flag here AND (where one
 * exists) the event's own sectionGate allow it.
 *
 * Stored as "platform:<key>" rows in the existing feature_flags table
 * (migration 009) so this doesn't need a parallel flags system — see
 * migration 122 for the seed data and rationale.
 *
 * SERVER ONLY (imports next/headers via supabase/server) — 'use client'
 * components must import the constants from ./platformFeatureMeta directly,
 * not from here, or the server-only code below gets bundled into the client.
 */
export * from './platformFeatureMeta';

/**
 * Is this platform feature enabled? Defaults to TRUE when no row exists yet
 * — this is a kill-switch to turn OFF features that already work, never an
 * allow-list gating something new, so a missing row (migration not applied,
 * or a key added to the list before its row exists) must never silently
 * break a live feature.
 */
export async function isPlatformFeatureEnabled(key: PlatformFeatureKey): Promise<boolean> {
  const db = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('feature_flags')
    .select('enabled')
    .eq('flag', platformFlagName(key))
    .maybeSingle();
  return (data?.enabled as boolean | undefined) ?? true;
}

/** All platform:* rows, including keys that have no row yet (reported as enabled: true). */
export async function getAllPlatformFeatureFlags(): Promise<PlatformFeatureFlagRow[]> {
  const db = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db as any)
    .from('feature_flags')
    .select('flag, label, description, enabled')
    .like('flag', 'platform:%');

  const byFlag = new Map((data ?? []).map((r: { flag: string; label: string; description: string | null; enabled: boolean }) => [r.flag, r]));

  return PLATFORM_FEATURE_KEYS.map((key) => {
    const row = byFlag.get(platformFlagName(key)) as { flag: string; label: string; description: string | null; enabled: boolean } | undefined;
    const meta = PLATFORM_FEATURE_META[key];
    return {
      key,
      flag: platformFlagName(key),
      label: row?.label ?? meta.label,
      description: row?.description ?? meta.description,
      enabled: row?.enabled ?? true,
    };
  });
}
