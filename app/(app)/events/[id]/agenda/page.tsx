export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agenda' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell } from '@/components/dash';
import { AgendaView } from '@/components/events/AgendaView';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function AgendaPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }, { data: sessions }, { data: speakers }, { data: tracks }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('event_pages').select('starts_at, ends_at, timezone').eq('event_id', id).maybeSingle(),
    admin.from('sessions').select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url))').eq('event_id', id).order('starts_at', { ascending: true }),
    admin.from('speakers').select('id, name, photo_url, role').eq('event_id', id).order('position', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <PageShell width="wide">
      <AgendaView
        eventId={id}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialSessions={(sessions ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        speakers={(speakers ?? []) as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialTracks={(tracks ?? []) as any}
        eventDates={{ starts_at: eventPage?.starts_at ?? null, ends_at: eventPage?.ends_at ?? null }}
        timezone={eventPage?.timezone || 'UTC'}
      />
    </PageShell>
  );
}
