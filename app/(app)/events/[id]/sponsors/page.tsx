export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventManageNav } from '@/components/events/EventManageNav';
import { Briefcase, Users, MapPin, DollarSign, Plus, Download } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

const TIERS = [
  { name: 'Platinum', color: '#C9A45E', bg: 'rgba(232,197,126,0.15)', border: 'rgba(201,164,94,0.4)' },
  { name: 'Gold',     color: '#C97A2D', bg: 'rgba(201,122,45,0.10)',  border: 'rgba(201,122,45,0.3)' },
  { name: 'Silver',   color: '#6B7A72', bg: 'rgba(107,122,114,0.10)', border: 'rgba(107,122,114,0.3)' },
  { name: 'Bronze',   color: '#8B6B4E', bg: 'rgba(139,107,78,0.10)',  border: 'rgba(139,107,78,0.3)' },
];

export default async function SponsorsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single();
  if (!event) redirect('/dashboard');

  const byStat = [
    { label: 'Sponsors',    value: '0',  icon: Briefcase },
    { label: 'Total leads', value: '—',  icon: Users },
    { label: 'Booths',      value: '0',  icon: MapPin },
    { label: 'Packages',    value: '—',  icon: DollarSign, accent: true },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <EventManageNav eventId={id} eventName={event.name} active="sponsors" />
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Sponsors</h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Manage sponsor packages, booths, and lead capture.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border transition opacity-40 cursor-not-allowed"
              style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}>
              <Download size={14} /> Export leads
            </button>
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition opacity-40 cursor-not-allowed"
              style={{ background: '#1F4D3A' }}>
              <Plus size={14} /> Add sponsor
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {byStat.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl grid place-items-center"
                  style={{ background: s.accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB', color: s.accent ? '#C9A45E' : '#1F4D3A' }}>
                  <s.icon size={16} strokeWidth={1.8} />
                </div>
              </div>
              <div className="font-mono text-[24px] font-medium leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="text-[12.5px] mt-1.5" style={{ color: '#6B7A72' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tier sections — empty state */}
        <div className="bg-white rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid #E5E0D4' }}>
          {/* Tier pills */}
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
            {TIERS.map(tier => (
              <span key={tier.name} className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-mono font-medium opacity-50"
                style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                {tier.name}
              </span>
            ))}
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4"
              style={{ background: '#E8EFEB' }}>
              <Briefcase size={22} strokeWidth={1.6} style={{ color: '#1F4D3A' }} />
            </div>
            <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>
              No sponsors yet
            </h3>
            <p className="text-[13px] max-w-[380px]" style={{ color: '#6B7A72' }}>
              Sponsor management — including packages, booth assignments, and lead capture — is coming soon.
              Contact us if you need this feature urgently.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
