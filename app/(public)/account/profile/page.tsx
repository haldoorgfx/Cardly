export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/events/PublicNav';
import ProfileSettings from '@/components/account/ProfileSettings';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Profile & preferences' };

export default async function AccountProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/account/profile');

  // Single read of the canonical profile. Networking / work columns (migration
  // 048) are not yet in the shared generated types (owned by another agent), so
  // the select string is cast and the row is read via a local `any` shape.
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'id, full_name, email, avatar_url, interests, city, phone, whatsapp_verified, notification_prefs, language, ' +
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ('bio, job_title, organization, industry, role_types, goals, directory_visible, open_to_connect, linkedin_url, x_url' as any),
    )
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/account/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = profile as any;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <ProfileSettings profile={{
        id: p.id,
        full_name: p.full_name,
        email: p.email ?? user.email ?? '',
        avatar_url: p.avatar_url,
        interests: (p.interests as string[] | null),
        city: p.city,
        phone: p.phone,
        whatsapp_verified: p.whatsapp_verified,
        notification_prefs: (p.notification_prefs as Record<string, boolean> | null),
        language: (p.language as string | null),
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
      }} />
    </div>
  );
}
