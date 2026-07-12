// Event-level · Manage: Event Page editor, Tickets, Check-in, Karta Card

// ── Tickets ──────────────────────────────────────────────────────────
function TicketsPage({ event, onModal }) {
  const tickets = [
    { name: "Early bird", price: "₦9,000", sold: 150, cap: 150, status: "Sold out", tone: "neutral", window: "Closed · sold out" },
    { name: "General admission", price: "₦15,000", sold: 84, cap: 300, status: "On sale", tone: "green", window: "Until 11 Mar" },
    { name: "VIP · front row", price: "₦40,000", sold: 13, cap: 25, status: "On sale", tone: "green", window: "Until 11 Mar" },
    { name: "Student", price: "₦5,000", sold: 0, cap: 100, status: "Scheduled", tone: "amber", window: "Opens 20 Feb" },
  ];
  const promos = [
    { code: "EARLY20", desc: "20% off · all tickets", used: 42, limit: 100 },
    { code: "PARTNER", desc: "Free · partner orgs", used: 8, limit: 20 },
  ];
  return (
    <PageShell
      title="Tickets"
      subtitle="4 ticket types · ₦4.2M collected · 247 sold"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Generating sales report…")}>Sales report</Btn><Btn variant="primary" icon="Plus" onClick={() => onModal && onModal({ type: "create-ticket" })}>Create ticket type</Btn></>}
    >
      <StatCards cols={4} items={[
        { label: "Revenue", value: "₦4.2M", icon: "Dollar", delta: "18% wk", deltaUp: true },
        { label: "Tickets sold", value: "247", icon: "Ticket" },
        { label: "Avg. order", value: "₦17k", icon: "CreditCard" },
        { label: "Conversion", value: "31%", icon: "Chart", delta: "4%", deltaUp: true },
      ]} />

      <SectionLabel>Ticket types</SectionLabel>
      <div className="grid gap-3 mb-7">
        {tickets.map((t, i) => {
          const pct = Math.round((t.sold / t.cap) * 100);
          return (
            <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-5 hover:border-primary/40 transition-colors">
              <span className="w-11 h-11 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Ticket w={20} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[15px] font-semibold text-ink tracking-tight truncate">{t.name}</span>
                  <Pill tone={t.tone} className="shrink-0">{t.status}</Pill>
                </div>
                <div className="font-mono text-[12px] text-muted mt-1 truncate">{t.window}</div>
              </div>
              <div className="hidden lg:block w-[160px] shrink-0">
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
                  <span className="text-ink-soft">{t.sold}/{t.cap}</span>
                  <span className="text-muted">{pct}%</span>
                </div>
                <ProgressBar pct={pct} color={pct >= 100 ? CHART.goldDark : CHART.forest} />
              </div>
              <div className="text-right shrink-0 w-[84px]">
                <div className="font-mono text-[15px] text-primary tracking-tight">{t.price}</div>
              </div>
              <button className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors shrink-0"><Icon.Gear w={15} /></button>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Promo codes" action={<Btn icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Add promo code", subtitle: "Create a discount code for this event", fields: [{ cols: 2, items: [{ label: "Code", value: "EARLY20", mono: true }, { label: "Discount", value: "20%", mono: true }] }, { cols: 2, items: [{ label: "Max uses", value: "100", mono: true }, { label: "Applies to", value: "All tickets" }] }], submitLabel: "Create code", submitIcon: "Plus", onConfirm: () => window.toast && window.toast("Promo code created") })}>Add code</Btn>}>
          <div className="grid gap-2.5">
            {promos.map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-cream/60 border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] font-semibold text-primary bg-primary-soft px-2 py-1 rounded">{p.code}</span>
                  <span className="text-[13px] text-ink-soft">{p.desc}</span>
                </div>
                <span className="font-mono text-[11.5px] text-muted">{p.used}/{p.limit} used</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Checkout settings">
          <div className="grid gap-3.5">
            {[
              ["Collect attendee details", "Name, email, organization", true],
              ["Require approval", "Manually approve each registrant", false],
              ["Show remaining tickets", "Display scarcity on event page", true],
              ["Apply 7.5% VAT", "Add tax at checkout", true],
            ].map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13.5px] text-ink font-medium">{r[0]}</div>
                  <div className="text-[12px] text-muted mt-0.5">{r[1]}</div>
                </div>
                <Toggle on={r[2]} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

// ── Check-in ─────────────────────────────────────────────────────────
function CheckInPage({ event }) {
  const feed = [
    { n: "Kwame Mensah", t: "Speaker", when: "just now", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Thandi Mokoena", t: "General", when: "1 min ago", g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Adebayo Dada", t: "VIP", when: "2 min ago", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "Yusuf Bello", t: "General", when: "3 min ago", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Liya Tesfaye", t: "General", when: "4 min ago", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
  ];
  return (
    <PageShell title="Check-in" subtitle="Live · Africa Tech Festival 2026" max="1100px"
      actions={<><Btn icon="Gear" onClick={() => window.toast && window.toast("Check-in settings")}>Settings</Btn><Btn variant="primary" icon="Scan" onClick={() => window.toast && window.toast("Opening QR scanner — point at a ticket")}>Open scanner</Btn></>}>
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5">
        {/* Scanner */}
        <div className="bg-primary-dark rounded-2xl p-6 relative overflow-hidden">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 50% 0%, rgba(232,197,126,0.18), transparent 60%)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-cream/60">QR Scanner</span>
              <Pill tone="green" dot="#34D399"><span className="text-emerald-300">Camera live</span></Pill>
            </div>
            <div className="aspect-square rounded-2xl border-2 border-cream/15 bg-primary/40 grid place-items-center relative overflow-hidden mb-5">
              {/* corner frames */}
              {[["top-4 left-4", "border-t-2 border-l-2"], ["top-4 right-4", "border-t-2 border-r-2"], ["bottom-4 left-4", "border-b-2 border-l-2"], ["bottom-4 right-4", "border-b-2 border-r-2"]].map((c, i) => (
                <span key={i} className={`absolute w-10 h-10 rounded-sm ${c[0]} ${c[1]} border-accent`} />
              ))}
              <span className="absolute left-6 right-6 h-0.5 bg-accent/70" style={{ boxShadow: "0 0 12px #E8C57E" }} />
              <Icon.Scan w={56} style={{ color: "rgba(250,246,238,0.25)" }} />
            </div>
            <div className="bg-cream/10 border border-cream/15 rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Icon.Search w={15} style={{ color: "rgba(250,246,238,0.5)" }} />
              <span className="text-[13px] text-cream/55">Or search by name / ticket ID…</span>
            </div>
          </div>
        </div>

        {/* Stats + feed */}
        <div className="grid gap-5">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Checked in" value="189" icon="Check" />
            <StatCard label="Of 247" value="77%" icon="Users" />
            <StatCard label="Rate / hr" value="64" icon="Clock" accent />
          </div>
          <div className="mb-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] text-ink-soft">Arrivals progress</span>
              <span className="font-mono text-[12px] text-primary">189 / 247</span>
            </div>
            <ProgressBar pct={77} height={10} />
          </div>
          <Panel title="Live check-in feed" pad="p-0" action={<Pill tone="green" dot="#2D7A4F">Live</Pill>}>
            <div className="divide-y divide-border/60">
              {feed.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Avatar initials={f.n.split(" ").map((x) => x[0]).join("")} grad={f.g} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-ink truncate">{f.n}</div>
                    <div className="font-mono text-[11px] text-muted">{f.t}</div>
                  </div>
                  <span className="text-emerald-600 shrink-0"><Icon.Check w={16} /></span>
                  <span className="font-mono text-[11px] text-muted w-[64px] text-right shrink-0">{f.when}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

// ── Event Page editor ────────────────────────────────────────────────
function EventPageEditor({ event }) {
  const sections = [
    { name: "Cover & hero", on: true, locked: true },
    { name: "About this event", on: true },
    { name: "Agenda", on: true },
    { name: "Speakers", on: true },
    { name: "Tickets", on: true },
    { name: "Location & map", on: true },
    { name: "Sponsors", on: false },
    { name: "FAQ", on: false },
  ];
  return (
    <PageShell title="Event Page" subtitle="Design your public event page" max="1180px"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Opening preview in a new tab")}>Preview</Btn><Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Event page published")}>Publish changes</Btn></>}>
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        {/* Section list */}
        <div>
          <Panel title="Page sections" action={<Btn icon="Plus">Add</Btn>} pad="p-3">
            <div className="grid gap-1">
              {sections.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-cream/70 transition-colors group">
                  <span className="text-muted/50 cursor-grab"><Icon.Grid w={13} /></span>
                  <span className={`flex-1 text-[13px] ${s.on ? "text-ink" : "text-muted"}`}>{s.name}</span>
                  {s.locked ? <span className="text-muted/40"><Icon.Lock w={12} /></span> : <Toggle on={s.on} />}
                </div>
              ))}
            </div>
          </Panel>
          <div className="mt-4">
            <Panel title="Theme">
              <div className="flex items-center gap-2">
                {["#1F4D3A", "#163828", "#2A6A50", "#7A3B2E", "#2E4A7A"].map((c, i) => (
                  <span key={i} className={`w-7 h-7 rounded-full cursor-pointer ${i === 0 ? "ring-2 ring-offset-2 ring-primary" : ""}`} style={{ background: c }} />
                ))}
              </div>
            </Panel>
          </div>
        </div>

        {/* Live preview */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="h-9 bg-cream border-b border-border flex items-center gap-2 px-4">
            <span className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="w-2 h-2 rounded-full bg-ink/15" />)}</span>
            <div className="ml-2 flex-1 max-w-[280px] h-5 rounded bg-surface border border-border flex items-center px-2 font-mono text-[10px] text-muted">eventera.so/{event.slug}</div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {/* cover */}
            <div className="relative h-[200px] px-7 flex flex-col justify-end pb-6" style={{ background: event.grad }}>
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.3), transparent 55%)" }} />
              <div className="relative">
                <Pill tone="gold" className="mb-3 bg-cream/95">Paystack presents</Pill>
                <div className="font-display text-[26px] font-bold text-cream tracking-[-0.02em] leading-tight">{event.name}</div>
                <div className="flex items-center gap-3 mt-2 font-mono text-[12px] text-cream/85">
                  <span className="inline-flex items-center gap-1.5"><Icon.Calendar w={13} style={{ color: "#E8C57E" }} /> {event.date}</span>
                  <span className="inline-flex items-center gap-1.5"><Icon.Pin w={13} style={{ color: "#E8C57E" }} /> {event.venue}</span>
                </div>
              </div>
            </div>
            <div className="p-7">
              <div className="font-display text-[16px] font-semibold text-primary mb-2">About this event</div>
              <p className="text-[13.5px] text-ink-soft leading-[1.65] mb-6">
                Africa's largest gathering of builders, founders and investors. Three days of keynotes, workshops and the connections that move the continent's tech forward.
              </p>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[["3", "days"], ["60+", "speakers"], ["1,200", "attendees"]].map((s, i) => (
                  <div key={i} className="bg-cream/70 border border-border rounded-xl p-3 text-center">
                    <div className="font-mono text-[18px] text-primary">{s[0]}</div>
                    <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted mt-1">{s[1]}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between bg-primary rounded-xl px-5 py-3.5">
                <div>
                  <div className="font-mono text-[9px] tracking-[0.12em] uppercase text-cream/60">From</div>
                  <div className="font-mono text-cream text-[16px]">₦15,000</div>
                </div>
                <span className="bg-accent text-primary-dark rounded-full px-4 py-2 text-[12.5px] font-semibold inline-flex items-center gap-1.5">Get ticket <Icon.Arrow w={13} /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ── Karta Card management ────────────────────────────────────────────
function MiniEventCard({ event, w = 200 }) {
  const h = w * 1.4;
  return (
    <div className="rounded-2xl overflow-hidden relative shrink-0" style={{ width: w, height: h, background: event.grad, boxShadow: "0 20px 40px -16px rgba(15,31,24,0.5)" }}>
      <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 50% at 80% 8%, rgba(232,197,126,0.4), transparent 60%)" }} />
      <div className="relative h-full flex flex-col p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[7px] tracking-[0.18em] uppercase text-accent">Africa Tech Fest</span>
          <span className="inline-block w-4 h-4 rounded" style={{ background: "linear-gradient(135deg,#FAF6EE,#E8C57E)" }} />
        </div>
        <div className="mt-auto">
          <span className="font-mono text-[7px] tracking-[0.16em] uppercase text-cream/60">I'm speaking at</span>
          <div className="w-12 h-12 rounded-full my-2 grid place-items-center text-cream font-display font-bold" style={{ background: "linear-gradient(135deg,#C9A45E,#1F4D3A)", fontSize: w * 0.07 }}>KM</div>
          <div className="font-display text-cream font-bold tracking-tight leading-tight" style={{ fontSize: w * 0.085 }}>Kwame Mensah</div>
          <div className="text-cream/70 mt-0.5" style={{ fontSize: w * 0.052 }}>Product Engineer · Paystack</div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream/15 font-mono text-cream/60" style={{ fontSize: w * 0.045 }}>
            <span>12 MAR</span><span>·</span><span>LAGOS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KartaCardPage({ event }) {
  const variants = [
    { name: "Attendee", count: 156, active: true },
    { name: "Speaker", count: 8 },
    { name: "Sponsor", count: 4 },
    { name: "VIP", count: 13 },
  ];
  return (
    <PageShell title="Karta Card" subtitle="The personalized card every attendee gets" max="1100px"
      actions={<><Btn icon="Palette" onClick={() => window.toast && window.toast("Opening the Card Studio…")}>Edit design</Btn><Btn variant="accent" icon="Sparkle" onClick={() => window.toast && window.toast("Previewing as an attendee")}>Preview as attendee</Btn></>}>
      <div className="rounded-2xl p-3 mb-6 inline-flex items-center gap-2 text-[12.5px]" style={{ background: "rgba(232,197,126,0.16)", border: "1px solid rgba(232,197,126,0.4)" }}>
        <span className="text-accent-dark"><Icon.Sparkle w={14} /></span>
        <span className="text-primary-dark">The Karta Card is standard on every plan — no other event platform has this.</span>
      </div>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <div className="flex justify-center lg:justify-start">
          <div style={{ filter: "drop-shadow(0 14px 30px rgba(15,31,24,0.18))" }}><MiniEventCard event={event} w={220} /></div>
        </div>
        <div className="grid gap-5">
          <StatCards cols={3} items={[
            { label: "Cards generated", value: "201", icon: "IdCard", delta: "12 today", deltaUp: true },
            { label: "Shared", value: "164", icon: "Share", delta: "82%", deltaUp: true },
            { label: "Reach", value: "31k", icon: "Network", accent: true },
          ]} />
          <Panel title="Card variants" action={<Btn icon="Plus">New variant</Btn>}>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {variants.map((v, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${v.active ? "border-primary/40 bg-primary-soft/40" : "border-border bg-cream/50"}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center"><Icon.IdCard w={15} /></span>
                    <span className="text-[13.5px] font-medium text-ink">{v.name}</span>
                  </div>
                  <span className="font-mono text-[11.5px] text-muted">{v.count} cards</span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Where cards are shared">
            <div className="grid sm:grid-cols-2 gap-5 items-center">
              <Donut size={140} segments={[
                { label: "Instagram", value: 64, color: CHART.forest },
                { label: "WhatsApp", value: 52, color: CHART.sage },
                { label: "LinkedIn", value: 31, color: CHART.gold },
                { label: "X / Twitter", value: 17, color: CHART.mist },
              ]} centerLabel="164" centerSub="SHARES" />
              <div className="text-[13px] text-ink-soft leading-[1.6]">
                Each share reaches an average of <span className="text-primary font-medium">189 people</span> who haven't heard of your event yet — your attendees are your best marketing channel.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  tickets: TicketsPage,
  "check-in": CheckInPage,
  "event-page": EventPageEditor,
  "karta-card": KartaCardPage,
});
