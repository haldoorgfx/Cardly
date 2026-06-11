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

  // Select only base columns that exist in production; attendee columns (interests, city, phone,
  // whatsapp_verified, notification_prefs) are added by migration 010_attendee_accounts — use
  // null fallbacks until that migration is applied.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/account/login');

  // Attempt to fetch the attendee-specific columns separately so a missing-column error
  // doesn't block the whole page load.
  const { data: attendeeData } = await (supabase as any)
    .from('profiles')
    .select('interests, city, phone, whatsapp_verified, notification_prefs')
    .eq('id', user.id)
    .single();

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <ProfileSettings profile={{
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email ?? user.email ?? '',
        avatar_url: profile.avatar_url,
        interests: (attendeeData?.interests as string[] | null) ?? null,
        city: attendeeData?.city ?? null,
        phone: attendeeData?.phone ?? null,
        whatsapp_verified: attendeeData?.whatsapp_verified ?? null,
        notification_prefs: (attendeeData?.notification_prefs as Record<string, boolean> | null) ?? null,
      }} />
    </div>
  );
}
