// Studio panels: LeftPanel, Canvas, RightPanel + helpers. Renders the app.

// ── small controls ───────────────────────────────────────────────────
function Seg({ options, value, onChange, className = "" }) {
  return (
    <div className={`inline-flex bg-cream border border-border rounded-lg p-0.5 ${className}`}>
      {options.map((o) => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button key={id} onClick={() => onChange(id)} className={`px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex-1 whitespace-nowrap ${value === id ? "bg-primary text-cream" : "text-ink-soft hover:text-primary"}`}>{label}</button>
        );
      })}
    </div>
  );
}
function IconSeg({ options, value, onChange }) {
  return (
    <div className="inline-flex bg-cream border border-border rounded-lg p-0.5 w-full">
      {options.map(([id, icon]) => {
        const IconC = Icon[icon];
        return (
          <button key={id} onClick={() => onChange(id)} className={`flex-1 py-1.5 grid place-items-center rounded-md transition-colors ${value === id ? "bg-primary text-cream" : "text-ink-soft hover:text-primary"}`}><IconC w={15} /></button>
        );
      })}
    </div>
  );
}
function Slider({ value, min, max, step = 1, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #1F4D3A ${pct}%, #E8EFEB ${pct}%)` }} />
  );
}
function Tgl({ on, onClick }) {
  return <button onClick={onClick} className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${on ? "bg-primary" : "bg-ink/15"}`}><span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} /></button>;
}
function PanelLabel({ children }) { return <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted mb-2">{children}</div>; }

// ── LEFT PANEL ───────────────────────────────────────────────────────
function LeftPanel({ tool, layers, sel, setSel }) {
  return (
    <div className="w-[260px] shrink-0 bg-surface border-r border-border overflow-y-auto att-scroll hidden md:block">
      {tool === "elements" && <ElementsPanel layers={layers} sel={sel} setSel={setSel} />}
      {tool === "templates" && <TemplatesPanel />}
      {tool === "brand" && <BrandPanel />}
      {tool === "background" && <BackgroundPanel />}
    </div>
  );
}

function ElementsPanel({ layers, sel, setSel }) {
  const adds = [
    ["Text field", "TypeT"], ["Photo zone", "ImageZone"], ["Select field", "SelectField"], ["Static text", "Tag"], ["Upload image", "Upload"],
  ];
  return (
    <div>
      <div className="p-3">
        <PanelLabel>Add element</PanelLabel>
        <div className="grid gap-2">
          {adds.map(([label, icon]) => {
            const IconC = Icon[icon];
            return (
              <button key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-cream/40 hover:border-primary/40 hover:bg-primary-soft/40 transition-colors text-left">
                <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><IconC w={16} /></span>
                <span className="text-[13px] font-medium text-ink">{label}</span>
              </button>
            );
          })}
          <button className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-cream/40 text-left">
            <span className="flex items-center gap-2.5"><Icon.ChevRight w={13} className="text-muted" /><span className="text-[13px] font-medium text-ink-soft">Shapes</span></span>
            <span className="font-mono text-[11px] text-muted">4</span>
          </button>
        </div>
      </div>
      <div className="px-3 pb-4">
        <div className="flex items-center justify-between mb-2">
          <PanelLabel>Layers</PanelLabel><span className="font-mono text-[10px] text-muted">{layers.length}</span>
        </div>
        <div className="grid gap-1">
          {layers.map((l) => {
            const IconC = Icon[l.icon] || Icon.TypeT;
            const on = sel === l.id;
            return (
              <button key={l.id} onClick={() => setSel(l.id)} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${on ? "bg-primary text-cream" : "hover:bg-cream text-ink-soft"}`}>
                <IconC w={14} className={on ? "text-cream" : "text-muted"} />
                <span className={`flex-1 text-left text-[12.5px] ${on ? "font-medium" : ""}`}>{l.name}</span>
                <span className={`font-mono text-[9px] tracking-[0.1em] uppercase ${on ? "text-cream/60" : "text-muted/70"}`}>{l.type}</span>
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
    { n: "Attending", g: "linear-gradient(150deg,#0D1F17,#1F4D3A 70%,#2A6A50)" },
    { n: "Speaker", g: "linear-gradient(150deg,#1F4D3A,#2A6A50 60%,#C9A45E)" },
    { n: "Sponsor", g: "linear-gradient(150deg,#163828,#3E7E5E)" },
    { n: "VIP", g: "linear-gradient(150deg,#122e21,#1F4D3A 70%,#C9A45E)" },
    { n: "Volunteer", g: "linear-gradient(160deg,#1F4D3A,#3E7E5E)" },
    { n: "Minimal", g: "linear-gradient(150deg,#0D1F17,#162D22)" },
  ];
  return (
    <div className="p-3">
      <PanelLabel>Card templates</PanelLabel>
      <div className="grid grid-cols-2 gap-2.5">
        {tpls.map((t, i) => (
          <button key={i} className="group rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
            <div className="relative" style={{ aspectRatio: "4/5", background: t.g }}>
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 80% 12%, rgba(232,197,126,0.3), transparent 60%)" }} />
              <div className="absolute inset-x-0 bottom-0 p-2"><span className="inline-block w-10 h-1 rounded-full bg-accent/70 mb-1" /><div className="w-3/4 h-1 rounded-full bg-cream/40" /></div>
            </div>
            <div className="px-2 py-1.5 text-[11.5px] font-medium text-ink text-left">{t.n}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BrandPanel() {
  const colors = ["#1F4D3A", "#163828", "#2A6A50", "#E8C57E", "#C9A45E", "#FAF6EE"];
  return (
    <div className="p-3 grid gap-5">
      <div>
        <PanelLabel>Logo</PanelLabel>
        <div className="aspect-[3/2] rounded-xl border border-dashed border-primary/40 bg-cream/50 grid place-items-center text-primary"><div className="text-center"><Icon.Upload w={18} /><div className="text-[11px] mt-1.5 font-medium">Upload logo</div></div></div>
      </div>
      <div>
        <PanelLabel>Brand colors</PanelLabel>
        <div className="grid grid-cols-6 gap-1.5">{colors.map((c, i) => <span key={i} className="aspect-square rounded-lg border border-border" style={{ background: c }} />)}</div>
      </div>
      <div>
        <PanelLabel>Brand fonts</PanelLabel>
        <div className="grid gap-2">
          <div className="px-3 py-2 rounded-lg border border-border bg-cream/40"><div className="font-display text-[15px] font-semibold text-ink">DM Sans</div><div className="font-mono text-[10px] text-muted">Display</div></div>
          <div className="px-3 py-2 rounded-lg border border-border bg-cream/40"><div className="text-[14px] text-ink" style={{ fontFamily: "Inter" }}>Inter</div><div className="font-mono text-[10px] text-muted">Body</div></div>
        </div>
      </div>
      <div className="rounded-xl p-3 text-[12px] text-ink-soft leading-snug" style={{ background: "rgba(232,197,126,0.16)", border: "1px solid rgba(232,197,126,0.4)" }}>
        <span className="inline-flex items-center gap-1.5 text-accent-dark font-medium mb-1"><Icon.Sparkle w={12} /> Brand kit applied</span>
        Your colors, logo and fonts auto-apply to every card variant.
      </div>
    </div>
  );
}

function BackgroundPanel() {
  const grads = [
    "linear-gradient(150deg,#0D1F17,#1F4D3A 70%,#2A6A50)",
    "linear-gradient(150deg,#1F4D3A,#2A6A50 60%,#C9A45E)",
    "linear-gradient(150deg,#122e21,#1F4D3A)",
    "linear-gradient(150deg,#163828,#3E7E5E)",
    "linear-gradient(150deg,#241733,#5a4a7a)",
    "linear-gradient(150deg,#2b160c,#9a6038)",
  ];
  return (
    <div className="p-3 grid gap-5">
      <div>
        <PanelLabel>Background type</PanelLabel>
        <Seg options={[{ id: "gradient", label: "Gradient" }, { id: "solid", label: "Solid" }, { id: "image", label: "Image" }]} value="gradient" onChange={() => {}} className="w-full" />
      </div>
      <div>
        <PanelLabel>Gradient presets</PanelLabel>
        <div className="grid grid-cols-3 gap-2">{grads.map((g, i) => <button key={i} className={`aspect-square rounded-xl border transition-all ${i === 0 ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"}`} style={{ background: g }} />)}</div>
      </div>
      <div>
        <PanelLabel>Texture</PanelLabel>
        <div className="grid gap-2">
          {[["Hex mesh", true], ["Dot grid", true], ["Topographic", false], ["None", false]].map(([l, on], i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-cream/40"><span className="text-[12.5px] text-ink-soft">{l}</span><Tgl on={on} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CANVAS ───────────────────────────────────────────────────────────
function Canvas({ sel, setSel, ns, setNs, scale, previewW }) {
  const tfMap = { none: "none", AA: "uppercase", aa: "lowercase" };
  const nameStyle = {
    fontFamily: FONTS[ns.font], fontWeight: WEIGHTS[ns.weight], fontSize: Math.max(11, ns.size * scale),
    textAlign: ns.align, textTransform: tfMap[ns.transform] || "none", color: ns.color, lineHeight: 1.1,
  };
  return (
    <div onClick={() => setSel(null)} className="flex-1 relative overflow-auto att-scroll grid place-items-center p-8"
      style={{ background: "#EFE9DC", backgroundImage: "radial-gradient(circle, rgba(15,31,24,0.06) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
      {/* canvas size chip */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1 font-mono text-[10px] text-muted shadow-sm">
        <span>canvas 4500 × 5625 px</span><span className="text-border">|</span><span className="text-primary">19%</span>
      </div>

      {/* the card */}
      <div className="relative" style={{ width: previewW }}>
        <div className="relative rounded-[16px] overflow-hidden" style={{ width: previewW, aspectRatio: "4500/5625", background: "linear-gradient(165deg,#0D1F17 0%,#1F4D3A 58%,#235741 105%)", boxShadow: "0 30px 70px -28px rgba(13,31,23,0.6)" }}>
          {/* texture */}
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 40% at 50% 38%, rgba(232,197,126,0.18), transparent 65%)" }} />
          <svg aria-hidden viewBox="0 0 200 250" className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
            <polygon points="100,70 140,95 140,140 100,165 60,140 60,95" fill="none" stroke="#E8C57E" strokeWidth="0.6" />
            <circle cx="100" cy="118" r="44" fill="none" stroke="#E8C57E" strokeWidth="0.5" />
          </svg>
          <div aria-hidden className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(232,197,126,0.10) 0.5px, transparent 0.5px)", backgroundSize: "10px 10px" }} />

          {/* content */}
          <div className="relative h-full flex flex-col items-center text-center" style={{ padding: previewW * 0.075 }}>
            <Zone id="kicker" sel={sel} onSelect={setSel}>
              <div className="font-display font-medium text-accent tracking-[0.28em]" style={{ fontSize: previewW * 0.038 }}>I'M ATTENDING</div>
            </Zone>
            <Zone id="evtitle" sel={sel} onSelect={setSel} className="mt-3">
              <div className="font-display font-bold text-cream leading-[0.98] tracking-[-0.02em]" style={{ fontSize: previewW * 0.135 }}>Africa Tech<br />Festival</div>
            </Zone>
            <div className="my-4" style={{ width: "62%", height: 1, background: "rgba(232,197,126,0.3)" }} />
            <Zone id="qr" sel={sel} onSelect={setSel} className="my-1">
              <div style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.3))" }}><QRBlock size={previewW * 0.34} /></div>
            </Zone>

            {/* the editable name field — with floating toolbar */}
            <div className="relative mt-4" style={{ width: "92%" }}>
              {sel === "name" && <FloatToolbar ns={ns} setNs={setNs} />}
              <Zone id="name" sel={sel} onSelect={setSel}>
                <div style={nameStyle}>Your Name Here</div>
              </Zone>
            </div>
            <Zone id="title" sel={sel} onSelect={setSel} className="mt-2">
              <div className="text-cream/85" style={{ fontSize: previewW * 0.05 }}>Your Title here</div>
            </Zone>

            <div className="mt-auto w-full">
              <div className="mx-auto mb-3" style={{ width: "62%", height: 1, background: "rgba(232,197,126,0.3)" }} />
              <Zone id="date" sel={sel} onSelect={setSel}>
                <div className="font-mono text-accent tracking-[0.16em]" style={{ fontSize: previewW * 0.04 }}>JUN 12–14 · NAIROBI</div>
              </Zone>
              <div className="font-mono text-cream/45 tracking-[0.12em] mt-2" style={{ fontSize: previewW * 0.032 }}>#ATF2026</div>
              <div className="font-mono text-cream/25 tracking-[0.18em] mt-3" style={{ fontSize: previewW * 0.026 }}>MADE WITH KARTA</div>
            </div>
          </div>
        </div>
      </div>

      {/* zoom controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface border border-border rounded-xl px-2 py-1.5 shadow-sm">
        <button className="w-7 h-7 grid place-items-center rounded-lg text-ink-soft hover:bg-primary-soft hover:text-primary text-[15px]">−</button>
        <span className="font-mono text-[11px] text-ink px-1 w-9 text-center">19%</span>
        <button className="w-7 h-7 grid place-items-center rounded-lg text-ink-soft hover:bg-primary-soft hover:text-primary text-[15px]">+</button>
        <span className="w-px h-5 bg-border mx-0.5" />
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-ink-soft hover:bg-primary-soft hover:text-primary text-[12px]"><Icon.Move w={13} /> Fit</button>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-ink-soft hover:bg-primary-soft hover:text-primary text-[12px]"><Icon.Grid w={13} /> Grid</button>
      </div>
    </div>
  );
}

function FloatToolbar({ ns, setNs }) {
  return (
    <div onClick={(e) => e.stopPropagation()} className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-surface border border-border rounded-xl px-1.5 py-1 shadow-lg whitespace-nowrap" style={{ boxShadow: "0 10px 28px -12px rgba(15,31,24,0.4)" }}>
      <select value={ns.font} onChange={(e) => setNs({ ...ns, font: e.target.value })} className="text-[11px] bg-cream border border-border rounded-md px-1.5 py-1 text-ink outline-none">
        <option value="DM">DM Sans</option><option value="Inter">Inter</option><option value="JetBrains">JetBrains</option>
      </select>
      <div className="flex items-center bg-cream border border-border rounded-md">
        <button onClick={() => setNs({ ...ns, size: Math.max(12, ns.size - 8) })} className="w-6 h-6 grid place-items-center text-ink-soft hover:text-primary">−</button>
        <span className="font-mono text-[10.5px] text-ink w-7 text-center">{ns.size}</span>
        <button onClick={() => setNs({ ...ns, size: Math.min(360, ns.size + 8) })} className="w-6 h-6 grid place-items-center text-ink-soft hover:text-primary">+</button>
      </div>
      <button onClick={() => setNs({ ...ns, weight: ns.weight === "Bold" ? "Reg" : "Bold" })} className={`w-6 h-6 grid place-items-center rounded-md text-[12px] font-bold ${ns.weight === "Bold" ? "bg-primary text-cream" : "text-ink-soft hover:bg-cream"}`}>B</button>
      <span className="w-px h-5 bg-border mx-0.5" />
      {[["left", "AlignLeft"], ["center", "AlignCenter"], ["right", "AlignRight"]].map(([a, ic]) => {
        const IconC = Icon[ic];
        return <button key={a} onClick={() => setNs({ ...ns, align: a })} className={`w-6 h-6 grid place-items-center rounded-md ${ns.align === a ? "bg-primary text-cream" : "text-ink-soft hover:bg-cream"}`}><IconC w={13} /></button>;
      })}
      <span className="w-px h-5 bg-border mx-0.5" />
      <span className="w-6 h-6 grid place-items-center rounded-md" title="Color"><span className="w-4 h-4 rounded border border-border" style={{ background: ns.color }} /></span>
      <button className="w-6 h-6 grid place-items-center rounded-md text-ink-soft hover:bg-cream"><Icon.Copy w={13} /></button>
      <button className="w-6 h-6 grid place-items-center rounded-md text-danger hover:bg-red-50"><Icon.Trash w={13} /></button>
    </div>
  );
}

window.LeftPanel = LeftPanel;
window.Canvas = Canvas;
