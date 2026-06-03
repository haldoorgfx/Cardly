export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Analytics' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import { EventAnalyticsView } from '@/components/events/EventAnalyticsView';

interface Props { params: { id: string } }

export default async function EventAnalyticsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // ── Registrations ─────────────────────────────────────────────────────────
  const { data: regs } = await admin
    .from('registrations')
    .select('created_at, status, amount_paid, currency, karta_card_url, ticket_type_id, ticket_types(name, currency)')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in', 'pending'])
    .order('created_at', { ascending: true })
    .limit(1000);

  const allRegs = regs ?? [];

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

  const totalRevenue    = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revenueCurrency = allRegs.find(r => r.amount_paid > 0)?.currency ?? 'USD';
  const checkInCount    = allRegs.filter(r => r.status === 'checked_in').length;
  const cardDownloaded  = allRegs.filter(r => r.karta_card_url).length;

  // ── Sessions ───────────────────────────────────────────────────────────────
  const { data: rawSessions } = await admin
    .from('sessions')
    .select('id, title, registrations_count')
    .eq('event_id', params.id)
    .order('registrations_count', { ascending: false })
    .limit(20);

  const sessionIds = (rawSessions ?? []).map(s => s.id);

  const [{ data: sessionRatings }, { data: agendaItems }] = await Promise.all([
    sessionIds.length > 0
      ? admin.from('session_ratings').select('session_id, rating').in('session_id', sessionIds)
      : Promise.resolve({ data: [] as { session_id: string; rating: number }[] }),
    sessionIds.length > 0
      ? admin.from('attendee_agendas').select('session_id').in('session_id', sessionIds)
      : Promise.resolve({ data: [] as { session_id: string }[] }),
  ]);

  const ratingMap = new Map<string, { sum: number; count: number }>();
  for (const r of sessionRatings ?? []) {
    const e = ratingMap.get(r.session_id) ?? { sum: 0, count: 0 };
    e.sum += r.rating; e.count += 1;
    ratingMap.set(r.session_id, e);
  }
  const agendaMap = new Map<string, number>();
  for (const a of agendaItems ?? []) {
    agendaMap.set(a.session_id, (agendaMap.get(a.session_id) ?? 0) + 1);
  }

  const sessions = (rawSessions ?? []).map(s => {
    const ratings = ratingMap.get(s.id);
    return {
      id: s.id,
      title: s.title,
      registrationsCount: s.registrations_count,
      attendedCount: agendaMap.get(s.id) ?? 0,
      avgRating: ratings ? ratings.sum / ratings.count : null,
      feedbackCount: ratings?.count ?? 0,
    };
  });

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={params.id} eventName={event.name} active="analytics" />
      <div className="max-w-[920px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}
          >
            Analytics — {event.name}
          </h1>
          <div
            className="inline-flex items-center gap-2 text-[14px] rounded-full px-4"
            style={{ height: 38, border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#6B7A72', cursor: 'default' }}
          >
            All time
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <EventAnalyticsView
          dailyRegistrations={dailyRegistrations}
          ticketRevenue={ticketRevenue}
          totalRegistrations={allRegs.length}
          totalRevenue={totalRevenue}
          revenueCurrency={revenueCurrency}
          checkInCount={checkInCount}
          cardDownloadCount={cardDownloaded}
          sessions={sessions}
        />
      </div>
    </div>
  );
}
