import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getVisibleSections } from '@/lib/rbac/sections';
import { AppShell } from '@/components/app/AppShell';

// Server layout: resolves the user's role sections BEFORE first paint so the
// sidebar renders with the right entries immediately (no client fetch flash).
// AppShell still refreshes via /api/me/roles in the background.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sections = await getVisibleSections(user.id);

  return <AppShell initialSections={sections}>{children}</AppShell>;
}
