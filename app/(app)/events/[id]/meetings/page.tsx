export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MeetingsClient } from '@/components/events/MeetingsClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

interface Props { params: Promise<{ id: string }> }

export default async function MeetingsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return <MeetingsClient eventId={id} eventName={event.name} />;
}
