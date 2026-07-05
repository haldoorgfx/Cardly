// Studio right properties panel + app render.

const TEXT_ZONES = { kicker: "Static text", evtitle: "Event title", name: "Text field", title: "Text field", title2: "Text field", date: "Static text" };

function FieldInput({ label, value }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted mb-1.5">{label}</div>
      <input defaultValue={value} className="w-full bg-cream border border-border rounded-lg px-3 py-2 text-[13px] text-ink focus:border-accent outline-none transition-colors" />
    </div>
  );
}

function RightPanel({ sel, ns, setNs, layers }) {
  const isText = sel && TEXT_ZONES[sel];
  const isImage = sel === "qr" || sel === "photo";
  const zoneName = sel ? (TEXT_ZONES[sel] || (sel === "qr" ? "QR code" : sel === "photo" ? "Photo zone" : "Element")) : null;
  const zoneKind = isText ? "Text zone" : isImage ? "Image zone" : "Card";

  return (
    <div className="w-[300px] shrink-0 bg-surface border-l border-border overflow-y-auto att-scroll hidden lg:block">
      {/* breadcrumb */}
      <div className="px-4 pt-3.5 pb-3 border-b border-border/70">
        <button className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase text-muted hover:text-primary transition-colors">
          <Icon.ChevLeft w={13} /> Event / Attendee
        </button>
        {sel ? (
          <div className="flex items-center gap-2 mt-3">
            <span className="w-7 h-7 rounded-lg bg-primary-soft text-primary grid place-items-center">{isText ? <Icon.TypeT w={15} /> : <Icon.ImageZone w={15} />}</span>
            <div>
              <div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-muted">{zoneKind}</div>
              <div className="font-display text-[14px] font-semibold text-ink tracking-tight leading-none mt-0.5">{zoneName}</div>
            </div>
            <span className="ml-auto font-mono text-[10px] text-muted">#avnt</span>
          </div>
        ) : (
          <div className="mt-3 font-display text-[14px] font-semibold text-ink">Card settings</div>
        )}
      </div>

      {!sel && <CardProps />}
      {isImage && <ImageProps sel={sel} />}
      {isText && (
        <React.Fragment>
          <FieldSection ns={ns} setNs={setNs} />
          <TypographySection ns={ns} setNs={setNs} />
        </React.Fragment>
      )}
    </div>
  );
}

function CardProps() {
  return (
    <div className="p-4 grid gap-5">
      <div>
        <PanelLabel>Card size</PanelLabel>
        <Seg options={[{ id: "story", label: "Story 4:5" }, { id: "square", label: "Square" }, { id: "wide", label: "Wide" }]} value="story" onChange={() => {}} className="w-full" />
        <div className="font-mono text-[10px] text-muted mt-2">4500 × 5625 px · 300 DPI</div>
      </div>
      <div>
        <PanelLabel>Background</PanelLabel>
        <div className="rounded-xl h-16 border border-border" style={{ background: "linear-gradient(165deg,#0D1F17,#1F4D3A 58%,#235741)" }} />
      </div>
      <div className="rounded-xl p-3 text-[12px] text-ink-soft leading-snug bg-primary-soft/50 border border-primary/15">
        Select any element on the card to edit its content and style.
      </div>
    </div>
  );
}

function ImageProps({ sel }) {
  return (
    <div className="p-4 grid gap-5">
      <div>
        <PanelLabel>Source</PanelLabel>
        <Seg options={sel === "qr" ? [{ id: "auto", label: "Auto QR" }, { id: "custom", label: "Custom" }] : [{ id: "attendee", label: "Attendee photo" }, { id: "fixed", label: "Fixed" }]} value={sel === "qr" ? "auto" : "attendee"} onChange={() => {}} className="w-full" />
      </div>
      {sel === "qr" ? (
        <div className="rounded-xl p-3 text-[12px] text-ink-soft leading-snug bg-cream border border-border">The QR auto-links to each attendee's check-in pass. It regenerates per registration.</div>
      ) : (
        <div className="rounded-xl p-3 text-[12px] text-ink-soft leading-snug bg-cream border border-border">Pulls the attendee's uploaded photo at registration. Falls back to their initials.</div>
      )}
      <div><PanelLabel>Fit</PanelLabel><Seg options={[{ id: "cover", label: "Cover" }, { id: "contain", label: "Contain" }]} value="cover" onChange={() => {}} className="w-full" /></div>
      <div><PanelLabel>Corner radius</PanelLabel><Slider value={12} min={0} max={50} onChange={() => {}} /></div>
      <div className="flex items-center justify-between"><span className="text-[12.5px] text-ink-soft">Drop shadow</span><Tgl on={true} /></div>
    </div>
  );
}

