import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { IntegrationsClient } from '@/components/settings/IntegrationsClient';

export const metadata = { title: 'Integrations' };

export default async function IntegrationsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <IntegrationsClient />;
}
