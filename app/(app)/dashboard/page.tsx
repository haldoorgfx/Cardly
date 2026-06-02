export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dashboard' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';
import React from 'react';
import { TrendingUp, Download, Eye, Zap, CalendarDays, Ticket, LayoutGrid } from 'lucide-react';
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
  // Canonical limits from billing config — events: null means UNLIMITED.
  // Note: read .events off the resolved plan config; don't `?? free` the value
  // itself, or a legitimate null (unlimited) would collapse to the free limit.
  const limit = (PLANS[plan] ?? PLANS.free).events;
  const nonArchivedCount = allEvents.filter(e => e.status !== 'archived').length;
  const atLimit = limit !== null && nonArchivedCount >= limit;

  const activeCount = allEvents.filter(e => e.status === 'published').length;
  const draftCount = allEvents.filter(e => e.status === 'draft').length;
  const totalDownloads = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);
  const totalViews = allEvents.reduce((s, e) => s + (e.view_count ?? 0), 0);
  const conversion = totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0;
  const firstName = profile?.full_name?.split(' ')[0] ?? '';

  // ─── C1: Empty state ───────────────────────────────────────────────────────
  if (isEmpty) {
    const steps = [
      { n: '01', icon: <CalendarDays size={18} strokeWidth={1.8} />, title: 'Set up your event', body: 'Name, date, venue, and a cover photo. The essentials.' },
      { n: '02', icon: <Ticket size={18} strokeWidth={1.8} />, title: 'Add tickets & registration', body: 'Free or paid, with a custom form for attendees.' },
      { n: '03', icon: <LayoutGrid size={18} strokeWidth={1.8} />, title: 'Build your agenda', body: 'Sessions, speakers, schedule — and a Karta Card for every attendee.' },
    ] as { n: string; icon: React.ReactNode; title: string; body: string }[];

    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 py-16" style={{ background: '#FAF6EE' }}>
        <div className="max-w-[840px] w-full mx-auto text-center">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-6 text-[#1F4D3A]"
            style={{ background: '#E8EFEB' }}>
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
                  <span className="w-9 h-9 rounded-lg grid place-items-center text-[#1F4D3A]" style={{ background: '#E8EFEB' }}>
                    {s.icon}
                  </span>
                  <span className="font-mono text-[11px] text-[#6B7A72]/50">{s.n}</span>
                </div>
                <div className="font-display text-[15px] font-semibold text-[#0F1F18] tracking-tight">{s.title}</div>
                <p className="text-[13px] text-[#6B7A72] mt-1.5 leading-[1.5]">{s.body}</p>
              </div>
            ))}
          </div>
          <Link href="/events/new"
            className="mt-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-white font-medium transition hover:bg-[#163828]"
            style={{ background: '#1F4D3A' }}>
            Create your first event
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>
    );
  }

  // ─── C2: Dashboard with metrics + events ──────────────────────────────────
  const stats = [
    {
      label: 'Active events',
      value: activeCount,
      sub: draftCount > 0 ? `${draftCount} draft` : 'All published',
      icon: <Zap size={16} strokeWidth={1.8} />,
      color: '#1F4D3A',
      bg: 'rgba(31,77,58,0.07)',
    },
    {
      label: 'Total downloads',
      value: totalDownloads.toLocaleString(),
      sub: 'Cards generated',
      icon: <Download size={16} strokeWidth={1.8} />,
      color: '#1F4D3A',
      bg: 'rgba(31,77,58,0.07)',
    },
    {
      label: 'Total views',
      value: totalViews.toLocaleString(),
      sub: 'Attendee page opens',
      icon: <Eye size={16} strokeWidth={1.8} />,
      color: '#1F4D3A',
      bg: 'rgba(31,77,58,0.07)',
    },
    {
      label: 'Conversion',
      value: `${conversion}%`,
      sub: 'Views → downloads',
      icon: <TrendingUp size={16} strokeWidth={1.8} />,
      color: conversion >= 60 ? '#2D7A4F' : conversion >= 30 ? '#C97A2D' : '#6B7A72',
      bg: conversion >= 60 ? 'rgba(45,122,79,0.08)' : 'rgba(31,77,58,0.07)',
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Header ── */}
      <div className="px-6 lg:px-8 pt-8 pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#6B7A72] uppercase mb-1">Workspace</div>
            <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight leading-tight">
              {firstName ? `Good to see you, ${firstName}` : 'Dashboard'}
            </h1>
            <p className="text-[14px] text-[#6B7A72] mt-1">
              {activeCount > 0
                ? `${activeCount} event${activeCount !== 1 ? 's' : ''} live · ${totalDownloads.toLocaleString()} cards generated`
                : 'No events published yet'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/analytics"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-[13px] font-medium rounded-lg border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
            >
              <TrendingUp size={13} strokeWidth={2} />
              Analytics
            </Link>
            {!atLimit && (
              <Link
                href="/events/new"
                className="inline-flex items-center gap-1.5 h-9 px-4 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90"
                style={{ background: '#1F4D3A' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                New event
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Slim metric strip (glanceable, doesn't bury the events) ── */}
      <div className="px-6 lg:px-8 pb-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="bg-white rounded-xl flex items-center gap-3 px-4 py-3"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
            >
              <div className="h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-[20px] leading-none tracking-tight" style={{ color: stat.color === '#1F4D3A' ? '#0F1F18' : stat.color }}>
                  {stat.value}
                </div>
                <div className="text-[11px] mt-1 truncate" style={{ color: '#6B7A72' }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan limit warning (only when genuinely at the plan's limit) ── */}
      {atLimit && (
        <div className="mx-6 lg:mx-8 mb-4 flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You&apos;ve reached the {limit}-event limit on the {planName} plan.
          <Link href="/pricing" className="ml-auto font-semibold text-[#1F4D3A] hover:underline">Upgrade →</Link>
        </div>
      )}

      {/* ── Events section (the hero of the dashboard) ── */}
      <div className="px-6 lg:px-8 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.18em] text-[#6B7A72] uppercase">Your events</div>
          </div>
          {atLimit && (
            <Link href="/pricing" className="text-[12px] font-medium text-[#1F4D3A] hover:underline">Upgrade for more →</Link>
          )}
        </div>
        <DashboardContent events={allEvents} atLimit={atLimit} />
      </div>

    </div>
  );
}