function FieldSection({ ns, setNs }) {
  return (
    <div className="p-4 border-b border-border/70 grid gap-4">
      <PanelLabel>Field</PanelLabel>
      <FieldInput label="Label" value="Full name" />
      <div className="rounded-xl p-3 bg-cream border border-border">
        <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mb-2">Attendee sees</div>
        <div className="grid gap-1 text-[11.5px] text-ink-soft leading-snug">
          <div><span className="font-medium text-ink">Label</span> → field title in the form</div>
          <div><span className="font-medium text-ink">Placeholder</span> → hint below the title</div>
          <div><span className="font-medium text-ink">Preview text</span> → sample shown on card</div>
        </div>
      </div>
      <FieldInput label="Placeholder" value="Your Name Here" />
      <FieldInput label="Preview text" value="Your Name Here" />
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-ink font-medium">Required</span>
        <Tgl on={ns.required} onClick={() => setNs({ ...ns, required: !ns.required })} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2"><span className="text-[11.5px] text-muted">Max chars · {ns.maxChars}</span></div>
        <Slider value={ns.maxChars} min={10} max={200} onChange={(v) => setNs({ ...ns, maxChars: v })} />
      </div>
    </div>
  );
}

function TypographySection({ ns, setNs }) {
  const sizes = [12, 18, 24, 32, 48, 64, 96, 128];
  const swatches = ["#FAF6EE", "#E8C57E", "#C9A45E", "#237A55", "#1F4D3A", "#0F1F18"];
  return (
    <div className="p-4 grid gap-4">
      <PanelLabel>Typography</PanelLabel>
      <div>
        <div className="text-[11.5px] text-muted mb-1.5">Font</div>
        <Seg options={[{ id: "DM", label: "DM" }, { id: "Inter", label: "Inter" }, { id: "JetBrains", label: "JetBrains" }]} value={ns.font} onChange={(v) => setNs({ ...ns, font: v })} className="w-full" />
      </div>
      <div>
        <div className="text-[11.5px] text-muted mb-1.5">Weight</div>
        <Seg options={[{ id: "Light", label: "Light" }, { id: "Reg", label: "Reg" }, { id: "SBd", label: "SBd" }, { id: "Bold", label: "Bold" }]} value={ns.weight} onChange={(v) => setNs({ ...ns, weight: v })} className="w-full" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11.5px] text-muted">Size · {ns.size}px</span>
        </div>
        <Slider value={ns.size} min={12} max={300} onChange={(v) => setNs({ ...ns, size: v })} />
        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
          {sizes.map((s) => (
            <button key={s} onClick={() => setNs({ ...ns, size: s })} className={`py-1.5 rounded-md text-[11px] font-mono border transition-colors ${ns.size === s ? "bg-primary text-cream border-primary" : "bg-cream border-border text-ink-soft hover:border-primary/40"}`}>{s}</button>
          ))}
          <button className="col-span-2 py-1.5 rounded-md text-[10.5px] border border-dashed border-border text-muted inline-flex items-center justify-center gap-1"><Icon.Lock w={10} /> Auto-height</button>
        </div>
      </div>
      <div>
        <div className="text-[11.5px] text-muted mb-1.5">Horizontal</div>
        <IconSeg options={[["left", "AlignLeft"], ["center", "AlignCenter"], ["right", "AlignRight"], ["justify", "AlignJustify"]]} value={ns.align} onChange={(v) => setNs({ ...ns, align: v })} />
      </div>
      <div>
        <div className="text-[11.5px] text-muted mb-1.5">Transform</div>
        <Seg options={[{ id: "none", label: "Aa" }, { id: "AA", label: "AA" }, { id: "aa", label: "aa" }]} value={ns.transform} onChange={(v) => setNs({ ...ns, transform: v })} className="w-full" />
      </div>
      <div>
        <div className="text-[11.5px] text-muted mb-2">Text color</div>
        <div className="flex items-center gap-2">
          {swatches.map((c) => (
            <button key={c} onClick={() => setNs({ ...ns, color: c })} className={`w-7 h-7 rounded-lg border transition-all ${ns.color === c ? "ring-2 ring-offset-1 ring-primary border-primary" : "border-border"}`} style={{ background: c }} />
          ))}
          <span className="ml-auto font-mono text-[10.5px] text-muted">{ns.color.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}

window.RightPanel = RightPanel;

ReactDOM.createRoot(document.getElementById("root")).render(<Studio />);
