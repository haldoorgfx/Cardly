export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Analytics' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventAnalyticsView } from '@/components/events/EventAnalyticsView';

interface Props { params: { id: string } }

export default async function EventAnalyticsPage({ params }: Props) {
  const _ev = await resolveEventRef(params.id);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // Fetch all registrations for this event (for analytics we want full data, capped at 1000)
  const { data: regs } = await admin
    .from('registrations')
    .select('created_at, status, amount_paid, currency, eventera_card_url, ticket_type_id, ticket_types(name, currency)')
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in', 'pending'])
    .order('created_at', { ascending: true })
    .limit(1000);

  const allRegs = regs ?? [];

  // ── Daily registrations ────────────────────────────────────────────────────
  const dailyMap = new Map<string, number>();
  for (const r of allRegs) {
    const day = r.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const dailyRegistrations = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // ── Revenue by ticket type ─────────────────────────────────────────────────
  const revenueMap = new Map<string, { name: string; revenue: number; count: number; currency: string }>();
  for (const r of allRegs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticket = (r.ticket_types as any) as { name: string; currency: string } | null;
    const key = r.ticket_type_id ?? 'free';
    const name = ticket?.name ?? 'Free / General';
    if (!revenueMap.has(key)) revenueMap.set(key, { name, revenue: 0, count: 0, currency: r.currency });
    const entry = revenueMap.get(key)!;
    entry.revenue += Number(r.amount_paid ?? 0);
    entry.count   += 1;
  }
  const ticketRevenue = Array.from(revenueMap.values()).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revenueCurrency = allRegs.find(r => r.amount_paid > 0)?.currency ?? 'USD';
  const checkInCount    = allRegs.filter(r => r.status === 'checked_in').length;
  const cardDownloaded  = allRegs.filter(r => r.eventera_card_url).length;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Analytics
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Registration metrics, revenue by ticket type, check-in rate, and card download rate.
          </p>
        </div>

        <EventAnalyticsView
          dailyRegistrations={dailyRegistrations}
          ticketRevenue={ticketRevenue}
          totalRegistrations={allRegs.length}
          totalRevenue={totalRevenue}
          revenueCurrency={revenueCurrency}
          checkInCount={checkInCount}
          cardDownloadCount={cardDownloaded}
        />
      </div>
    </div>
  );
}
