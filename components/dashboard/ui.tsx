'use client';

import React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Search, ChevronDown } from 'lucide-react';

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export function PageShell({ title, subtitle, actions, children, maxWidth = '1100px' }: PageShellProps) {
  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div style={{ maxWidth, marginLeft: 'auto', marginRight: 'auto', padding: '32px' }}>
        <div className="flex items-start justify-between gap-4 mb-7 flex-wrap">
          <div>
            <h1
              className="font-display font-semibold"
              style={{ fontSize: 24, color: '#1F4D3A', letterSpacing: '-0.02em', margin: 0 }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ color: '#3A4A42', fontSize: 14, marginTop: 2 }}>{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Btn ─────────────────────────────────────────────────────────────────────

interface BtnProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'ghost' | 'accent' | 'soft';
  onClick?: () => void;
  href?: string;
  className?: string;
  type?: 'button' | 'submit';
}

export function Btn({ children, icon: Icon, variant = 'ghost', onClick, href, className = '', type = 'button' }: BtnProps) {
  const base = 'inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap cursor-pointer';
  const variants: Record<string, string> = {
    primary: 'bg-[#1F4D3A] text-[#FAF6EE] hover:bg-[#163828]',
    ghost:   'border border-[#E5E0D4] text-[#6B7A72] hover:border-[#1F4D3A]/40 hover:text-[#1F4D3A]',
    accent:  'bg-[#E8C57E] text-[#163828] hover:bg-[#C9A45E] font-semibold',
    soft:    'bg-[#E8EFEB] text-[#1F4D3A] hover:bg-[#E8EFEB]/70',
  };
  const cls = `${base} ${variants[variant]} ${className}`;
  const content = (
    <>
      {Icon && <Icon size={14} strokeWidth={1.8} />}
      {children}
    </>
  );
  if (href) return <Link href={href} className={cls}>{content}</Link>;
  return <button type={type} onClick={onClick} className={cls}>{content}</button>;
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardItem {
  value: string | number;
  label: string;
  delta?: string;
  deltaUp?: boolean;
  icon?: LucideIcon;
  accent?: boolean;
}

export function StatCard({ value, label, delta, deltaUp = true, icon: Icon, accent }: StatCardItem) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={accent
        ? { borderColor: 'rgba(232,197,126,0.5)', background: 'linear-gradient(135deg,rgba(232,197,126,0.1),rgba(31,77,58,0.05))' }
        : { borderColor: '#E5E0D4', background: 'white' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="font-mono uppercase tracking-[0.14em]"
          style={{ fontSize: 9.5, color: '#6B7A72' }}
        >
          {label}
        </span>
        {Icon && (
          <span
            className="h-7 w-7 rounded-lg grid place-items-center"
            style={{ background: accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB' }}
          >
            <Icon size={13} strokeWidth={1.8} color={accent ? '#C9A45E' : '#1F4D3A'} />
          </span>
        )}
      </div>
      <div
        className="font-mono tracking-tight"
        style={{ fontSize: 26, color: '#1F4D3A', lineHeight: 1 }}
      >
        {value}
      </div>
      {delta && (
        <div
          className="flex items-center gap-1 mt-2 font-mono"
          style={{ fontSize: 11, color: deltaUp ? '#2D7A4F' : '#B8423C' }}
        >
          {deltaUp ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
          {delta}
        </div>
      )}
    </div>
  );
}

export function StatCards({ items, cols = 4 }: { items: StatCardItem[]; cols?: number }) {
  return (
    <div
      className="grid gap-4 mb-7"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((item, i) => <StatCard key={i} {...item} />)}
    </div>
  );
}

// ─── StatStrip ───────────────────────────────────────────────────────────────

interface StatStripItem { value: string | number; label: string }

export function StatStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div
      className="bg-white border rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2"
      style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-5">
          <div>
            <span className="font-mono" style={{ fontSize: 19, color: '#1F4D3A', letterSpacing: '-0.01em' }}>
              {item.value}
            </span>
            <span className="ml-2" style={{ fontSize: 13, color: '#3A4A42' }}>{item.label}</span>
          </div>
          {i < items.length - 1 && <span style={{ color: '#E5E0D4' }}>·</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Pill ────────────────────────────────────────────────────────────────────

interface PillProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'green' | 'amber' | 'gold' | 'forest' | 'red';
  dot?: string;
  className?: string;
}

const PILL_STYLES: Record<string, React.CSSProperties> = {
  neutral: { background: 'rgba(15,31,24,0.05)', color: '#3A4A42', border: '1px solid #E5E0D4' },
  green:   { background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
  amber:   { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' },
  gold:    { background: 'rgba(232,197,126,0.2)', color: '#C9A45E', border: '1px solid rgba(232,197,126,0.4)' },
  forest:  { background: '#E8EFEB', color: '#1F4D3A', border: '1px solid rgba(31,77,58,0.2)' },
  red:     { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' },
};

export function Pill({ children, tone = 'neutral', dot, className = '' }: PillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full ${className}`}
      style={{ fontSize: 11, ...PILL_STYLES[tone] }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />}
      {children}
    </span>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

const GRAD_PRESETS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#163828,#1F4D3A)',
  'linear-gradient(135deg,#1F4D3A,#E8C57E)',
  'linear-gradient(135deg,#2A6A50,#E8C57E)',
  'linear-gradient(135deg,#3A6B8C,#1F4D3A)',
];

export function Avatar({ initials, grad, size = 32 }: { initials: string; grad?: string; size?: number }) {
  const bg = grad ?? GRAD_PRESETS[initials.charCodeAt(0) % GRAD_PRESETS.length];
  return (
    <div
      className="rounded-full grid place-items-center shrink-0 font-bold"
      style={{ width: size, height: size, background: bg, color: '#FAF6EE', fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────────────────────

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-2xl overflow-hidden overflow-x-auto" style={{ borderColor: '#E5E0D4' }}>
      <table className="w-full">
        <thead>
          <tr style={{ background: 'rgba(250,246,238,0.6)' }}>
            {head.map((h, i) => (
              <th
                key={i}
                className="font-mono uppercase text-left px-4 py-3"
                style={{ fontSize: 9.5, letterSpacing: '0.16em', color: '#6B7A72', borderBottom: '1px solid rgba(229,224,212,0.6)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return (
    <tr className="hover:bg-[#FAF6EE]/40 transition-colors" style={{ borderTop: '1px solid rgba(229,224,212,0.6)' }}>
      {children}
    </tr>
  );
}

export function Cell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-[13px] text-[#3A4A42] ${className}`}>{children}</td>;
}

// ─── Panel ───────────────────────────────────────────────────────────────────

interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: string;
}

export function Panel({ title, action, children, className = '', pad = 'p-5' }: PanelProps) {
  return (
    <div className={`bg-white border rounded-2xl ${className}`} style={{ borderColor: '#E5E0D4' }}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
          {title && (
            <span className="font-display font-semibold" style={{ fontSize: 14, color: '#0F1F18' }}>{title}</span>
          )}
          {action}
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{ width: 36, height: 20, background: on ? '#1F4D3A' : 'rgba(15,31,24,0.15)' }}
    >
      <span
        className="absolute top-1 rounded-full bg-white shadow transition-all"
        style={{ width: 16, height: 16, left: on ? 'calc(100% - 20px)' : 4 }}
      />
    </button>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

export function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`font-mono uppercase mb-3 ${className}`}
      style={{ fontSize: 10, letterSpacing: '0.2em', color: '#6B7A72' }}
    >
      {children}
    </div>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  cta?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, body, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl grid place-items-center mb-5"
        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
      >
        <Icon size={26} strokeWidth={1.6} />
      </div>
      <div className="font-display font-semibold" style={{ fontSize: 18, color: '#0F1F18' }}>{title}</div>
      {body && <p className="mt-2 max-w-[360px]" style={{ fontSize: 14, color: '#3A4A42', lineHeight: 1.6 }}>{body}</p>}
      {cta && <div className="mt-6">{cta}</div>}
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}

export function Field({ label, value, placeholder, mono, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <div className="font-mono uppercase mb-1.5" style={{ fontSize: 9.5, color: '#6B7A72' }}>{label}</div>
      <div
        className="px-3 py-2 rounded-lg border"
        style={{
          background: 'white',
          borderColor: '#E5E0D4',
          fontSize: 13,
          color: value ? '#0F1F18' : '#6B7A72',
          fontFamily: mono ? 'JetBrains Mono, monospace' : undefined,
        }}
      >
        {value ?? placeholder ?? '—'}
      </div>
    </div>
  );
}

// ─── SearchBox ───────────────────────────────────────────────────────────────

export function SearchBox({ placeholder = 'Search…', maxWidth = '320px' }: { placeholder?: string; maxWidth?: string }) {
  return (
    <div className="relative" style={{ maxWidth }}>
      <Search
        size={13}
        strokeWidth={2}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        color="#6B7A72"
      />
      <input
        type="search"
        placeholder={placeholder}
        className="w-full h-9 pl-8 pr-3 rounded-lg border text-[13px] outline-none transition focus:border-[#1F4D3A]/40"
        style={{ background: 'white', borderColor: '#E5E0D4', color: '#6B7A72' }}
      />
    </div>
  );
}

// ─── FilterBtn ───────────────────────────────────────────────────────────────

export function FilterBtn({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="h-9 px-3 border bg-white rounded-lg flex items-center gap-1.5 transition hover:border-[#1F4D3A]/40"
      style={{ fontSize: 12.5, color: '#3A4A42', borderColor: '#E5E0D4' }}
    >
      {children}
      <ChevronDown size={12} strokeWidth={2} color="#6B7A72" />
    </button>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

export function Toolbar({ children, search }: { children?: React.ReactNode; search?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
      <SearchBox placeholder={search ?? 'Search…'} />
      {children}
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

interface TabItem { id: string; label: string }

interface TabsProps {
  tabs: string[] | TabItem[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  const items: TabItem[] = (tabs as (string | TabItem)[]).map(t =>
    typeof t === 'string' ? { id: t, label: t } : t
  );
  return (
    <div className="flex border-b mb-5" style={{ borderColor: '#E5E0D4' }}>
      {items.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-4 py-2.5 text-[13px] font-medium relative transition-colors"
          style={{
            color: active === tab.id ? '#1F4D3A' : '#6B7A72',
            borderBottom: active === tab.id ? '2px solid #1F4D3A' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── SegTabs ─────────────────────────────────────────────────────────────────

export function SegTabs({ tabs, active, onChange }: TabsProps) {
  const items: TabItem[] = (tabs as (string | TabItem)[]).map(t =>
    typeof t === 'string' ? { id: t, label: t } : t
  );
  return (
    <div
      className="inline-flex rounded-lg p-0.5 mb-5"
      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
    >
      {items.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-3.5 py-1.5 rounded-md text-[12.5px] font-medium transition-colors"
          style={active === tab.id
            ? { background: '#1F4D3A', color: '#FAF6EE' }
            : { color: '#3A4A42' }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── BarsChart ───────────────────────────────────────────────────────────────

interface BarItem { label: string; value: number; color?: string; dim?: boolean }

export function BarsChart({ data, height = 180, unit = '', color = '#1F4D3A' }: { data: BarItem[]; height?: number; unit?: string; color?: string }) {
  if (data.length === 0) return <div className="h-[180px] flex items-center justify-center text-[13px] text-[#6B7A72]">No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.max(8, Math.min(40, Math.floor(560 / data.length) - 8));
  const chartH = height - 32;
  const totalW = data.length * (barW + 8);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${Math.max(560, totalW)} ${height}`} style={{ width: '100%', height }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={0} y1={t * chartH} x2={Math.max(560, totalW)} y2={t * chartH} stroke="#E5E0D4" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const bh = Math.max(2, (d.value / max) * chartH);
          const x = i * (barW + 8) + 4;
          const y = chartH - bh;
          const c = d.color ?? color;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={bh} fill={d.dim ? '#E8EFEB' : c} rx={3} />
              <text x={x + barW / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
                {d.label}
              </text>
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#1F4D3A" fontFamily="JetBrains Mono, monospace">
                  {d.value}{unit}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── AreaChart ───────────────────────────────────────────────────────────────

interface AreaPoint { label: string; v: number }

export function AreaChart({ points, height = 170, color = '#1F4D3A' }: { points: AreaPoint[]; height?: number; color?: string }) {
  if (points.length < 2) return <div style={{ height }} className="flex items-center justify-center text-[13px] text-[#6B7A72]">Not enough data</div>;
  const W = 560;
  const H = height - 28;
  const max = Math.max(...points.map(p => p.v), 1);
  const pts = points.map((p, i) => ({
    x: (i / (points.length - 1)) * W,
    y: H - (p.v / max) * (H - 10) - 5,
    label: p.label,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${W},${H} L0,${H} Z`;
  const gradId = `area-${color.replace('#', '')}`;
  const labelIdxs = [0, Math.floor(points.length / 3), Math.floor((2 * points.length) / 3), points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.2, 0.5, 0.8].map(t => (
        <line key={t} x1={0} y1={t * H} x2={W} y2={t * H} stroke="#E5E0D4" strokeWidth={1} />
      ))}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      {labelIdxs.map(i => (
        <text key={i} x={pts[i].x} y={height - 6} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'} fontSize={9} fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
          {pts[i].label}
        </text>
      ))}
    </svg>
  );
}

// ─── Donut ───────────────────────────────────────────────────────────────────

interface DonutSegment { label: string; value: number; color: string }

export function Donut({ segments, size = 150, thickness = 22, centerLabel, centerSub }: { segments: DonutSegment[]; size?: number; thickness?: number; centerLabel?: string; centerSub?: string }) {
  const r = 15.91;
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  let cumPct = 0;
  return (
    <div style={{ width: size, height: size }}>
      <svg viewBox="0 0 42 42" style={{ width: size, height: size }}>
        <circle cx="21" cy="21" r={r} fill="none" stroke="#E5E0D4" strokeWidth={(thickness / size) * 42} />
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const offset = -(cumPct - 25);
          cumPct += pct;
          return (
            <circle
              key={i}
              cx="21" cy="21" r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={(thickness / size) * 42}
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeDashoffset={offset}
            />
          );
        })}
        {centerLabel && (
          <>
            <text x="21" y="19.5" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="6" fill="#0F1F18">{centerLabel}</text>
            {centerSub && <text x="21" y="23.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="2.4" fill="#6B7A72">{centerSub}</text>}
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────────────────────────

interface FunnelStep { label: string; value: number; icon?: LucideIcon; color?: string }

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const max = Math.max(...steps.map(s => s.value), 1);
  return (
    <div className="space-y-4">
      {steps.map((step, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1.5" style={{ fontSize: 12.5, color: '#3A4A42' }}>
            <div className="flex items-center gap-2">
              {step.icon && <step.icon size={13} strokeWidth={1.8} color="#6B7A72" />}
              <span>{step.label}</span>
            </div>
            <span className="font-mono font-semibold" style={{ fontSize: 13, color: '#0F1F18' }}>
              {step.value.toLocaleString()}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(step.value / max) * 100}%`, background: step.color ?? '#1F4D3A', transition: 'width 0.5s ease' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

export function ProgressBar({ pct, color = '#1F4D3A', height = 8, track = '#E8EFEB' }: { pct: number; color?: string; height?: number; track?: string }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ height, background: track }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color, transition: 'width 0.5s ease' }}
      />
    </div>
  );
}

// ─── GateNotice ──────────────────────────────────────────────────────────────

interface GateNoticeProps {
  featureLabel: string;
  planLabel: string;
  onUpgrade?: () => void;
}

export function GateNotice({ featureLabel, planLabel, onUpgrade }: GateNoticeProps) {
  return (
    <div
      className="rounded-2xl border px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap"
      style={{ background: 'rgba(232,197,126,0.08)', borderColor: 'rgba(232,197,126,0.4)' }}
    >
      <div>
        <div className="font-display font-semibold" style={{ fontSize: 14, color: '#163828' }}>
          {featureLabel} requires {planLabel}
        </div>
        <p style={{ fontSize: 13, color: '#3A4A42', marginTop: 2 }}>
          Upgrade to unlock this feature and more.
        </p>
      </div>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[13px] transition"
          style={{ background: '#E8C57E', color: '#163828' }}
        >
          Upgrade to {planLabel}
        </button>
      )}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#FAF6EE' }}>
      <div
        className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: '#E8EFEB', borderTopColor: '#1F4D3A' }}
      />
    </div>
  );
}
