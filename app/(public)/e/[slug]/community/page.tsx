export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { getEventFeatures, isSectionEnabled } from '@/lib/events/sectionGate';
import { resolveViewerRegistrationId } from '@/lib/attendee/resolveViewerRegistration';
import { CommunityChatClient } from '@/components/events/CommunityChatClient';

interface Props { params: { slug: string }; searchParams: { reg?: string; channel?: string } }

export default async function CommunityPage({ params, searchParams }: Props) {
  const admin = createAdminClient();
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;
  // 404 when the organizer has explicitly disabled this section.
  if (!isSectionEnabled(await getEventFeatures(event.id), 'community')) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: channels } = await adminAny
    .from('community_channels')
    .select('id, name, description, is_pinned, position')
    .eq('event_id', event.id)
    .order('is_pinned', { ascending: false })
    .order('position', { ascending: true });

  const defaultChannel = searchParams.channel ?? channels?.[0]?.id;
  const { data: messages } = defaultChannel ? await adminAny
    .from('community_messages')
    .select('id, content, created_at, is_pinned, registration_id, registrations!community_messages_registration_id_fkey(attendee_name)')
    .eq('channel_id', defaultChannel)
    .order('created_at', { ascending: true })
    .limit(100) : { data: [] };

  // h-full, not min-h-screen: EventShell marks this segment immersive and gives
  // it a fixed-height flex slot, so the chat fills exactly what's left.
  return (
    <div className="h-full" style={{ background: '#FAF6EE' }}>
      <CommunityChatClient
        eventId={event.id}
        eventName={event.name}
        eventSlug={params.slug}
        channels={channels ?? []}
        initialMessages={messages ?? []}
        activeChannelId={defaultChannel ?? null}
        registrationId={await resolveViewerRegistrationId(event.id, searchParams.reg) ?? undefined}
      />
    </div>
  );
}
