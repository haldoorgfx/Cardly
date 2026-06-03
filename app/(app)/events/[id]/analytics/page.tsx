export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Analytics' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { EventAnalyticsView } from '@/components/events/EventAnalyticsView';

interface Props { params: { id: string } }

export default async function EventAnalyticsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug, status, view_count')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  const { data: regs } = await admin
    .from('registrations')
    .select('created_at, status, amount_paid, currency, karta_card_url, ticket_type_id, ticket_types(name, currency)')
    .eq('event_id', params.id)
    .in('status', ['confirmed', 'checked_in', 'pending'])
    .order('created_at', { ascending: true })
    .limit(1000);

  const allRegs = regs ?? [];

  // Daily registrations
  const dailyMap = new Map<string, number>();
  for (const r of allRegs) {
    const day = r.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const dailyRegistrations = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  // Revenue by ticket type
  const revenueMap = new Map<string, { name: string; revenue: number; count: number; currency: string }>();
  for (const r of allRegs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ticket = (r.ticket_types as any) as { name: string; currency: string } | null;
    const key  = r.ticket_type_id ?? 'free';
    const name = ticket?.name ?? 'Free / General';
    if (!revenueMap.has(key)) revenueMap.set(key, { name, revenue: 0, count: 0, currency: r.currency });
    const entry = revenueMap.get(key)!;
    entry.revenue += Number(r.amount_paid ?? 0);
    entry.count   += 1;
  }
  const ticketRevenue = Array.from(revenueMap.values()).sort((a, b) => b.revenue - a.revenue);

  const totalRevenue    = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revenueCurrency = allRegs.find(r => Number(r.amount_paid) > 0)?.currency ?? 'USD';
  const checkInCount    = allRegs.filter(r => r.status === 'checked_in').length;
  const cardDownloaded  = allRegs.filter(r => r.karta_card_url).length;

  const statusDot: Record<string, string> = {
    published: '#2D7A4F', draft: '#C9A45E', archived: '#6B7A72',
  };
  const statusLabel: Record<string, string> = {
    published: 'live', draft: 'draft', archived: 'archived',
  };

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="border-b px-6 pt-7 pb-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[26px] text-[#0F1F18] tracking-tight leading-tight">Analytics</h1>
            <div className="flex items-center gap-2 mt-1" style={{ fontSize: 13, color: '#6B7A72' }}>
              <span>{event.name}</span>
              {event.status && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusDot[event.status] ?? '#6B7A72' }} />
                    {statusLabel[event.status] ?? event.status}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-8 px-3 rounded-lg flex items-center gap-1.5 border text-[12.5px] font-medium"
              style={{ background: '#FAF6EE', borderColor: '#E5E0D4', color: '#3A4A42' }}>
              Last 30 days
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </span>
            <a href={`/api/events/${params.id}/export`} download
              className="h-8 px-3 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5 border transition hover:bg-[#FAF6EE]"
              style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
              <Download size={13} strokeWidth={2} /> Export
            </a>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-7">
        <EventAnalyticsView
          viewCount={event.view_count ?? 0}
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
