export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Speakers' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import SpeakersManager from '@/components/events/SpeakersManager';

interface Props { params: Promise<{ id: string }> }

export default async function SpeakersPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: speakers }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('speakers').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SpeakersManager eventId={id} slug={event.slug} initialSpeakers={(speakers ?? []) as any} />
      </div>
    </div>
  );
}
