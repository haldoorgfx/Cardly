export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agenda' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { EventManageNav } from '@/components/events/EventManageNav';
import type { Session, Track } from '@/types/database';

const AgendaBuilder = nextDynamic(() => import('@/components/events/AgendaBuilder'), { ssr: false });

export default async function SessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }, { data: speakers }, { data: tracks }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('sessions')
      .select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url))')
      .eq('event_id', id).order('starts_at', { ascending: true }),
    admin.from('speakers').select('id, name').eq('event_id', id).order('position', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="flex flex-col" style={{ height: '100vh', overflow: 'hidden', background: '#FAF6EE' }}>
      <EventManageNav eventId={id} eventName={event.name} active="sessions" />
      <AgendaBuilder
        eventId={id}
        initialSessions={(sessions ?? []) as unknown as Session[]}
        speakers={speakers ?? []}
        initialTracks={(tracks ?? []) as unknown as Track[]}
      />
    </div>
  );
}
