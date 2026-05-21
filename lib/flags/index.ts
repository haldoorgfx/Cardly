/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/server';

// ─── Flag name constants ──────────────────────────────────────────────────────

export const FLAG_AI_CAPTIONS       = 'ai_captions';
export const FLAG_BULK_EXPORT       = 'bulk_export';
export const FLAG_ANALYTICS_V2      = 'analytics_v2';
export const FLAG_QR_CUSTOMIZATION  = 'qr_customization';
export const FLAG_NEW_CANVAS_EDITOR = 'new_canvas_editor';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeatureFlag {
  flag: string;
  label: string;
  description: string | null;
  enabled: boolean;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Check whether a feature flag is enabled.
 * Per-user override takes priority over the global setting.
 * Returns false if the flag doesn't exist.
 */
export async function isEnabled(flag: string, userId?: string): Promise<boolean> {
  const db = createAdminClient();

  if (userId) {
    const { data: override } = await (db as any)
      .from('feature_flag_overrides')
      .select('enabled')
      .eq('flag', flag)
      .eq('user_id', userId)
      .maybeSingle();

    if (override !== null && override !== undefined) {
      return override.enabled as boolean;
    }
  }

  const { data: row } = await (db as any)
    .from('feature_flags')
    .select('enabled')
    .eq('flag', flag)
    .maybeSingle();

  return row?.enabled ?? false;
}

/**
 * Return all feature flags ordered alphabetically.
 */
export async function getAllFlags(): Promise<FeatureFlag[]> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('feature_flags')
    .select('flag, label, description, enabled')
    .order('flag', { ascending: true });
  return (data as FeatureFlag[]) ?? [];
}

/**
 * Return a map of flag → enabled for a given user's overrides.
 */
export async function getFlagOverridesForUser(userId: string): Promise<Record<string, boolean>> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('feature_flag_overrides')
    .select('flag, enabled')
    .eq('user_id', userId);
  if (!data) return {};
  return Object.fromEntries(
    (data as { flag: string; enabled: boolean }[]).map(r => [r.flag, r.enabled])
  );
}
