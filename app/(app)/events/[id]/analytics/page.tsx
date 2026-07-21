export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Analytics' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EventAnalyticsView } from '@/components/events/EventAnalyticsView';
import { getUserPlan } from '@/lib/billing/can';
import { PageShell, PageHeader } from '@/components/dash';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

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
    .in('user_id', await manageableOwnerIds(user.id))
    .single();

  if (!event) redirect('/dashboard');

  // The event's display timezone lives on event_pages, not events. Fetched
  // separately (and tolerantly) so a missing page row can never blank analytics.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventPage } = await (admin as any)
    .from('event_pages')
    .select('timezone')
    .eq('event_id', id)
    .maybeSingle();

  // Fetch registrations on the SAME confirmed basis that Reports and Check-in
  // use (confirmed + checked_in), so the headline "registrations" count and
  // check-in rate agree across every page. Including 'pending' here previously
  // inflated the count (e.g. 13 vs 12) and deflated the check-in rate (85% vs
  // 92%) because a not-yet-confirmed row sat in the denominator.
  const { data: regs } = await admin
    .from('registrations')
    .select('created_at, status, amount_paid, currency, eventera_card_url, ticket_type_id, ticket_types(name, currency)')
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in'])
    .order('created_at', { ascending: true })
    // Was 1000 — an event past that cap silently under-reported EVERY figure on
    // this page (registrations, revenue, check-in rate) with no warning.
    .limit(50_000);

  const allRegs = regs ?? [];

  // ── Daily registrations ────────────────────────────────────────────────────
  // Bucket by the EVENT's local day, not the server's UTC day. created_at is a
  // UTC timestamp, so slicing the first 10 chars put a 9pm registration in
  // Djibouti (UTC+3) on the following calendar day — the organiser's "opening
  // day" bar was wrong for every event that isn't on UTC.
  const eventTz: string = eventPage?.timezone || 'UTC';
  let dayKey: Intl.DateTimeFormat;
  try {
    dayKey = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: eventTz,
    });
  } catch {
    // Bad/unknown IANA zone stored on the page — fall back rather than throw.
    dayKey = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC',
    });
  }
  const dailyMap = new Map<string, number>();
  for (const r of allRegs) {
    const day = dayKey.format(new Date(r.created_at));
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
