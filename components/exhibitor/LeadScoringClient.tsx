'use client';

import { useState, useMemo } from 'react';
import { ArrowLeft, Download, Flame, Zap, Snowflake, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Lead = any;

type Tier = 'all' | 'hot' | 'warm' | 'cold' | 'uncontacted';

interface Props {
  eventSlug: string;
  eventName: string;
  leads: Lead[];
}

function exportCSV(leads: Lead[]) {
  const headers = ['Name', 'Role', 'Company', 'Score', 'Tier', 'Reason', 'Contacted'];
  const rows = leads.map((l: Lead) => [
    l.name ?? '',
    l.role ?? '',
    l.company ?? '',
    l.score ?? '',
    l.tier ?? '',
    l.reason ?? '',
    l.contacted ? 'Yes' : 'No',
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leads.csv'; a.click();
  URL.revokeObjectURL(url);
}

function ScoreRing({ score, tier }: { score: number; tier: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  // Rating semantics (align with the rest of the design system):
  // hot = danger, warm = warning, cold = info/muted.
  const color = tier === 'hot' ? '#D96A63' : tier === 'warm' ? '#D99A4E' : 'rgba(255,255,255,0.35)';

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
  if (tier === 'hot') return <Flame size={12} style={{ color: '#D96A63' }} />;
  if (tier === 'warm') return <Zap size={12} style={{ color: '#D99A4E' }} />;
  return <Snowflake size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />;
}

function TierBadge({ tier }: { tier: string }) {
  const styles = {
    hot: { bg: 'rgba(184,66,60,0.18)', color: '#D96A63', label: 'Hot' },
    warm: { bg: 'rgba(201,122,45,0.18)', color: '#D99A4E', label: 'Warm' },
    cold: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', label: 'Cold' },
  };
  const s = styles[tier as keyof typeof styles] ?? styles.cold;
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
      style={{ background: s.bg, color: s.color }}>
      <TierIcon tier={tier} />
      {s.label}
    </span>
  );
}

export function LeadScoringClient({ eventSlug, eventName, leads: dbLeads }: Props) {
  const leads = dbLeads;
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
        <button
          onClick={() => exportCSV(leads)}
          disabled={leads.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
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
              {hotCount} hot {hotCount === 1 ? 'lead' : 'leads'} awaiting follow-up
            </p>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your highest-intent contacts — reach out first
            </p>
          </div>
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
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${lead.tier === 'hot' ? 'rgba(184,66,60,0.22)' : 'rgba(255,255,255,0.06)'}` }}
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
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}>
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
                      <div className="flex flex-wrap gap-1.5">
                        {lead.tags.map((tag: string) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[11px]"
                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl py-16 text-center px-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {leads.length === 0 ? (
              <>
                <p className="text-[15px] font-medium mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>No leads captured yet</p>
                <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Leads appear here as attendees scan your booth or share their card.
                </p>
              </>
            ) : (
              <p className="text-[15px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>No leads in this category</p>
            )}
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
