export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Speakers' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell } from '@/components/dash';
import SpeakersManager from '@/components/events/SpeakersManager';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

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
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('speakers').select('*').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <PageShell width="wide">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SpeakersManager eventId={id} slug={event.slug} initialSpeakers={(speakers ?? []) as any} />
    </PageShell>
  );
}
