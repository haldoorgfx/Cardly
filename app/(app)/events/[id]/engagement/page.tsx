export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Networking' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Network, MessageSquare, CalendarDays, CheckCircle2, TrendingUp, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props { params: Promise<{ id: string }> }

function StatCard({ label, value, icon: Icon, delta, deltaUp, accent }: {
  label: string; value: string;
  icon: React.ElementType; delta?: string; deltaUp?: boolean; accent?: boolean;
}) {
  return (
    <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl grid place-items-center"
          style={{ background: accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB', color: accent ? '#C9A45E' : '#1F4D3A' }}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
        {delta && (
          <span className="font-mono text-[11px]" style={{ color: deltaUp ? '#2D7A4F' : '#B8423C' }}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="font-mono text-[26px] font-medium leading-none tracking-tight" style={{ color: '#0F1F18' }}>{value}</div>
      <div className="text-[12.5px] mt-1.5" style={{ color: '#6B7A72' }}>{label}</div>
    </div>
  );
}

function AreaChartSvg({ points }: { points: { label: string; v: number }[] }) {
  const W = 500, H = 120, PAD = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...points.map(p => p.v), 1);
  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.v)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1F4D3A" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD.left} y1={PAD.top + innerH * (1 - f)} x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - f)}
          stroke="#E5E0D4" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={areaD} fill="url(#netGrad)" />
      <path d={pathD} fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.v)} r="3" fill="#1F4D3A" />
          <text x={toX(i)} y={H - 4} textAnchor="middle" fontSize="9.5" fill="#9BA8A1" fontFamily="JetBrains Mono, monospace">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

const CONNECTOR_AVATARS = [
  { name: 'Fatou Diop',       connections: 28, grad: 'linear-gradient(135deg,#3E7E5E,#C9A45E)' },
  { name: 'Kwame Mensah',     connections: 24, grad: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' },
  { name: 'Odunayo Eweniyi',  connections: 21, grad: 'linear-gradient(135deg,#2A6A50,#C9A45E)' },
  { name: 'Tunde Kehinde',    connections: 19, grad: 'linear-gradient(135deg,#163828,#3E7E5E)' },
];

const CHART_POINTS = [
  { label: 'Mon', v: 40 }, { label: 'Tue', v: 95 }, { label: 'Wed', v: 160 },
  { label: 'Thu', v: 130 }, { label: 'Fri', v: 210 }, { label: 'Sat', v: 260 },
];

const AI_CARDS = [
  { title: 'Match by interests', desc: 'Pair attendees with shared topics' },
  { title: 'Match by goals', desc: 'Founders ↔ investors, hiring, etc.' },
  { title: 'Suggest sessions', desc: 'Recommend sessions per attendee' },
];

export default async function NetworkingPage({ params }: Props) {
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
          <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition"
            style={{ background: '#1F4D3A', color: 'white' }}>
            Matchmaking settings
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Networking</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Attendee connections & AI matchmaking.</p>
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Connections made"  value="486"   icon={Network}        delta="9% wk" deltaUp />
          <StatCard label="Messages sent"     value="1,204" icon={MessageSquare}  />
          <StatCard label="Meetings booked"   value="92"    icon={CalendarDays}   />
          <StatCard label="Match acceptance"  value="68%"   icon={CheckCircle2}   accent />
        </div>

        {/* Chart + Top connectors */}
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 mb-5">
          <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Connections over time
            </div>
            <AreaChartSvg points={CHART_POINTS} />
          </div>

          <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Top connectors
            </div>
            <div className="space-y-3">
              {CONNECTOR_AVATARS.map((c, i) => {
                const initials = c.name.split(' ').map(x => x[0]).join('');
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="font-mono text-[12px] w-4 shrink-0" style={{ color: '#9BA8A1' }}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0"
                      style={{ background: c.grad }}>
                      {initials}
                    </div>
                    <span className="flex-1 text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{c.name}</span>
                    <span className="font-mono text-[13px]" style={{ color: '#1F4D3A' }}>{c.connections}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI matchmaking */}
        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} strokeWidth={1.8} style={{ color: '#C9A45E' }} />
            <div className="font-display text-[14.5px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              AI matchmaking
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {AI_CARDS.map((card, i) => (
              <div key={i} className="rounded-xl p-4 border" style={{ background: 'rgba(250,246,238,0.6)', borderColor: '#E5E0D4' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <Sparkles size={14} strokeWidth={1.8} />
                  </div>
                  {/* Toggle */}
                  <div className="w-9 h-5 rounded-full relative cursor-pointer" style={{ background: i < 2 ? '#1F4D3A' : '#D1D5DB' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all"
                      style={{ left: i < 2 ? '18px' : '2px' }} />
                  </div>
                </div>
                <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{card.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl px-4 py-3 border text-[12.5px]"
          style={{ background: 'rgba(232,197,126,0.08)', borderColor: 'rgba(232,197,126,0.3)', color: '#6B7A72' }}>
          <TrendingUp size={13} strokeWidth={1.8} className="inline mr-1.5" style={{ color: '#C9A45E' }} />
          Networking data shown above is from the current event session. Live attendee matching is available once attendees register.
        </div>
      </div>
    </div>
  );
}
