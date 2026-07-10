// Platform UI mocks — stylized product screens built entirely from brand tokens.
// Used in the hero composite, the 5-step lifecycle, and the card-reveal sequence.
// Each screen is designed at a natural ~340px width; parents scale via transform.

function ScreenChrome({ label, children, className = "", tone = "light" }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        tone === "light"
          ? "bg-surface border-border"
          : "bg-primary-dark border-primary-dark"
      } ${className}`}
      style={{ boxShadow: "0 24px 50px -22px rgba(15,31,24,0.45), 0 10px 22px -14px rgba(15,31,24,0.32)" }}
    >
      <div
        className={`h-8 flex items-center gap-1.5 px-3 border-b ${
          tone === "light" ? "bg-cream border-border" : "bg-primary border-primary-dark"
        }`}
      >
        <span className="w-2 h-2 rounded-full" style={{ background: tone === "light" ? "rgba(15,31,24,0.12)" : "rgba(250,246,238,0.22)" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: tone === "light" ? "rgba(15,31,24,0.12)" : "rgba(250,246,238,0.22)" }} />
        <span className="w-2 h-2 rounded-full" style={{ background: tone === "light" ? "rgba(15,31,24,0.12)" : "rgba(250,246,238,0.22)" }} />
        <div
          className={`ml-2.5 font-mono text-[9px] tracking-[0.14em] uppercase truncate ${
            tone === "light" ? "text-muted" : "text-cream/55"
          }`}
        >
          {label}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Bar used in dashboards ─────────────────────────────────────────
function MiniBar({ label, value, pct, accent }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-cream/70 font-mono tracking-[0.1em] uppercase">{label}</span>
        <span className="text-[10px] text-cream font-mono">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-cream/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: accent ? "#E8C57E" : "rgba(232,197,126,0.55)" }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Analytics dashboard — dark forest surface
// ────────────────────────────────────────────────────────────────────
function DashboardMock() {
  const stats = [
    { k: "Registered", v: "1,284" },
    { k: "Checked in", v: "968" },
    { k: "Cards shared", v: "742" },
  ];
  return (
    <ScreenChrome label="karta · analytics · africa tech fest" tone="dark">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="font-display text-cream text-[13px] font-semibold tracking-tight">
              Africa Tech Festival 2026
            </div>
            <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-cream/45 mt-0.5">
              Live · updated 2m ago
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.14em] uppercase text-primary-dark bg-accent px-2 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-dark" /> Live
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-cream/[0.06] border border-cream/10 rounded-lg p-2.5">
              <div className="font-mono text-cream text-[16px] font-medium tracking-tight leading-none">
                {s.v}
              </div>
              <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-cream/50 mt-1.5">
                {s.k}
              </div>
            </div>
          ))}
        </div>
        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-cream/45 mb-2.5">
          Registration funnel
        </div>
        <div className="space-y-2.5">
          <MiniBar label="Visited" value="3,910" pct={100} />
          <MiniBar label="Registered" value="1,284" pct={64} />
          <MiniBar label="Checked in" value="968" pct={48} />
          <MiniBar label="Shared a card" value="742" pct={37} accent />
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Public event page — cover + ticket CTA + agenda peek
// ────────────────────────────────────────────────────────────────────
function EventPageMock() {
  return (
    <ScreenChrome label="karta.app/africa-tech-fest">
      <div>
        {/* Cover */}
        <div
          className="relative h-[112px] px-4 pt-3.5 pb-3 flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)" }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 80% at 100% 0%, rgba(232,197,126,0.34), transparent 60%)",
            }}
          />
          <div className="relative font-mono text-[8px] tracking-[0.18em] uppercase text-accent">
            Paystack · presents
          </div>
          <div className="relative">
            <div className="font-display text-cream text-[19px] font-bold leading-[1.02] tracking-[-0.02em]">
              Africa Tech Festival 2026
            </div>
            <div className="flex items-center gap-3 mt-2 font-mono text-[8px] tracking-[0.12em] uppercase text-cream/80">
              <span className="inline-flex items-center gap-1"><Icon.Calendar w={10} style={{ color: "#E8C57E" }} /> 12 Mar</span>
              <span className="inline-flex items-center gap-1"><Icon.Pin w={10} style={{ color: "#E8C57E" }} /> Lagos</span>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">General admission</div>
              <div className="font-mono text-ink text-[15px] font-medium tracking-tight">₦15,000</div>
            </div>
            <div className="cardly-cta bg-primary text-cream rounded-full px-3.5 py-2 text-[11px] font-medium inline-flex items-center gap-1.5">
              Get ticket <Icon.Arrow w={12} />
            </div>
          </div>
          <div className="font-mono text-[7.5px] tracking-[0.16em] uppercase text-muted mb-2 pt-1 border-t border-border">
            Agenda preview
          </div>
          <div className="space-y-1.5">
            {[
              ["09:30", "Opening keynote", "#E8C57E"],
              ["11:00", "Scaling fintech in Africa", "#1F4D3A"],
              ["14:00", "Founder networking", "#2A6A50"],
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="font-mono text-[8px] text-muted w-7">{r[0]}</span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: r[2] }} />
                <span className="text-[11px] text-ink-soft">{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Card confirmation screen — the gold moment (front of hero composite)
// ────────────────────────────────────────────────────────────────────
function CardConfirmMock({ cardWidth = 152 }) {
  return (
    <ScreenChrome label="karta.app · you're registered">
      <div className="p-4 bg-cream">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-6 h-6 rounded-full bg-success/15 text-success grid place-items-center">
            <Icon.Check w={14} />
          </span>
          <div>
            <div className="font-display text-ink text-[13px] font-semibold tracking-tight leading-none">
              You're in, Aisha.
            </div>
            <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted mt-1">
              Your Karta Card is ready
            </div>
          </div>
        </div>
        <div className="relative grid place-items-center py-1">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(55% 55% at 50% 50%, rgba(232,197,126,0.55), transparent 65%)",
              filter: "blur(18px)",
            }}
          />
          <div className="relative" style={{ filter: "drop-shadow(0 14px 26px rgba(15,31,24,0.32))" }}>
            <MiniCard width={cardWidth} variant="forest" />
          </div>
        </div>
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="cardly-cta-accent bg-accent text-primary-dark rounded-full py-2 text-[10.5px] font-semibold inline-flex items-center justify-center gap-1.5">
            <Icon.Share w={12} /> Share
          </div>
          <div className="bg-surface border border-border text-ink rounded-full py-2 text-[10.5px] font-medium inline-flex items-center justify-center gap-1.5">
            Download
          </div>
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Lifecycle step 1 — create event
// ────────────────────────────────────────────────────────────────────
function EventCreateMock() {
  return (
    <ScreenChrome label="karta · new event">
      <div className="p-4">
        <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-muted mb-3">Event details</div>
        <div className="space-y-2.5">
          <div className="bg-cream border border-border rounded-lg px-3 py-2">
            <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">Event name</div>
            <div className="text-[12px] text-ink mt-0.5 font-medium">Africa Tech Festival 2026</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-cream border border-border rounded-lg px-3 py-2">
              <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">Date</div>
              <div className="text-[12px] text-ink mt-0.5 font-medium">12 Mar 2026</div>
            </div>
            <div className="bg-cream border border-border rounded-lg px-3 py-2">
              <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">Venue</div>
              <div className="text-[12px] text-ink mt-0.5 font-medium">Lagos, NG</div>
            </div>
          </div>
          <div className="bg-cream border border-dashed border-primary/40 rounded-lg px-3 py-3.5 flex items-center gap-2 text-primary">
            <Icon.Layout w={15} />
            <span className="text-[11px] font-medium">Upload cover photo</span>
          </div>
        </div>
        <div className="mt-3.5 cardly-cta bg-primary text-cream rounded-full py-2 text-[11px] font-medium inline-flex w-full items-center justify-center gap-1.5">
          Publish event page <Icon.Arrow w={12} />
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Lifecycle step 2 — tickets
// ────────────────────────────────────────────────────────────────────
function TicketsMock() {
  const tix = [
    { name: "Early bird", price: "₦9,000", left: "Sold out", muted: true },
    { name: "General", price: "₦15,000", left: "284 left", accent: true },
    { name: "VIP · front row", price: "₦40,000", left: "12 left" },
  ];
  return (
    <ScreenChrome label="karta · tickets">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono text-[8px] tracking-[0.16em] uppercase text-muted">Ticket types</div>
          <span className="font-mono text-[8px] tracking-[0.14em] uppercase text-primary inline-flex items-center gap-1">
            <Icon.Plus w={11} /> Add
          </span>
        </div>
        <div className="space-y-2">
          {tix.map((t, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
                t.accent ? "border-primary/40 bg-primary-soft/40" : "border-border bg-surface"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`${t.muted ? "text-muted" : "text-primary"}`}><Icon.Ticket w={15} /></span>
                <div>
                  <div className={`text-[12px] font-medium ${t.muted ? "text-muted line-through" : "text-ink"}`}>{t.name}</div>
                  <div className="font-mono text-[7.5px] tracking-[0.12em] uppercase text-muted mt-0.5">{t.left}</div>
                </div>
              </div>
              <div className={`font-mono text-[12px] tracking-tight ${t.muted ? "text-muted" : "text-ink"}`}>{t.price}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted">
          <span className="font-mono tracking-[0.12em] uppercase">Promo</span>
          <span className="bg-cream border border-border rounded px-1.5 py-0.5 font-mono text-[9px] text-ink-soft">EARLY20</span>
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Lifecycle step 3 — agenda grid
// ────────────────────────────────────────────────────────────────────
function AgendaMock() {
  const tracks = ["Main", "Builders", "Invest"];
  const sessions = [
    { col: 0, top: 0, h: 30, t: "Keynote", c: "#1F4D3A" },
    { col: 1, top: 6, h: 22, t: "Workshop", c: "#2A6A50" },
    { col: 2, top: 2, h: 26, t: "Panel", c: "#C9A45E" },
    { col: 0, top: 36, h: 24, t: "Fireside", c: "#2A6A50" },
    { col: 1, top: 32, h: 30, t: "Demo Day", c: "#1F4D3A" },
    { col: 2, top: 34, h: 20, t: "LP Mixer", c: "#C9A45E" },
  ];
  return (
    <ScreenChrome label="karta · agenda builder">
      <div className="p-4">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {tracks.map((t, i) => (
            <div key={i} className="font-mono text-[8px] tracking-[0.12em] uppercase text-muted text-center">{t}</div>
          ))}
        </div>
        <div className="relative grid grid-cols-3 gap-1.5" style={{ height: 132 }}>
          {[0, 1, 2].map((c) => (
            <div key={c} className="relative bg-cream border border-border rounded-lg overflow-hidden">
              {[25, 50, 75].map((y) => (
                <div key={y} className="absolute left-0 right-0 border-t border-border/60" style={{ top: `${y}%` }} />
              ))}
            </div>
          ))}
          {sessions.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-md px-1.5 py-1 overflow-hidden"
              style={{
                left: `calc(${s.col} * (33.333% ) + ${s.col * 0}px)`,
                width: "31%",
                marginLeft: s.col === 0 ? 0 : s.col === 1 ? "1%" : "2%",
                top: `${s.top * 2}px`,
                height: s.h * 2,
                background: s.c,
                color: s.c === "#C9A45E" ? "#163828" : "#FAF6EE",
              }}
            >
              <div className="font-display text-[8.5px] font-semibold leading-tight tracking-tight">{s.t}</div>
            </div>
          ))}
        </div>
      </div>
    </ScreenChrome>
  );
}

// ────────────────────────────────────────────────────────────────────
// Lifecycle step 4 — registration form (also used in reveal sequence)
// ────────────────────────────────────────────────────────────────────
function RegFormMock({ generating = false }) {
  return (
    <ScreenChrome label="karta.app/africa-tech-fest · register">
      <div className="p-4 bg-cream">
        <div className="font-display text-ink text-[13px] font-semibold tracking-tight mb-3">
          Get your festival card
        </div>
        <div className="space-y-2.5">
          <div className="bg-surface border border-border rounded-lg px-3 py-2">
            <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">Full name</div>
            <div className="text-[12px] text-ink mt-0.5">Aisha Ahmed</div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-surface border border-border rounded-lg px-3 py-2">
              <div className="font-mono text-[7.5px] tracking-[0.14em] uppercase text-muted">Role</div>
              <div className="text-[12px] text-ink mt-0.5">Speaker</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full grid place-items-center font-display text-[9px] font-semibold text-primary" style={{ background: "radial-gradient(120% 120% at 30% 25%, #f3e4c1, #c9a45e)" }}>AA</span>
              <span className="text-[11px] text-ink-soft">Photo added</span>
            </div>
          </div>
        </div>
        <div
          className={`mt-3.5 rounded-full py-2 text-[11px] font-medium inline-flex w-full items-center justify-center gap-2 ${
            generating ? "bg-primary/80 text-cream" : "cardly-cta bg-primary text-cream"
          }`}
        >
          {generating ? (
            <React.Fragment>
              <span className="w-3 h-3 rounded-full border-2 border-cream/40 border-t-cream animate-spin" />
              Generating your card…
            </React.Fragment>
          ) : (
            <React.Fragment>
              Generate my card <Icon.Arrow w={12} />
            </React.Fragment>
          )}
        </div>
      </div>
    </ScreenChrome>
  );
}

Object.assign(window, {
  ScreenChrome,
  DashboardMock,
  EventPageMock,
  CardConfirmMock,
  EventCreateMock,
  TicketsMock,
  AgendaMock,
  RegFormMock,
});
