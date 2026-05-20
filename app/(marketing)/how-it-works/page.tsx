import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

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
    body: "Cardly generates a short URL and a QR code for your campaign. Share it however your audience already shares — WhatsApp groups, email blasts, printed flyers, event signage. Attendees never sign up.",
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

function AppChrome({ url, children, height = 360 }: { url: string; children: React.ReactNode; height?: number }) {
  return (
    <div className="relative bg-surface rounded-2xl border border-border overflow-hidden"
      style={{ boxShadow: '0 8px 30px rgba(15,31,24,0.12)' }}>
      <div className="h-10 bg-cream border-b border-border flex items-center gap-1.5 px-3.5">
        <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink/15" />
        <div className="ml-3 font-mono text-[10px] tracking-[0.12em] text-muted">{url}</div>
      </div>
      <div style={{ height }}>{children}</div>
    </div>
  );
}

function CardPreview({ width = 180 }: { width?: number }) {
  return (
    <div className="rounded-xl overflow-hidden shrink-0" style={{
      width,
      aspectRatio: '4/5',
      background: 'linear-gradient(165deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)',
      boxShadow: '0 12px 32px rgba(15,31,24,0.35)',
    }}>
      <div className="h-full relative p-4 flex flex-col">
        <div className="font-mono text-[7px] tracking-[0.2em] text-white/50 uppercase">5th Pan-African Youth Forum</div>
        <div className="mt-1 font-mono text-[7px] tracking-[0.14em] text-white/80 uppercase border border-white/20 inline-block px-1.5 py-0.5 rounded-full self-start">
          I&apos;M ATTENDING
        </div>
        <div className="mt-auto flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/20 shrink-0 grid place-items-center">
            <span className="text-[8px] font-bold text-white">AA</span>
          </div>
          <div>
            <div className="font-display font-bold text-[9px] text-white leading-tight">Aisha Ahmed</div>
            <div className="font-mono text-[7px] text-white/60">Climate Policy Lead</div>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/10 font-mono text-[7px] text-white/40">NOV 2025 · DJIBOUTI</div>
      </div>
    </div>
  );
}

function ZoneOverlay({ x, y, w, h, label, circle = false }: {
  x: number; y: number; w: number; h: number; label: string; circle?: boolean;
}) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: h }}>
      <div className="absolute inset-0 border-2 border-dashed pointer-events-none" style={{
        borderColor: '#E8C57E',
        borderRadius: circle ? '50%' : 4,
        background: 'rgba(232, 197, 126, 0.14)',
      }} />
      <span className="absolute -top-3 left-0 font-mono text-[7px] tracking-[0.14em] uppercase px-1 rounded text-ink"
        style={{ background: '#E8C57E' }}>
        {label}
      </span>
    </div>
  );
}

