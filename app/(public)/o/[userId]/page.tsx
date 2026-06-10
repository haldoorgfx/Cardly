export const dynamic = 'force-dynamic';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { OrganizerProfile } from '@/components/discovery/OrganizerProfile';
import type { Metadata } from 'next';

interface Props { params: { userId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('full_name, organization')
    .eq('id', params.userId)
    .maybeSingle();

  const name = profile?.organization ?? profile?.full_name ?? 'Organizer';
  return {
    title: `${name} — Karta`,
    description: `Discover events by ${name} on Karta.`,
  };
}

export default async function OrganizerProfilePage({ params }: Props) {
  const { userId } = params;
  const admin = createAdminClient();

  // Profile — try full select first; fall back to base columns if newer columns missing in DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let { data: profile, error: profileError } = await (admin as any)
    .from('profiles')
    .select('id, full_name, avatar_url, bio, organization, city')
    .eq('id', userId)
    .maybeSingle();

  if (!profile && profileError) {
    // Possibly some columns don't exist yet — retry with only guaranteed-base columns
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallback = await (admin as any)
      .from('profiles')
      .select('id, full_name, avatar_url, bio, city')
      .eq('id', userId)
      .maybeSingle();
    profile = fallback.data;
  }

  if (!profile) notFound();

  const now = new Date().toISOString();

  // Upcoming + past events, follower count — all in parallel
  const [upcomingRes, pastRes, followerRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('event_pages')
      .select('id, event_id, title, tagline, cover_image_url, starts_at, ends_at, timezone, is_online, venue_name, city, country, category, price_from, organizer_name, custom_slug, events!inner(slug, user_id)')
      .eq('is_public', true)
      .eq('events.user_id', userId)
      .gte('ends_at', now)
      .order('starts_at', { ascending: true })
      .limit(12),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('event_pages')
      .select('id, title, starts_at, cover_image_url, custom_slug, events!inner(slug, user_id)')
      .eq('is_public', true)
      .eq('events.user_id', userId)
      .lt('ends_at', now)
      .order('starts_at', { ascending: false })
      .limit(12),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any)
      .from('organizer_follows')
      .select('id', { count: 'exact', head: true })
      .eq('organizer_id', userId),
  ]);

  // Filter by actual user_id match (PostgREST join filter quirk)
  const upcomingEvents = (upcomingRes.data ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep: any) => ep.events?.user_id === userId
  );
  const pastEvents = (pastRes.data ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep: any) => ep.events?.user_id === userId
  );
  const followerCount: number = followerRes.count ?? 0;
  const eventsHosted = upcomingEvents.length + pastEvents.length;

  // Is the logged-in user following this organizer?
  let isFollowing = false;
  let savedIds: string[] = [];
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id !== userId) {
      const [followRes, savedRes] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('organizer_follows').select('id').eq('follower_id', user.id).eq('organizer_id', userId).maybeSingle(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (admin as any).from('saved_events').select('event_page_id').eq('user_id', user.id),
      ]);
      isFollowing = !!followRes.data;
      savedIds = (savedRes.data ?? []).map((r: { event_page_id: string }) => r.event_page_id);
    }
  } catch { /* non-blocking */ }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <OrganizerProfile
        userId={userId}
        name={profile.full_name ?? 'Organizer'}
        bio={profile.bio}
        avatarUrl={profile.avatar_url}
        organization={profile.organization}
        followerCount={followerCount}
        eventsHosted={eventsHosted}
        upcomingEvents={upcomingEvents}
        pastEvents={pastEvents}
        isFollowing={isFollowing}
        savedIds={savedIds}
      />
    </div>
  );
}
