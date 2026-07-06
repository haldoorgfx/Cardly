// Karta Card Studio — canvas card editor, forest/cream/gold platform brand.

const FONTS = { DM: '"DM Sans"', Inter: '"Inter"', JetBrains: '"JetBrains Mono"' };
const WEIGHTS = { Light: 300, Reg: 400, SBd: 600, Bold: 700 };
const CANVAS_W = 4500;

// ── decorative QR ────────────────────────────────────────────────────
function QRBlock({ size = 132 }) {
  const n = 21, c = size / n;
  const seed = (x, y) => ((x * 13 + y * 7 + x * y * 3) % 5) > 1;
  const finder = (gx, gy) => (
    <g key={`f${gx}-${gy}`}>
      <rect x={gx * c} y={gy * c} width={c * 7} height={c * 7} fill="#0F1F18" />
      <rect x={(gx + 1) * c} y={(gy + 1) * c} width={c * 5} height={c * 5} fill="#fff" />
      <rect x={(gx + 2) * c} y={(gy + 2) * c} width={c * 3} height={c * 3} fill="#0F1F18" />
    </g>
  );
  const dots = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    if (!inF && seed(x, y)) dots.push(<rect key={`${x}-${y}`} x={x * c} y={y * c} width={c} height={c} fill="#0F1F18" />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-md">
      <rect width={size} height={size} rx="6" fill="#fff" />
      {dots}{finder(0, 0)}{finder(14, 0)}{finder(0, 14)}
    </svg>
  );
}

