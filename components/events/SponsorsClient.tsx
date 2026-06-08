'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Sponsor {
  id: string;
  company_name: string;
  tier: string | null;
  booth_location: string | null;
  website_url: string | null;
  invite_token: string;
  lead_count: number;
}

interface Props {
  eventId: string;
  eventName: string;
  sponsors: Sponsor[];
}

// Values match DB check constraint: platinum|gold|silver|standard
const TIERS = [
  { value: 'platinum', label: 'Platinum' },
  { value: 'gold',     label: 'Gold' },
  { value: 'silver',   label: 'Silver' },
  { value: 'standard', label: 'Standard' },
];

const TIER_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  platinum: { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E',  border: 'rgba(201,164,94,0.4)' },
  gold:     { bg: 'rgba(201,122,45,0.10)',  color: '#C97A2D',  border: 'rgba(201,122,45,0.3)' },
  silver:   { bg: 'rgba(107,122,114,0.10)', color: '#6B7A72',  border: 'rgba(107,122,114,0.3)' },
  standard: { bg: '#E8EFEB',                color: '#1F4D3A',  border: 'rgba(31,77,58,0.2)' },
};

function tierStyle(tier: string | null) {
  return TIER_STYLE[tier ?? ''] ?? TIER_STYLE['standard'];
}

function tierLabel(tier: string | null) {
  return TIERS.find(t => t.value === tier)?.label ?? tier ?? 'Standard';
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span className="w-10 h-10 rounded-xl grid place-items-center text-cream font-display font-semibold text-[13px] shrink-0"
      style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}>
      {initials}
    </span>
  );
}

export function SponsorsClient({ eventId, eventName, sponsors: initial }: Props) {
  const router = useRouter();
  const [sponsors, setSponsors] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ company_name: '', tier: 'gold', booth_location: '', website_url: '' });
  const [isPending, startTransition] = useTransition();

  const totalLeads = sponsors.reduce((s, sp) => s + sp.lead_count, 0);
  const booths = sponsors.filter(s => s.booth_location).length;

  function copyPortalLink(token: string) {
    const url = `${window.location.origin}/exhibitor/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function handleAdd() {
    if (!form.company_name) return;
    startTransition(async () => {
      const res = await fetch('/api/events/sponsors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId, ...form }),
      });
      const data = await res.json();
      if (data.sponsor) {
        setSponsors(prev => [{ ...data.sponsor, lead_count: 0 }, ...prev]);
        setForm({ company_name: '', tier: 'gold', booth_location: '', website_url: '' });
        setShowAdd(false);
        router.refresh(); // sync server state (stats, counts)
      } else {
        alert(data.error || 'Failed to add sponsor');
      }
    });
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-[12px] mb-1" style={{ color: '#6B7A72' }}>
              <Link href="/dashboard" className="hover:text-[#1F4D3A] transition-colors">Events</Link>
              <span>/</span>
              <Link href={`/events/${eventId}`} className="hover:text-[#1F4D3A] transition-colors truncate max-w-[200px]">{eventName}</Link>
              <span>/</span>
              <span>Sponsors</span>
            </div>
            <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Sponsors</h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Manage packages, booths, and lead capture.</p>
          </div>
          <button onClick={() => setShowAdd(v => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-cream transition-colors"
            style={{ background: '#1F4D3A' }}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add sponsor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sponsors',       value: sponsors.length, accent: false },
            { label: 'Total leads',    value: totalLeads || '—', accent: false },
            { label: 'Booths assigned', value: booths, accent: false },
            { label: 'Portal links sent', value: sponsors.length, accent: true },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
              <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{s.label}</div>
              <div className="font-mono text-[26px] leading-none tracking-tight" style={{ color: s.accent ? '#C9A45E' : '#1F4D3A' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-2xl p-5 mb-5 border" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14px] font-semibold mb-4" style={{ color: '#0F1F18' }}>New sponsor</div>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Company name *</div>
                <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                  placeholder="Paystack"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Tier</div>
                <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none bg-white"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}>
                  {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Booth location</div>
                <input type="text" value={form.booth_location} onChange={e => setForm(f => ({ ...f, booth_location: e.target.value }))}
                  placeholder="Hall B · Booth 14"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-1.5" style={{ color: '#6B7A72' }}>Website</div>
                <input type="url" value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  placeholder="https://paystack.com"
                  className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={isPending || !form.company_name}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium text-cream"
                style={{ background: '#1F4D3A', opacity: !form.company_name ? 0.6 : 1 }}>
                {isPending ? 'Adding…' : 'Add sponsor'}
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2.5 rounded-xl text-[13.5px] border"
                style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sponsors list */}
        {sponsors.length === 0 ? (
          <div className="bg-white rounded-2xl py-20 text-center" style={{ border: '1px solid #E5E0D4' }}>
            <div className="w-14 h-14 rounded-2xl grid place-items-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
              <svg width={22} height={22} fill="none" stroke="#1F4D3A" strokeWidth={1.6} viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="font-display text-[16px] font-semibold mb-2" style={{ color: '#0F1F18' }}>No sponsors yet</h3>
            <p className="text-[13px] max-w-[380px] mx-auto" style={{ color: '#6B7A72' }}>
              Add a sponsor to generate their exhibitor portal link — they can manage leads, booth profile, and resources themselves.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-2 px-5 py-3.5 flex-wrap" style={{ borderBottom: '1px solid #E5E0D4' }}>
              {TIERS.map(t => {
                const ts = tierStyle(t.value);
                const count = sponsors.filter(s => s.tier === t.value).length;
                if (count === 0) return null;
                return (
                  <span key={t.value} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium"
                    style={{ background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>
                    {t.label} · {count}
                  </span>
                );
              })}
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
              {sponsors.map(sponsor => {
                const ts = tierStyle(sponsor.tier);
                return (
                  <div key={sponsor.id} className="flex items-center gap-4 px-5 py-4">
                    <Avatar name={sponsor.company_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display text-[14.5px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
                          {sponsor.company_name}
                        </span>
                        {sponsor.tier && (
                          <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border"
                            style={{ background: ts.bg, color: ts.color, borderColor: ts.border }}>
                            {tierLabel(sponsor.tier)}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] mt-0.5 flex items-center gap-3 flex-wrap" style={{ color: '#6B7A72' }}>
                        {sponsor.booth_location && <span>{sponsor.booth_location}</span>}
                        {sponsor.website_url && <span>{sponsor.website_url}</span>}
                      </div>
                    </div>
                    <div className="text-center shrink-0 hidden sm:block">
                      <div className="font-mono text-[15px]" style={{ color: '#1F4D3A' }}>{sponsor.lead_count}</div>
                      <div className="font-mono text-[9.5px] tracking-[0.1em] uppercase" style={{ color: '#6B7A72' }}>leads</div>
                    </div>
                    <button onClick={() => copyPortalLink(sponsor.invite_token)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-colors border shrink-0"
                      style={{
                        borderColor: copied === sponsor.invite_token ? 'rgba(45,122,79,0.4)' : '#E5E0D4',
                        color: copied === sponsor.invite_token ? '#2D7A4F' : '#3A4A42',
                        background: copied === sponsor.invite_token ? 'rgba(45,122,79,0.06)' : 'white',
                      }}>
                      {copied === sponsor.invite_token ? 'Copied!' : 'Copy portal link'}
                    </button>
                    <a href={`/exhibitor/${sponsor.invite_token}`} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 grid place-items-center rounded-lg shrink-0" style={{ color: '#6B7A72' }}>
                      <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
