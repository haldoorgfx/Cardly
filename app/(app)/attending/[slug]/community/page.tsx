export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { CommunityChatClient } from '@/components/events/CommunityChatClient';
import { requireAttendeeContext } from '@/lib/attendee/requireAttendeeContext';

export const metadata = { title: 'Community' };

export default async function AttendingCommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ channel?: string }>;
}) {
  const { slug } = await params;
  const { channel } = await searchParams;
  const { registrationId, event } = await requireAttendeeContext(
    slug,
    `/attending/${slug}/community`,
  );

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: channels } = await adminAny
    .from('community_channels')
    .select('id, name, description, is_pinned, position')
    .eq('event_id', event.id)
    .order('is_pinned', { ascending: false })
    .order('position', { ascending: true });

  const defaultChannel = channel ?? channels?.[0]?.id;
  const { data: messages } = defaultChannel ? await adminAny
    .from('community_messages')
    .select('id, content, created_at, is_pinned, registration_id, registrations!community_messages_registration_id_fkey(attendee_name)')
    .eq('channel_id', defaultChannel)
    .order('created_at', { ascending: true })
    .limit(100) : { data: [] };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Community
        </h1>
        <p className="text-[14px] sm:text-[14.5px] mt-1.5" style={{ color: '#6B7A72' }}>{event.name}</p>
      </div>
      <CommunityChatClient
        eventId={event.id}
        eventName={event.name}
        eventSlug={slug}
        channels={channels ?? []}
        initialMessages={messages ?? []}
        activeChannelId={defaultChannel ?? null}
        registrationId={registrationId}
        embedded
      />
    </div>
  );
}
