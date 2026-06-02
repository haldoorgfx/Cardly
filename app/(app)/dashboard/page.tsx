export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';
import React from 'react';
import {
  CalendarDays, Ticket, ScanLine, Plus,
  BarChart2, Palette, Users2, Settings, LayoutTemplate, IdCard,
} from 'lucide-react';
import { PLANS, type Plan } from '@/lib/billing/plans';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events').select('id, name, slug, status, view_count, download_count, updated_at, event_pages(starts_at, venue_name)').eq('user_id', user.id).order('updated_at', { ascending: false }),
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
  const draftCount  = allEvents.filter(e => e.status === 'draft').length;
  const firstName   = profile?.full_name?.split(' ')[0] ?? '';

  // ─── Empty state ───────────────────────────────────────────────────────────
  if (isEmpty) {
    const steps = [
      { n: '01', icon: <CalendarDays size={18} strokeWidth={1.8} />, title: 'Set up your event', body: 'Name, date, venue, and a cover photo.' },
      { n: '02', icon: <Ticket size={18} strokeWidth={1.8} />, title: 'Add tickets & registration', body: 'Free or paid, with a custom form for attendees.' },
      { n: '03', icon: <IdCard size={18} strokeWidth={1.8} />, title: 'Build your programme', body: 'Agenda, speakers, sessions — and a Karta Card for every attendee.' },
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
  const regsByEvent: Record<string, { count: number; revenue: number }> = {};
  let totalRegistrations = 0;
  let totalRevenue = 0;
  if (eventIds.length > 0) {
    const { data: regs } = await admin
      .from('registrations')
      .select('event_id, amount_paid')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'checked_in']);
    for (const r of regs ?? []) {
      if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0 };
      regsByEvent[r.event_id].count   += 1;
      regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
      totalRegistrations += 1;
      totalRevenue       += Number(r.amount_paid ?? 0);
    }
  }

  const firstLiveEvent = allEvents.find(e => e.status === 'published');

  // ─── Attention items ───────────────────────────────────────────────────────
  const attentionItems: { id: string; name: string; reason: string; href: string }[] = [];
  for (const e of allEvents) {
    if (e.status === 'draft') {
      attentionItems.push({ id: e.id, name: e.name, reason: 'Draft — publish to open registration', href: `/events/${e.id}` });
    } else if (e.status === 'published' && (regsByEvent[e.id]?.count ?? 0) === 0) {
      attentionItems.push({ id: e.id, name: e.name, reason: 'Live but no registrations yet', href: `/events/${e.id}` });
    }
    if (attentionItems.length >= 3) break;
  }

  // ─── Workspace feature grid ────────────────────────────────────────────────
  const workspaceFeatures = [
    {
      label: 'Analytics',
      icon: <BarChart2 size={20} strokeWidth={1.7} />,
      desc: 'Registration funnel, revenue, and engagement across all events.',
      href: '/analytics',
      stat: totalRegistrations > 0 ? `${totalRegistrations} registrations` : null,
    },
    {
      label: 'Check-in',
      icon: <ScanLine size={20} strokeWidth={1.7} />,
      desc: 'Scan attendees at the door for any live event.',
      href: firstLiveEvent ? `/events/${firstLiveEvent.id}/check-in` : '/analytics',
      stat: firstLiveEvent ? 'Go live →' : null,
    },
    {
      label: 'Templates',
      icon: <LayoutTemplate size={20} strokeWidth={1.7} />,
      desc: 'Reuse event setups — tickets, form, agenda — across multiple events.',
      href: '/templates',
      stat: null,
    },
    {
      label: 'Brand kit',
      icon: <Palette size={20} strokeWidth={1.7} />,
      desc: 'Your logos, colors, and brand assets in one place.',
      href: '/brand',
      stat: null,
    },
    {
      label: 'Team',
      icon: <Users2 size={20} strokeWidth={1.7} />,
      desc: 'Invite collaborators to manage your events.',
      href: '/team',
      stat: null,
    },
    {
      label: 'Settings',
      icon: <Settings size={20} strokeWidth={1.7} />,
      desc: 'Workspace preferences, billing, and integrations.',
      href: '/settings',
      stat: null,
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Gradient header — same treatment as event detail ── */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)', paddingBottom: '28px' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 120% at 90% 0%, rgba(232,197,126,0.22), transparent 55%)' }} />
        <svg aria-hidden viewBox="0 0 1200 160" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.07 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <path key={i} d={`M -40 ${30 + i * 32} Q 320 ${-6 + i * 32} 640 ${56 + i * 32} T 1280 ${34 + i * 32}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
          ))}
        </svg>

        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 pt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: 'rgba(232,239,235,0.55)' }}>Workspace</div>
              <h1 className="font-display font-bold text-[28px] sm:text-[32px] tracking-[-0.02em] leading-tight" style={{ color: '#FAF6EE' }}>
                {firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
              </h1>
              <p className="text-[14px] mt-1.5" style={{ color: 'rgba(250,246,238,0.65)' }}>
                {activeCount > 0
                  ? `${activeCount} event${activeCount !== 1 ? 's' : ''} live · ${totalRegistrations.toLocaleString()} registration${totalRegistrations !== 1 ? 's' : ''}`
                  : draftCount > 0 ? `${draftCount} event${draftCount !== 1 ? 's' : ''} in draft` : 'No events yet'}
              </p>
            </div>

            {/* Header actions */}
            <div className="flex items-center gap-2 shrink-0">
              {!atLimit && (
                <Link href="/events/new"
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition"
                  style={{ background: '#E8C57E', color: '#0F1F18' }}>
                  <Plus size={15} strokeWidth={2.4} /> New event
                </Link>
              )}
            </div>
          </div>

          {/* Inline stats — four numbers in the header ─────────────────────── */}
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {[
              { value: activeCount, label: 'events live' },
              { value: totalRegistrations.toLocaleString(), label: 'registrations' },
              { value: totalRevenue > 0 ? '$' + totalRevenue.toLocaleString() : '$0', label: 'revenue' },
              { value: draftCount, label: 'in draft' },
            ].map((s, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="font-mono text-[22px] leading-none font-bold" style={{ color: '#FAF6EE' }}>{s.value}</span>
                <span className="text-[13px]" style={{ color: 'rgba(250,246,238,0.6)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-7 space-y-8">

        {/* ── Attention strip ── */}
        {attentionItems.length > 0 && (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#E5E0D4', background: 'white' }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #E5E0D4' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C97A2D" strokeWidth="2" strokeLinecap="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#C97A2D]">Needs attention</span>
            </div>
            {attentionItems.map(item => (
              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-4" style={{ borderBottom: '1px solid #F0EDE7' }}>
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#0F1F18] truncate">{item.name}</span>
                  <span className="text-[12px] text-[#6B7A72]">— {item.reason}</span>
                </div>
                <Link href={item.href} className="text-[12px] font-medium text-[#1F4D3A] hover:underline shrink-0">Take action →</Link>
              </div>
            ))}
          </div>
        )}

        {/* ── Plan limit warning ── */}
        {atLimit && (
          <div className="flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            You&apos;ve reached the {limit}-event limit on the {planName} plan.
            <Link href="/pricing" className="ml-auto font-semibold text-[#1F4D3A] hover:underline">Upgrade →</Link>
          </div>
        )}

        {/* ── Workspace feature grid ── */}
        <section>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72] mb-3">Manage your workspace</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaceFeatures.map(card => (
              <Link key={card.label} href={card.href}
                className="group text-left bg-white rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:border-[#1F4D3A]/40"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)', color: 'inherit', textDecoration: 'none' }}>
                <div className="flex items-start justify-between mb-3">
                  <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {card.icon}
                  </span>
                  {card.stat && (
                    <span className="font-mono text-[10px] tracking-[0.08em] text-[#6B7A72]">{card.stat}</span>
                  )}
                </div>
                <div className="font-display text-[15px] font-semibold tracking-tight text-[#0F1F18]">{card.label}</div>
                <p className="text-[13px] mt-1 leading-[1.5] text-[#6B7A72]">{card.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Events table ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72]">Your events</div>
            <div className="flex items-center gap-3">
              {atLimit && (
                <Link href="/pricing" className="text-[12px] font-medium text-[#1F4D3A] hover:underline">Upgrade for more →</Link>
              )}
              {!atLimit && (
                <Link href="/events/new"
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium transition hover:opacity-90"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  <Plus size={12} strokeWidth={2.4} /> New event
                </Link>
              )}
            </div>
          </div>
          <DashboardContent events={allEvents} atLimit={atLimit} regsByEvent={regsByEvent} />
        </section>

      </div>
    </div>
  );
}
