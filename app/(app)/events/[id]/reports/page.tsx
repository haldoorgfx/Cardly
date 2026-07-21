export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReportsClient } from '@/components/events/ReportsClient';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function ReportsPage({ params }: Props) {
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
    { data: ticketTypes },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('registrations').select('id, attendee_name, status, amount_paid, currency, created_at, ticket_type_id').eq('event_id', id),
    admin.from('ticket_types').select('id, name, price, currency').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const totalRevenue = (regs ?? []).filter(r => ['confirmed', 'checked_in'].includes(r.status))
    .reduce((s: number, r: { amount_paid: number }) => s + (r.amount_paid ?? 0), 0);
  const regCount = (regs ?? []).filter(r => ['confirmed', 'checked_in'].includes(r.status)).length;
  const checkedIn = (regs ?? []).filter(r => r.status === 'checked_in').length;

  return (
    <ReportsClient
      eventId={id}
      eventName={event.name}
      totalRevenue={totalRevenue}
      regCount={regCount}
      checkedIn={checkedIn}
      regs={regs ?? []}
      ticketTypes={ticketTypes ?? []}
    />
  );
}
