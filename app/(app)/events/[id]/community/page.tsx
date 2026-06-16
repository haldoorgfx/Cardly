export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { OrganizerCommunityClient } from '@/components/events/OrganizerCommunityClient';

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
    db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    db.from('community_channels').select('id, name, description, is_pinned, created_at').eq('event_id', id).order('created_at'),
  ]);

  if (!event) redirect('/dashboard');

  // Fetch message counts per channel
  const msgCounts: Record<string, number> = {};
  if (channels && channels.length > 0) {
    for (const ch of channels) {
      const { count } = await db.from('community_messages').select('id', { count: 'exact', head: true }).eq('channel_id', ch.id);
      msgCounts[ch.id] = count ?? 0;
    }
  }

  return (
    <OrganizerCommunityClient
      eventName={event.name}
      eventSlug={event.slug}
      channels={channels ?? []}
      msgCounts={msgCounts}
    />
  );
}
