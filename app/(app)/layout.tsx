import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getVisibleSections } from '@/lib/rbac/sections';
import { AppShell } from '@/components/app/AppShell';

// Server layout: resolves the user's role sections AND profile/plan BEFORE
// first paint, so the sidebar renders complete and identical on every page —
// no client fetch flash, no plan-box flicker. AppShell still refreshes in the
// background.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [sections, profileRes, countRes, settingsRes] = await Promise.all([
    getVisibleSections(user.id),
    admin.from('profiles').select('full_name, email, plan, role').eq('id', user.id).single(),
    admin.from('events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'archived'),
    admin.from('site_settings').select('logo_light_url').eq('id', 1).maybeSingle(),
  ]);

  return (
    <AppShell
      initialSections={sections}
      initialProfile={profileRes?.data ?? null}
      initialEventCount={countRes?.count ?? 0}
      initialLogoUrl={settingsRes?.data?.logo_light_url ?? null}
    >
      {children}
    </AppShell>
  );
}
