// Event-level · Reports builder/ROI (Insights) + Waitlist & capacity (Manage).

// ════════════════════════════════════════════════════════════════════
// REPORTS — custom report builder + ROI dashboard + scheduled exports
// ════════════════════════════════════════════════════════════════════
function ReportsPage({ event }) {
  const [tab, setTab] = React.useState("roi");
  return (
    <PageShell title="Reports" subtitle={`Custom reports & ROI · ${event.name}`}
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Exporting report as CSV…")}>Export</Btn><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "New report", subtitle: "Build a custom report", fields: [{ key: "name", label: "Report name", placeholder: "Revenue by ticket type", required: true }, { key: "source", label: "Data source", radios: [["Registrations", "Attendees, tickets, sources"], ["Orders", "Transactions, refunds, revenue"], ["Sessions", "Attendance & engagement"], ["Sponsors", "Leads & booth activity"]], selected: 1 }, { cols: 2, items: [{ key: "group", label: "Group by", placeholder: "Ticket type" }, { key: "range", label: "Date range", placeholder: "Last 30 days" }] }], submitLabel: "Build report", submitIcon: "Check", toast: "Report created" })}>New report</Btn></>}>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "roi", label: "ROI dashboard" }, { id: "builder", label: "Report builder" }, { id: "saved", label: "Saved reports" }, { id: "scheduled", label: "Scheduled" }]} />
      {tab === "roi" && <ROIDashboard />}
      {tab === "builder" && <ReportBuilder />}
      {tab === "saved" && <SavedReports />}
      {tab === "scheduled" && <ScheduledReports />}
    </PageShell>
  );
}

