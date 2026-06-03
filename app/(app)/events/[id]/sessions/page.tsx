export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Agenda' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import type { Session, Track } from '@/types/database';

const SessionsManager = nextDynamic(() => import('@/components/events/SessionsManager'), { ssr: false });
const AgendaGrid      = nextDynamic(() => import('@/components/events/AgendaGrid'),      { ssr: false });

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
    admin.from('speakers').select('id, name, photo_url, role').eq('event_id', id).order('position', { ascending: true }),
    admin.from('tracks').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  const safeSessions = (sessions ?? []) as unknown as Session[];
  const safeTracks   = (tracks   ?? []) as unknown as Track[];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        {/* ── Page header ──────────────────────────────── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="font-display text-[24px] font-semibold tracking-[-0.02em]"
              style={{ color: '#1F4D3A' }}
            >
              Agenda
            </h1>
            <p className="text-[14px] mt-0.5" style={{ color: '#6B7A72' }}>
              {safeSessions.length} session{safeSessions.length !== 1 ? 's' : ''}
              {safeTracks.length > 0 && ` · ${safeTracks.length} track${safeTracks.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* SessionsManager renders "Add session" button + CRUD dialogs */}
        </div>

        {/* ── Visual grid ──────────────────────────────── */}
        {safeSessions.length > 0 ? (
          <AgendaGrid
            eventId={id}
            initialSessions={safeSessions}
            initialTracks={safeTracks}
          />
        ) : null}

        {/* ── Full CRUD manager (tracks, add/edit/delete sessions) ── */}
        <div className={safeSessions.length > 0 ? 'mt-8' : ''}>
          <SessionsManager
            eventId={id}
            initialSessions={safeSessions as never}
            speakers={(speakers ?? []) as never}
            initialTracks={safeTracks as never}
          />
        </div>

      </div>
    </div>
  );
}
