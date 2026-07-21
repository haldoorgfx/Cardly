export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Downloads' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { DownloadsHub } from '@/components/events/DownloadsHub';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function DownloadsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [
    { data: event },
    { data: regs },
    { data: sessions },
    { data: ticketTypes },
    { data: tracks },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('registrations').select('id, attendee_name, status, amount_paid, currency, created_at, ticket_type_id').eq('event_id', id),
    admin.from('sessions').select('id, title, starts_at, ends_at, session_type, room, track_id, session_speakers(speakers(name))').eq('event_id', id).order('starts_at', { ascending: true }),
    admin.from('ticket_types').select('id, name, price, currency').eq('event_id', id),
    admin.from('tracks').select('id, name').eq('event_id', id).order('position', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <DownloadsHub
      eventId={id}
      eventSlug={event.slug}
      eventName={event.name}
      regs={regs ?? []}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions={(sessions ?? []) as any}
      ticketTypes={ticketTypes ?? []}
      tracks={tracks ?? []}
    />
  );
}
