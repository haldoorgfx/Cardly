'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

interface Source { name: string; count: number; pct: number; }
interface Props {
  eventId: string;
  eventName: string;
  publicSlug: string;
  sources: Source[];
  total: number;
}

const SOURCE_COLORS: Record<string, string> = {
  card:        '#E8C57E',
  feed:        '#1F4D3A',
  instagram:   '#2A6A50',
  whatsapp:    '#8FC3A0',
  direct:      '#6B7A72',
  embed:       '#C9C3B1',
  newsletter:  '#3A6B8C',
  twitter:     '#3A6B8C',
  linkedin:    '#2A5A8A',
  facebook:    '#3A5A9A',
};

function sourceColor(name: string) {
  return SOURCE_COLORS[name.toLowerCase()] ?? '#C9C3B1';
}

function sourceDisplay(name: string) {
  const map: Record<string, string> = {
    card: 'Eventera Card shares',
    feed: 'Marketplace feed',
    direct: 'Direct / typed',
    embed: 'Embed widget',
    newsletter: 'Partner newsletter',
  };
  return map[name] ?? name.charAt(0).toUpperCase() + name.slice(1);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12.5px] font-medium transition hover:opacity-80"
      style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

const BASE = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/e`;

export function SourceAnalyticsClient({ eventName, publicSlug, sources, total }: Props) {
  const cardRegs = sources.find(s => s.name === 'card');
  const [exported, setExported] = useState(false);

  function exportCsv() {
    if (sources.length === 0) return;
    const headers = ['Source', 'Registrations', 'Percentage'];
    const rows = sources.map(s => [sourceDisplay(s.name), String(s.count), `${s.pct}%`]);
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const slug = eventName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventera-sources-${slug || 'event'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  }

  const trackedLinks = [
    { label: 'Instagram bio link',  url: `${BASE}/${publicSlug}?src=instagram&utm_campaign=launch` },
    { label: 'Partner newsletter',  url: `${BASE}/${publicSlug}?src=newsletter&utm_source=partner` },
    { label: 'WhatsApp broadcast',  url: `${BASE}/${publicSlug}?src=whatsapp` },
    { label: 'LinkedIn post',       url: `${BASE}/${publicSlug}?src=linkedin&utm_campaign=organic` },
    { label: 'Facebook event',      url: `${BASE}/${publicSlug}?src=facebook` },
  ];

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Insights"
        title="Registrations by source"
        subtitle={<>Where your attendees are coming from — <span className="font-medium" style={{ color: '#0F1F18' }}>{eventName}</span></>}
        actions={
          <button
            onClick={exportCsv}
            disabled={sources.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium border transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderColor: '#E5E0D4', color: exported ? '#2D7A4F' : '#3A4A42' }}>
            {exported ? <Check size={14} /> : <Download size={14} />} {exported ? 'Exported' : 'Export CSV'}
          </button>
        }
      />

      {/* Hero card (Eventera Card metric) */}
      {cardRegs && cardRegs.count > 0 && (
        <div className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}>
          <div className="relative z-10">
            <p className="text-[12px] font-medium mb-1 opacity-75" style={{ color: '#FAF6EE', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.1em' }}>
              FROM SHARED EVENTERA CARDS
            </p>
            <p className="font-display font-bold text-[36px]" style={{ color: '#E8C57E', letterSpacing: '-0.02em' }}>
              {cardRegs.count} regs · {cardRegs.pct}%
            </p>
            <p className="text-[14px] mt-2 max-w-lg" style={{ color: 'rgba(250,246,238,0.85)' }}>
              Every shared card carries <code className="px-1 rounded text-[12px]" style={{ background: 'rgba(232,197,126,0.2)', color: '#E8C57E' }}>?src=card</code> — when someone registers through a friend&#39;s card, it&#39;s counted here. <strong style={{ color: '#FAF6EE' }}>The card is your top organic channel.</strong>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Sources table */}
        <div className="rounded-2xl p-6" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
          <h2 className="font-display font-semibold text-[16px] mb-5" style={{ color: '#0F1F18' }}>
            All sources · {total} registrations
          </h2>

          {sources.length === 0 ? (
            <div className="py-10 text-center" style={{ color: '#6B7A72' }}>
              <p className="text-[14px]">No registrations yet. Share your event to start tracking sources.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sources.map(s => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-40 shrink-0">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: sourceColor(s.name) }} />
                    <span className="text-[13px] truncate" style={{ color: '#0F1F18' }}>{sourceDisplay(s.name)}</span>
                  </div>
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: '#F0EDE6' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: sourceColor(s.name) }} />
                  </div>
                  <span className="text-[13px] font-semibold w-8 text-right shrink-0" style={{ color: '#0F1F18' }}>{s.count}</span>
                  <span className="text-[12px] w-9 text-right shrink-0" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Auto-tagged sources note */}
          <div className="mt-5 pt-4 text-[12px]" style={{ borderTop: '1px solid #F0EDE6', color: '#6B7A72' }}>
            <span className="font-medium" style={{ color: '#3A4A42' }}>Auto-tagged:</span> <code style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>src=card</code> on every shared Eventera Card · <code style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>src=embed</code> on widgets · <code style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>src=feed</code> from the marketplace.
          </div>
        </div>

        {/* Build a tracked link */}
        <div className="rounded-2xl p-6" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
          <h2 className="font-display font-semibold text-[16px] mb-4" style={{ color: '#0F1F18' }}>
            Build a tracked link
          </h2>
          <p className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>
            Share these links to see exactly where your registrations come from.
          </p>
          <div className="space-y-4">
            {trackedLinks.map(link => (
              <div key={link.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium" style={{ color: '#3A4A42' }}>{link.label}</span>
                  <CopyButton text={link.url} />
                </div>
                <div className="px-3 py-2 rounded-lg text-[12.5px] break-all" style={{ background: '#F0EDE6', color: '#3A4A42', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {link.url.replace(BASE + '/', '').split('?').map((part, i) => (
                    i === 0
                      ? <span key={i} style={{ color: '#0F1F18' }}>{BASE}/{part}?</span>
                      : <span key={i} style={{ color: '#E8C57E' }}>{part}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
