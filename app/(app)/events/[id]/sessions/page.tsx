export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sessions' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AgendaTabs } from '@/components/events/AgendaTabs';
import SessionsManager from '@/components/events/SessionsManager';

interface Props { params: { id: string } }

export default async function SessionsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }, { data: speakers }, { data: tracks }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('sessions').select('*, tracks(id,name,color), session_speakers(speaker_id, position, speakers(id,name,photo_url))').eq('event_id', params.id).order('starts_at', { ascending: true }),
    admin.from('speakers').select('id, name, photo_url, role').eq('event_id', params.id).order('position', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', params.id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <AgendaTabs eventId={params.id} eventName={event.name} />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            Sessions
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Build your event agenda — add sessions, assign speakers, organise by track.
          </p>
        </div>
        <SessionsManager
          eventId={params.id}
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
