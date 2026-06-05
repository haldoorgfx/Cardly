export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationTabs } from '@/components/events/RegistrationTabs';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';
import { DollarSign, Ticket, CreditCard, BarChart2 } from 'lucide-react';

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
    admin.from('registrations').select('status, amount_paid, ticket_type_id').eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const confirmedRegs = (regs ?? []).filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRevenue = confirmedRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const ticketsSold = confirmedRegs.length;
  const avgOrder = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;
  const totalCapacity = (tickets ?? []).reduce((s, t) => s + (t.quantity ?? 0), 0);
  const conversionRate = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  // sold count per ticket type
  const soldByType: Record<string, number> = {};
  for (const r of confirmedRegs) {
    if (r.ticket_type_id) soldByType[r.ticket_type_id] = (soldByType[r.ticket_type_id] ?? 0) + 1;
  }

  function fmtMoney(n: number) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  const stats = [
    { label: 'Revenue',      value: fmtMoney(totalRevenue), sub: 'total collected',          icon: DollarSign, accent: false },
    { label: 'Tickets sold', value: ticketsSold.toLocaleString(), sub: 'confirmed registrations', icon: Ticket,    accent: false },
    { label: 'Avg order',    value: fmtMoney(avgOrder),    sub: 'per attendee',              icon: CreditCard, accent: false },
    { label: 'Fill rate',    value: `${conversionRate}%`,  sub: 'of total capacity',         icon: BarChart2,  accent: true  },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <RegistrationTabs eventId={id} eventName={event.name} />
      <div className="max-w-[900px] mx-auto px-6 py-8 pb-24">

        {/* Stat strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg grid place-items-center"
                  style={{ background: s.accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB', color: s.accent ? '#C9A45E' : '#1F4D3A' }}>
                  <s.icon size={15} strokeWidth={1.8} />
                </div>
              </div>
              <div className="font-mono text-[22px] font-medium leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="font-display text-[12px] font-semibold mt-2" style={{ color: '#0F1F18' }}>{s.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Ticket type cards (read-only summary with capacity bars) */}
        {(tickets ?? []).length > 0 && (
          <div className="mb-8">
            <div className="font-display text-[14px] font-semibold mb-3" style={{ color: '#6B7A72', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '11px' }}>
              Ticket types · capacity overview
            </div>
            <div className="grid gap-3">
              {(tickets ?? []).map(t => {
                const sold = soldByType[t.id] ?? t.quantity_sold ?? 0;
                const cap = t.quantity ?? 0;
                const pct = cap > 0 ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
                const isSoldOut = cap > 0 && sold >= cap;
                const isLimited = cap > 0;
                const priceStr = t.price === 0 ? 'Free' : new Intl.NumberFormat('en-US', {
                  style: 'currency', currency: t.currency || 'USD', minimumFractionDigits: 0,
                }).format(t.price);
                const statusLabel = isSoldOut ? 'Sold out' : t.is_visible ? 'On sale' : 'Hidden';
                const statusStyle = isSoldOut
                  ? { bg: '#FEE2E2', color: '#991B1B' }
                  : t.is_visible
                  ? { bg: '#D1FAE5', color: '#065F46' }
                  : { bg: '#F3F4F6', color: '#6B7280' };

                return (
                  <div key={t.id} className="bg-white rounded-2xl p-5 flex items-center gap-5"
                    style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                    <div className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
                      style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      <Ticket size={18} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="font-display text-[15px] font-semibold truncate" style={{ color: '#0F1F18' }}>{t.name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                          style={{ background: statusStyle.bg, color: statusStyle.color }}>
                          {statusLabel}
                        </span>
                      </div>
                      {t.sales_end && (
                        <div className="font-mono text-[11.5px]" style={{ color: '#6B7A72' }}>
                          Until {new Date(t.sales_end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      )}
                      {isLimited && (
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between font-mono text-[11px] mb-1"
                            style={{ color: '#6B7A72' }}>
                            <span>{sold}/{cap} sold</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: isSoldOut ? '#C9A45E' : '#1F4D3A' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[16px] font-medium shrink-0" style={{ color: '#1F4D3A' }}>
                      {priceStr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full CRUD manager below */}
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Manage ticket types
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
