export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';
import React from 'react';
import { CalendarDays, Ticket, LayoutGrid, Users, ScanLine, DollarSign, Plus, CheckCircle2 } from 'lucide-react';
import { PLANS, type Plan } from '@/lib/billing/plans';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events').select('id, name, slug, status, view_count, download_count, updated_at, event_variants(id, background_url, zones, position)').eq('user_id', user.id).order('updated_at', { ascending: false }),
    admin.from('profiles').select('plan, full_name').eq('id', user.id).single(),
  ]);

  const allEvents = events ?? [];
  const isEmpty = allEvents.length === 0;
  const plan = (profile?.plan ?? 'free') as Plan;
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const limit = (PLANS[plan] ?? PLANS.free).events;
  const nonArchivedCount = allEvents.filter(e => e.status !== 'archived').length;
  const atLimit = limit !== null && nonArchivedCount >= limit;
  const activeCount = allEvents.filter(e => e.status === 'published').length;
  const draftCount = allEvents.filter(e => e.status === 'draft').length;
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // ── Fetch registration + check-in data ──────────────────────────────────────
  const eventIds = allEvents.map(e => e.id);
  type RegEntry = { count: number; revenue: number; checkins: number };
  const regsByEvent: Record<string, RegEntry> = {};
  let totalRegistrations = 0;
  let totalRevenue = 0;
  let totalCheckins = 0;

  if (eventIds.length > 0) {
    const { data: regs } = await admin
      .from('registrations')
      .select('event_id, amount_paid, status')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'checked_in']);
    for (const r of regs ?? []) {
      if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0, checkins: 0 };
      regsByEvent[r.event_id].count += 1;
      regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
      if (r.status === 'checked_in') {
        regsByEvent[r.event_id].checkins += 1;
        totalCheckins += 1;
      }
      totalRegistrations += 1;
      totalRevenue += Number(r.amount_paid ?? 0);
    }
  }

  // ── Attention items ─────────────────────────────────────────────────────────
  type AttentionEvent = { id: string; name: string; slug: string; reasons: string[] };
  const attentionEvents: AttentionEvent[] = allEvents
    .filter(e => e.status === 'draft')
    .map(e => {
      const reasons: string[] = [];
      const zonesCount = Array.isArray((e.event_variants ?? [])[0]?.zones)
        ? ((e.event_variants ?? [])[0].zones as unknown[]).length : 0;
      if (!e.event_variants?.length) reasons.push('No design uploaded');
      else if (zonesCount === 0) reasons.push('No zones defined');
      reasons.push('Not published');
      return { id: e.id, name: e.name, slug: e.slug, reasons };
    })
    .slice(0, 4);

  const firstLiveEvent = allEvents.find(e => e.status === 'published');

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (isEmpty) {
    const steps = [
      { n: '01', icon: <CalendarDays size={18} strokeWidth={1.8} />, title: 'Set up your event', body: 'Name, date, venue, and a cover photo.' },
      { n: '02', icon: <Ticket size={18} strokeWidth={1.8} />, title: 'Add tickets & registration', body: 'Free or paid, with a custom registration form.' },
      { n: '03', icon: <LayoutGrid size={18} strokeWidth={1.8} />, title: 'Build your agenda', body: 'Sessions, speakers, schedule — and a Karta Card for every attendee.' },
    ] as { n: string; icon: React.ReactNode; title: string; body: string }[];

    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16" style={{ background: '#FAF6EE' }}>
        <div className="max-w-[840px] w-full mx-auto text-center">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-6" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            <CalendarDays size={26} strokeWidth={1.7} />
          </div>
          <h1 className="font-display text-[30px] font-semibold text-[#1F4D3A] tracking-[-0.02em]">Create your first event</h1>
          <p className="mt-3 text-[#6B7A72] text-[15px] leading-[1.6] max-w-[480px] mx-auto">
            Set up your event page, add tickets, build your agenda, and get your personalized Karta Card ready for every attendee.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-9 h-9 rounded-lg grid place-items-center" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{s.icon}</span>
                  <span className="font-mono text-[11px]" style={{ color: 'rgba(107,122,114,0.5)' }}>{s.n}</span>
                </div>
                <div className="font-display text-[15px] font-semibold text-[#0F1F18] tracking-tight">{s.title}</div>
                <p className="text-[13px] mt-1.5 leading-[1.5]" style={{ color: '#6B7A72' }}>{s.body}</p>
              </div>
            ))}
          </div>
          <Link href="/events/new"
            className="mt-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-white font-medium transition"
            style={{ background: '#1F4D3A' }}>
            Create your first event
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  // ── Populated dashboard ──────────────────────────────────────────────────────
  const stats = [
    {
      label: 'Active events',
      value: activeCount,
      sub: draftCount > 0 ? `${draftCount} in draft` : 'All published',
      icon: <CalendarDays size={16} strokeWidth={1.8} />,
    },
    {
      label: 'Registrations',
      value: totalRegistrations.toLocaleString(),
      sub: 'Total confirmed',
      icon: <Users size={16} strokeWidth={1.8} />,
    },
    {
      label: 'Revenue',
      value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '$0',
      sub: 'Collected',
      icon: <DollarSign size={16} strokeWidth={1.8} />,
    },
    {
      label: 'Check-ins',
      value: totalCheckins.toLocaleString(),
      sub: totalRegistrations > 0 ? `${Math.round((totalCheckins / totalRegistrations) * 100)}% rate` : '—',
      icon: <CheckCircle2 size={16} strokeWidth={1.8} />,
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Header ── */}
      <div className="px-6 lg:px-8 pt-8 pb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-1" style={{ color: '#6B7A72' }}>Workspace</div>
            <h1 className="font-display font-bold text-[28px] tracking-tight leading-tight" style={{ color: '#0F1F18' }}>
              {firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              {activeCount > 0
                ? `${activeCount} event${activeCount !== 1 ? 's' : ''} live · ${totalRegistrations.toLocaleString()} registration${totalRegistrations !== 1 ? 's' : ''}`
                : 'No events published yet'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="px-6 lg:px-8 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          {!atLimit && (
            <Link href="/events/new"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-white text-[13.5px] font-medium transition"
              style={{ background: '#1F4D3A' }}>
              <Plus size={15} strokeWidth={2.2} /> New event
            </Link>
          )}
          <Link href="/analytics"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border text-[13.5px] font-medium transition"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>
            <Users size={15} strokeWidth={1.8} /> View registrations
          </Link>
          {firstLiveEvent && (
            <Link href={`/events/${firstLiveEvent.id}/check-in`}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border text-[13.5px] font-medium transition"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>
              <ScanLine size={15} strokeWidth={1.8} /> Check-in scanner
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="px-6 lg:px-8 pb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="bg-white rounded-xl flex items-center gap-3 px-4 py-3"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-[20px] leading-none tracking-tight" style={{ color: '#0F1F18' }}>
                  {stat.value}
                </div>
                <div className="text-[11px] mt-1 truncate" style={{ color: '#6B7A72' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan limit warning ── */}
      {atLimit && (
        <div className="mx-6 lg:mx-8 mb-4 flex items-center gap-2 text-[13px] border px-4 py-2.5 rounded-xl"
          style={{ color: '#C97A2D', background: 'rgba(201,122,45,0.07)', borderColor: 'rgba(201,122,45,0.3)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You&apos;ve reached the {limit}-event limit on the {planName} plan.
          <Link href="/pricing" className="ml-auto font-semibold hover:underline" style={{ color: '#1F4D3A' }}>Upgrade →</Link>
        </div>
      )}

      {/* ── Events section ── */}
      <div className="px-6 lg:px-8 pb-10">
        <DashboardContent
          events={allEvents}
          atLimit={atLimit}
          regsByEvent={regsByEvent}
          attentionEvents={attentionEvents}
        />
      </div>

    </div>
  );
}
