export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Analytics' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventAnalyticsView } from '@/components/events/EventAnalyticsView';
import { getUserPlan } from '@/lib/billing/can';
import { PageShell, PageHeader } from '@/components/dash';

interface Props { params: Promise<{ id: string }> }

export default async function EventAnalyticsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
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
  // Revenue must only count confirmed/checked_in rows — a pending registration
  // already has amount_paid populated at checkout initiation (before the
  // payment webhook confirms it), so including it here would show money that
  // was never actually collected and disagree with the Dashboard/Overview totals.
  const paidRegs = allRegs.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
  const revenueMap = new Map<string, { name: string; revenue: number; count: number; currency: string }>();
  for (const r of paidRegs) {
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

  const totalRevenue = paidRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revenueCurrency = paidRegs.find(r => r.amount_paid > 0)?.currency ?? 'USD';
  const checkInCount    = allRegs.filter(r => r.status === 'checked_in').length;
  const cardDownloaded  = allRegs.filter(r => r.eventera_card_url).length;

  const plan = await getUserPlan(user.id);
  let eraInsight: string | null = null;
  if (plan === 'pro' || plan === 'studio') {
    try {
      const { ERA } = await import('@/lib/ai/era');
      eraInsight = await ERA.narrateAnalytics({
        eventName: event.name,
        totalRegistered: allRegs.length,
        totalCheckedIn: checkInCount,
        checkInRate: allRegs.length > 0 ? Math.round((checkInCount / allRegs.length) * 100) : 0,
        cardDownloads: cardDownloaded,
      });
    } catch { /* non-blocking */ }
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title="Analytics"
        subtitle="Registration metrics, revenue by ticket type, check-in rate, and card download rate."
      />
      <EventAnalyticsView
        dailyRegistrations={dailyRegistrations}
        ticketRevenue={ticketRevenue}
        totalRegistrations={allRegs.length}
        totalRevenue={totalRevenue}
        revenueCurrency={revenueCurrency}
        checkInCount={checkInCount}
        cardDownloadCount={cardDownloaded}
        eraInsight={eraInsight}
      />
    </PageShell>
  );
}
