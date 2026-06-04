export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';
import React from 'react';
import { CalendarDays, Ticket, Users, ScanLine, Plus, IdCard } from 'lucide-react';
import { PLANS, type Plan } from '@/lib/billing/plans';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events')
      .select('id, name, slug, status, view_count, download_count, updated_at, event_pages(starts_at, venue_name), event_variants(id, background_url, position)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (admin as any).from('profiles').select('plan, full_name, onboarding_completed').eq('id', user.id).single(),
  ]);

  const allEvents = events ?? [];
  const isEmpty = allEvents.length === 0;

  // New users who haven't completed onboarding → redirect to the wizard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isEmpty && !(profile as any)?.onboarding_completed) {
    redirect('/onboarding');
  }
  const plan = (profile?.plan ?? 'free') as Plan;
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);
  const limit = (PLANS[plan] ?? PLANS.free).events;
  const nonArchivedCount = allEvents.filter(e => e.status !== 'archived').length;
  const atLimit = limit !== null && nonArchivedCount >= limit;

  const activeCount = allEvents.filter(e => e.status === 'published').length;
  const draftCount  = allEvents.filter(e => e.status === 'draft').length;

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (isEmpty) {
    const steps = [
      { n: '01', icon: <CalendarDays size={18} strokeWidth={1.8} />, title: 'Set up your event', body: 'Name, date, venue, cover photo.' },
      { n: '02', icon: <Ticket size={18} strokeWidth={1.8} />, title: 'Add tickets & registration', body: 'Free or paid, with a custom form.' },
      { n: '03', icon: <IdCard size={18} strokeWidth={1.8} />, title: 'Build your programme', body: 'Agenda, speakers, sessions.' },
    ] as { n: string; icon: React.ReactNode; title: string; body: string }[];

    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16" style={{ background: '#FAF6EE' }}>
        <div className="max-w-[840px] w-full mx-auto text-center">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-6 text-[#1F4D3A]" style={{ background: '#E8EFEB' }}>
            <CalendarDays size={26} strokeWidth={1.7} />
          </div>
          <h1 className="font-display text-[30px] font-semibold text-[#1F4D3A] tracking-[-0.02em]">Create your first event</h1>
          <p className="mt-3 text-[#6B7A72] text-[15px] leading-[1.6] max-w-[480px] mx-auto">
            Set up your event page, add tickets, build your agenda, and get a personalized Karta Card ready for every attendee.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            {steps.map(s => (
              <div key={s.n} className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="w-9 h-9 rounded-lg grid place-items-center text-[#1F4D3A]" style={{ background: '#E8EFEB' }}>{s.icon}</span>
                  <span className="font-mono text-[11px] text-[#6B7A72]/50">{s.n}</span>
                </div>
                <div className="font-display text-[15px] font-semibold text-[#0F1F18] tracking-tight">{s.title}</div>
                <p className="text-[13px] text-[#6B7A72] mt-1.5 leading-[1.5]">{s.body}</p>
              </div>
            ))}
          </div>
          <Link href="/events/new" className="mt-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-white font-medium transition hover:bg-[#163828]" style={{ background: '#1F4D3A' }}>
            Create your first event
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Registrations + revenue ───────────────────────────────────────────────
  const eventIds = allEvents.map(e => e.id);
  const regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number }> = {};
  let totalRegistrations = 0;
  let totalRevenue = 0;
  let totalCheckedIn = 0;
  if (eventIds.length > 0) {
    const { data: regs } = await admin
      .from('registrations')
      .select('event_id, amount_paid, status')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'checked_in']);
    for (const r of regs ?? []) {
      if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0, checkedIn: 0 };
      regsByEvent[r.event_id].count   += 1;
      regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
      totalRegistrations += 1;
      totalRevenue       += Number(r.amount_paid ?? 0);
      if (r.status === 'checked_in') {
        totalCheckedIn += 1;
        regsByEvent[r.event_id].checkedIn += 1;
      }
    }
  }

  const checkInRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;
  const firstLiveEvent = allEvents.find(e => e.status === 'published');

  // ─── Attention items ───────────────────────────────────────────────────────
  const attentionItems: { id: string; name: string; reason: string; href: string }[] = [];
  for (const e of allEvents) {
    if (e.status === 'draft') {
      attentionItems.push({ id: e.id, name: e.name, reason: 'not published', href: `/events/${e.id}` });
    } else if (e.status === 'published' && (regsByEvent[e.id]?.count ?? 0) === 0) {
      attentionItems.push({ id: e.id, name: e.name, reason: 'no registrations yet', href: `/events/${e.id}` });
    }
    if (attentionItems.length >= 4) break;
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-[26px] font-semibold text-[#1F4D3A] tracking-[-0.02em]">Events</h1>
            <p className="text-[#6B7A72] text-[14px] mt-0.5">Everything you&apos;re organizing, in one place.</p>
          </div>
          {!atLimit && (
            <Link href="/events/new"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-[14px] font-medium transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}>
              <Plus size={16} strokeWidth={2.2} /> Create event
            </Link>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="bg-white border rounded-2xl px-6 py-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          {[
            { value: allEvents.filter(e => e.status !== 'archived').length, label: 'events total' },
            { value: totalRegistrations.toLocaleString(), label: 'registrations' },
            { value: totalRevenue > 0 ? '$' + totalRevenue.toLocaleString() : '$0', label: 'revenue' },
            { value: `${checkInRate}%`, label: 'check-in rate', last: true },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-5">
              <div>
                <span className="font-mono text-[20px] text-[#1F4D3A] tracking-tight">{s.value}</span>
                <span className="ml-2 text-[13px] text-[#6B7A72]">{s.label}</span>
              </div>
              {!s.last && <span className="text-[#E5E0D4] hidden sm:inline">·</span>}
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          {!atLimit && (
            <Link href="/events/new"
              className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-[13.5px] font-medium transition hover:bg-[#163828]"
              style={{ background: '#1F4D3A' }}>
              <Plus size={15} strokeWidth={2.2} /> Create event
            </Link>
          )}
          <Link href="/analytics"
            className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13.5px] transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: 'white' }}>
            <Users size={15} strokeWidth={1.8} /> View all registrations
          </Link>
          {firstLiveEvent && (
            <Link href={`/events/${firstLiveEvent.id}/check-in`}
              className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-[13.5px] transition hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72', background: 'white' }}>
              <ScanLine size={15} strokeWidth={1.8} /> Open check-in scanner
            </Link>
          )}
        </div>

        {/* ── Plan limit warning ── */}
        {atLimit && (
          <div className="flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            You&apos;ve reached the {limit}-event limit on the {planName} plan.
            <Link href="/pricing" className="ml-auto font-semibold text-[#1F4D3A] hover:underline">Upgrade →</Link>
          </div>
        )}

        {/* ── Attention strip ── */}
        {attentionItems.length > 0 && (
          <div className="mb-8">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-700/90 mb-3 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: '#B45309' }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Needs attention
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {attentionItems.map(item => (
                <Link key={item.id} href={item.href}
                  className="flex items-center gap-3 text-left rounded-xl px-4 py-3 transition-colors hover:border-amber-300"
                  style={{ background: 'rgba(254,243,199,0.6)', border: '1px solid rgba(253,230,138,0.7)' }}>
                  <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-[#0F1F18] truncate">{item.name}</div>
                    <div className="text-[12px] text-amber-700 mt-0.5">{item.reason}</div>
                  </div>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Events grid ── */}
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72] mb-3">Your events</div>
        <DashboardContent events={allEvents} atLimit={atLimit} regsByEvent={regsByEvent} draftCount={draftCount} activeCount={activeCount} />

      </div>
    </div>
  );
}
