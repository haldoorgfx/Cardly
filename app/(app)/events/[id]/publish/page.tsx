export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PublishClient from './PublishClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

export default async function PublishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status, view_count')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const isFirstPublish = event.status !== 'published';
  let slug = event.slug;
  if (isFirstPublish) {
    const { data: updated } = await admin
      .from('events')
      .update({ status: 'published' })
      .eq('id', id)
      .select('slug')
      .single();
    if (updated) slug = updated.slug;
  }

  // Ensure event_pages row exists and is public
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upsertedPage } = await (admin as any)
    .from('event_pages')
    .upsert(
      { event_id: id, title: event.name, is_public: true },
      { onConflict: 'event_id', ignoreDuplicates: false }
    )
    .select('id, starts_at, ends_at, timezone, venue_name, is_online')
    .single();

  // On first publish: notify followers who have opted in
  if (isFirstPublish && upsertedPage?.id) {
    const { data: followers } = await admin
      .from('organizer_follows')
      .select('follower_id')
      .eq('organizer_id', user.id)
      .eq('notify_new_events', true);

    if (followers && followers.length > 0) {
      const notifications = followers.map((f: { follower_id: string }) => ({
        user_id: f.follower_id,
        event_id: id,
        type: 'new_event_from_follow' as const,
        title: `New event: ${event.name}`,
        body: `An organizer you follow just published a new event.`,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (admin as any).from('notifications').insert(notifications);
    }
  }

  // Real event stats
  const [{ count: registrationCount }, { count: ticketCount }] = await Promise.all([
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('ticket_types').select('id', { count: 'exact', head: true }).eq('event_id', id),
  ]);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const shareUrl = `${appUrl}/e/${slug}`;

  return (
    <PublishClient
      eventId={id}
      eventName={event.name}
      shareUrl={shareUrl}
      slug={slug}
      viewCount={event.view_count ?? 0}
      registrationCount={registrationCount ?? 0}
      ticketCount={ticketCount ?? 0}
      startsAt={upsertedPage?.starts_at ?? null}
      endsAt={upsertedPage?.ends_at ?? null}
      timezone={upsertedPage?.timezone ?? 'UTC'}
      venueName={upsertedPage?.venue_name ?? null}
      isOnline={upsertedPage?.is_online ?? false}
    />
  );
}
