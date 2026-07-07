export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Settings' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GeneralSettings from './GeneralSettings';
import ProfileSettings from '@/components/account/ProfileSettings';

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  // Select includes columns (job_title, industry, …) added in migration 048 that
  // aren't in the frozen types/database.ts, so cast the client at the boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select(`
      id, full_name, email, plan, role, avatar_url, phone, city,
      interests, whatsapp_verified, notification_prefs,
      organization, timezone, language, currency, date_format,
      notify_registrations, notify_daily_summary, notify_card_shares, notify_product_updates,
      bio, job_title, industry, role_types, goals, directory_visible, open_to_connect, linkedin_url, x_url
    `)
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/dashboard');

  // The organizer's identity/networking profile is edited by the SHARED canonical
  // editor (same component the attendee /account/profile route renders), so there
  // is one source of truth for profile fields. SettingsClient keeps the
  // organizer-only General bits: workspace preferences + org notifications + danger.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;

  return (
    <GeneralSettings
      profile={profile}
      userId={user.id}
      profileTab={
        <ProfileSettings
          embedded
          profile={{
            id: p.id,
            full_name: p.full_name,
            email: p.email ?? user.email ?? '',
            avatar_url: p.avatar_url,
            interests: (p.interests as string[] | null) ?? null,
            city: p.city ?? null,
            phone: p.phone ?? null,
            whatsapp_verified: p.whatsapp_verified ?? null,
            notification_prefs: (p.notification_prefs as Record<string, boolean> | null) ?? null,
            language: (p.language as string | null) ?? null,
            bio: p.bio ?? null,
            job_title: p.job_title ?? null,
            organization: p.organization ?? null,
            industry: p.industry ?? null,
            role_types: (p.role_types as string[] | null) ?? null,
            goals: (p.goals as string[] | null) ?? null,
            directory_visible: p.directory_visible ?? null,
            open_to_connect: p.open_to_connect ?? null,
            linkedin_url: p.linkedin_url ?? null,
            x_url: p.x_url ?? null,
          }}
        />
      }
    />
  );
}
