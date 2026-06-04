'use client';

import { IdCard, Share2, Network, Sparkles, Palette, Plus } from 'lucide-react';
import Link from 'next/link';

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  totalCards: number;
  sharedCards: number;
}

const VARIANTS = [
  { label: 'Attendee', count: null, active: true  },
  { label: 'Speaker',  count: null, active: false },
  { label: 'Sponsor',  count: null, active: false },
  { label: 'VIP',      count: null, active: false },
];

const SHARE_CHANNELS = [
  { name: 'Instagram', pct: 39, color: '#1F4D3A' },
  { name: 'WhatsApp',  pct: 32, color: '#2A6A50' },
  { name: 'LinkedIn',  pct: 19, color: '#E8C57E' },
  { name: 'X',         pct: 10, color: '#8BA89A' },
];

export function KartaCardView({ eventId, eventName, totalCards, sharedCards }: Props) {
  const reach = sharedCards > 0 ? (sharedCards * 189).toLocaleString() : '—';

  return (
    <div className="max-w-[1100px] mx-auto px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Karta Card
          </h1>
          <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
            The personalized card every attendee gets
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={`/e/${eventId}`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
            style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
          >
            <Sparkles size={13} strokeWidth={2} />
            Preview as attendee
          </Link>
          <Link
            href={`/events/${eventId}/edit`}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <Palette size={13} strokeWidth={2} />
            Edit design
          </Link>
        </div>
      </div>

      {/* Promo banner */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-7 text-[13px]"
        style={{ background: 'rgba(232,197,126,0.12)', border: '1px solid rgba(232,197,126,0.4)' }}
      >
        <Sparkles size={14} strokeWidth={2} style={{ color: '#C9A45E', flexShrink: 0 }} />
        <span style={{ color: '#3A4A42' }}>
          The Karta Card is standard on every plan — no other event platform has this.
        </span>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">

        {/* Left: card preview */}
        <div>
          <MiniCard eventName={eventName} />
        </div>

        {/* Right: stats + panels */}
        <div className="space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              label="Cards generated"
              value={totalCards.toLocaleString()}
              sub="total"
              icon={<IdCard size={15} strokeWidth={2} />}
            />
            <StatCard
              label="Shared"
              value={sharedCards.toLocaleString()}
              sub={totalCards > 0 ? `${Math.round((sharedCards / totalCards) * 100)}% rate` : '—'}
              icon={<Share2 size={15} strokeWidth={2} />}
            />
            <StatCard
              label="Est. reach"
              value={reach}
              sub="at 189 avg/share"
              icon={<Network size={15} strokeWidth={2} />}
              accent
            />
          </div>

          {/* Card variants */}
          <Panel title="Card variants" action={
            <button
              className="inline-flex items-center gap-1 text-[12px] font-medium h-7 px-2.5 rounded-lg transition"
              style={{ color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}
            >
              <Plus size={12} strokeWidth={2.5} />
              New variant
            </button>
          }>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {VARIANTS.map(v => (
                <div
                  key={v.label}
                  className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{
                    border: v.active ? '1px solid rgba(31,77,58,0.4)' : '1px solid #E5E0D4',
                    background: v.active ? 'rgba(31,77,58,0.04)' : 'white',
                  }}
                >
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(31,77,58,0.08)' }}
                  >
                    <IdCard size={15} strokeWidth={2} style={{ color: '#1F4D3A' }} />
                  </div>
                  <span className="text-[13.5px] font-medium flex-1" style={{ color: '#0F1F18' }}>{v.label}</span>
                  <span className="text-[12px] font-mono" style={{ color: '#6B7A72' }}>
                    {v.count ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Where cards are shared */}
          <Panel title="Where cards are shared">
            {sharedCards === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: '#6B7A72' }}>
                No cards shared yet. They appear here once attendees start sharing.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-5 items-center">
                <DonutChart total={sharedCards} channels={SHARE_CHANNELS} />
                <div className="space-y-3">
                  {SHARE_CHANNELS.map(ch => (
                    <div key={ch.name} className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ch.color }} />
                      <span className="text-[13px] flex-1" style={{ color: '#0F1F18' }}>{ch.name}</span>
                      <span className="text-[12px] font-mono" style={{ color: '#6B7A72' }}>{ch.pct}%</span>
                    </div>
                  ))}
                  <p className="text-[12px] pt-2" style={{ color: '#6B7A72' }}>
                    <span className="font-medium" style={{ color: '#1F4D3A' }}>189 avg reach</span> per card shared
                  </p>
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function MiniCard({ eventName }: { eventName: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        width: '100%', maxWidth: 260,
        background: 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 55%, #2A6A50 100%)',
        boxShadow: '0 4px 12px rgba(15,31,24,0.12), 0 24px 60px rgba(31,77,58,0.16)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div
          className="h-6 w-6 rounded-md"
          style={{ background: 'linear-gradient(135deg, #E8C57E, #C9A45E)' }}
        />
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {eventName.toUpperCase().slice(0, 20)}
        </span>
      </div>
      {/* Body */}
      <div className="px-4 py-5">
        <div
          className="h-14 w-14 rounded-full mb-4 flex items-center justify-center"
          style={{ background: 'rgba(232,197,126,0.2)', border: '2px solid rgba(232,197,126,0.4)' }}
        >
          <span className="text-[18px] font-bold" style={{ color: '#E8C57E' }}>K</span>
        </div>
        <p className="text-[20px] font-bold leading-tight" style={{ color: 'white' }}>Kwame Mensah</p>
        <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Product Engineer · Paystack</p>
        <p className="text-[11px] mt-4 font-mono tracking-widest" style={{ color: 'rgba(232,197,126,0.7)' }}>
          12 MAR · LAGOS
        </p>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon, accent,
}: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: accent ? 'rgba(31,77,58,0.06)' : 'white',
        border: accent ? '1px solid rgba(31,77,58,0.2)' : '1px solid #E5E0D4',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium" style={{ color: '#6B7A72', letterSpacing: '0.03em' }}>{label}</span>
        <span style={{ color: accent ? '#1F4D3A' : '#6B7A72' }}>{icon}</span>
      </div>
      <p className="text-[26px] font-bold leading-none" style={{ color: accent ? '#1F4D3A' : '#0F1F18' }}>{value}</p>
      {sub && <p className="text-[12px] mt-1.5" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <h3 className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function DonutChart({ total, channels }: { total: number; channels: typeof SHARE_CHANNELS }) {
  const size = 140;
  const r = 52;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {channels.map(ch => {
          const dash = (ch.pct / 100) * circ;
          const gap = circ - dash;
          const el = (
            <circle
              key={ch.name}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={ch.color}
              strokeWidth={18}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-bold" style={{ color: '#0F1F18' }}>{total}</span>
        <span className="text-[10px] font-mono" style={{ color: '#6B7A72', letterSpacing: '0.06em' }}>SHARES</span>
      </div>
    </div>
  );
}
