export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import { OrganizerCalendarClient } from '@/components/discovery/OrganizerCalendarClient';
import type { Metadata } from 'next';

interface Props { params: { userId: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).from('profiles').select('full_name, organization').eq('id', params.userId).maybeSingle();
  const name = data?.organization ?? data?.full_name ?? 'Organizer';
  return { title: `${name} — Calendar`, description: `Upcoming events by ${name}` };
}

export default async function OrganizerCalendarPage({ params }: Props) {
  const { userId } = params;
  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profile: any = null;
  for (const cols of ['id, full_name, avatar_url, organization, bio', 'id, full_name, avatar_url', 'id, full_name']) {
    const { data, error } = await adminAny.from('profiles').select(cols).eq('id', userId).maybeSingle();
    if (data) { profile = data; break; }
    if (!error) break;
  }
  if (!profile) notFound();

  const now = new Date().toISOString();

  const { data: events } = await adminAny
    .from('event_pages')
    .select('id, title, cover_image_url, starts_at, ends_at, venue_name, city, is_online, price_from, custom_slug, events!inner(slug, user_id, id)')
    .eq('is_public', true)
    .eq('events.user_id', userId)
    .or(`ends_at.gte.${now},ends_at.is.null`)
    .order('starts_at', { ascending: true, nullsFirst: false })
    .limit(50);

  const upcoming = (events ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ep: any) => ep.events?.user_id === userId
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: followerCount } = await adminAny.from('organizer_follows').select('id', { count: 'exact', head: true }).eq('organizer_id', userId);

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <OrganizerCalendarClient
        userId={userId}
        name={profile.organization ?? profile.full_name ?? 'Organizer'}
        avatarUrl={profile.avatar_url}
        bio={profile.bio}
        followerCount={followerCount ?? 0}
        events={upcoming}
      />
    </div>
  );
}