function ROIDashboard() {
  return (
    <React.Fragment>
      <div className="rounded-2xl p-5 mb-5 grid sm:grid-cols-[1.4fr_1fr] gap-5 items-center text-cream relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.26), transparent 55%)" }} />
        <div className="relative">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-2">Event ROI</div>
          <div className="flex items-end gap-3"><span className="font-mono text-[40px] leading-none text-cream">312%</span><span className="font-mono text-[12px] text-emerald-300 mb-1.5">↑ vs 240% target</span></div>
          <div className="text-[13px] text-cream/75 mt-2">$4,200 revenue + $48k sponsorship against $16.7k cost.</div>
        </div>
        <div className="relative grid grid-cols-2 gap-3">
          {[["Revenue", "$52.2k"], ["Cost", "$16.7k"], ["Net", "$35.5k"], ["Cost / attendee", "$68"]].map((s, i) => (
            <div key={i} className="bg-cream/10 border border-cream/15 rounded-xl px-3 py-2.5"><div className="font-mono text-[16px] text-cream">{s[1]}</div><div className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-cream/55 mt-1">{s[0]}</div></div>
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">
        <Panel title="Revenue vs cost by category">
          <BarsChart height={180} data={[
            { label: "Tickets", value: 42 }, { label: "Sponsors", value: 96, color: CHART.goldDark }, { label: "Add-ons", value: 14 },
            { label: "Venue", value: 60, color: "#B9837A", dim: true }, { label: "Staff", value: 28, color: "#B9837A", dim: true }, { label: "AV", value: 18, color: "#B9837A", dim: true },
          ]} />
        </Panel>
        <Panel title="Marketing attribution">
          <Funnel steps={[
            { label: "Instagram", value: 94, icon: "Share", color: CHART.goldDark },
            { label: "WhatsApp", value: 67, icon: "Chat", color: CHART.forest },
            { label: "Email", value: 48, icon: "Bell", color: CHART.sage },
            { label: "Referral (cards)", value: 38, icon: "IdCard", color: CHART.leaf },
          ]} />
        </Panel>
      </div>
      <Panel title="Cost breakdown">
        <div className="grid sm:grid-cols-2 gap-5 items-center">
          <Donut size={150} segments={[
            { label: "Venue", value: 60, color: CHART.forest }, { label: "Staff", value: 28, color: CHART.sage },
            { label: "AV & stream", value: 18, color: CHART.gold }, { label: "Marketing", value: 14, color: CHART.mist },
          ]} centerLabel="$16.7k" centerSub="COST" />
          <div className="text-[13px] text-ink-soft leading-[1.6]">Your <span className="text-primary font-medium">cost per attendee</span> dropped 14% versus last year, while sponsorship revenue grew 22% — driven largely by booth-map self-service bookings.</div>
        </div>
      </Panel>
    </React.Fragment>
  );
}

function ReportBuilder() {
  const [source, setSource] = React.useState("orders");
  const [group, setGroup] = React.useState("ticket");
  const cols = { orders: ["Order ID", "Buyer", "Ticket", "Amount", "Status"], registrations: ["Name", "Ticket", "Source", "Checked in", "Card"], sessions: ["Session", "Track", "Attendance", "Rating"], sponsors: ["Sponsor", "Tier", "Leads", "Booth"] };
  const rows = {
    orders: [["KA-2041", "Aisha Ahmed", "VIP", "$80.00", "Paid"], ["KA-2040", "Kwame Mensah", "General ×2", "$50.00", "Paid"], ["KA-2038", "Yusuf Bello", "VIP + add-on", "$95.00", "Paid"]],
    registrations: [["Aisha Ahmed", "VIP", "Instagram", "Yes", "Yes"], ["Thandi M.", "General", "WhatsApp", "Yes", "Yes"], ["Liya T.", "General", "Email", "No", "No"]],
    sessions: [["Opening keynote", "Main", "842", "4.8"], ["Scaling fintech", "Main", "610", "4.5"], ["Ship an AI agent", "Builders", "120", "4.9"]],
    sponsors: [["Paystack", "Platinum", "142", "A1"], ["MTN", "Platinum", "118", "A2"], ["Flutterwave", "Gold", "86", "B1"]],
  };
  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5">
      <div className="grid gap-4 content-start">
        <Panel title="Data source">
          <div className="grid gap-1.5">
            {[["orders", "Orders", "CreditCard"], ["registrations", "Registrations", "Users"], ["sessions", "Sessions", "Calendar"], ["sponsors", "Sponsors", "Briefcase"]].map(([id, label, icon]) => {
              const IconC = Icon[icon]; const on = source === id;
              return <button key={id} onClick={() => setSource(id)} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${on ? "bg-primary text-cream font-medium" : "text-ink-soft hover:bg-cream"}`}><IconC w={14} className={on ? "text-cream" : "text-primary/70"} />{label}</button>;
            })}
          </div>
        </Panel>
        <Panel title="Group by">
          <SegTabs active={group} onChange={setGroup} tabs={[{ id: "ticket", label: "Ticket" }, { id: "source", label: "Source" }, { id: "day", label: "Day" }]} />
          <div className="mt-3 font-mono text-[10px] tracking-[0.12em] uppercase text-muted mb-2">Filters</div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="forest">Last 30 days</Pill><Pill tone="neutral">+ Add filter</Pill>
          </div>
        </Panel>
        <Btn variant="primary" full icon="Check" onClick={() => window.toast && window.toast("Report saved")}>Save report</Btn>
      </div>
      <Panel title="Preview" action={<span className="font-mono text-[10.5px] text-muted">live</span>} pad="p-0">
        <Table head={cols[source]}>
          {rows[source].map((r, i) => (
            <Row key={i}>{r.map((c, j) => <Cell key={j} className={j === 0 ? "font-medium text-ink text-[13px]" : "text-[13px] text-ink-soft"}>{c}</Cell>)}</Row>
          ))}
        </Table>
        <div className="px-5 py-3 font-mono text-[11px] text-muted border-t border-border/60">Showing 3 of 178 rows · grouped by {group}</div>
      </Panel>
    </div>
  );
}

function SavedReports() {
  const reps = [
    ["Revenue by ticket type", "Orders", "Updated 2h ago"], ["Check-in funnel", "Registrations", "Updated today"],
    ["Session engagement", "Sessions", "Updated yesterday"], ["Sponsor lead report", "Sponsors", "Updated 3d ago"],
    ["Traffic source ROI", "Registrations", "Updated 1w ago"],
  ];
  return (
    <Panel title="Saved reports" pad="p-0">
      <div className="divide-y divide-border/60">
        {reps.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-cream/50 transition-colors">
            <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.ListChecks w={15} /></span>
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{r[0]}</div><div className="font-mono text-[11px] text-muted mt-0.5">{r[1]} · {r[2]}</div></div>
            <Btn size="sm" variant="ghost" icon="External" onClick={() => window.toast && window.toast("Exporting “" + r[0] + "”…")}>Export</Btn>
            <button onClick={() => window.toast && window.toast("Opening “" + r[0] + "”")} className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors shrink-0"><Icon.Arrow w={15} /></button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ScheduledReports() {
  const seed = [
    { name: "Weekly revenue digest", to: "finance@karta.app", freq: "Every Monday · 8am", on: true },
    { name: "Daily registration count", to: "team@karta.app", freq: "Daily · 6pm", on: true },
    { name: "Post-event full export", to: "adaeze@karta.app", freq: "1 day after event", on: false },
  ];
  const [items, setItems] = React.useState(seed);
  const toggle = (i) => setItems((a) => a.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  return (
    <React.Fragment>
      <div className="flex justify-end mb-4"><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Schedule a report", subtitle: "We'll email it automatically", fields: [{ key: "report", label: "Report", placeholder: "Revenue by ticket type" }, { key: "to", label: "Send to", placeholder: "finance@company.com", mono: true, type: "email", required: true }, { key: "freq", label: "Frequency", radios: [["Daily"], ["Weekly"], ["After the event"]], selected: 1 }], submitLabel: "Schedule report", submitIcon: "Clock", toast: "Report scheduled" })}>Schedule report</Btn></div>
      <div className="grid gap-2.5">
        {items.map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${s.on ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted"}`}><Icon.Clock w={17} /></span>
            <div className="min-w-0 flex-1"><div className="text-[14px] font-medium text-ink">{s.name}</div><div className="font-mono text-[11px] text-muted mt-0.5">{s.freq} · {s.to}</div></div>
            <Toggle on={s.on} onClick={() => toggle(i)} />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

// ════════════════════════════════════════════════════════════════════
// WAITLIST & CAPACITY — group reg, waitlists, session seat limits
// ════════════════════════════════════════════════════════════════════
function WaitlistPage({ event }) {
  const [tab, setTab] = React.useState("waitlist");
  return (
    <PageShell title="Waitlist & Capacity" subtitle={`Manage demand beyond capacity · ${event.name}`}
      actions={<Btn variant="primary" icon="Bell" onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Release 20 spots from the waitlist?", confirmLabel: "Offer 20 spots", confirmIcon: "Bell", body: "The next 20 people on the waitlist get a time-limited offer to claim a ticket. They have 24 hours before it passes to the next person.", onConfirm: () => window.toast && window.toast("20 offers sent — claim window is 24h") })}>Release spots</Btn>}>
      <StatCards cols={4} items={[
        { label: "On waitlist", value: "84", icon: "Clock", delta: "12 today", deltaUp: true },
        { label: "Capacity", value: "247 / 250", icon: "Users" },
        { label: "Offers pending", value: "6", icon: "Bell", accent: true },
        { label: "Converted", value: "73%", icon: "Check" },
      ]} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "waitlist", label: "Waitlist · 84" }, { id: "groups", label: "Group bookings" }, { id: "capacity", label: "Session capacity" }]} />
      {tab === "waitlist" && <WaitlistTab />}
      {tab === "groups" && <GroupsTab />}
      {tab === "capacity" && <CapacityTab />}
    </PageShell>
  );
}

function WaitlistTab() {
  const seed = [
    { n: "Grace Wanjiru", e: "grace@safboda.co", tier: "General", pos: 1, when: "2 days ago", status: "waiting", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "Ibrahim Toure", e: "ibrahim@wave.com", tier: "VIP", pos: 2, when: "2 days ago", status: "offered", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Chioma Eze", e: "chioma@andela.com", tier: "General", pos: 3, when: "1 day ago", status: "waiting", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
    { n: "Samuel Adeyemi", e: "sam@paystack.com", tier: "General", pos: 4, when: "1 day ago", status: "waiting", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "Nadia Hassan", e: "nadia@andela.com", tier: "Student", pos: 5, when: "18h ago", status: "waiting", g: "linear-gradient(135deg,#C9A45E,#2A6A50)" },
  ];
  const [rows, setRows] = React.useState(seed);
  const offer = (i) => { setRows((a) => a.map((x, j) => j === i ? { ...x, status: "offered" } : x)); window.toast && window.toast("Offer sent — 24h to claim"); };
  const stTone = { waiting: "neutral", offered: "amber", claimed: "green" };
  return (
    <Panel title="Waitlist queue" action={<Btn icon="External" onClick={() => window.toast && window.toast("Waitlist exported")}>Export</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
            <span className="w-7 h-7 rounded-full bg-cream border border-border grid place-items-center font-mono text-[12px] text-ink-soft shrink-0">{r.pos}</span>
            <Avatar initials={r.n.split(" ").map((x) => x[0]).join("")} grad={r.g} size={36} />
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[13.5px] font-medium text-ink truncate">{r.n}</span><Pill tone="forest">{r.tier}</Pill></div><div className="font-mono text-[11px] text-muted mt-0.5">{r.e} · joined {r.when}</div></div>
            <Pill tone={stTone[r.status]} dot={r.status === "offered" ? "#C9A45E" : null}>{r.status === "offered" ? "Offer sent" : "Waiting"}</Pill>
            {r.status === "waiting" && <Btn size="sm" variant="ghost" icon="Bell" onClick={() => offer(i)}>Offer spot</Btn>}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function GroupsTab() {
  const groups = [
    { org: "Paystack", seats: 12, used: 12, lead: "Samuel Adeyemi", code: "PSTK12", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { org: "Andela", seats: 20, used: 14, lead: "Chioma Eze", code: "ANDELA20", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { org: "University of Lagos", seats: 50, used: 38, lead: "Dr. Okonkwo", code: "UNILAG50", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
  ];
  return (
    <React.Fragment>
      <div className="flex justify-end mb-4"><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Create group booking", subtitle: "Reserve a block of tickets for an organization", fields: [{ key: "org", label: "Organization", placeholder: "Acme Inc.", required: true }, { cols: 2, items: [{ key: "seats", label: "Seats", placeholder: "20", mono: true, type: "number" }, { key: "tier", label: "Ticket type", placeholder: "General" }] }, { key: "lead", label: "Group lead email", placeholder: "lead@acme.com", mono: true, type: "email", required: true }], submitLabel: "Create group", submitIcon: "Plus", toast: "Group booking created — invite link sent" })}>New group</Btn></div>
      <div className="grid gap-3">
        {groups.map((g, i) => {
          const pct = Math.round((g.used / g.seats) * 100);
          return (
            <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl grid place-items-center text-cream font-display text-[13px] font-bold shrink-0" style={{ background: g.g }}>{g.org.slice(0, 2)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5"><span className="font-display text-[14.5px] font-semibold text-ink tracking-tight">{g.org}</span><span className="font-mono text-[11px] text-primary bg-primary-soft px-2 py-0.5 rounded">{g.code}</span></div>
                <div className="font-mono text-[11px] text-muted mt-1">Lead: {g.lead}</div>
              </div>
              <div className="hidden sm:block w-[150px] shrink-0">
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5"><span className="text-ink-soft">{g.used}/{g.seats} claimed</span><span className="text-muted">{pct}%</span></div>
                <ProgressBar pct={pct} color={pct === 100 ? CHART.goldDark : CHART.forest} />
              </div>
              <Btn size="sm" variant="ghost" icon="Gear" onClick={() => window.toast && window.toast("Manage " + g.org + " group")}>Manage</Btn>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}

function CapacityTab() {
  const seed = [
    { name: "Ship an AI agent (workshop)", room: "Lab 1", cap: 40, booked: 40 },
    { name: "Founder office hours", room: "Suite 3", cap: 20, booked: 17 },
    { name: "Hands-on: payments API", room: "Lab 2", cap: 35, booked: 28 },
    { name: "Investor speed-dating", room: "Lounge", cap: 60, booked: 60 },
    { name: "Design critique clinic", room: "Studio", cap: 25, booked: 12 },
  ];
  return (
    <React.Fragment>
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
        <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Users w={16} /></span>
        <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">Limited-capacity sessions</span> let attendees reserve a seat for workshops & breakouts. Full sessions open their own waitlist automatically.</div>
      </div>
      <div className="grid gap-2.5">
        {seed.map((s, i) => {
          const pct = Math.round((s.booked / s.cap) * 100);
          const full = s.booked >= s.cap;
          return (
            <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
              <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${full ? "bg-accent/20 text-accent-dark" : "bg-primary-soft text-primary"}`}><Icon.Calendar w={16} /></span>
              <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[14px] font-medium text-ink truncate">{s.name}</span>{full && <Pill tone="gold">Full · waitlist on</Pill>}</div><div className="font-mono text-[11px] text-muted mt-0.5">{s.room}</div></div>
              <div className="w-[150px] shrink-0 hidden sm:block">
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5"><span className="text-ink-soft">{s.booked}/{s.cap}</span><span className="text-muted">{pct}%</span></div>
                <ProgressBar pct={pct} color={full ? CHART.goldDark : CHART.forest} />
              </div>
              <Btn size="sm" variant="ghost" icon="Gear" onClick={() => window.openModal && window.openModal({ type: "form", title: "Session capacity", subtitle: s.name, fields: [{ key: "cap", label: "Max seats", value: String(s.cap), mono: true }, { key: "wl", toggle: true, on: true, label: "Auto-waitlist when full", desc: "Let attendees queue for a seat" }], submitLabel: "Save", submitIcon: "Check", toast: "Capacity updated" })}>Limit</Btn>
            </div>
          );
        })}
      </div>
    </React.Fragment>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  reports: ReportsPage,
  waitlist: WaitlistPage,
});
