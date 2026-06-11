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

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, interests, city, phone, whatsapp_verified, notification_prefs')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/account/login');

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <ProfileSettings profile={{
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email ?? user.email ?? '',
        avatar_url: profile.avatar_url,
        interests: (profile.interests as string[] | null),
        city: profile.city,
        phone: profile.phone,
        whatsapp_verified: profile.whatsapp_verified,
        notification_prefs: (profile.notification_prefs as Record<string, boolean> | null),
      }} />
    </div>
  );
}
