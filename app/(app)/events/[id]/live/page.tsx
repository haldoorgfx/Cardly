export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LiveDisplayClient } from '@/components/events/LiveDisplayClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

export async function generateMetadata() {
  return { title: 'Live Display' };
}

export default async function LiveDisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('event_pages').select('title, timezone').eq('event_id', id).maybeSingle(),
  ]);
  if (!event) redirect('/dashboard');

  const page = eventPage as { title?: string; timezone?: string } | null;
  // The venue clock must read in the EVENT's zone, not the zone of whatever
  // laptop happens to be driving the projector. A speaker flying in from
  // another country plugging into HDMI must not change the time on the wall.
  const eventTimezone = page?.timezone || 'UTC';

  // Real, working "submit a question" link for the projected screen — the app
  // domain (never hardcoded) + the event's public Q&A page. Replaces the old
  // hardcoded vanity "eventera.so/q", which was a dead link (no /q route).
  const appHost = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  // /e/[slug]/q-and-a does not exist — the attendee Q&A page lives in the
  // attendee workspace at /attending/[slug]/q-and-a (it redirects anyone
  // without a registration to the public event page), so the URL projected on
  // the venue screen has to point there or it 404s in front of the room.
  const submitPath = `/attending/${event.slug}/q-and-a`;
  const submitUrl = appHost ? `${appHost}${submitPath}` : submitPath;

  // Fetch top Q&A questions by votes.
  //
  // `is_featured` comes back so the client can run a MODERATED wall. Attendee
  // submissions land with status 'pending' (migration 021), and 'pending' is not
  // 'hidden' — so filtering on `neq('hidden')` alone projects every question the
  // instant it is typed, and an organizer can only take it down after the room
  // has already read it. The display therefore defaults to featured-only; the
  // full list is still sent (this page is organizer-authenticated) so the
  // operator can knowingly switch to the unmoderated view from the footer.
  //
  // A fixed cap, not a growing list: this page is left open for a whole
  // conference day, so the payload must not scale with submission volume.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: qaRows } = await (admin as any)
    .from('qa_questions')
    .select('id, question, upvotes_count, is_anonymous, status, is_featured, created_at, registrations!qa_questions_registration_id_fkey(attendee_name)')
    .eq('event_id', id)
    .neq('status', 'hidden')
    .order('upvotes_count', { ascending: false })
    .limit(24);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (qaRows ?? []).map((q: any) => ({
    id: q.id,
    question: q.question,
    votes: q.upvotes_count,
    is_featured: !!q.is_featured,
    asker_name: q.is_anonymous ? null : (q.registrations?.attendee_name ?? null),
    created_at: q.created_at,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: polls } = await (admin as any)
    .from('polls')
    .select('id, question, is_active, poll_options(id, text, votes_count, position)')
    .eq('event_id', id)
    .eq('is_active', true)
    .eq('is_closed', false)
    .order('created_at', { ascending: false })
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawPoll = polls?.[0] as any;
  const activePoll = rawPoll
    ? {
        id: rawPoll.id,
        question: rawPoll.question,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options: (rawPoll.poll_options ?? [])
          .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
          .map((o: { text: string; votes_count: number }) => ({ label: o.text, votes: o.votes_count })),
      }
    : null;

  return (
    <LiveDisplayClient
      eventId={id}
      eventName={event.name}
      sessionLabel={page?.title ?? event.name}
      eventTimezone={eventTimezone}
      submitUrl={submitUrl}
      initialQuestions={questions ?? []}
      activePoll={activePoll}
    />
  );
}
