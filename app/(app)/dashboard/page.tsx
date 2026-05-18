export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DashboardContent from './DashboardContent';
import React from 'react';
import { Upload, Maximize2, Link2 } from 'lucide-react';

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 10, studio: Infinity };

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: events }, { data: profile }] = await Promise.all([
    admin.from('events').select('*, event_variants(id, background_url, zones, position)').eq('user_id', user.id).order('updated_at', { ascending: false }),
    admin.from('profiles').select('plan, full_name').eq('id', user.id).single(),
  ]);

  const allEvents = events ?? [];
  const isEmpty = allEvents.length === 0;
  const plan = profile?.plan ?? 'free';
  const limit = PLAN_LIMITS[plan] ?? 1;
  const nonArchivedCount = allEvents.filter(e => e.status !== 'archived').length;
  const atLimit = limit !== Infinity && nonArchivedCount >= limit;

  const activeCount = allEvents.filter(e => e.status === 'published').length;
  const totalDownloads = allEvents.reduce((s, e) => s + e.download_count, 0);
  const totalViews = allEvents.reduce((s, e) => s + e.view_count, 0);
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  // ─── C1: Empty state ───────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="min-h-full flex flex-col" style={{ background: '#F5F5F4' }}>
        {/* Welcome banner */}
        <div className="mx-6 mt-6">
          <div
            className="relative rounded-2xl p-5 flex items-center gap-5 overflow-hidden"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
          >
            {/* Blob */}
            <div className="absolute pointer-events-none" style={{ top: '-60%', right: '-5%', width: 200, height: 200, background: 'radial-gradient(ellipse, rgba(31,77,58,0.1) 0%, transparent 70%)', filter: 'blur(30px)' }} />
            <div
              className="h-12 w-12 rounded-xl grid place-items-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z" />
              </svg>
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="font-display font-bold text-[16px] text-[#0F1F18]">Welcome to Cardly, {firstName} 👋</div>
              <div className="text-[13px] text-[#6B7A72] mt-0.5">
                You&apos;re on the <span className="font-medium text-[#0F1F18]">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span> plan. Let&apos;s set up your first event.
              </div>
            </div>
          </div>
        </div>

        {/* Main empty state */}
        <div className="flex-1 px-6 pt-6 pb-10">
          <div className="max-w-[860px] mx-auto">

            {/* Big dashed tile — C1 style */}
            <Link href="/events/new" className="group block">
              <div
                className="relative rounded-3xl border-2 border-dashed text-center px-10 py-16 overflow-hidden transition-colors"
                style={{ borderColor: 'rgba(31,77,58,0.25)', background: 'rgba(31,77,58,0.02)' }}
              >
                {/* Floating shapes */}
                <div className="absolute top-8 left-14 h-16 w-16 rounded-2xl opacity-60 -rotate-12 group-hover:rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }} />
                <div className="absolute top-10 right-16 h-10 w-10 rounded-full opacity-50" style={{ background: 'linear-gradient(135deg, #E8C57E, rgba(232,197,126,0.4))' }} />
                <div className="absolute bottom-10 left-24 h-9 w-9 rounded-full border-2 opacity-30" style={{ borderColor: '#1F4D3A' }} />
                <div className="absolute bottom-10 right-20 h-14 w-14 rounded-xl opacity-40 rotate-12 group-hover:-rotate-0 transition-transform duration-300" style={{ background: 'linear-gradient(135deg, rgba(31,77,58,0.4), rgba(42,106,80,0.3))' }} />

                {/* Dot grid overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(31,77,58,0.06) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative">
                  <div
                    className="inline-flex h-16 w-16 rounded-2xl grid place-items-center text-white mb-5 group-hover:scale-110 transition-transform duration-200"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 12px 30px rgba(31,77,58,0.35)' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                  <h2 className="font-display font-bold text-[32px] text-[#0F1F18] leading-tight tracking-tight">
                    Create your first event
                  </h2>
                  <p className="mt-3 text-[15px] text-[#6B7A72] max-w-[420px] mx-auto leading-relaxed">
                    Upload your design, mark the editable zones, share the link. Attendees personalize their own card.
                  </p>
                  <div
                    className="mt-7 inline-flex items-center gap-2 h-12 px-7 rounded-xl text-white font-display font-semibold text-[15px] transition hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)', boxShadow: '0 8px 24px rgba(31,77,58,0.35)' }}
                  >
                    Upload a design
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </div>
                  <div className="mt-4 text-[11px] font-mono text-[#6B7A72]/50 tracking-widest uppercase">
                    PNG or JPG · Up to 10 MB
                  </div>
                </div>
              </div>
            </Link>

            {/* How it works — 3-step quick start */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[11px] font-mono text-[#6B7A72]/50 tracking-widest uppercase">Get started</div>
                  <h3 className="font-display font-bold text-[20px] text-[#0F1F18] mt-1">How it works in 60 seconds</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {([
                  { n: '01', icon: <Upload size={14} strokeWidth={2} color="#1F4D3A" />, title: 'Upload your design', body: 'Drop your PNG or JPG. Anything you\'d post on social works.' },
                  { n: '02', icon: <Maximize2 size={14} strokeWidth={2} color="#1F4D3A" />, title: 'Mark the zones', body: 'Drag rectangles where the attendee\'s name and photo should go.' },
                  { n: '03', icon: <Link2 size={14} strokeWidth={2} color="#1F4D3A" />, title: 'Share the link', body: 'Send the public URL anywhere — WhatsApp, email, or a QR on screen.' },
                ] as { n: string; icon: React.ReactNode; title: string; body: string }[]).map((step) => (
                  <div
                    key={step.n}
                    className="relative bg-white rounded-2xl p-5"
                    style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[11px] font-mono text-[#6B7A72]/45">{step.n}</div>
                      <div className="h-8 w-8 rounded-lg grid place-items-center" style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.12)' }}>
                        {step.icon}
                      </div>
                    </div>
                    <div className="font-display font-bold text-[15px] text-[#0F1F18]">{step.title}</div>
                    <p className="text-[13px] text-[#6B7A72] mt-1.5 leading-relaxed">{step.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── C2: Events list ───────────────────────────────────────────────────────
  return (
    <div className="min-h-full flex flex-col" style={{ background: '#F5F5F4' }}>

      {/* Page header */}
      <div className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        {/* Green mesh */}
        <div className="absolute pointer-events-none" style={{ top: '-50%', left: '-5%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/50 mb-3">
            <span>WORKSPACE</span>
            <span>/</span>
            <span className="text-[#6B7A72]">Events</span>
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[32px] text-[#0F1F18] leading-tight tracking-tight">Events</h1>
              <p className="text-[14px] text-[#6B7A72] mt-1">
                {activeCount > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                      {activeCount} live
                    </span>
                    {totalDownloads > 0 && <> · {totalDownloads.toLocaleString()} downloads · {totalViews.toLocaleString()} views</>}
                  </>
                ) : (
                  'No events published yet'
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {atLimit ? (
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 h-9 px-4 text-[13px] font-medium rounded-lg border transition hover:opacity-90"
                  style={{ background: 'white', borderColor: '#E5E0D4', color: '#3A4A42' }}
                >
                  Upgrade plan
                </Link>
              ) : (
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-2 h-9 px-4 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90"
                  style={{ background: '#1F4D3A' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New event
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan limit warning */}
      {atLimit && (
        <div className="mx-6 mt-4 flex items-center gap-2 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          You&apos;ve reached the {limit}-event limit on the Free plan.
          <Link href="/pricing" className="ml-auto font-semibold text-[#1F4D3A] hover:underline">Upgrade →</Link>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-6 py-6">
        <DashboardContent events={allEvents} atLimit={atLimit} />
      </div>
    </div>
  );
}
