export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agenda' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgendaTabs } from '@/components/events/AgendaTabs';
import { AgendaView } from '@/components/events/AgendaView';

interface Props { params: Promise<{ id: string }> }

export default async function AgendaPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }, { data: speakers }, { data: tracks }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('sessions').select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url))').eq('event_id', id).order('starts_at', { ascending: true }),
    admin.from('speakers').select('id, name, photo_url, role').eq('event_id', id).order('position', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <AgendaTabs eventId={id} eventName={event.name} />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <AgendaView
          eventId={id}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialSessions={(sessions ?? []) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          speakers={(speakers ?? []) as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialTracks={(tracks ?? []) as any}
        />
      </div>
    </div>
  );
}
