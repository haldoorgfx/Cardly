import Link from 'next/link';
import { ArrowRight, Check, Send, Plus } from 'lucide-react';
import { CardMockup } from '@/components/marketing/CardMockup';

export const metadata = {
  title: 'How It Works — Cardly',
  description:
    'From idea to thousands of shares in four steps. Upload a design, mark editable zones, publish your link, and watch your audience generate branded cards.',
};

/* ── Data ────────────────────────────────────────────────── */
const STEPS = [
  {
    n: 1,
    short: 'Upload your design',
    duration: '~2 min',
    title: 'Drop in any design. Cardly handles the rest.',
    body: 'Export from Canva, Figma, Illustrator, Photoshop — anywhere. PNG or JPG, any aspect ratio. We auto-detect the canvas size and place it on the editor at the right scale.',
    bullets: [
      'PNG / JPG · up to 20 MB',
      'Any aspect ratio · portrait, square, landscape',
      'Auto-detected safe area for typography',
      'Multiple designs per event (Speaker variant, Sponsor variant)',
    ],
  },
  {
    n: 2,
    short: 'Mark editable zones',
    duration: '~3 min',
    title: 'Click to mark where attendees personalize.',
    body: 'Drop text fields, photo zones, and dropdowns directly on the canvas. Each zone has its own typography, max length, photo shape, and validation. Need different roles? Add variants — Attendee, Speaker, Sponsor, Volunteer.',
    bullets: [
      'Text · name, role, organization, anything',
      'Photo · circle, square, hexagon, rounded — auto crop',
      'Dropdown · pick from list (department, country, ticket tier)',
      'Variants per event · up to unlimited on Studio',
    ],
  },
  {
    n: 3,
    short: 'Publish your link',
    duration: '~30 sec',
    title: 'One link. WhatsApp, email, QR. No accounts.',
    body: 'Cardly generates a short URL and a QR code for your campaign. Share it however your audience already shares — WhatsApp groups, email blasts, printed flyers, event signage. Attendees never sign up.',
    bullets: [
      'Short URL · cardly.app/your-slug',
      'QR code · downloadable PNG and SVG',
      'Embed code · drop into any website',
      'No attendee account, no app download',
    ],
  },
  {
    n: 4,
    short: 'Watch your audience share',
    duration: 'Live',
    title: 'Track reach as your campaign goes off.',
    body: "Real-time analytics show how many cards have been generated, where they're being shared, and which variants are performing. Export to CSV or pipe to your data tool via webhook.",
    bullets: [
      'Live counter · cards generated, per variant',
      'Share platform breakdown · WhatsApp, IG, X, LinkedIn',
      'Top sharers · spot your loudest advocates',
      'CSV export · or webhook events to your stack',
    ],
  },
];

/* ── Shared primitives ───────────────────────────────────── */
const BORDER = { border: '1px solid #E5E0D4' };

