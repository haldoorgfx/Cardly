export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Settings' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select(`
      full_name, email, plan, role, avatar_url,
      organization, timezone, language, currency, date_format,
      notify_registrations, notify_daily_summary, notify_card_shares, notify_product_updates
    `)
    .eq('id', user.id)
    .single();

  return (
    <>
      <SettingsTabs />
      <SettingsClient profile={profile} userId={user.id} />
    </>
  );
}
