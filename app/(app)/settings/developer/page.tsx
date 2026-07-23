export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Developer — Settings' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DeveloperTab } from '@/app/(app)/settings/DeveloperTab';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export default async function DeveloperPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!(await isPlatformFeatureEnabled('developer_api'))) redirect('/settings');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = profile?.plan ?? 'free';

  return (
    <div className="max-w-[760px] mx-auto">
      <DeveloperTab plan={plan} />
    </div>
  );
}
