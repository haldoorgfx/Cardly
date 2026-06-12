export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sponsors' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Briefcase, Users, MapPin, DollarSign, ArrowLeft, Download, Plus } from 'lucide-react';
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

const TIERS = [
  {
    tier: 'Platinum',
    color: '#C9A45E',
    sponsors: [
      { name: 'Paystack', leads: 142 },
      { name: 'MTN', leads: 118 },
    ],
  },
  {
    tier: 'Gold',
    color: '#E8C57E',
    sponsors: [
      { name: 'Flutterwave', leads: 86 },
      { name: 'Andela', leads: 71 },
      { name: 'Kuda', leads: 64 },
    ],
  },
  {
    tier: 'Silver',
    color: '#A8C2B5',
    sponsors: [
      { name: 'Wave', leads: 38 },
      { name: 'Lidya', leads: 29 },
      { name: 'PiggyVest', leads: 24 },
      { name: 'Safaricom', leads: 18 },
    ],
  },
];

export default async function SponsorsPage({ params }: Props) {
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
              <Download size={13} strokeWidth={1.8} />
              Lead export
            </button>
            <button className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[13px] font-medium transition"
              style={{ background: '#1F4D3A', color: 'white' }}>
              <Plus size={13} strokeWidth={2} />
              Add sponsor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>Sponsors</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>9 sponsors · 590 leads captured</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          <StatCard label="Sponsors"        value="9"     icon={Briefcase} />
          <StatCard label="Leads captured"  value="590"   icon={Users}     delta="11% wk" deltaUp />
          <StatCard label="Booth visits"    value="2,140" icon={MapPin}    />
          <StatCard label="Sponsor revenue" value="$48k"  icon={DollarSign} accent />
        </div>

        {/* Tier grids */}
        <div className="space-y-7">
          {TIERS.map((t) => (
            <div key={t.tier}>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ background: t.color }} />
                <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                  {t.tier}
                </span>
                <span className="font-mono text-[11px]" style={{ color: '#9BA8A1' }}>{t.sponsors.length} sponsors</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {t.sponsors.map((s, j) => (
                  <div key={j} className="bg-white border rounded-2xl p-4 hover:border-[#1F4D3A]/40 transition-colors cursor-pointer"
                    style={{ borderColor: '#E5E0D4' }}>
                    <div className="h-12 rounded-lg border grid place-items-center mb-3"
                      style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}>
                      <span className="font-display text-[15px] font-bold tracking-tight" style={{ color: 'rgba(31,77,58,0.7)' }}>
                        {s.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase" style={{ color: '#9BA8A1' }}>Leads</span>
                      <span className="font-mono text-[14px]" style={{ color: '#1F4D3A' }}>{s.leads}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
