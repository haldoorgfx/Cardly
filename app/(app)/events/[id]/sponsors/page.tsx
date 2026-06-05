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

// Mock sponsors — replace with real DB query once sponsors table exists
const MOCK_SPONSORS = [
  { id: '1', name: 'Paystack',      tier: 'Platinum', leads: 142, booth: 'A1 · Main hall',  logo: 'PS' },
  { id: '2', name: 'Flutterwave',   tier: 'Platinum', leads: 98,  booth: 'A2 · Main hall',  logo: 'FL' },
  { id: '3', name: 'Andela',        tier: 'Gold',     leads: 64,  booth: 'B1 · East wing',  logo: 'AN' },
  { id: '4', name: 'Kuda Bank',     tier: 'Gold',     leads: 51,  booth: 'B2 · East wing',  logo: 'KB' },
  { id: '5', name: 'Safaricom',     tier: 'Silver',   leads: 29,  booth: 'C1 · West wing',  logo: 'SF' },
  { id: '6', name: 'M-Pesa Africa', tier: 'Silver',   leads: 23,  booth: 'C2 · West wing',  logo: 'MP' },
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

  const totalLeads = MOCK_SPONSORS.reduce((s, sp) => s + sp.leads, 0);
  const totalBooths = MOCK_SPONSORS.length;

  const byStat = [
    { label: 'Sponsors',    value: String(MOCK_SPONSORS.length), icon: Briefcase },
    { label: 'Total leads', value: String(totalLeads),           icon: Users },
    { label: 'Booths',      value: String(totalBooths),          icon: MapPin },
    { label: 'Packages',    value: '$92k',                       icon: DollarSign, accent: true },
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
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border transition hover:border-[#1F4D3A]/40"
              style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white' }}>
              <Download size={14} /> Export leads
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium text-white transition hover:bg-[#163828]"
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

        {/* Sponsors by tier */}
        {TIERS.map(tier => {
          const tierSponsors = MOCK_SPONSORS.filter(sp => sp.tier === tier.name);
          if (tierSponsors.length === 0) return null;
          return (
            <div key={tier.name} className="mb-8">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-mono font-medium"
                  style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}>
                  {tier.name}
                </span>
                <span className="text-[13px]" style={{ color: '#6B7A72' }}>{tierSponsors.length} sponsor{tierSponsors.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tierSponsors.map(sp => (
                  <div key={sp.id} className="bg-white rounded-2xl p-5 hover:-translate-y-0.5 transition-transform cursor-pointer"
                    style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl grid place-items-center shrink-0"
                        style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                        <span className="font-display text-[14px] font-bold" style={{ color: tier.color }}>{sp.logo}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>{sp.name}</div>
                        <div className="font-mono text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>{sp.booth}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E5E0D4' }}>
                      <div className="text-[13px]" style={{ color: '#6B7A72' }}>Leads captured</div>
                      <div className="font-mono text-[15px] font-medium" style={{ color: '#1F4D3A' }}>{sp.leads}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state note */}
        <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px dashed #E5E0D4' }}>
          <div className="text-[13px]" style={{ color: '#6B7A72' }}>
            Sponsor data is currently using placeholder content. Connect your sponsors database to see live data.
          </div>
        </div>

      </div>
    </div>
  );
}
