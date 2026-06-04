// Super-admin · Operations (cont.): Finance, Refunds, Plans & Flags, System Health

// ── Finance & Payouts ────────────────────────────────────────────────
function FinancePage() {
  const payouts = [
    { org: "Paystack Events", ev: "Build Summit", amt: "$48,200", method: "Bank · USD", status: "Processing", when: "Today" },
    { org: "Sahel Ventures", ev: "AfriTech Summit", amt: "$31,940", method: "Flutterwave", status: "Scheduled", when: "14 Mar" },
    { org: "Wave", ev: "Agent Conference", amt: "$22,180", method: "M-Pesa", status: "Paid", when: "02 Mar" },
    { org: "Andela", ev: "Engineering Week", amt: "$14,600", method: "Bank · USD", status: "Paid", when: "28 Feb" },
    { org: "Kuda", ev: "Fintech Mixer", amt: "$6,120", method: "Paystack", status: "On hold", when: "—" },
  ];
  const stTone = { Paid: "green", Processing: "forest", Scheduled: "amber", "On hold": "red" };
  return (
    <PageShell title="Finance & Payouts" subtitle="Gross volume, platform revenue and organizer payouts" max="1180px"
      actions={<><FilterBtn>Last 30 days</FilterBtn><Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Gross volume", value: "$2.4M", icon: "Dollar", delta: "16% mo", deltaUp: true },
        { label: "Platform revenue", value: "$214k", icon: "Chart", delta: "12% mo", deltaUp: true },
        { label: "Pending payouts", value: "$182k", icon: "Clock" },
        { label: "Processed (30d)", value: "$1.9M", icon: "Check", accent: true },
      ]} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
        <Panel title="Gross volume trend">
          <AreaChart color={CHART.goldDark} points={[{ label: "W1", v: 280 }, { label: "W2", v: 360 }, { label: "W3", v: 420 }, { label: "W4", v: 510 }, { label: "W5", v: 600 }, { label: "Now", v: 720 }]} />
        </Panel>
        <Panel title="Volume by method">
          <Donut size={150} segments={[
            { label: "Card", value: 48, color: CHART.forest },
            { label: "Flutterwave", value: 22, color: CHART.sage },
            { label: "M-Pesa", value: 18, color: CHART.gold },
            { label: "Bank", value: 12, color: CHART.mist },
          ]} centerLabel="$2.4M" centerSub="GMV" />
        </Panel>
      </div>
      <Panel title="Organizer payouts" pad="p-0" action={<Btn icon="Dollar" onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Run pending payouts?", confirmLabel: "Run payouts", confirmIcon: "Dollar", body: "This releases $182k in pending payouts to 3 organizers via their configured methods. Payouts on hold are skipped.", onConfirm: () => window.toast && window.toast("Payouts initiated") })}>Run payouts</Btn>}>
        <Table head={["Organizer", "Event", "Amount", "Method", "When", "Status"]}>
          {payouts.map((p, i) => (
            <Row key={i}>
              <Cell className="text-[13.5px] font-medium text-ink">{p.org}</Cell>
              <Cell className="text-[13px] text-ink-soft">{p.ev}</Cell>
              <Cell className="font-mono text-[13px] text-ink">{p.amt}</Cell>
              <Cell className="font-mono text-[12px] text-muted">{p.method}</Cell>
              <Cell className="font-mono text-[12px] text-muted">{p.when}</Cell>
              <Cell><Pill tone={stTone[p.status]} dot={p.status === "Paid" ? "#2D7A4F" : p.status === "On hold" ? "#B8423C" : null}>{p.status}</Pill></Cell>
            </Row>
          ))}
        </Table>
      </Panel>
    </PageShell>
  );
}