// ── selection wrapper ────────────────────────────────────────────────
function Zone({ id, sel, onSelect, children, className = "" }) {
  const active = sel === id;
  return (
    <div onClick={(e) => { e.stopPropagation(); onSelect(id); }} className={`relative cursor-pointer ${className}`}>
      {children}
      {active && (
        <div className="absolute -inset-2 pointer-events-none rounded-sm" style={{ outline: "1.5px solid #1F4D3A", outlineOffset: 0 }}>
          {[["−left-1 −top-1", "left:-4px;top:-4px"], 0].slice(0, 0)}
          {[[-4, -4], [-4, "calc(100% - 4px)"], ["calc(100% - 4px)", -4], ["calc(100% - 4px)", "calc(100% - 4px)"]].map((p, i) => (
            <span key={i} className="absolute w-2 h-2 bg-surface border border-primary rounded-sm" style={{ left: p[0], top: p[1] }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
function Studio() {
  const [tool, setTool] = React.useState("elements");
  const [variant, setVariant] = React.useState("attendee");
  const [sel, setSel] = React.useState("name");
  // live-editable style for the name field
  const [ns, setNs] = React.useState({ font: "DM", weight: "Bold", size: 200, align: "center", transform: "none", color: "#237A55", required: false, maxChars: 110 });

  const scale = 0.084; // 4500px canvas → ~378px preview
  const previewW = CANVAS_W * scale;

  const layers = [
    { id: "qr", name: "quickqr (1)", type: "image", icon: "ImageZone" },
    { id: "title2", name: "Text field copy", type: "text", icon: "TypeT" },
    { id: "name", name: "Text field", type: "text", icon: "TypeT" },
    { id: "photo", name: "Photo", type: "photo", icon: "ImageZone" },
  ];
  const variants = [["attendee", "Attendee", 4], ["dssw", "dssw", 0], ["wrwrw32", "wrwrw32", 0], ["r2r2", "r2r2", 0], ["rwrwrw", "rwrwrw", 0]];

  return (
    <div className="h-screen flex flex-col bg-cream text-ink overflow-hidden">
      <TopBar />
      <VariantTabs variants={variants} variant={variant} setVariant={setVariant} />
      <div className="flex-1 flex overflow-hidden">
        <LeftRail tool={tool} setTool={setTool} />
        <LeftPanel tool={tool} layers={layers} sel={sel} setSel={setSel} />
        <Canvas sel={sel} setSel={setSel} ns={ns} setNs={setNs} scale={scale} previewW={previewW} />
        <RightPanel sel={sel} ns={ns} setNs={setNs} layers={layers} />
      </div>
    </div>
  );
}

// ── top bar ──────────────────────────────────────────────────────────
function TopBar() {
  return (
    <header className="h-12 shrink-0 bg-primary-dark text-cream flex items-center justify-between px-3 border-b border-black/20">
      <div className="flex items-center gap-3 min-w-0">
        <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-cream/10"><Icon.ChevLeft w={18} /></button>
        <span className="w-7 h-7 rounded-md grid place-items-center font-display font-bold text-[13px] text-primary-dark" style={{ background: "linear-gradient(135deg,#FAF6EE,#E8C57E)" }}>K</span>
        <div className="flex items-center gap-2 text-[13px] min-w-0">
          <span className="text-cream/55">Events</span><span className="text-cream/30">/</span>
          <span className="font-medium inline-flex items-center gap-1.5">#PAYF2025 <Icon.Pencil w={12} style={{ opacity: 0.5 }} /></span>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-3 text-[12.5px]">
        <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-cream/10 text-cream/70"><Icon.Undo w={16} /></button>
        <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-cream/10 text-cream/70"><Icon.Redo w={16} /></button>
        <span className="inline-flex items-center gap-1.5 text-cream/55"><Icon.Check w={13} style={{ color: "#8FC0A2" }} /> Saved just now</span>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-cream/10 text-cream/80"><Icon.Copy w={14} /> Copy style</button>
        <button className="w-8 h-8 grid place-items-center rounded-lg hover:bg-cream/10 text-cream/55"><Icon.Help w={15} /></button>
      </div>
      <div className="flex items-center gap-2">
        <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream/10 border border-cream/15 text-[12.5px] font-medium hover:bg-cream/15"><Icon.Eye w={14} /> Preview</button>
        <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream/10 border border-cream/15 text-[12.5px] font-medium hover:bg-cream/15"><Icon.Play w={13} /> Test</button>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-accent text-primary-dark text-[12.5px] font-semibold hover:bg-accent-dark"><Icon.Globe w={14} /> Publish</button>
      </div>
    </header>
  );
}

// ── variant tabs ─────────────────────────────────────────────────────
function VariantTabs({ variants, variant, setVariant }) {
  return (
    <div className="h-11 shrink-0 bg-cream border-b border-border flex items-center justify-between px-3 gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto att-noscroll">
        <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-muted mr-1.5 shrink-0">Variants</span>
        {variants.map(([id, label, n]) => (
          <button key={id} onClick={() => setVariant(id)} className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${variant === id ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border hover:border-primary/40"}`}>
            <span className={`w-2 h-2 rounded-sm ${variant === id ? "bg-accent" : "bg-border"}`} />{label}
            <span className={`font-mono text-[10px] ${variant === id ? "text-cream/60" : "text-muted"}`}>{n}</span>
          </button>
        ))}
        <button className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium border border-dashed border-border text-muted hover:text-primary hover:border-primary/40"><Icon.Plus w={13} /> Add variant</button>
      </div>
      <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted shrink-0 hidden lg:inline">4500 × 5625 px</span>
    </div>
  );
}

// ── far-left icon rail ───────────────────────────────────────────────
function LeftRail({ tool, setTool }) {
  const tabs = [["elements", "Elements", "Grid"], ["templates", "Templates", "Layout"], ["brand", "Brand", "Palette"], ["background", "Background", "ImageZone"]];
  return (
    <div className="w-[68px] shrink-0 bg-cream border-r border-border flex flex-col items-center py-3 gap-1">
      {tabs.map(([id, label, icon]) => {
        const IconC = Icon[icon] || Icon.Grid;
        const on = tool === id;
        return (
          <button key={id} onClick={() => setTool(id)} className={`w-[52px] py-2 rounded-xl grid place-items-center gap-1 transition-colors ${on ? "bg-primary-soft text-primary" : "text-muted hover:text-primary hover:bg-primary-soft/50"}`}>
            <IconC w={20} /><span className="text-[9px] font-medium tracking-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

window.Studio = Studio;
window.QRBlock = QRBlock;
window.Zone = Zone;
