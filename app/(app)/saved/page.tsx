export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SavedFollowingClient } from '@/components/discovery/SavedFollowingClient';

export const metadata = { title: 'Saved & Following' };

export default async function SavedPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const [savedRes, followingRes] = await Promise.all([
    adminAny
      .from('saved_events')
      .select('event_page_id, event_pages(id, title, cover_image_url, starts_at, city, venue_name, is_online, price_from, custom_slug, events(slug))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    adminAny
      .from('organizer_follows')
      .select('id, organizer_id, notify_new_events, profiles(id, full_name, organization, avatar_url), next_event_title, follower_count')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <SavedFollowingClient
      saved={(savedRes.data ?? []).map((s: { event_pages: unknown }) => s.event_pages).filter(Boolean)}
      following={followingRes.data ?? []}
      userId={user.id}
      embedded
    />
  );
}