// ── Refunds & Disputes ───────────────────────────────────────────────
function RefundsPage() {
  const [tab, setTab] = React.useState("refunds");
  const [refunds, setRefunds] = React.useState([
    { id: "r1", who: "Liya Tesfaye", ev: "AfriTech Summit", amt: "$25.00", reason: "Duplicate purchase", status: "Pending", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
    { id: "r2", who: "Yusuf Bello", ev: "AfriTech Summit", amt: "$80.00", reason: "Can no longer attend", status: "Pending", g: "linear-gradient(135deg,#1F4D3A,#163828)" },
    { id: "r3", who: "Nadia Hassan", ev: "Design Week", amt: "$12.00", reason: "Event rescheduled", status: "Approved", g: "linear-gradient(135deg,#C9A45E,#2A6A50)" },
    { id: "r4", who: "Thabo Nkosi", ev: "Fintech Mixer", amt: "$30.00", reason: "Bought wrong tier", status: "Denied", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
  ]);
  const [disputes, setDisputes] = React.useState([
    { id: "d1", who: "Chargeback · ····4242", ev: "Build Summit", amt: "$120.00", reason: "Cardholder dispute", status: "Needs evidence", g: "linear-gradient(135deg,#5a2036,#a04a68)" },
    { id: "d2", who: "Chargeback · ····8810", ev: "AfriTech Summit", amt: "$25.00", reason: "Fraudulent", status: "Under review", g: "linear-gradient(135deg,#1f120c,#5a3320)" },
  ]);
  const stTone = { Pending: "amber", Approved: "green", Denied: "neutral", "Needs evidence": "red", "Under review": "amber" };
  const rows = tab === "refunds" ? refunds : disputes;
  const setRows = tab === "refunds" ? setRefunds : setDisputes;
  const patch = (id, fields, msg) => { setRows((rs) => rs.map((x) => x.id === id ? { ...x, ...fields } : x)); if (msg) window.toast && window.toast(msg); };
  const approve = (r) => window.openModal && window.openModal({
    type: "confirm", title: "Approve refund of " + r.amt + "?", confirmLabel: "Approve refund", confirmIcon: "Check",
    body: "We’ll refund " + r.who + " (" + r.amt + ") to their original payment method. This usually settles in 5–10 days.",
    onConfirm: () => patch(r.id, { status: "Approved" }, "Refund approved"),
  });
  const deny = (r) => window.openModal && window.openModal({
    type: "confirm", danger: true, title: "Deny this refund?", confirmLabel: "Deny refund", confirmIcon: "X",
    body: "Decline " + r.who + "’s refund request. They’ll be notified by email.", reason: true,
    onConfirm: () => patch(r.id, { status: "Denied" }, "Refund denied"),
  });
  return (
    <PageShell title="Refunds & Disputes" subtitle="Refund requests and payment disputes" max="1100px">
      <StatCards cols={4} items={[
        { label: "Refund requests", value: "18", icon: "CreditCard" },
        { label: "Open disputes", value: "4", icon: "Shield", delta: "1 new", deltaUp: false },
        { label: "Refund rate", value: "1.2%", icon: "Chart" },
        { label: "Refunded (30d)", value: "$8,400", icon: "Dollar", accent: true },
      ]} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "refunds", label: "Refund requests" }, { id: "disputes", label: "Disputes" }]} />
      <div className="grid gap-2.5">
        {rows.map((r) => (
          <div key={r.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <Avatar initials={r.who.split(" ").map((x) => x[0]).join("").slice(0, 2)} grad={r.g} size={42} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5"><span className="text-[14px] font-medium text-ink truncate">{r.who}</span><span className="font-mono text-[13px] text-primary">{r.amt}</span></div>
              <div className="text-[12.5px] text-ink-soft mt-0.5">{r.reason} · {r.ev}</div>
            </div>
            <Pill tone={stTone[r.status]}>{r.status}</Pill>
            {(r.status === "Pending" || r.status === "Needs evidence") && (
              <div className="flex items-center gap-2 shrink-0">
                {tab === "refunds"
                  ? <Btn size="sm" variant="ghost" icon="Check" onClick={() => approve(r)}>Approve</Btn>
                  : <Btn size="sm" variant="ghost" icon="Check" onClick={() => patch(r.id, { status: "Under review" }, "Evidence submitted")}>Submit evidence</Btn>}
                {tab === "refunds" && <button onClick={() => deny(r)} className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-[12.5px] font-medium hover:bg-red-50 transition-colors">Deny</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ── Plans & Feature Flags ────────────────────────────────────────────
function FlagsPage() {
  const [tab, setTab] = React.useState("flags");
  const plans = [
    { name: "Free", price: "$0", events: "1 event", regs: "50 regs", users: "2,816" },
    { name: "Pro", price: "$19", events: "Unlimited", regs: "500/mo", users: "1,218", pop: true },
    { name: "Studio", price: "$49", events: "Unlimited", regs: "Unlimited", users: "184" },
  ];
  const [flags, setFlags] = React.useState([
    { name: "AI matchmaking v2", desc: "Improved networking suggestions", env: "Production", pct: 100, on: true },
    { name: "Virtual stage (HD)", desc: "1080p streaming for Studio", env: "Production", pct: 60, on: true },
    { name: "Karta Card video export", desc: "Animated card downloads", env: "Beta", pct: 25, on: true },
    { name: "Self-serve refunds", desc: "Let attendees request in-app", env: "Beta", pct: 10, on: true },
    { name: "New onboarding flow", desc: "Revamped first-run wizard", env: "Internal", pct: 0, on: false },
  ]);
  const toggleFlag = (i) => setFlags((fs) => fs.map((f, j) => j === i ? { ...f, on: !f.on } : f));
  const newFlag = () => window.openModal && window.openModal({ type: "form", title: "New feature flag", subtitle: "Roll out a feature gradually", fields: [{ label: "Flag name", placeholder: "e.g. New checkout" }, { label: "Description", placeholder: "What it controls" }, { cols: 2, items: [{ label: "Environment", value: "Beta" }, { label: "Rollout %", value: "10", mono: true }] }], submitLabel: "Create flag", submitIcon: "Plus", onConfirm: () => window.toast && window.toast("Feature flag created") });
  const editPlan = (p) => window.openModal && window.openModal({ type: "form", title: "Edit " + p.name + " plan", subtitle: "Adjust limits and pricing", fields: [{ cols: 2, items: [{ label: "Price / mo", value: p.price, mono: true }, { label: "Events", value: p.events }] }, { label: "Registrations", value: p.regs }], submitLabel: "Save plan", submitIcon: "Check", onConfirm: () => window.toast && window.toast(p.name + " plan updated") });
  return (
    <PageShell title="Plans & Flags" subtitle="Plan configuration and feature rollouts" max="1100px"
      actions={<Btn variant="primary" icon="Plus" onClick={newFlag}>New flag</Btn>}>
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "flags", label: "Feature flags" }, { id: "plans", label: "Plans" }]} />
      {tab === "plans" ? (
        <div className="grid lg:grid-cols-3 gap-4">
          {plans.map((p, i) => (
            <div key={i} className={`rounded-2xl border p-5 ${p.pop ? "border-accent/60" : "border-border bg-surface"}`} style={p.pop ? { background: "linear-gradient(135deg, rgba(232,197,126,0.12), rgba(31,77,58,0.04))" } : undefined}>
              <div className="flex items-center justify-between"><span className="font-display text-[15px] font-semibold text-primary">{p.name}</span>{p.pop && <Pill tone="gold">Popular</Pill>}</div>
              <div className="mt-3 font-mono text-[26px] text-primary">{p.price}<span className="text-[12px] text-muted">/mo</span></div>
              <div className="mt-3 grid gap-1.5 text-[13px] text-ink-soft">
                <div className="flex items-center gap-2"><Icon.Check w={14} style={{ color: "#1F4D3A" }} /> {p.events}</div>
                <div className="flex items-center gap-2"><Icon.Check w={14} style={{ color: "#1F4D3A" }} /> {p.regs}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between"><span className="font-mono text-[11px] text-muted">{p.users} accounts</span><Btn size="sm" variant="ghost" icon="Gear" onClick={() => editPlan(p)}>Edit</Btn></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-2.5">
          {flags.map((f, i) => {
            const envTone = { Production: "green", Beta: "amber", Internal: "neutral" };
            return (
              <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
                <span className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${f.on ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted"}`}><Icon.Puzzle w={16} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5"><span className="text-[14px] font-medium text-ink">{f.name}</span><Pill tone={envTone[f.env]}>{f.env}</Pill></div>
                  <div className="text-[12.5px] text-muted mt-0.5">{f.desc}</div>
                </div>
                <div className="hidden sm:block w-[120px] shrink-0">
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-muted mb-1"><span>Rollout</span><span>{f.pct}%</span></div>
                  <ProgressBar pct={f.pct} color={f.pct === 100 ? CHART.forest : CHART.goldDark} height={6} />
                </div>
                <Toggle on={f.on} onClick={() => toggleFlag(i)} />
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

// ── System Health ────────────────────────────────────────────────────
function HealthPage() {
  const services = [
    { name: "API", up: "99.99%", lat: "82ms", status: "Operational" },
    { name: "Web app", up: "99.98%", lat: "120ms", status: "Operational" },
    { name: "Payments", up: "99.95%", lat: "210ms", status: "Operational" },
    { name: "Email & notifications", up: "99.90%", lat: "340ms", status: "Degraded" },
    { name: "Check-in sync", up: "100%", lat: "60ms", status: "Operational" },
    { name: "Streaming (virtual)", up: "99.97%", lat: "180ms", status: "Operational" },
  ];
  const incidents = [
    { t: "Email delivery delays (SendGrid upstream)", when: "Today · 09:12", color: "#C9A45E", st: "Monitoring" },
    { t: "Resolved: elevated API latency in eu-west", when: "28 Feb", color: "#2D7A4F", st: "Resolved" },
    { t: "Resolved: payments webhook retry backlog", when: "21 Feb", color: "#2D7A4F", st: "Resolved" },
  ];
  const degraded = services.some((s) => s.status !== "Operational");
  return (
    <PageShell title="System Health" subtitle="Live platform status and incidents" max="1100px"
      actions={<Btn icon="External">Public status page</Btn>}>
      <div className={`rounded-2xl border p-5 mb-5 flex items-center gap-4 ${degraded ? "border-amber-200 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/60"}`}>
        <span className={`w-11 h-11 rounded-xl grid place-items-center ${degraded ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{degraded ? <Icon.Bell w={20} /> : <Icon.Check w={20} />}</span>
        <div><div className="font-display text-[16px] font-semibold text-ink">{degraded ? "Partial degradation" : "All systems operational"}</div><div className="text-[13px] text-ink-soft mt-0.5">{degraded ? "Email delivery is delayed — team investigating." : "Everything is running smoothly."}</div></div>
      </div>
      <StatCards cols={4} items={[
        { label: "Uptime (90d)", value: "99.97%", icon: "Check" },
        { label: "Requests / min", value: "42k", icon: "Bolt" },
        { label: "Error rate", value: "0.02%", icon: "Chart" },
        { label: "Open incidents", value: "1", icon: "Bell", accent: true },
      ]} />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Panel title="Services" pad="p-0">
          <div className="divide-y divide-border/60">
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${s.status === "Operational" ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="flex-1 text-[13.5px] font-medium text-ink">{s.name}</span>
                <span className="font-mono text-[11.5px] text-muted w-[64px] text-right">{s.lat}</span>
                <span className="font-mono text-[11.5px] text-muted w-[68px] text-right">{s.up}</span>
                <Pill tone={s.status === "Operational" ? "green" : "amber"} className="hidden sm:inline-flex">{s.status}</Pill>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="API latency (24h)">
          <AreaChart color={CHART.forest} points={[{ label: "00", v: 80 }, { label: "04", v: 70 }, { label: "08", v: 110 }, { label: "12", v: 140 }, { label: "16", v: 120 }, { label: "now", v: 90 }]} />
        </Panel>
      </div>
      <div className="mt-5">
        <Panel title="Incident history">
          <Timeline items={incidents.map((it) => ({ text: it.t + "  ·  " + it.st, when: it.when, color: it.color }))} />
        </Panel>
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "admin-finance": FinancePage,
  "admin-refunds": RefundsPage,
  "admin-flags": FlagsPage,
  "admin-health": HealthPage,
});
