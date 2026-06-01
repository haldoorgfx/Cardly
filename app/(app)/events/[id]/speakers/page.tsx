export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import SpeakersManager from '@/components/events/SpeakersManager';

interface Props { params: { id: string } }

export default async function SpeakersPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: speakers }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('speakers').select('*').eq('event_id', params.id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="speakers" />
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Speakers
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Add speakers to your event. They&apos;ll appear on the public event page and session cards.
          </p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <SpeakersManager eventId={params.id} initialSpeakers={(speakers ?? []) as any} />
      </div>
    </div>
  );
}
