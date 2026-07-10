'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Dismiss the one-time entitlements migration notice (G01).
 *
 * Re-derives the caller from the session — never trusts a client-supplied id —
 * and flips ONLY that user's own profiles.seen_entitlements_migration flag.
 * Mirrors the 024_onboarding_completed flag pattern.
 */
export async function dismissEntitlementsMigration(): Promise<{ ok?: boolean; error?: string }> {
  const supa = createClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { error: 'Not signed in' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from('profiles')
    .update({ seen_entitlements_migration: true })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  return { ok: true };
}
