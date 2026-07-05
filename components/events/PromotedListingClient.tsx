'use client';

import { useState } from 'react';
import { TrendingUp, MousePointer, Ticket, DollarSign, Pause, RefreshCw, LayoutGrid } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Campaign = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  campaign: Campaign | null;
}

const PLACEMENTS = [
  { key: 'homepage', label: 'Homepage feed' },
  { key: 'city', label: 'City page' },
  { key: 'category', label: 'Category results' },
  { key: 'search', label: 'Search results' },
];

const DURATION_OPTIONS = [
  { key: '3', label: '3 days' },
  { key: '7', label: '1 week' },
  { key: '14', label: '2 weeks' },
  { key: '30', label: '1 month' },
];

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: '#6B7A72' }} />
        <span className="text-[12px]" style={{ color: '#6B7A72' }}>{label}</span>
      </div>
      <div className="font-display font-bold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{sub}</div>}
    </div>
  );
}

export function PromotedListingClient({ eventId, eventName, campaign }: Props) {
  const [budget, setBudget] = useState<number>(campaign?.daily_budget ?? 25);
  const [duration, setDuration] = useState<string>(campaign?.duration_days?.toString() ?? '7');
  const [placements, setPlacements] = useState<string[]>(campaign?.placements ?? ['homepage', 'city']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSpend = budget * parseInt(duration);
  const estImpressions = Math.round(totalSpend * 340);
  const estClicks = Math.round(totalSpend * 12);
  const estRegistrations = Math.round(totalSpend * 1.4);

  const hasActiveCampaign = campaign?.status === 'active';

  function togglePlacement(key: string) {
    setPlacements(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]);
  }

  async function submit() {
    setSubmitting(true);
    await fetch(`/api/events/${eventId}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_budget: budget, duration_days: parseInt(duration), placements }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  }

  return (
    <div className="max-w-[840px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Promote listing
        </h1>
        <p className="text-[14px]" style={{ color: '#6B7A72' }}>{eventName}</p>
      </div>

      {/* Stats (only if campaign exists) */}
      {hasActiveCampaign && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={TrendingUp} label="Impressions" value={(campaign.impressions ?? 0).toLocaleString()} sub="this campaign" />
          <StatCard icon={MousePointer} label="Clicks" value={(campaign.clicks ?? 0).toLocaleString()} />
          <StatCard icon={Ticket} label="Registrations" value={(campaign.registrations ?? 0).toString()} sub="attributed" />
          <StatCard icon={DollarSign} label="Spent" value={`$${campaign.spent_amount ?? 0}`} sub={`of $${(campaign.daily_budget ?? 0) * (campaign.duration_days ?? 0)}`} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Campaign settings */}
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <h2 className="font-semibold text-[16px] mb-5" style={{ color: '#0F1F18' }}>Campaign settings</h2>

          {/* Budget */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold" style={{ color: '#3A4A42' }}>Daily budget</label>
              <span className="font-display font-bold text-[20px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
                ${budget}/day
              </span>
            </div>
            <input
              type="range" min={5} max={200} step={5}
              value={budget}
              onChange={e => setBudget(parseInt(e.target.value))}
              className="w-full accent-[#1F4D3A]"
            />
            <div className="flex justify-between text-[11px] mt-1" style={{ color: '#C9C3B1' }}>
              <span>$5</span><span>$200</span>
            </div>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <label className="text-[13px] font-semibold block mb-2" style={{ color: '#3A4A42' }}>Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setDuration(opt.key)}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold transition"
                  style={{
                    background: duration === opt.key ? '#1F4D3A' : '#F5F2EC',
                    color: duration === opt.key ? '#FAF6EE' : '#3A4A42',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Placements */}
          <div className="mb-6">
            <label className="text-[13px] font-semibold block mb-2" style={{ color: '#3A4A42' }}>Placements</label>
            <div className="grid grid-cols-2 gap-2">
              {PLACEMENTS.map(p => {
                const active = placements.includes(p.key);
                return (
                  <button key={p.key} onClick={() => togglePlacement(p.key)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition border"
                    style={{
                      background: active ? '#E8EFEB' : '#FAF6EE',
                      borderColor: active ? '#1F4D3A' : '#E5E0D4',
                      color: active ? '#1F4D3A' : '#6B7A72',
                    }}>
                    <div className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                      style={{ background: active ? '#1F4D3A' : 'transparent', border: active ? 'none' : '1.5px solid #C9C3B1' }}>
                      {active && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {hasActiveCampaign ? (
              <>
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition hover:opacity-80"
                  style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
                  <Pause size={13} /> Pause campaign
                </button>
                <button onClick={submit} disabled={submitting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                  <RefreshCw size={13} /> Update campaign
                </button>
              </>
            ) : (
              <button onClick={submit} disabled={submitting || submitted}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                {submitted ? '✓ Submitted for review' : submitting ? 'Submitting…' : 'Launch campaign'}
              </button>
            )}
          </div>
        </div>

        {/* ROI estimate */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
            <h3 className="font-semibold text-[14px] mb-3" style={{ color: '#1F4D3A' }}>Estimated reach</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Total spend', val: `$${totalSpend}` },
                { label: 'Impressions', val: estImpressions.toLocaleString() },
                { label: 'Clicks', val: estClicks.toLocaleString() },
                { label: 'Registrations', val: `~${estRegistrations}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-[13px]">
                  <span style={{ color: '#3A4A42' }}>{row.label}</span>
                  <span className="font-semibold" style={{ color: '#1F4D3A', fontFamily: 'Inter, system-ui, sans-serif' }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live preview mockup */}
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="text-[11px] font-semibold mb-3 uppercase tracking-wider" style={{ color: '#6B7A72' }}>Feed preview</div>
            <div className="flex flex-col gap-2">
              {/* Organic card */}
              <div className="h-10 rounded-xl" style={{ background: '#F5F2EC' }} />
              {/* Promoted card */}
              <div className="rounded-xl p-2.5" style={{ background: '#E8EFEB', border: '1.5px solid #1F4D3A' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3 w-24 rounded-full" style={{ background: '#C9E0D4' }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                    Promoted
                  </span>
                </div>
                <div className="h-2.5 w-32 rounded-full" style={{ background: '#C9E0D4' }} />
              </div>
              {/* Organic card */}
              <div className="h-10 rounded-xl" style={{ background: '#F5F2EC' }} />
            </div>
          </div>

          {/* Placement rules */}
          <div className="rounded-2xl p-4" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <LayoutGrid size={13} style={{ color: '#6B7A72' }} />
              <span className="text-[12px] font-semibold" style={{ color: '#3A4A42' }}>Placement rules</span>
            </div>
            <p className="text-[11px]" style={{ color: '#6B7A72' }}>
              Promoted listings are reviewed within 24h. They appear as native cards with a &ldquo;Promoted&rdquo; label. Max 1 promoted card per 5 organic cards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
