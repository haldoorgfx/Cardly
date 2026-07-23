export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { OrganizerCommunityClient } from '@/components/events/OrganizerCommunityClient';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

export async function generateMetadata() {
  return { title: 'Community' };
}

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const [{ data: event }, { data: channels }] = await Promise.all([
    db.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    db.from('community_channels').select('id, name, description, is_pinned, created_at').eq('event_id', id).order('created_at'),
  ]);

  if (!event) redirect('/dashboard');
  if (!(await isPlatformFeatureEnabled('community'))) redirect(`/events/${_ev.slug}`);

  // Fetch message counts per channel + the real count of distinct posters
  const msgCounts: Record<string, number> = {};
  const posters = new Set<string>();
  if (channels && channels.length > 0) {
    // One query for every channel, not two per channel. Reads the same rows the
    // per-channel loop did, then tallies counts + distinct posters in memory.
    const channelIds = channels.map((c: { id: string }) => c.id);
    for (const cid of channelIds) msgCounts[cid] = 0;
    const { data: rows } = await db
      .from('community_messages')
      .select('channel_id, registration_id')
      .in('channel_id', channelIds);
    for (const r of (rows ?? []) as { channel_id: string; registration_id: string | null }[]) {
      msgCounts[r.channel_id] = (msgCounts[r.channel_id] ?? 0) + 1;
      if (r.registration_id) posters.add(r.registration_id);
    }
  }

  return (
    <OrganizerCommunityClient
      eventId={id}
      eventName={event.name}
      eventSlug={event.slug}
      channels={channels ?? []}
      msgCounts={msgCounts}
      activePosters={posters.size}
    />
  );
}
