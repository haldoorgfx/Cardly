export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { ownedSpeaker } from '@/lib/rbac/ownership';
import { SpeakerPortalClient } from '@/components/speaker/SpeakerPortalClient';
import { PageShell } from '@/components/dash';
import { RoleBand } from '@/components/workspace/RoleBand';
import { resolveEventRoles, roleLinks } from '@/lib/workspace/eventRoles';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Speaker workspace' };

// Dashboard-native speaker workspace — the logged-in twin of the legacy
// /s/[slug]/[speakerId] portal. Ownership is enforced server-side: only the
// account whose email matches the speaker record (or who holds the speaker
// role for the event) can open it.
export default async function SpeakerWorkspacePage({
  params,
}: {
  params: Promise<{ speakerId: string }>;
}) {
  const { speakerId } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(`/speaking/${speakerId}`)}`);

  const speaker = await ownedSpeaker(user.id, speakerId);
  if (!speaker) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', speaker.event_id)
    .single();
  if (!event) notFound();

  const [{ data: sessionSpeakers }, { data: page }] = await Promise.all([
    admin
      .from('session_speakers')
      .select('sessions(id, title, starts_at, ends_at, room, session_type, slides_url, track_id, tracks(name))')
      .eq('speaker_id', speakerId),
    admin
      .from('event_pages')
      .select('starts_at, ends_at, organizer_email')
      .eq('event_id', speaker.event_id)
      .maybeSingle(),
  ]);

  const sessions = (sessionSpeakers ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ss: any) => ss.sessions)
    .filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resources: any[] = [];
  try {
    const { data } = await admin
      .from('event_resources')
      .select('*')
      .eq('event_id', speaker.event_id)
      .order('created_at', { ascending: true });
    resources = data ?? [];
  } catch {
    resources = [];
  }

  // Read-only live Q&A for this speaker's sessions (SP02). Defensive: a missing
  // table or empty read must render a clean empty state, never crash the page.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionIds = sessions.map((s: any) => s.id).filter(Boolean);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let questions: any[] = [];
  if (sessionIds.length > 0) {
    try {
      const { data } = await admin
        .from('qa_questions')
        .select('id, session_id, question, upvotes_count, is_anonymous, created_at, registrations!qa_questions_registration_id_fkey(attendee_name)')
        .in('session_id', sessionIds)
        .neq('status', 'hidden')
        .order('upvotes_count', { ascending: false })
        .order('created_at', { ascending: true });
      // SpeakerPortalClient prints "Anonymous" for an anonymous question, but
      // that is client-side only — the asker's real attendee_name still shipped
      // in this page's payload, so a speaker could de-anonymise every anonymous
      // question about their own session by reading the response. Redact here,
      // matching /api/events/[id]/q-and-a and the attendee Q&A page.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      questions = (data ?? []).map((q: any) => ({
        ...q,
        registrations: q.is_anonymous ? null : q.registrations,
      }));
    } catch {
      questions = [];
    }
  }

  // Other hats this account wears at THIS event. A speaker who also holds a
  // ticket had no way across from here — the two halves of their own event
  // lived in unrelated sidebar entries.
  const roles = await resolveEventRoles(user.id, event.id);

  return (
    <PageShell width="wide">
      <RoleBand
        roles={roleLinks(roles, event.slug, event.id)}
        activeRole="speaking"
        className="mb-5"
      />
      <SpeakerPortalClient
        embedded
        speaker={speaker}
        event={{
          id: event.id,
          name: event.name,
          slug: event.slug,
          starts_at: page?.starts_at ?? null,
          ends_at: page?.ends_at ?? null,
          organizer_email: page?.organizer_email ?? null,
        }}
        sessions={sessions}
        resources={resources}
        questions={questions}
      />
    </PageShell>
  );
}
