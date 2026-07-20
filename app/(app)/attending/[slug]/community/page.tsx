export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { CommunityChatClient } from '@/components/events/CommunityChatClient';
import { resolveAttendeeWorkspace } from '@/lib/attendee/eventWorkspace';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reg?: string; channel?: string }>;
}

export default async function CommunityPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { reg, channel } = await searchParams;
  const ws = await resolveAttendeeWorkspace({ slug, reg, section: 'community' });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: channels } = await admin
    .from('community_channels')
    .select('id, name, description, is_pinned, position')
    .eq('event_id', ws.eventId)
    .order('is_pinned', { ascending: false })
    .order('position', { ascending: true });

  const activeChannel = channel ?? channels?.[0]?.id;
  const { data: messages } = activeChannel
    ? await admin
        .from('community_messages')
        .select('id, content, created_at, is_pinned, registration_id, registrations!community_messages_registration_id_fkey(attendee_name)')
        .eq('channel_id', activeChannel)
        .order('created_at', { ascending: true })
        .limit(100)
    : { data: [] };

  // `embedded` gives the contained, rounded pane that sits inside the
  // workspace tabs, rather than the full-viewport public layout.
  return (
    <CommunityChatClient
      eventId={ws.eventId}
      eventName={ws.eventName}
      eventSlug={slug}
      channels={channels ?? []}
      initialMessages={messages ?? []}
      activeChannelId={activeChannel ?? null}
      registrationId={ws.registrationId}
      embedded
    />
  );
}
