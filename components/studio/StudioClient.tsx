'use client';

import { useState } from 'react';
import {
  ChevronLeft, Undo2, Redo2, Copy, Eye, Play, Globe,
  LayoutGrid, LayoutTemplate, Palette, Image as ImageIcon, Plus,
  Type, ScanLine, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Lock, Upload, Check, HelpCircle,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */
type RailTool = 'elements' | 'templates' | 'brand' | 'background';
type LayerId = string | null;

interface TextStyle {
  font: 'DM' | 'Inter' | 'JetBrains';
  weight: 300 | 400 | 600 | 700;
  size: number;
  align: 'left' | 'center' | 'right' | 'justify';
  transform: 'none' | 'uppercase' | 'lowercase';
  color: string;
  required: boolean;
  maxChars: number;
}

const FONTS: Record<string, string> = {
  DM: '"DM Sans", sans-serif',
  Inter: 'Inter, sans-serif',
  JetBrains: 'Inter, system-ui, sans-serif',
};
const CANVAS_W = 4500;
const CANVAS_H = 5625;
const SCALE = 0.084;
const PREVIEW_W = Math.round(CANVAS_W * SCALE);
const PREVIEW_H = Math.round(CANVAS_H * SCALE);

const LAYERS = [
  { id: 'qr', name: 'Quick QR', type: 'image' as const },
  { id: 'title2', name: 'Text field copy', type: 'text' as const },
  { id: 'name', name: 'Full name', type: 'text' as const },
  { id: 'photo', name: 'Photo', type: 'photo' as const },
];

const VARIANTS = [
  { id: 'attendee', label: 'Attendee', count: 4 },
  { id: 'speaker', label: 'Speaker', count: 0 },
  { id: 'vip', label: 'VIP', count: 0 },
  { id: 'sponsor', label: 'Sponsor', count: 0 },
];

const GRADIENTS = [
  'linear-gradient(165deg,#0D1F17,#1F4D3A 70%,#235741)',
  'linear-gradient(150deg,#1F4D3A,#2A6A50 60%,#C9A45E)',
  'linear-gradient(150deg,#163828,#3E7E5E)',
  'linear-gradient(150deg,#122e21,#1F4D3A 70%,#C9A45E)',
  'linear-gradient(150deg,#241733,#5a4a7a)',
  'linear-gradient(150deg,#2b160c,#9a6038)',
];

/* ── Small Controls ────────────────────────────────────────────────── */
function Seg({ options, value, onChange, full }: {
  options: (string | { id: string; label: string })[];
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <div className={`inline-flex bg-[#FAF6EE] border border-[#E5E0D4] rounded-lg p-0.5 ${full ? 'w-full' : ''}`}>
      {options.map(o => {
        const id = typeof o === 'string' ? o : o.id;
        const label = typeof o === 'string' ? o : o.label;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap"
            style={{ background: value === id ? '#1F4D3A' : 'transparent', color: value === id ? '#FAF6EE' : '#6B7A72' }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function IconSeg({ options, value, onChange }: {
  options: [string, React.ReactNode][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex bg-[#FAF6EE] border border-[#E5E0D4] rounded-lg p-0.5 w-full">
      {options.map(([id, icon]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex-1 py-1.5 grid place-items-center rounded-md transition-colors"
          style={{ background: value === id ? '#1F4D3A' : 'transparent', color: value === id ? '#FAF6EE' : '#6B7A72' }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function Slider({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range" min={min} max={max} value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
      style={{ background: `linear-gradient(to right, #1F4D3A ${pct}%, #E8EFEB ${pct}%)` }}
    />
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-9 h-5 rounded-full transition-colors shrink-0"
      style={{ background: on ? '#1F4D3A' : 'rgba(15,31,24,0.15)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: on ? 18 : 2 }}
      />
    </button>
  );
}

function PLabel({ children }: { children: React.ReactNode }) {
  return <div className=" text-[9.5px] tracking-[0.18em] uppercase text-[#6B7A72] mb-2">{children}</div>;
}

/* ── Decorative QR ─────────────────────────────────────────────────── */
function QRBlock({ size = 88 }: { size?: number }) {
  const n = 21;
  const c = size / n;
  const seed = (x: number, y: number) => ((x * 13 + y * 7 + x * y * 3) % 5) > 1;
  const finder = (gx: number, gy: number) => (
    <g key={`f${gx}-${gy}`}>
      <rect x={gx * c} y={gy * c} width={c * 7} height={c * 7} fill="#0F1F18" />
      <rect x={(gx + 1) * c} y={(gy + 1) * c} width={c * 5} height={c * 5} fill="#fff" />
      <rect x={(gx + 2) * c} y={(gy + 2) * c} width={c * 3} height={c * 3} fill="#0F1F18" />
    </g>
  );
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (!inF && seed(x, y)) dots.push(<rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} fill="#0F1F18" />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 4 }}>
      <rect width={size} height={size} rx="4" fill="#fff" />
      {dots}{finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  );
}

/* ── Canvas Card Preview ───────────────────────────────────────────── */
function CardCanvas({ sel, onSelect, ns, bg }: {
  sel: LayerId;
  onSelect: (id: LayerId) => void;
  ns: TextStyle;
  bg: string;
}) {
  const nameStyle: React.CSSProperties = {
    fontFamily: FONTS[ns.font],
    fontWeight: ns.weight,
    fontSize: Math.max(11, ns.size * SCALE),
    textAlign: ns.align,
    textTransform: ns.transform === 'none' ? 'none' : ns.transform,
    color: ns.color,
    lineHeight: 1.1,
  };

  function zone(id: string, style: React.CSSProperties, children: React.ReactNode) {
    const active = sel === id;
    return (
      <div
        key={id}
        onClick={e => { e.stopPropagation(); onSelect(id); }}
        style={{ ...style, position: 'absolute', cursor: 'pointer', outline: active ? '1.5px solid #E8C57E' : 'none', outlineOffset: 2, borderRadius: 2 }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(null)}
      style={{
        width: PREVIEW_W, height: PREVIEW_H,
        background: bg,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(15,31,24,0.4)',
        flexShrink: 0,
      }}
    >
      {/* Dot texture */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(232,197,126,0.08) 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
      {/* Gold accent top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#E8C57E' }} />

      {/* Event label */}
      {zone('evtitle',
        { top: PREVIEW_H * 0.06, left: PREVIEW_W * 0.07, right: PREVIEW_W * 0.07, textAlign: 'center' },
        <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 6, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(232,197,126,0.8)' }}>
          AFRICA TECH FESTIVAL 2026
        </div>
      )}

      {/* Photo zone */}
      {zone('photo',
        { top: PREVIEW_H * 0.14, left: '50%', transform: 'translateX(-50%)', width: 72, height: 72, borderRadius: '50%', background: '#E8C57E', display: 'flex', alignItems: 'center', justifyContent: 'center' },
        <span style={{ fontSize: 24, fontWeight: 700, color: '#1F4D3A' }}>KM</span>
      )}

      {/* Name */}
      {zone('name',
        { top: PREVIEW_H * 0.43, left: PREVIEW_W * 0.06, right: PREVIEW_W * 0.06 },
        <div style={nameStyle}>Kwame Mensah</div>
      )}

      {/* Title2 */}
      {zone('title2',
        { top: PREVIEW_H * 0.54, left: PREVIEW_W * 0.06, right: PREVIEW_W * 0.06 },
        <div style={{ ...nameStyle, fontSize: Math.max(8, ns.size * SCALE * 0.55), color: 'rgba(250,246,238,0.6)' }}>
          Product Engineer · Paystack
        </div>
      )}

      {/* QR */}
      {zone('qr',
        { bottom: PREVIEW_H * 0.08, right: PREVIEW_W * 0.06 },
        <QRBlock size={40} />
      )}

      {/* Bottom bar */}
      <div style={{ position: 'absolute', bottom: PREVIEW_H * 0.04, left: PREVIEW_W * 0.06, right: PREVIEW_W * 0.06 + 52, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 5.5, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#E8C57E' }}>ATTENDEE</span>
        <span style={{ flex: 1, height: 1, background: 'rgba(250,246,238,0.15)' }} />
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 5, color: 'rgba(250,246,238,0.4)' }}>12 MAR</span>
      </div>
    </div>
  );
}

/* ── Left Rail ──────────────────────────────────────────────────────── */
function LeftRail({ tool, setTool }: { tool: RailTool; setTool: (t: RailTool) => void }) {
  const tabs: [RailTool, string, React.ReactNode][] = [
    ['elements', 'Elements', <LayoutGrid key="elements" size={20} strokeWidth={1.8} />],
    ['templates', 'Templates', <LayoutTemplate key="templates" size={20} strokeWidth={1.8} />],
    ['brand', 'Brand', <Palette key="brand" size={20} strokeWidth={1.8} />],
    ['background', 'Background', <ImageIcon key="background" size={20} strokeWidth={1.8} />],
  ];
  return (
    <div style={{ width: 68, background: '#FAF6EE', borderRight: '1px solid #E5E0D4', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, flexShrink: 0 }}>
      {tabs.map(([id, label, icon]) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          className="w-[52px] py-2 rounded-xl flex flex-col items-center gap-1 transition-colors"
          style={{ background: tool === id ? '#E8EFEB' : 'transparent', color: tool === id ? '#1F4D3A' : '#6B7A72' }}
        >
          {icon}
          <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Left Panel ─────────────────────────────────────────────────────── */
function ElementsPanel({ sel, onSelect }: { sel: LayerId; onSelect: (id: LayerId) => void }) {
  const adds = [
    ['Text field', <Type key="text" size={15} strokeWidth={1.8} />],
    ['Photo zone', <ImageIcon key="photo" size={15} strokeWidth={1.8} />],
    ['QR code', <ScanLine key="qr" size={15} strokeWidth={1.8} />],
    ['Static text', <Type key="static" size={15} strokeWidth={1.8} />],
  ];
  return (
    <div>
      <div style={{ padding: 12 }}>
        <PLabel>Add element</PLabel>
        <div style={{ display: 'grid', gap: 8 }}>
          {adds.map(([label, icon]) => (
            <button
              key={label as string}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
              style={{ background: 'rgba(250,246,238,0.4)', border: '1px solid #E5E0D4', color: '#0F1F18' }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 8, background: '#E8EFEB', color: '#1F4D3A', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {icon}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '0 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <PLabel>Layers</PLabel>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#6B7A72' }}>{LAYERS.length}</span>
        </div>
        <div style={{ display: 'grid', gap: 4 }}>
          {LAYERS.map(l => {
            const on = sel === l.id;
            return (
              <button
                key={l.id}
                onClick={() => onSelect(l.id)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left"
                style={{ background: on ? '#1F4D3A' : 'transparent', color: on ? '#FAF6EE' : '#6B7A72' }}
              >
                <Type size={13} strokeWidth={1.8} />
                <span style={{ flex: 1, fontSize: 12.5, fontWeight: on ? 600 : 400 }}>{l.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 9, opacity: 0.6, textTransform: 'uppercase' }}>{l.type}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TemplatesPanel() {
  const tpls = [
    { n: 'Attending', g: 'linear-gradient(150deg,#0D1F17,#1F4D3A 70%,#2A6A50)' },
    { n: 'Speaker', g: 'linear-gradient(150deg,#1F4D3A,#2A6A50 60%,#C9A45E)' },
    { n: 'Sponsor', g: 'linear-gradient(150deg,#163828,#3E7E5E)' },
    { n: 'VIP', g: 'linear-gradient(150deg,#122e21,#1F4D3A 70%,#C9A45E)' },
    { n: 'Volunteer', g: 'linear-gradient(160deg,#1F4D3A,#3E7E5E)' },
    { n: 'Minimal', g: 'linear-gradient(150deg,#0D1F17,#162D22)' },
  ];
  return (
    <div style={{ padding: 12 }}>
      <PLabel>Card templates</PLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tpls.map((t, i) => (
          <button key={i} className="rounded-xl overflow-hidden border border-[#E5E0D4] hover:border-[#1F4D3A] transition-colors">
            <div style={{ aspectRatio: '4/5', background: t.g, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 80% 12%, rgba(232,197,126,0.25), transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(232,197,126,0.6)', marginBottom: 4 }} />
                <div style={{ width: '65%', height: 3, borderRadius: 2, background: 'rgba(250,246,238,0.3)' }} />
              </div>
            </div>
            <div style={{ padding: '6px 8px', fontSize: 11.5, fontWeight: 500, color: '#0F1F18', textAlign: 'left' }}>{t.n}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandPanel() {
  const colors = ['#1F4D3A', '#163828', '#2A6A50', '#E8C57E', '#C9A45E', '#FAF6EE'];
  return (
    <div style={{ padding: 12, display: 'grid', gap: 20 }}>
      <div>
        <PLabel>Logo</PLabel>
        <div style={{ aspectRatio: '3/2', borderRadius: 12, border: '2px dashed rgba(31,77,58,0.4)', background: 'rgba(250,246,238,0.5)', display: 'grid', placeItems: 'center', color: '#1F4D3A' }}>
          <div style={{ textAlign: 'center' }}>
            <Upload size={18} strokeWidth={1.8} style={{ margin: '0 auto' }} />
            <div style={{ fontSize: 11, marginTop: 6, fontWeight: 500 }}>Upload logo</div>
          </div>
        </div>
      </div>
      <div>
        <PLabel>Brand colors</PLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
          {colors.map((c, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: c, border: '1px solid #E5E0D4' }} />
          ))}
        </div>
      </div>
      <div>
        <PLabel>Fonts</PLabel>
        <div style={{ display: 'grid', gap: 8 }}>
          {[{ name: 'DM Sans', role: 'Display', family: '"DM Sans"' }, { name: 'Inter', role: 'Body', family: 'Inter' }].map(f => (
            <div key={f.name} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.4)' }}>
              <div style={{ fontFamily: f.family, fontSize: 14, fontWeight: 600, color: '#0F1F18' }}>{f.name}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6B7A72' }}>{f.role}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BackgroundPanel({ bg, onBg }: { bg: string; onBg: (g: string) => void }) {
  return (
    <div style={{ padding: 12, display: 'grid', gap: 20 }}>
      <div>
        <PLabel>Background type</PLabel>
        <Seg options={['Gradient', 'Solid', 'Image']} value="Gradient" onChange={() => {}} full />
      </div>
      <div>
        <PLabel>Gradient presets</PLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {GRADIENTS.map((g, i) => (
            <button
              key={i}
              onClick={() => onBg(g)}
              style={{
                aspectRatio: '1', borderRadius: 12, background: g,
                border: bg === g ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
                boxShadow: bg === g ? '0 0 0 2px rgba(31,77,58,0.2)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <PLabel>Texture</PLabel>
        <div style={{ display: 'grid', gap: 8 }}>
          {[['Hex mesh', true], ['Dot grid', true], ['Topographic', false], ['None', false]].map(([l, on], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.4)' }}>
              <span style={{ fontSize: 12.5, color: '#3A4A42' }}>{l as string}</span>
              <Toggle on={on as boolean} onClick={() => {}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeftPanel({ tool, sel, onSelect, bg, onBg }: {
  tool: RailTool;
  sel: LayerId;
  onSelect: (id: LayerId) => void;
  bg: string;
  onBg: (g: string) => void;
}) {
  return (
    <div style={{ width: 256, background: '#fff', borderRight: '1px solid #E5E0D4', overflowY: 'auto', flexShrink: 0 }}>
      {tool === 'elements' && <ElementsPanel sel={sel} onSelect={onSelect} />}
      {tool === 'templates' && <TemplatesPanel />}
      {tool === 'brand' && <BrandPanel />}
      {tool === 'background' && <BackgroundPanel bg={bg} onBg={onBg} />}
    </div>
  );
}

/* ── Right Panel ────────────────────────────────────────────────────── */
function RightPanel({ sel, ns, setNs }: { sel: LayerId; ns: TextStyle; setNs: (s: TextStyle) => void }) {
  const isText = sel && ['name', 'title2', 'evtitle'].includes(sel);
  const isImage = sel === 'qr' || sel === 'photo';
  const label = sel === 'name' ? 'Full name' : sel === 'title2' ? 'Text field copy' : sel === 'photo' ? 'Photo zone' : sel === 'qr' ? 'QR code' : sel === 'evtitle' ? 'Event title' : null;
  const SWATCHES = ['#FAF6EE', '#E8C57E', '#C9A45E', '#237A55', '#1F4D3A', '#0F1F18'];
  const SIZES = [12, 18, 24, 32, 48, 64, 96, 128];

  return (
    <div style={{ width: 296, background: '#fff', borderLeft: '1px solid #E5E0D4', overflowY: 'auto', flexShrink: 0 }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(229,224,212,0.7)' }}>
        <button className="flex items-center gap-1.5" style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B7A72' }}>
          <ChevronLeft size={13} /> Event / Attendee
        </button>
        {label ? (
          <div className="flex items-center gap-2 mt-3">
            <span style={{ width: 28, height: 28, borderRadius: 8, background: '#E8EFEB', color: '#1F4D3A', display: 'grid', placeItems: 'center' }}>
              <Type size={14} strokeWidth={1.8} />
            </span>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#6B7A72' }}>
                {isText ? 'Text zone' : 'Image zone'}
              </div>
              <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: '#0F1F18', lineHeight: 1, marginTop: 2 }}>{label}</div>
            </div>
            <span style={{ marginLeft: 'auto', fontFamily: 'monospace', fontSize: 10, color: '#6B7A72' }}>#avnt</span>
          </div>
        ) : (
          <div style={{ marginTop: 12, fontFamily: '"DM Sans", sans-serif', fontSize: 14, fontWeight: 600, color: '#0F1F18' }}>Card settings</div>
        )}
      </div>

      {!sel && (
        <div style={{ padding: 16, display: 'grid', gap: 20 }}>
          <div>
            <PLabel>Card size</PLabel>
            <Seg options={['Story 4:5', 'Square', 'Wide']} value="Story 4:5" onChange={() => {}} full />
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6B7A72', marginTop: 8 }}>4500 × 5625 px · 300 DPI</div>
          </div>
          <div style={{ borderRadius: 12, padding: 12, background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.15)', fontSize: 12, color: '#3A4A42', lineHeight: 1.5 }}>
            Select any element on the card to edit its content and style.
          </div>
        </div>
      )}

      {isImage && (
        <div style={{ padding: 16, display: 'grid', gap: 16 }}>
          <div>
            <PLabel>Source</PLabel>
            <Seg
              options={sel === 'qr' ? ['Auto QR', 'Custom'] : ['Attendee photo', 'Fixed']}
              value={sel === 'qr' ? 'Auto QR' : 'Attendee photo'}
              onChange={() => {}} full
            />
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: '#FAF6EE', border: '1px solid #E5E0D4', fontSize: 12, color: '#3A4A42', lineHeight: 1.5 }}>
            {sel === 'qr'
              ? "The QR auto-links to each attendee's check-in pass. It regenerates per registration."
              : "Pulls the attendee's uploaded photo at registration."}
          </div>
          <div>
            <PLabel>Corner radius</PLabel>
            <Slider value={12} min={0} max={50} onChange={() => {}} />
          </div>
        </div>
      )}

      {isText && (
        <>
          {/* Field section */}
          <div style={{ padding: 16, borderBottom: '1px solid rgba(229,224,212,0.7)', display: 'grid', gap: 14 }}>
            <PLabel>Field</PLabel>
            {[{ label: 'Label', placeholder: 'Full name' }, { label: 'Placeholder', placeholder: 'Your Name Here' }, { label: 'Preview text', placeholder: 'Kwame Mensah' }].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>{f.label}</div>
                <input
                  defaultValue={f.placeholder}
                  className="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0F1F18' }}>Required</span>
              <Toggle on={ns.required} onClick={() => setNs({ ...ns, required: !ns.required })} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Max chars · {ns.maxChars}</div>
              <Slider value={ns.maxChars} min={10} max={200} onChange={v => setNs({ ...ns, maxChars: v })} />
            </div>
          </div>

          {/* Typography */}
          <div style={{ padding: 16, display: 'grid', gap: 14 }}>
            <PLabel>Typography</PLabel>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Font</div>
              <Seg
                options={[{ id: 'DM', label: 'DM' }, { id: 'Inter', label: 'Inter' }, { id: 'JetBrains', label: 'JB' }]}
                value={ns.font}
                onChange={v => setNs({ ...ns, font: v as TextStyle['font'] })}
                full
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Weight</div>
              <Seg
                options={[{ id: '300', label: 'Light' }, { id: '400', label: 'Reg' }, { id: '600', label: 'SBd' }, { id: '700', label: 'Bold' }]}
                value={String(ns.weight)}
                onChange={v => setNs({ ...ns, weight: Number(v) as TextStyle['weight'] })}
                full
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, color: '#6B7A72' }}>Size · {ns.size}px</span>
              </div>
              <Slider value={ns.size} min={12} max={300} onChange={v => setNs({ ...ns, size: v })} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 10 }}>
                {SIZES.map(s => (
                  <button
                    key={s}
                    onClick={() => setNs({ ...ns, size: s })}
                    className="py-1.5 rounded-md text-[11px] border transition-colors"
                    style={{ background: ns.size === s ? '#1F4D3A' : '#FAF6EE', color: ns.size === s ? '#FAF6EE' : '#6B7A72', border: '1px solid #E5E0D4' }}
                  >
                    {s}
                  </button>
                ))}
                <button className="col-span-2 py-1.5 rounded-md text-[10.5px] border border-dashed border-[#E5E0D4] text-[#6B7A72] flex items-center justify-center gap-1">
                  <Lock size={10} /> Auto-height
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Alignment</div>
              <IconSeg
                options={[
                  ['left', <AlignLeft key="left" size={14} strokeWidth={1.8} />],
                  ['center', <AlignCenter key="center" size={14} strokeWidth={1.8} />],
                  ['right', <AlignRight key="right" size={14} strokeWidth={1.8} />],
                  ['justify', <AlignJustify key="justify" size={14} strokeWidth={1.8} />],
                ]}
                value={ns.align}
                onChange={v => setNs({ ...ns, align: v as TextStyle['align'] })}
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Transform</div>
              <Seg
                options={[{ id: 'none', label: 'Aa' }, { id: 'uppercase', label: 'AA' }, { id: 'lowercase', label: 'aa' }]}
                value={ns.transform}
                onChange={v => setNs({ ...ns, transform: v as TextStyle['transform'] })}
                full
              />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: '#6B7A72', marginBottom: 6 }}>Color</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 6 }}>
                {SWATCHES.map(c => (
                  <button
                    key={c}
                    onClick={() => setNs({ ...ns, color: c })}
                    style={{
                      aspectRatio: '1', borderRadius: 8, background: c,
                      border: ns.color === c ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
                    }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={ns.color}
                onChange={e => setNs({ ...ns, color: e.target.value })}
                className="w-full h-9 mt-2 rounded-lg cursor-pointer"
                style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', padding: '2px 4px' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main Studio ────────────────────────────────────────────────────── */
export function StudioClient() {
  const [tool, setTool] = useState<RailTool>('elements');
  const [variant, setVariant] = useState('attendee');
  const [sel, setSel] = useState<LayerId>(null);
  const [bg, setBg] = useState(GRADIENTS[0]);
  const [ns, setNs] = useState<TextStyle>({
    font: 'DM', weight: 700, size: 200, align: 'center',
    transform: 'none', color: '#FAF6EE', required: false, maxChars: 110,
  });

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#FAF6EE', overflow: 'hidden' }}>
      {/* Top bar */}
      <header style={{ height: 48, background: '#163828', color: '#FAF6EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10">
            <ChevronLeft size={18} />
          </button>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg,#FAF6EE,#E8C57E)', display: 'grid', placeItems: 'center', fontFamily: '"DM Sans",sans-serif', fontWeight: 700, fontSize: 13, color: '#163828' }}>
            K
          </div>
          <div className="flex items-center gap-2 text-[13px] min-w-0">
            <span style={{ color: 'rgba(250,246,238,0.5)' }}>Events</span>
            <span style={{ color: 'rgba(250,246,238,0.25)' }}>/</span>
            <span style={{ fontWeight: 500 }}>Karta Card Studio</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3 text-[12.5px]">
          <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10" style={{ color: 'rgba(250,246,238,0.7)' }}>
            <Undo2 size={16} strokeWidth={1.8} />
          </button>
          <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10" style={{ color: 'rgba(250,246,238,0.7)' }}>
            <Redo2 size={16} strokeWidth={1.8} />
          </button>
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(250,246,238,0.5)' }}>
            <Check size={13} style={{ color: '#8FC0A2' }} /> Saved
          </span>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10" style={{ color: 'rgba(250,246,238,0.8)' }}>
            <Copy size={14} /> Copy style
          </button>
          <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-white/10" style={{ color: 'rgba(250,246,238,0.5)' }}>
            <HelpCircle size={15} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium hover:bg-white/15" style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)', color: '#FAF6EE' }}>
            <Eye size={14} /> Preview
          </button>
          <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium hover:bg-white/15" style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)', color: '#FAF6EE' }}>
            <Play size={13} /> Test
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold" style={{ background: '#E8C57E', color: '#163828' }}>
            <Globe size={14} /> Publish
          </button>
        </div>
      </header>

      {/* Variant tabs */}
      <div style={{ height: 44, background: '#FAF6EE', borderBottom: '1px solid #E5E0D4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B7A72', marginRight: 6, flexShrink: 0 }}>Variants</span>
          {VARIANTS.map(v => (
            <button
              key={v.id}
              onClick={() => setVariant(v.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors shrink-0"
              style={{
                background: variant === v.id ? '#1F4D3A' : '#fff',
                color: variant === v.id ? '#FAF6EE' : '#3A4A42',
                border: `1px solid ${variant === v.id ? '#1F4D3A' : '#E5E0D4'}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 2, background: variant === v.id ? '#E8C57E' : '#E5E0D4' }} />
              {v.label}
              <span style={{ fontFamily: 'monospace', fontSize: 10, opacity: 0.6 }}>{v.count}</span>
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium shrink-0" style={{ border: '1px dashed #E5E0D4', color: '#6B7A72' }}>
            <Plus size={13} /> Add variant
          </button>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7A72', flexShrink: 0 }}>4500 × 5625</span>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftRail tool={tool} setTool={setTool} />
        <LeftPanel tool={tool} sel={sel} onSelect={setSel} bg={bg} onBg={setBg} />

        {/* Canvas area */}
        <div
          onClick={() => setSel(null)}
          style={{
            flex: 1, overflow: 'auto',
            display: 'grid', placeItems: 'center', padding: 32,
            background: '#EFE9DC',
            backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.06) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            position: 'relative',
          }}
        >
          {/* Canvas size chip */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '1px solid #E5E0D4', borderRadius: 999,
            padding: '4px 14px', fontFamily: 'monospace', fontSize: 10, color: '#6B7A72',
            boxShadow: '0 1px 2px rgba(15,31,24,0.06)',
            whiteSpace: 'nowrap',
          }}>
            <span>canvas 4500 × 5625 px</span>
            <span style={{ color: '#E5E0D4' }}>|</span>
            <span style={{ color: '#1F4D3A' }}>8%</span>
          </div>

          <CardCanvas sel={sel} onSelect={setSel} ns={ns} bg={bg} />
        </div>

        <RightPanel sel={sel} ns={ns} setNs={setNs} />
      </div>
    </div>
  );
}
