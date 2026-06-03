export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Speakers' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import type { Speaker } from '@/types/database';

const SpeakersManager = nextDynamic(() => import('@/components/events/SpeakersManager'), { ssr: false });

export default async function SpeakersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: speakers }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('speakers').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  const safeSpeakers = (speakers ?? []) as unknown as Speaker[];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        <SpeakersManager
          eventId={id}
          initialSpeakers={safeSpeakers as never}
          speakerCount={safeSpeakers.length}
        />

      </div>
    </div>
  );
}
