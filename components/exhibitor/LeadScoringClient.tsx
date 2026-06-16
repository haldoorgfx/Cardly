'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Mail, Phone, Download, Flame, Zap, Snowflake, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lead = any;

type Tier = 'all' | 'hot' | 'warm' | 'cold' | 'uncontacted';

interface Props {
  eventSlug: string;
  eventName: string;
  leads: Lead[];
}

const DEMO_LEADS: Lead[] = [
  { id: '1', name: 'Amina Osman', role: 'Founder & CEO', company: 'Sahel Pay', score: 92, tier: 'hot', reason: 'Senior role · 3 session overlaps · Visited booth 2×', tags: ['Fintech', 'Payments'], contacted: false },
  { id: '2', name: 'Kwame Asante', role: 'CTO', company: 'Accra Labs', score: 87, tier: 'hot', reason: 'Technical decision-maker · High dwell time', tags: ['Dev Tools', 'API'], contacted: false },
  { id: '3', name: 'Fatima Al-Rashid', role: 'VP Product', company: 'Mashreq Digital', score: 84, tier: 'hot', reason: 'Product leader · Scanned your materials', tags: ['SaaS', 'Fintech'], contacted: true },
  { id: '4', name: 'Chidi Okeke', role: 'Head of Partnerships', company: 'Lagos Ventures', score: 64, tier: 'warm', reason: 'Partnership potential · Mid seniority', tags: ['BD', 'Partnerships'], contacted: false },
  { id: '5', name: 'Sara Njoroge', role: 'Product Manager', company: 'Safaricom PLC', score: 61, tier: 'warm', reason: 'PM at key account · Attended keynote', tags: ['Mobile', 'East Africa'], contacted: false },
  { id: '6', name: 'Moussa Diallo', role: 'Engineer', company: 'Wave Mobile', score: 58, tier: 'warm', reason: 'IC engineer · Showed technical interest', tags: ['Engineering', 'Payments'], contacted: true },
  { id: '7', name: 'Nia Kamara', role: 'Marketing Manager', company: 'Flutterwave', score: 31, tier: 'cold', reason: 'Indirect role · Single session', tags: ['Marketing'], contacted: false },
  { id: '8', name: 'Emeka Ihejirika', role: 'Business Analyst', company: 'UBA Group', score: 28, tier: 'cold', reason: 'Analyst role · Low intent signals', tags: ['Finance'], contacted: false },
];

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = tier === 'hot' ? '#E8C57E' : tier === 'warm' ? '#3A8A6E' : 'rgba(255,255,255,0.25)';

  return (
    <div className="relative shrink-0" style={{ width: 52, height: 52 }}>
      <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={26} cy={26} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        <circle cx={26} cy={26} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-[13px]"
        style={{ color, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {score}
      </div>
    </div>
  );
}

function TierIcon({ tier }: { tier: string }) {
  if (tier === 'hot') return <Flame size={12} style={{ color: '#E8C57E' }} />;
  if (tier === 'warm') return <Zap size={12} style={{ color: '#3A8A6E' }} />;
  return <Snowflake size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />;
}

function TierBadge({ tier }: { tier: string }) {
  const styles = {
    hot: { bg: 'rgba(232,197,126,0.15)', color: '#E8C57E', label: 'Hot' },
    warm: { bg: 'rgba(58,138,110,0.15)', color: '#3A8A6E', label: 'Warm' },
    cold: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: 'Cold' },
  };
  const s = styles[tier as keyof typeof styles] ?? styles.cold;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.color }}>
      <TierIcon tier={tier} />
      {s.label}
    </span>
  );
}

