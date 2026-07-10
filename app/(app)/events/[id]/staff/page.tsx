export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { StaffRolesClient } from '@/components/events/StaffRolesClient';

export async function generateMetadata() {
  return { title: 'Staff' };
}

export default async function StaffPage({ params }: { params: Promise<{ id: string }> }) {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: staff } = await (admin as any).from('event_staff').select('*').eq('event_id', id).neq('status', 'removed').order('invited_at');

  return (
    <StaffRolesClient
      eventId={id}
      eventName={event.name}
      initialStaff={staff ?? []}
      ownerEmail={user.email ?? ''}
    />
  );
}
