export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Ticket, DollarSign, Users, TrendingUp } from 'lucide-react';
import { StatCards } from '@/components/dashboard/ui';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';
import { PromoCodesManager } from '@/components/events/PromoCodesManager';

interface Props { params: { id: string } }

function fmtMoney(n: number, currency = 'USD') {
  if (n === 0) return '$0';
  try {
    if (n >= 1_000_000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency,
        minimumFractionDigits: 1, maximumFractionDigits: 1, notation: 'compact',
      }).format(n);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()}`;
  }
}

export default async function TicketsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }, regResult, { data: codes }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('*').eq('event_id', params.id).order('position'),
    admin.from('registrations')
      .select('amount_paid, status, currency, ticket_type_id')
      .eq('event_id', params.id)
      .in('status', ['confirmed', 'checked_in']),
    admin.from('promo_codes').select('*').eq('event_id', params.id).order('created_at', { ascending: false }),
  ]);

  if (!event) redirect('/dashboard');

  const allRegs = regResult.data ?? [];

  // Stat calculations
  const totalRevenue  = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revCurrency   = allRegs.find(r => Number(r.amount_paid) > 0)?.currency ?? 'USD';
  const ticketsSold   = allRegs.length;
  const checkedIn     = allRegs.filter(r => r.status === 'checked_in').length;
  const checkInRate   = ticketsSold > 0 ? Math.round((checkedIn / ticketsSold) * 100) : 0;

  // Conversion: sold / total capacity (sum of quantity across tickets)
  const totalCapacity = (tickets ?? []).reduce((s, t) => s + (t.quantity ?? 0), 0);
  const convRate      = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b px-6 pt-7 pb-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[26px] text-[#0F1F18] tracking-tight leading-tight">Tickets</h1>
            <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>
              {(tickets ?? []).length} ticket type{(tickets ?? []).length !== 1 ? 's' : ''}
              {totalRevenue > 0 && <> · {fmtMoney(totalRevenue, revCurrency)} collected</>}
              {ticketsSold > 0 && <> · {ticketsSold} sold</>}
            </p>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-7 space-y-7">

        {/* Stat cards */}
        <StatCards cols={4} items={[
          { value: fmtMoney(totalRevenue, revCurrency), label: 'REVENUE',       icon: DollarSign, accent: true },
          { value: ticketsSold,                         label: 'TICKETS SOLD',  icon: Ticket },
          { value: `${checkInRate}%`,                   label: 'CHECK-IN RATE', icon: Users },
          { value: convRate > 0 ? `${convRate}%` : '—', label: 'CONVERSION',    icon: TrendingUp },
        ]} />

        {/* Ticket types */}
        <div>
          <div className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: 10, color: '#6B7A72' }}>
            Ticket types
          </div>
          <TicketTypesManager eventId={params.id} initialTickets={tickets ?? []} />
        </div>

        {/* Promo codes */}
        <div>
          <div className="font-mono uppercase tracking-[0.18em] mb-4" style={{ fontSize: 10, color: '#6B7A72' }}>
            Promo codes
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PromoCodesManager eventId={params.id} initialCodes={(codes ?? []) as any} />
        </div>

      </div>
    </div>
  );
}
