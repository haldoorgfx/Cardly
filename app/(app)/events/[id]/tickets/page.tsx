export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationTabs } from '@/components/events/RegistrationTabs';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';

interface Props { params: Promise<{ id: string }> }

export default async function TicketsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }, { data: regs }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('*').eq('event_id', id).order('position'),
    admin.from('registrations').select('status, amount_paid').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const confirmedRegs = (regs ?? []).filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRevenue = confirmedRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const ticketsSold = confirmedRegs.length;
  const avgOrder = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;
  const totalCapacity = (tickets ?? []).reduce((s, t) => s + (t.quantity ?? 0), 0);
  const conversionRate = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <RegistrationTabs eventId={id} eventName={event.name} />
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-24">

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Revenue', value: fmtMoney(totalRevenue), sub: 'total collected' },
            { label: 'Tickets sold', value: ticketsSold.toLocaleString(), sub: 'confirmed registrations' },
            { label: 'Avg order', value: fmtMoney(avgOrder), sub: 'per attendee' },
            { label: 'Fill rate', value: `${conversionRate}%`, sub: 'of total capacity' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-mono text-[22px] font-medium leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="font-display text-[12px] font-semibold mt-2" style={{ color: '#0F1F18' }}>{s.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
          >
            Ticket types
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Create free and paid ticket tiers. Quantity caps are enforced — overselling is prevented at the database level.
          </p>
        </div>
        <TicketTypesManager eventId={id} initialTickets={tickets ?? []} />
      </div>
    </div>
  );
}
