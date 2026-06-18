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

  // Only auto-publish if the URL includes ?publish=1 (explicit intent).
  // Visiting /publish on a draft event shows the preview + a "Publish now" button — no silent publish.
  const isAlreadyPublished = event.status === 'published';
  let slug = event.slug;
  // We no longer auto-publish on page load. PublishClient handles the publish action via /api/events/[id].

  // Fetch event_pages row (read-only — no side-effects on page load)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upsertedPage } = await (admin as any)
    .from('event_pages')
    .select('id, starts_at, ends_at, timezone, venue_name, is_online')
    .eq('event_id', id)
    .maybeSingle();

  // Real event stats — only count confirmed/checked_in registrations
  const [{ count: registrationCount }, { count: ticketCount }] = await Promise.all([
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
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
      isPublished={isAlreadyPublished}
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