function MockStep1() {
  return (
    <AppChrome url="cardly.app/editor · new event" height={380}>
      <div className="grid h-full" style={{ gridTemplateColumns: '170px 1fr' }}>
        <aside className="bg-cream/60 border-r border-border p-3 flex flex-col gap-2">
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase mb-1">Event setup</div>
          {([['01 · Design', true], ['02 · Zones', false], ['03 · Variants', false], ['04 · Publish', false]] as [string, boolean][]).map(([l, active], i) => (
            <div key={i} className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-[11px] ${active ? 'bg-primary text-cream font-medium' : 'text-ink-soft'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent' : 'bg-muted/40'}`} />
              {l}
            </div>
          ))}
          <div className="mt-auto bg-surface border border-border rounded-md p-2.5">
            <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">Detected</div>
            <div className="text-[11px] text-ink mt-0.5 font-medium">4:5 · 1080×1350</div>
          </div>
        </aside>
        <div className="relative grid place-items-center p-6"
          style={{ background: 'radial-gradient(circle at center, #F1E9D6 0%, #FAF6EE 70%)' }}>
          <div className="relative bg-surface/80 border-2 border-dashed border-primary/40 rounded-xl p-8 text-center" style={{ minWidth: 240 }}>
            <div className="text-primary mx-auto mb-3 inline-flex">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div className="font-display text-ink text-[15px] font-semibold tracking-tight">Drop your design here</div>
            <div className="text-ink-soft text-[11px] mt-1.5">PNG or JPG · up to 20 MB · any aspect ratio</div>
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-cream text-[11px] font-medium">
              Browse files <ArrowRight size={11} />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 bg-surface border border-border rounded-lg px-3 py-2 shadow-sm flex items-center gap-2.5">
            <div className="w-8 h-10 rounded bg-primary grid place-items-center text-cream font-mono text-[9px]">.PNG</div>
            <div>
              <div className="font-mono text-[10px] text-ink leading-none">youth-forum-attendee.png</div>
              <div className="font-mono text-[8px] text-success tracking-[0.16em] uppercase mt-1">Uploaded · 2.1 MB</div>
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function MockStep2() {
  return (
    <AppChrome url="cardly.app/editor · 5th pan-african youth forum" height={380}>
      <div className="grid h-full" style={{ gridTemplateColumns: '160px 1fr 165px' }}>
        <aside className="bg-cream/60 border-r border-border p-3 flex flex-col gap-2">
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Zones · 5</div>
          {([['Organization', 'TEXT', true], ['Event title', 'TEXT', true], ['Role badge', 'DROP', false], ['Photo', 'PHOTO', true], ['Name', 'TEXT', true]] as [string, string, boolean][]).map(([l, kind, active], i) => (
            <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-md text-[10px] border ${active ? 'bg-primary text-cream border-primary' : 'bg-surface text-ink-soft border-border'}`}>
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-accent' : 'bg-muted/40'}`} />
                {l}
              </span>
              <span className={`font-mono text-[8px] tracking-[0.14em] ${active ? 'text-cream/70' : 'text-muted'}`}>{kind}</span>
            </div>
          ))}
          <button className="mt-2 inline-flex items-center justify-center gap-1.5 text-[10px] text-primary border border-dashed border-primary/40 rounded-md py-1.5">
            + Add zone
          </button>
        </aside>
        <div className="relative grid place-items-center p-4"
          style={{ background: 'radial-gradient(circle at center, #F1E9D6 0%, #FAF6EE 70%)' }}>
          <div className="relative">
            <CardPreview width={148} />
            <ZoneOverlay x={12} y={16} w={108} h={11} label="ORG" />
            <ZoneOverlay x={12} y={37} w={116} h={22} label="EVENT" />
            <ZoneOverlay x={12} y={126} w={30} h={30} label="PHOTO" circle />
            <ZoneOverlay x={50} y={130} w={78} h={11} label="NAME" />
          </div>
        </div>
        <aside className="bg-cream/60 border-l border-border p-3 flex flex-col gap-2.5">
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Field · Name</div>
          {([['Label', 'Your name'], ['Max chars', '24'], ['Required', 'Yes'], ['Font', 'DM Sans 600'], ['Color', '#FAF6EE']] as [string, string][]).map(([k, v], i) => (
            <div key={i} className="bg-surface border border-border rounded-md p-2">
              <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">{k}</div>
              <div className="text-[10px] text-ink mt-0.5 font-medium flex items-center gap-1.5">
                {k === 'Color' && <span className="w-3 h-3 rounded-sm border border-border" style={{ background: '#FAF6EE' }} />}
                {v}
              </div>
            </div>
          ))}
          <div className="mt-1 font-mono text-[9px] tracking-[0.18em] text-muted uppercase">Variants · 3</div>
          <div className="flex gap-1.5 flex-wrap">
            {['Attendee', 'Speaker', 'Sponsor'].map((v, i) => (
              <span key={i} className={`text-[10px] px-2 py-1 rounded-full ${i === 0 ? 'bg-primary text-cream' : 'bg-surface border border-border text-ink-soft'}`}>{v}</span>
            ))}
          </div>
        </aside>
      </div>
    </AppChrome>
  );
}

function FakeQR() {
  const pattern = '110110011 100111010 011011101 110101011 001110010 101011110 011100110 110011001 101110011';
  const rows = pattern.split(' ');
  const dots: React.ReactNode[] = [];
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (rows[y]?.[x] === '1') {
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

function MockStep3() {
  const shareChannels: [string, string][] = [
    ['WhatsApp', '#25D366'],
    ['Email', '#1F4D3A'],
    ['X / Twitter', '#0F1F18'],
    ['Instagram DM', '#C13584'],
    ['LinkedIn', '#0A66C2'],
    ['Copy link', '#6B7A72'],
  ];
  return (
    <AppChrome url="cardly.app/editor · publish" height={380}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 240px' }}>
        <div className="p-5 flex flex-col gap-3.5">
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-primary">Your link is live</div>
          <div className="font-display font-bold text-ink text-[18px] tracking-tight leading-tight">5th Pan-African Youth Forum</div>
          <div className="bg-cream border border-border rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="font-mono text-[11px] text-ink truncate">
              <span className="text-muted">cardly.app/</span>y2025
            </div>
            <div className="text-[10px] bg-primary text-cream px-3 py-1.5 rounded-full font-medium inline-flex items-center gap-1.5">
              <Check size={10} /> Copied
            </div>
          </div>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted">Share to</div>
          <div className="grid grid-cols-3 gap-1.5">
            {shareChannels.map(([n, c]) => (
              <div key={n} className="bg-surface border border-border rounded-lg p-2 text-[10px] text-ink-soft flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md grid place-items-center text-cream font-mono text-[8px] font-semibold shrink-0" style={{ background: c }}>
                  {n[0]}
                </span>
                <span className="truncate">{n}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="border-l border-border p-4 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(232,239,235,0.3)' }}>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-primary">Print-ready QR</div>
          <div className="w-24 h-24 bg-surface border border-border rounded-xl p-2 grid place-items-center">
            <FakeQR />
          </div>
          <div className="flex gap-2">
            {['PNG', 'SVG'].map(f => (
              <div key={f} className="text-[10px] font-mono tracking-[0.14em] uppercase bg-surface border border-border rounded-full px-2 py-1">↓ {f}</div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-ink-soft">247 generated</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function FakeChart() {
  const pts = [22, 30, 28, 40, 52, 48, 62, 70, 68, 80, 76, 90, 84, 92, 86, 98, 94, 108, 118, 112, 124, 120, 134, 128, 140];
  const max = Math.max(...pts);
  const w = 100, h = 100;
  const path = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * w;
    const y = h - (p / max) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="bg-cream/50 border border-border rounded-lg p-3 relative" style={{ height: 72 }}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1F4D3A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#chartGrad)" />
        <path d={path} fill="none" stroke="#1F4D3A" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="absolute top-2 right-3 font-mono text-[9px] tracking-[0.14em] uppercase text-muted">Cards / hour</div>
    </div>
  );
}

function MockStep4() {
  const platforms: [string, number, string][] = [
    ['WhatsApp Status', 52, '#25D366'],
    ['Instagram Stories', 28, '#C13584'],
    ['X', 14, '#0F1F18'],
    ['LinkedIn', 6, '#0A66C2'],
  ];
  const topSharers: [string, string, string][] = [
    ['Aisha Ahmed', 'AA', '32 sh.'],
    ['Kwame Mensah', 'KM', '28 sh.'],
    ['Liya Tesfaye', 'LT', '21 sh.'],
    ['Fatou Diop', 'FD', '18 sh.'],
    ['Yusuf Bello', 'YB', '14 sh.'],
  ];
  return (
    <AppChrome url="cardly.app/dashboard · 5th pan-african youth forum" height={380}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 190px' }}>
        <div className="p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted">Total cards generated</div>
              <div className="font-display font-bold text-ink text-[30px] tracking-[-0.03em] leading-none mt-1">1,247</div>
              <div className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase text-success">↑ 38% vs last 24h</div>
            </div>
            <div className="flex gap-1">
              {['24h', '7d', '30d'].map((p, i) => (
                <div key={p} className={`text-[10px] font-mono tracking-[0.14em] uppercase px-2 py-1 rounded ${i === 0 ? 'bg-primary text-cream' : 'text-ink-soft'}`}>{p}</div>
              ))}
            </div>
          </div>
          <FakeChart />
          <div>
            <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted mb-2">Share platforms</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {platforms.map(([n, p, c]) => (
                <div key={n}>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-[10px] text-ink-soft">{n}</span>
                    <span className="font-mono text-[10px] tracking-[0.12em] text-ink font-semibold">{p}%</span>
                  </div>
                  <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                    <div style={{ width: `${p}%`, background: c }} className="h-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="bg-cream/60 border-l border-border p-3 flex flex-col gap-2.5">
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-muted">Top sharers</div>
          {topSharers.map(([n, ii, c]) => (
            <div key={n} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full grid place-items-center text-[9px] font-display font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg, #E8C57E, #C9A45E)', color: '#163828' }}>
                {ii}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-ink truncate">{n}</div>
                <div className="font-mono text-[9px] tracking-[0.14em] text-muted">{c}</div>
              </div>
            </div>
          ))}
          <div className="mt-auto text-[11px] text-primary font-medium inline-flex items-center gap-1">
            Export CSV <ArrowRight size={10} />
          </div>
        </aside>
      </div>
    </AppChrome>
  );
}

function VideoDemo() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="text-center mb-8 lg:mb-10">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">60-second tour</div>
          <h2 className="font-display font-bold text-ink text-[28px] sm:text-[38px] lg:text-[44px] leading-[1.02] tracking-tight">
            See the whole thing in a minute.
          </h2>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-border"
          style={{
            aspectRatio: '16 / 9',
            background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 50%, #2A6A50 100%)',
            boxShadow: '0 8px 40px rgba(15,31,24,0.18)',
          }}>
          <div aria-hidden className="absolute inset-0 opacity-[0.1]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)', backgroundSize: '26px 26px' }} />
          <div className="absolute inset-0 grid place-items-center">
            <div style={{ transform: 'rotate(-4deg)' }}>
              <CardPreview width={180} />
            </div>
          </div>
          <div className="absolute inset-0 grid place-items-center">
            <div className="w-20 h-20 rounded-full grid place-items-center"
              style={{ background: 'rgba(250,246,238,0.95)', backdropFilter: 'blur(8px)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#1F4D3A">
                <path d="M7 4l14 8-14 8V4z" />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent">Demo · coming soon</div>
              <div className="font-display font-semibold text-cream text-[16px] lg:text-[20px] tracking-tight mt-1">
                From upload to first shared card.
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/90">Live product</span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] text-muted">
          Demo video coming soon. Create a free account and try it yourself — setup takes under 20 minutes.
        </p>
      </div>
    </section>
  );
}

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-12 lg:pb-16">
          <div className="max-w-[860px]">
            <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
              How it works
            </div>
            <h1 className="font-display font-bold text-ink text-[40px] sm:text-[56px] lg:text-[70px] leading-[0.95] tracking-tight">
              From idea to thousands of shares{' '}
              <span className="text-primary">in four steps.</span>
            </h1>
            <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[640px]">
              Upload a design. Mark editable zones. Share one link. Watch your
              audience generate their own branded cards — on their phones, in under
              thirty seconds.
            </p>
          </div>

          {/* Quick-jump strip */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {STEPS.map((s, i) => (
              <a key={i} href={`#step-${i + 1}`}
                className="group bg-surface border border-border rounded-2xl p-4 lg:p-5 hover:border-primary/40 hover:shadow-soft transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                    Step {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={14} />
                  </span>
                </div>
                <div className="font-display font-semibold text-ink text-[14px] lg:text-[15px] tracking-tight">{s.short}</div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: '#1F4D3A99' }}>{s.duration}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Step rows — alternating left/right */}
      {STEPS.map((s, i) => {
        const mocks = [<MockStep1 key="1" />, <MockStep2 key="2" />, <MockStep3 key="3" />, <MockStep4 key="4" />];
        const reverse = i % 2 === 1;
        return (
          <section key={s.n} id={`step-${s.n}`} className="relative">
            <div className={`mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <div className="inline-flex items-center gap-2.5 mb-5">
                  <span className="font-mono text-[13px] font-semibold bg-primary text-cream w-9 h-9 rounded-full grid place-items-center">
                    {String(s.n).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-primary">
                    Step {s.n} · {s.duration}
                  </span>
                </div>
                <h2 className="font-display font-bold text-ink text-[26px] sm:text-[36px] lg:text-[42px] leading-[1.0] tracking-tight">
                  {s.title}
                </h2>
                <p className="mt-5 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6] max-w-[520px]">
                  {s.body}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {s.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2.5 text-[14px] lg:text-[15px] text-ink-soft">
                      <span className="text-primary mt-0.5 shrink-0"><Check size={15} /></span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>{mocks[i]}</div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="mx-auto max-w-[1200px] px-5 lg:px-10">
                <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #E5E0D4 30%, #E5E0D4 70%, transparent)' }} />
              </div>
            )}
          </section>
        );
      })}

      {/* Video demo */}
      <VideoDemo />

      {/* CTA */}
      <section className="pb-28">
        <div className="mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-24 text-center">
          <h2 className="font-display font-bold text-ink text-[34px] sm:text-[48px] lg:text-[58px] leading-[0.98] tracking-tight">
            Ten minutes from now,<br className="hidden sm:block" /> your link is live.
          </h2>
          <p className="mt-5 text-ink-soft text-[16px] lg:text-[18px] leading-[1.55] max-w-[520px] mx-auto">
            Free for up to 50 cards. No credit card. Most teams ship their first
            campaign on a coffee break.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-cream font-medium hover:bg-primary-dark transition-colors">
              Start free <ArrowRight size={16} />
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors text-[15px]">
              See pricing <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
