// Richer sub-pages: Registrations table + Agenda builder.

function Registrations({ event, onOpenDetail }) {
  const loaded = useLoaded(600);
  const rows = [
    { n: "Kwame Mensah", e: "kwame@paystack.com", t: "Speaker", st: "checked", card: true, when: "12 min ago", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Thandi Mokoena", e: "thandi@gmail.com", t: "General", st: "checked", card: true, when: "28 min ago", g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Adebayo Dada", e: "ade@flutterwave.com", t: "VIP", st: "registered", card: true, when: "41 min ago", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "Nia Williams", e: "nia@andela.com", t: "General", st: "registered", card: false, when: "1 hr ago", g: "linear-gradient(135deg,#C9A45E,#1F4D3A)" },
    { n: "Yusuf Bello", e: "yusuf@kuda.com", t: "General", st: "checked", card: true, when: "2 hr ago", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Fatou Diop", e: "fatou@wave.com", t: "Speaker", st: "registered", card: true, when: "3 hr ago", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "Chidinma Okeke", e: "chidi@mtn.com", t: "VIP", st: "registered", card: false, when: "5 hr ago", g: "linear-gradient(135deg,#163828,#2A6A50)" },
    { n: "Liya Tesfaye", e: "liya@safaricom.co.ke", t: "General", st: "checked", card: true, when: "Yesterday", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
  ];
  const TKT = {
    Speaker: "bg-primary-soft text-primary",
    VIP: "bg-accent/20 text-accent-dark",
    General: "bg-ink/5 text-ink-soft",
  };
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em]">Registrations</h1>
          <p className="text-ink-soft text-[14px] mt-0.5">{event.stats.registered} attendees · {event.stats.checkinN} checked in · {event.stats.cards} cards generated</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.toast && window.toast("Export started — we’ll email you the CSV")} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-ink-soft text-[13px] hover:border-primary/40 hover:text-primary transition-colors">
            <Icon.External w={14} /> Export CSV
          </button>
          <button onClick={() => window.openModal && window.openModal({ type: "form", title: "Add attendee", subtitle: "Manually register someone", fields: [{ key: "name", label: "Full name", placeholder: "Jane Doe", required: true }, { key: "email", label: "Email", placeholder: "jane@company.com", mono: true, type: "email", required: true }, { key: "ticket", label: "Ticket type", placeholder: "General admission" }], submitLabel: "Add attendee", submitIcon: "Plus", toast: "Attendee added" })} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-cream text-[13px] font-medium hover:bg-primary-dark transition-colors">
            <Icon.Plus w={14} /> Add attendee
          </button>
        </div>
      </div>

      {!loaded ? (
        <div className="grid gap-3">
          <Skeleton className="h-9 w-full max-w-[320px]" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" rounded="rounded-xl" />)}
        </div>
      ) : (
      <React.Fragment>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative flex-1 max-w-[320px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><Icon.Search w={15} /></span>
          <div className="h-9 pl-9 pr-3 rounded-lg bg-surface border border-border text-[13px] text-muted flex items-center">Search attendees…</div>
        </div>
        {["All tickets", "All statuses"].map((f, i) => (
          <button key={i} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface text-[12.5px] text-ink-soft hover:border-primary/40 transition-colors">
            {f} <Icon.ChevDown w={13} />
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-cream/60 border-b border-border">
              {["Attendee", "Ticket", "Status", "Card", "Registered"].map((h, i) => (
                <th key={i} className="py-3 px-5 font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} onClick={() => onOpenDetail && onOpenDetail("attendee", { name: r.n, e: r.e, ticket: r.t, st: r.st, card: r.card, when: r.when, initials: r.n.split(" ").map((x) => x[0]).join(""), g: r.g })} className="border-t border-border/60 hover:bg-cream/40 transition-colors cursor-pointer">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-3">
                    <Avatar initials={r.n.split(" ").map((x) => x[0]).join("")} grad={r.g} />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-ink leading-tight">{r.n}</div>
                      <div className="font-mono text-[11px] text-muted truncate">{r.e}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-5">
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${TKT[r.t]}`}>{r.t}</span>
                </td>
                <td className="py-3 px-5">
                  {r.st === "checked" ? (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-emerald-700"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Checked in</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft"><span className="w-1.5 h-1.5 rounded-full bg-muted/50" /> Registered</span>
                  )}
                </td>
                <td className="py-3 px-5">
                  {r.card ? (
                    <span className="text-primary" title="Card generated"><Icon.IdCard w={17} /></span>
                  ) : (
                    <span className="text-muted/40" title="No card yet"><Icon.IdCard w={17} /></span>
                  )}
                </td>
                <td className="py-3 px-5 font-mono text-[12px] text-muted">{r.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </React.Fragment>
      )}
    </div>
  );
}

function Agenda({ event }) {
  const tracks = ["Main Stage", "Builders Track", "Investor Lounge"];
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
  // sessions: {col, start (0-based hour index, can be .5), len (hours), title, sub, tone}
  const sessions = [
    { col: 0, start: 0, len: 1, title: "Opening keynote", sub: "Iyin Aboyeji", tone: "forest" },
    { col: 0, start: 1.5, len: 1.5, title: "Scaling fintech across borders", sub: "Panel · 4 speakers", tone: "sage" },
    { col: 0, start: 4, len: 1, title: "Fireside: Building Paystack", sub: "Shola Akinlade", tone: "gold" },
    { col: 0, start: 5.5, len: 1.5, title: "Founder networking", sub: "Main hall", tone: "forest" },
    { col: 1, start: 0.5, len: 1.5, title: "Workshop: Ship payments in a weekend", sub: "Hands-on", tone: "sage" },
    { col: 1, start: 2.5, len: 1, title: "API design clinic", sub: "Open table", tone: "forest" },
    { col: 1, start: 4, len: 2, title: "Demo Day", sub: "12 startups", tone: "gold" },
    { col: 2, start: 1, len: 1.5, title: "LP panel: Funding the next wave", sub: "VC roundtable", tone: "forest" },
    { col: 2, start: 3, len: 1, title: "Office hours", sub: "Investors × founders", tone: "sage" },
    { col: 2, start: 5, len: 1.5, title: "Closing reception", sub: "Rooftop", tone: "gold" },
  ];
  const TONE = {
    forest: { bg: "#1F4D3A", fg: "#FAF6EE", sub: "rgba(250,246,238,0.75)" },
    sage: { bg: "#2A6A50", fg: "#FAF6EE", sub: "rgba(250,246,238,0.8)" },
    gold: { bg: "#E8C57E", fg: "#163828", sub: "rgba(22,56,40,0.7)" },
  };
  const ROW = 52; // px per hour

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em]">Agenda</h1>
          <p className="text-ink-soft text-[14px] mt-0.5">12 sessions across 3 days · 3 tracks</p>
        </div>
        <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-cream text-[13px] font-medium hover:bg-primary-dark transition-colors">
          <Icon.Plus w={14} /> Add session
        </button>
      </div>

      {/* Day tabs */}
      <div className="flex items-center gap-1.5 mb-4">
        {["Day 1 · 12 Mar", "Day 2 · 13 Mar", "Day 3 · 14 Mar"].map((d, i) => (
          <button key={i} className={`px-3.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${i === 0 ? "bg-primary text-cream" : "border border-border text-ink-soft hover:border-primary/40"}`}>{d}</button>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5 overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Track headers */}
          <div className="grid mb-2" style={{ gridTemplateColumns: "56px repeat(3, 1fr)", gap: 10 }}>
            <div />
            {tracks.map((t, i) => (
              <div key={i} className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted text-center pb-1 border-b border-border">{t}</div>
            ))}
          </div>
          {/* Grid */}
          <div className="grid" style={{ gridTemplateColumns: "56px repeat(3, 1fr)", gap: 10 }}>
            {/* time column */}
            <div className="relative" style={{ height: hours.length * ROW }}>
              {hours.map((h, i) => (
                <div key={i} className="absolute left-0 right-1 font-mono text-[10px] text-muted -translate-y-1/2" style={{ top: i * ROW }}>{h}</div>
              ))}
            </div>
            {/* track columns */}
            {tracks.map((t, ci) => (
              <div key={ci} className="relative bg-cream/50 border border-border rounded-lg" style={{ height: hours.length * ROW }}>
                {hours.map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-border/50" style={{ top: i * ROW }} />
                ))}
                {sessions.filter((s) => s.col === ci).map((s, i) => {
                  const tone = TONE[s.tone];
                  return (
                    <div key={i} className="absolute left-1.5 right-1.5 rounded-md px-2 py-1.5 overflow-hidden" style={{ top: s.start * ROW + 3, height: s.len * ROW - 6, background: tone.bg, color: tone.fg }}>
                      <div className="font-display text-[11.5px] font-semibold leading-tight tracking-tight line-clamp-2">{s.title}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: tone.sub }}>{s.sub}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Registrations, Agenda });
window.SCREENS = Object.assign(window.SCREENS || {}, {
  registrations: Registrations,
  agenda: Agenda,
});
