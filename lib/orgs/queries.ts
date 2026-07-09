import { createClient } from '@/lib/supabase/server';

export type Org = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  brand: Record<string, string>;
  onboarded_at: string | null;
};

/** Returns the first org owned by this user (personal workspace). */
export async function getUserOrg(userId: string): Promise<Org | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, plan, brand, onboarded_at')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  return (data as Org | null) ?? null;
}

/** True if the user has completed the onboarding wizard. */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const org = await getUserOrg(userId);
  return !!org?.onboarded_at;
}

/** Marks the org as onboarded and updates the workspace name. */
export async function completeOnboarding(orgId: string, name: string): Promise<void> {
  const supabase = createClient();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  await supabase
    .from('organizations')
    .update({ name, slug, onboarded_at: new Date().toISOString() })
    .eq('id', orgId);
}