export function LeadScoringClient({ eventSlug, eventName, leads: dbLeads }: Props) {
  const leads = dbLeads.length > 0 ? dbLeads : DEMO_LEADS;
  const [filter, setFilter] = useState<Tier>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: leads.length,
    hot: leads.filter((l: Lead) => l.tier === 'hot').length,
    warm: leads.filter((l: Lead) => l.tier === 'warm').length,
    cold: leads.filter((l: Lead) => l.tier === 'cold').length,
    uncontacted: leads.filter((l: Lead) => !l.contacted).length,
  }), [leads]);

  const filtered = useMemo(() => {
    if (filter === 'all') return leads;
    if (filter === 'uncontacted') return leads.filter((l: Lead) => !l.contacted);
    return leads.filter((l: Lead) => l.tier === filter);
  }, [leads, filter]);

  const hotCount = counts.hot;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0A1812 0%, #0F2518 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 h-14 border-b"
        style={{ background: 'rgba(10,24,18,0.92)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <Link href={`/e/${eventSlug}/booth`} className="flex items-center gap-2 text-[13px] transition hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft size={15} /> Booth
        </Link>
        <span className="font-display font-semibold text-[15px]" style={{ color: '#FAF6EE' }}>Leads</span>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-80"
          style={{ background: 'rgba(232,197,126,0.12)', color: '#E8C57E', border: '1px solid rgba(232,197,126,0.2)' }}>
          <Download size={12} /> Export
        </button>
      </div>

      {/* Title block */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display font-bold text-[22px] mb-1" style={{ color: '#FAF6EE', letterSpacing: '-0.02em' }}>
          Leads — scored by Eventera AI
        </h1>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {leads.length} captured · ranked by role seniority, intent signals, dwell time & session overlap
        </p>
      </div>

      {/* AI assistant bar */}
      {hotCount > 0 && (
        <div className="mx-5 mb-4 rounded-2xl p-4 flex items-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(232,197,126,0.12) 0%, rgba(31,77,58,0.2) 100%)', border: '1px solid rgba(232,197,126,0.2)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(232,197,126,0.2)' }}>
            <Flame size={16} style={{ color: '#E8C57E' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: '#E8C57E' }}>
              {hotCount} hot leads awaiting follow-up
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Eventera AI drafted follow-up emails — review &amp; send
            </p>
          </div>
          <button className="px-3 py-1.5 rounded-xl text-[12px] font-semibold transition hover:opacity-80 shrink-0"
            style={{ background: '#E8C57E', color: '#0F1F18' }}>
            Review
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {([
          { key: 'all', label: `All ${counts.all}` },
          { key: 'hot', label: `🔥 Hot ${counts.hot}` },
          { key: 'warm', label: `⚡ Warm ${counts.warm}` },
          { key: 'cold', label: `❄ Cold ${counts.cold}` },
          { key: 'uncontacted', label: `Not contacted ${counts.uncontacted}` },
        ] as { key: Tier; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition shrink-0"
            style={{
              background: filter === f.key ? '#E8C57E' : 'rgba(255,255,255,0.06)',
              color: filter === f.key ? '#0F1F18' : 'rgba(255,255,255,0.55)',
              border: `1px solid ${filter === f.key ? '#E8C57E' : 'rgba(255,255,255,0.08)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lead rows */}
      <div className="px-5 pb-8 flex flex-col gap-2">
        {filtered.map((lead: Lead) => {
          const expanded = expandedId === lead.id;
          return (
            <div key={lead.id} className="rounded-2xl overflow-hidden transition cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${lead.tier === 'hot' ? 'rgba(232,197,126,0.15)' : 'rgba(255,255,255,0.06)'}` }}
              onClick={() => setExpandedId(expanded ? null : lead.id)}>

              <div className="flex items-center gap-3 p-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[14px] shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', color: '#FAF6EE' }}>
                  {lead.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[14px] truncate" style={{ color: '#FAF6EE' }}>{lead.name}</span>
                    <TierBadge tier={lead.tier} />
                    {lead.contacted && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
                        Contacted
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {lead.role} · {lead.company}
                  </div>
                  {!expanded && (
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{lead.reason}</div>
                  )}
                </div>

                {/* Score ring */}
                <div className="flex items-center gap-2">
                  <ScoreRing score={lead.score} tier={lead.tier} />
                  <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </div>
              </div>

              {/* Expanded */}
              {expanded && (
                <div className="px-4 pb-4 pt-0" onClick={e => e.stopPropagation()}>
                  <div className="pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-[12px] mb-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Why this score: </span>
                      {lead.reason}
                    </p>
                    {lead.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {lead.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-80"
                        style={{ background: lead.tier === 'hot' ? '#E8C57E' : 'rgba(255,255,255,0.08)', color: lead.tier === 'hot' ? '#0F1F18' : '#FAF6EE' }}>
                        <Mail size={13} /> Send email
                      </button>
                      <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-80"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>
                        <Phone size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl py-16 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No leads in this category</p>
          </div>
        )}
      </div>

      {/* Event label */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-[11px] font-semibold tracking-widest uppercase"
        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, system-ui, sans-serif', backdropFilter: 'blur(8px)' }}>
        {eventName}
      </div>
    </div>
  );
}
