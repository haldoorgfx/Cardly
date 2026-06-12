export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Virtual' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Video, Users, BarChart2, Clock, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }> }

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl grid place-items-center"
          style={{ background: accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB', color: accent ? '#C9A45E' : '#1F4D3A' }}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <div className="font-mono text-[26px] font-medium leading-none tracking-tight" style={{ color: '#0F1F18' }}>{value}</div>
      <div className="text-[12.5px] mt-1.5" style={{ color: '#6B7A72' }}>{label}</div>
    </div>
  );
}

const STREAMS = [
  { title: 'Opening keynote',                        track: 'Main Stage', status: 'Live',     viewers: 842,  tone: 'green' },
  { title: 'Scaling fintech across borders',         track: 'Main Stage', status: 'Upcoming', viewers: 0,    tone: 'amber' },
  { title: 'Workshop: Ship payments in a weekend',   track: 'Builders',   status: 'Upcoming', viewers: 0,    tone: 'amber' },
  { title: 'Founder AMA (Day 1)',                    track: 'Main Stage', status: 'Recorded', viewers: 1240, tone: 'neutral' },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; dot?: string }> = {
  green:   { bg: '#E8F5EE', color: '#2D7A4F', dot: '#2D7A4F' },
  amber:   { bg: '#FEF9EE', color: '#C97A2D', dot: '#C9A45E' },
  neutral: { bg: '#F5F3EE', color: '#6B7A72' },
};

export default async function VirtualPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id, name').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b" style={{ borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto px-6 lg:px-8 pt-3 pb-3 flex items-center justify-between gap-4">
          <Link href={`/events/${id}`} className="inline-flex items-center gap-1.5 text-[12px] hover:text-[#1F4D3A] transition-colors"
            style={{ color: '#6B7A72' }}>
            <ArrowLeft size={12} strokeWidth={2} />
            {event.name}
          </Link>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A]/40"
              style={{ background: 'white', borderColor: '#E5E0D4', color: '#3A4A42' }}>
              <Settings size={13} strokeWidth={1.8} />
              Stream settings
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition"
              style={{ background: '#1F4D3A', color: 'white' }}>
              <Video size={13} strokeWidth={1.8} />
              Go live
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Virtual</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Stream sessions to online attendees.</p>
        </div>

        {/* Stream panel + stats */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">
          {/* Dark stream card */}
          <div className="rounded-2xl overflow-hidden relative grid place-items-center" style={{
            background: '#163828',
            aspectRatio: '16/9',
            minHeight: '180px',
          }}>
            <div className="absolute inset-0" style={{
              background: 'radial-gradient(60% 80% at 50% 30%, rgba(232,197,126,0.18), transparent 60%)',
            }} />
            <div className="relative text-center px-6">
              <div className="inline-grid place-items-center w-16 h-16 rounded-full border mb-3"
                style={{ background: 'rgba(250,246,238,0.1)', borderColor: 'rgba(250,246,238,0.2)', color: '#E8C57E' }}>
                <Video size={28} strokeWidth={1.5} />
              </div>
              <div className="font-display text-[16px] font-semibold" style={{ color: '#FAF6EE' }}>
                Main Stage — Live now
              </div>
              <div className="font-mono text-[11px] mt-1" style={{ color: 'rgba(250,246,238,0.55)' }}>842 watching</div>
            </div>
            {/* Live badge */}
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full font-semibold text-white"
              style={{ background: 'rgba(239,68,68,0.9)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          </div>

          {/* Stat mini-grid */}
          <div className="grid grid-cols-2 gap-4 content-start">
            <StatCard label="Live viewers" value="842"  icon={Users} />
            <StatCard label="Peak today"   value="1.2k" icon={BarChart2} />
            <StatCard label="Avg. watch"   value="34m"  icon={Clock} />
            <StatCard label="Recordings"   value="6"    icon={Video} accent />
          </div>
        </div>

        {/* Sessions list */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
            <span className="font-display text-[14.5px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Sessions</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
            {STREAMS.map((s, i) => {
              const style = STATUS_STYLE[s.tone];
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <Video size={15} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{s.title}</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: '#9BA8A1' }}>{s.track}</div>
                  </div>
                  {s.viewers > 0 && (
                    <span className="font-mono text-[11.5px] hidden sm:inline" style={{ color: '#6B7A72' }}>
                      {s.viewers.toLocaleString()} views
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: style.bg, color: style.color }}>
                    {style.dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />}
                    {s.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