function AppChrome({ url, children, height = 360 }: { url: string; children: React.ReactNode; height?: number }) {
  return (
    <div
      className="relative bg-surface rounded-2xl overflow-hidden"
      style={{ ...BORDER, boxShadow: '0 20px 60px rgba(15,31,24,0.10), 0 4px 12px rgba(15,31,24,0.06)' }}
    >
      {/* Browser bar */}
      <div className="h-10 flex items-center gap-1.5 px-3.5" style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(15,31,24,0.15)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(15,31,24,0.15)' }} />
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(15,31,24,0.15)' }} />
        <div className="ml-3 font-mono text-[10px] tracking-[0.12em] text-muted">{url}</div>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

/* ── Mock: Step 1 — Upload ───────────────────────────────── */
function MockStep1() {
  return (
    <AppChrome url="cardly.app/editor · new event" height={400}>
      <div className="grid h-full" style={{ gridTemplateColumns: '180px 1fr' }}>
        {/* Sidebar */}
        <aside className="flex flex-col gap-2 p-3" style={{ background: 'rgba(250,246,238,0.6)', borderRight: '1px solid #E5E0D4' }}>
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase mb-1">Event setup</div>
          {(['01 · Design', '02 · Zones', '03 · Variants', '04 · Publish'] as const).map((l, i) => (
            <div
              key={l}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px]"
              style={i === 0 ? { background: '#1F4D3A', color: '#FAF6EE', fontWeight: 500 } : { color: '#3A4A42' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#E8C57E' : 'rgba(58,74,66,0.4)' }} />
              {l}
            </div>
          ))}
          <div className="mt-auto rounded-md p-2.5 bg-surface" style={BORDER}>
            <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">Detected</div>
            <div className="text-[11px] text-ink mt-0.5 font-medium">4:5 · 1080×1350</div>
          </div>
        </aside>

        {/* Drop zone area */}
        <div
          className="relative grid place-items-center p-6"
          style={{ background: 'radial-gradient(circle at center, #F1E9D6 0%, #FAF6EE 70%)' }}
        >
          <div
            className="relative rounded-xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.8)', border: '2px dashed rgba(31,77,58,0.4)', minWidth: 280 }}
          >
            <div className="text-primary mx-auto mb-3 flex justify-center">
              <Send size={26} strokeWidth={1.8} style={{ transform: 'rotate(-45deg)' }} />
            </div>
            <div className="font-display text-ink text-[16px] font-semibold tracking-tight">Drop your design here</div>
            <div className="text-ink-soft text-[12px] mt-1.5">PNG or JPG · up to 20 MB · any aspect ratio</div>
            <div
              className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-cream text-[12px] font-medium"
              style={{ background: '#1F4D3A' }}
            >
              Browse files <ArrowRight size={12} strokeWidth={2} />
            </div>
          </div>

          {/* Uploaded file indicator */}
          <div
            className="absolute bottom-5 left-5 flex items-center gap-2.5 rounded-lg px-3 py-2 bg-surface"
            style={{ ...BORDER, boxShadow: '0 2px 8px rgba(15,31,24,0.08)' }}
          >
            <div
              className="w-8 h-10 rounded grid place-items-center font-mono text-[9px] tracking-tight text-cream"
              style={{ background: '#1F4D3A' }}
            >
              .PNG
            </div>
            <div>
              <div className="font-mono text-[10px] text-ink leading-none">youth-forum-attendee.png</div>
              <div className="font-mono text-[8px] tracking-[0.16em] uppercase mt-1" style={{ color: '#2D7A4F' }}>
                Uploaded · 2.1 MB
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

/* ── Zone overlay helper ─────────────────────────────────── */
function ZoneOverlay({ x, y, w, h, label, circle }: { x: number; y: number; w: number; h: number; label: string; circle?: boolean }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: '2px dashed #E8C57E',
          borderRadius: circle ? '50%' : 4,
          background: 'rgba(232,197,126,0.14)',
        }}
      />
      <span
        className="absolute font-mono text-[7px] tracking-[0.14em] uppercase px-1 rounded text-ink"
        style={{ top: -12, left: 0, background: '#E8C57E' }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Mock: Step 2 — Zone editor ─────────────────────────── */
function MockStep2() {
  return (
    <AppChrome url="cardly.app/editor · 5th pan-african youth forum" height={400}>
      <div className="grid h-full" style={{ gridTemplateColumns: '170px 1fr 180px' }}>
        {/* Left sidebar — zone list */}
        <aside className="flex flex-col gap-2 p-3" style={{ background: 'rgba(250,246,238,0.6)', borderRight: '1px solid #E5E0D4' }}>
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Zones · 5</div>
          {([
            ['Organization', 'TEXT', true],
            ['Event title', 'TEXT', true],
            ['Role badge', 'DROPDOWN', false],
            ['Photo', 'PHOTO', true],
            ['Name', 'TEXT', true],
            ['Title', 'TEXT', false],
          ] as [string, string, boolean][]).map(([l, kind, active]) => (
            <div
              key={l}
              className="flex items-center justify-between px-2 py-1.5 rounded-md text-[11px]"
              style={
                active
                  ? { background: '#1F4D3A', color: '#FAF6EE', border: '1px solid #1F4D3A' }
                  : { background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }
              }
            >
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#E8C57E' : 'rgba(58,74,66,0.4)' }} />
                {l}
              </span>
              <span
                className="font-mono text-[8px] tracking-[0.14em]"
                style={{ color: active ? 'rgba(250,246,238,0.7)' : '#6B7A72' }}
              >
                {kind}
              </span>
            </div>
          ))}
          <button
            className="inline-flex items-center justify-center gap-1.5 text-[11px] text-primary rounded-md py-1.5"
            style={{ border: '1px dashed rgba(31,77,58,0.4)' }}
          >
            <Plus size={11} strokeWidth={2} /> Add zone
          </button>
        </aside>

        {/* Canvas with card + zone overlays */}
        <div
          className="relative grid place-items-center p-4"
          style={{ background: 'radial-gradient(circle at center, #F1E9D6 0%, #FAF6EE 70%)' }}
        >
          <div className="relative">
            <CardMockup width={180} variant="forest" />
            <ZoneOverlay x={14} y={20} w={130} h={14} label="ORG" />
            <ZoneOverlay x={14} y={46} w={140} h={30} label="EVENT" />
            <ZoneOverlay x={14} y={154} w={38} h={38} label="PHOTO" circle />
            <ZoneOverlay x={64} y={156} w={94} h={14} label="NAME" />
          </div>
        </div>

        {/* Right sidebar — field properties */}
        <aside className="flex flex-col gap-2.5 p-3" style={{ background: 'rgba(250,246,238,0.6)', borderLeft: '1px solid #E5E0D4' }}>
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Field · Name</div>
          {([
            ['Label', 'Your name'],
            ['Max chars', '24'],
            ['Required', 'Yes'],
            ['Font', 'DM Sans 600'],
            ['Color', '#FAF6EE'],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="rounded-md p-2 bg-surface" style={BORDER}>
              <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">{k}</div>
              <div className="text-[11px] text-ink mt-0.5 font-medium flex items-center gap-1.5">
                {k === 'Color' && <span className="w-3 h-3 rounded-sm" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }} />}
                {v}
              </div>
            </div>
          ))}
          <div className="mt-1 font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Variants · 3</div>
          <div className="flex gap-1.5 flex-wrap">
            {['Attendee', 'Speaker', 'Sponsor'].map((v, i) => (
              <span
                key={v}
                className="text-[10px] px-2 py-1 rounded-full"
                style={
                  i === 0
                    ? { background: '#1F4D3A', color: '#FAF6EE' }
                    : { background: '#FFFFFF', color: '#3A4A42', border: '1px solid #E5E0D4' }
                }
              >
                {v}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </AppChrome>
  );
}

/* ── Fake QR ─────────────────────────────────────────────── */
function FakeQR() {
  const pattern = '110110011 100111010 011011101 110101011 001110010 101011110 011100110 110011001 101110011';
  const rows = pattern.split(' ');
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (rows[y][x] === '1') {
        dots.push(<rect key={`${x}-${y}`} x={x * 12} y={y * 12} width="11" height="11" rx="1.5" fill="#1F4D3A" />);
      }
    }
  }
  return (
    <svg viewBox="0 0 108 108" width="100%" height="100%">
      {([[0, 0], [84, 0], [0, 84]] as [number, number][]).map(([cx, cy], i) => (
        <g key={i}>
          <rect x={cx} y={cy} width="24" height="24" rx="4" fill="#1F4D3A" />
          <rect x={cx + 6} y={cy + 6} width="12" height="12" rx="2" fill="#FAF6EE" />
          <rect x={cx + 9} y={cy + 9} width="6" height="6" rx="1" fill="#1F4D3A" />
        </g>
      ))}
      {dots}
    </svg>
  );
}

/* ── Mock: Step 3 — Publish ──────────────────────────────── */
function MockStep3() {
  const channels = [
    ['WhatsApp', '#25D366'],
    ['Email', '#1F4D3A'],
    ['X / Twitter', '#0F1F18'],
    ['Instagram DM', '#C13584'],
    ['LinkedIn', '#0A66C2'],
    ['Copy link', '#6B7A72'],
  ] as [string, string][];

  return (
    <AppChrome url="cardly.app/editor · publish" height={400}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="p-6 lg:p-8 flex flex-col gap-4">
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-primary">Your link is live</div>
          <div className="font-display font-bold text-ink text-[22px] tracking-tight leading-tight">5th Pan-African Youth Forum</div>

          {/* URL pill */}
          <div className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            <div className="font-mono text-[12px] text-ink truncate">
              <span className="text-muted">cardly.app/</span>y2025
            </div>
            <div
              className="text-[11px] text-cream px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5"
              style={{ background: '#1F4D3A' }}
            >
              <Check size={11} strokeWidth={2.5} /> Copied
            </div>
          </div>

          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted mt-2">Share to</div>
          <div className="grid grid-cols-3 gap-2">
            {channels.map(([n, c]) => (
              <div
                key={n}
                className="rounded-lg p-2.5 text-[11px] text-ink-soft flex items-center gap-2 bg-surface"
                style={BORDER}
              >
                <span
                  className="w-5 h-5 rounded-md grid place-items-center text-cream font-mono text-[9px] font-semibold shrink-0"
                  style={{ background: c }}
                >
                  {n[0]}
                </span>
                {n}
              </div>
            ))}
          </div>
        </div>

        {/* QR panel */}
        <div
          className="flex flex-col items-center justify-center gap-3 p-5"
          style={{ background: 'rgba(232,239,235,0.3)', borderLeft: '1px solid #E5E0D4' }}
        >
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-primary">Print-ready QR</div>
          <div className="w-32 h-32 rounded-xl p-2 grid place-items-center bg-surface" style={BORDER}>
            <FakeQR />
          </div>
          <div className="flex gap-2">
            {['PNG', 'SVG'].map((f) => (
              <div
                key={f}
                className="text-[10px] font-mono tracking-[0.14em] uppercase rounded-full px-2.5 py-1 bg-surface"
                style={BORDER}
              >
                ↓ {f}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-full px-2.5 py-1.5 bg-surface" style={BORDER}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">247 generated</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

/* ── Fake chart ──────────────────────────────────────────── */
function FakeChart() {
  const pts = [22, 30, 28, 40, 52, 48, 62, 70, 68, 80, 76, 90, 84, 92, 86, 98, 94, 108, 118, 112, 124, 120, 134, 128, 140];
  const max = Math.max(...pts);
  const w = 100, h = 100;
  const pathD = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const areaD = `${pathD} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="relative rounded-lg p-3" style={{ background: 'rgba(250,246,238,0.5)', border: '1px solid #E5E0D4', height: 90 }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1F4D3A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#chartGrad)" />
        <path d={pathD} fill="none" stroke="#1F4D3A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute top-2 right-3 font-mono text-[9px] tracking-[0.14em] uppercase text-muted">Cards / hour</div>
    </div>
  );
}

/* ── Mock: Step 4 — Analytics ────────────────────────────── */
function MockStep4() {
  const platforms = [
    ['WhatsApp Status', 52, '#25D366'],
    ['Instagram Stories', 28, '#C13584'],
    ['X', 14, '#0F1F18'],
    ['LinkedIn', 6, '#0A66C2'],
  ] as [string, number, string][];

  const topSharers = [
    ['Aisha Ahmed', 'AA', '32 sh.'],
    ['Kwame Mensah', 'KM', '28 sh.'],
    ['Liya Tesfaye', 'LT', '21 sh.'],
    ['Fatou Diop', 'FD', '18 sh.'],
    ['Yusuf Bello', 'YB', '14 sh.'],
  ] as [string, string, string][];

  return (
    <AppChrome url="cardly.app/dashboard · 5th pan-african youth forum" height={400}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 220px' }}>
        <div className="p-5 lg:p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted">Total cards generated</div>
              <div className="font-display font-bold text-ink text-[36px] tracking-[-0.03em] leading-none mt-1">1,247</div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: '#2D7A4F' }}>↑ 38% vs last 24h</div>
            </div>
            <div className="flex gap-1">
              {['24h', '7d', '30d'].map((p, i) => (
                <div
                  key={p}
                  className="text-[10px] font-mono tracking-[0.14em] uppercase px-2 py-1 rounded"
                  style={i === 0 ? { background: '#1F4D3A', color: '#FAF6EE' } : { color: '#3A4A42' }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          <FakeChart />

          <div>
            <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted mb-2">Share platforms</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {platforms.map(([n, p, c]) => (
                <div key={n}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[11px] text-ink-soft">{n}</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] text-ink font-semibold">{p}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#FAF6EE' }}>
                    <div style={{ width: `${p}%`, background: c }} className="h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-3 p-4" style={{ background: 'rgba(250,246,238,0.6)', borderLeft: '1px solid #E5E0D4' }}>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted">Top sharers</div>
          {topSharers.map(([n, initials, count]) => (
            <div key={n} className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full grid place-items-center text-[9px] font-display font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8C57E, #C9A45E)', color: '#163828' }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-ink truncate">{n}</div>
                <div className="font-mono text-[9px] tracking-[0.14em] text-muted">{count}</div>
              </div>
            </div>
          ))}
          <a href="#" className="mt-auto text-[11px] text-primary font-medium inline-flex items-center gap-1.5">
            Export CSV <ArrowRight size={11} strokeWidth={2} />
          </a>
        </aside>
      </div>
    </AppChrome>
  );
}

/* ── Step row ────────────────────────────────────────────── */
function getMock(n: number) {
  if (n === 1) return <MockStep1 />;
  if (n === 2) return <MockStep2 />;
  if (n === 3) return <MockStep3 />;
  return <MockStep4 />;
}

function StepRow({ step, mock, reverse }: { step: typeof STEPS[0]; mock: React.ReactNode; reverse: boolean }) {
  return (
    <section id={`step-${step.n}`} className="relative" style={{ borderBottom: '1px solid #E5E0D4' }}>
      <div
        className={`mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center`}
      >
        <div className={reverse ? 'lg:order-2' : ''}>
          <div className="inline-flex items-center gap-2.5 mb-5">
            <span
              className="font-mono text-[14px] font-semibold w-9 h-9 rounded-full grid place-items-center"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}
            >
              {String(step.n).padStart(2, '0')}
            </span>
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary">
              Step {step.n} · {step.duration}
            </span>
          </div>
          <h2 className="font-display font-bold text-ink text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.0] tracking-[-0.035em]">
            {step.title}
          </h2>
          <p className="mt-5 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6] max-w-[520px]">
            {step.body}
          </p>
          <ul className="mt-6 space-y-2.5">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[14px] lg:text-[15px] text-ink-soft">
                <span className="text-primary mt-0.5 shrink-0"><Check size={15} strokeWidth={2.5} /></span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? 'lg:order-1' : ''}>{mock}</div>
      </div>
    </section>
  );
}

/* ── Video demo placeholder ──────────────────────────────── */
function VideoDemo() {
  return (
    <section>
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="text-center mb-8 lg:mb-10">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">60-second tour</div>
          <h2 className="font-display font-bold text-ink text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.02] tracking-[-0.035em]">
            See the whole thing in a minute.
          </h2>
        </div>

        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            aspectRatio: '16 / 9',
            background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 50%, #2A6A50 100%)',
            border: '1px solid #E5E0D4',
            boxShadow: '0 20px 60px rgba(15,31,24,0.15)',
          }}
        >
          {/* Gold dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.10) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />

          {/* Floating card */}
          <div className="absolute inset-0 grid place-items-center">
            <div style={{ transform: 'rotate(-4deg)' }}>
              <CardMockup width={220} variant="cream" />
            </div>
          </div>

          {/* Play button */}
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="w-20 h-20 rounded-full grid place-items-center"
              style={{ background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(8px)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#1F4D3A">
                <path d="M7 4l14 8-14 8V4z" />
              </svg>
            </div>
          </div>

          {/* Bottom labels */}
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: '#E8C57E' }}>Demo · 0:58</div>
              <div className="font-display font-semibold text-cream text-[18px] lg:text-[22px] tracking-tight mt-1">
                From upload to first shared card.
              </div>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(250,246,238,0.10)', border: '1px solid rgba(250,246,238,0.20)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8C57E' }} />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/90">Live product</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(70% 60% at 10% 0%, rgba(31,77,58,0.10), transparent 65%)',
              'radial-gradient(50% 50% at 90% 100%, rgba(232,197,126,0.13), transparent 65%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-16">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">How it works</div>
            <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[78px] leading-[0.95] tracking-[-0.035em]">
              From idea to thousands of shares{' '}
              <span className="text-primary">in four steps.</span>
            </h1>
            <p className="mt-6 text-ink-soft text-[18px] lg:text-[20px] leading-[1.55] max-w-[680px]">
              Upload a design. Mark editable zones. Share one link. Watch your audience generate
              their own branded cards — on their phones, in under thirty seconds.
            </p>
          </div>

          {/* Quick-jump cards */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {STEPS.map((s) => (
              <Link
                key={s.n}
                href={`#step-${s.n}`}
                className="group bg-surface rounded-2xl p-4 lg:p-5 transition-colors hover:bg-primary-soft"
                style={BORDER}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                    Step {String(s.n).padStart(2, '0')}
                  </span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} strokeWidth={2} />
                  </span>
                </div>
                <div className="font-display font-semibold text-ink text-[15px] lg:text-[16px] tracking-tight">{s.short}</div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: 'rgba(31,77,58,0.8)' }}>{s.duration}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Step rows */}
      {STEPS.map((s, i) => (
        <StepRow key={s.n} step={s} mock={getMock(s.n)} reverse={i % 2 === 1} />
      ))}

      {/* Video demo */}
      <VideoDemo />

      {/* Final CTA */}
      <section className="relative overflow-hidden" style={{ borderTop: '1px solid #E5E0D4' }}>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'radial-gradient(65% 55% at 50% 110%, rgba(31,77,58,0.08), transparent 65%)',
            ].join(', '),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(15,31,24,0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-24 text-center">
          <h2 className="font-display font-bold text-ink text-[40px] sm:text-[54px] lg:text-[68px] leading-[0.98] tracking-[-0.035em]">
            Ten minutes from now, your link is live.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px] mx-auto">
            Free for up to 50 cards. No credit card. Most teams ship their first
            campaign on a coffee break.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
            >
              Start free <ArrowRight size={16} strokeWidth={2} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors text-[15px]"
            >
              See pricing <ArrowRight size={14} strokeWidth={2} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
