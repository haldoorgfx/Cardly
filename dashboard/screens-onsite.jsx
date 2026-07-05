// Event-level · On-site: 1:1 Meetings scheduler + Badge designer/print.

// Local decorative QR (dashboard has no shared QR component).
function BadgeQR({ size = 42 }) {
  const n = 17, c = size / n;
  const seed = (x, y) => ((x * 13 + y * 7 + x * y * 3) % 5) > 1;
  const dots = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = (x < 5 && y < 5) || (x > 11 && y < 5) || (x < 5 && y > 11);
    if (!inF && seed(x, y)) dots.push(<rect key={x + "-" + y} x={x * c} y={y * c} width={c} height={c} fill="#0F1F18" />);
  }
  const finder = (gx, gy) => (
    <g key={gx + "f" + gy}><rect x={gx * c} y={gy * c} width={c * 5} height={c * 5} fill="#0F1F18" /><rect x={(gx + 1) * c} y={(gy + 1) * c} width={c * 3} height={c * 3} fill="#fff" /><rect x={(gx + 2) * c} y={(gy + 2) * c} width={c} height={c} fill="#0F1F18" /></g>
  );
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded"><rect width={size} height={size} fill="#fff" />{dots}{finder(0, 0)}{finder(12, 0)}{finder(0, 12)}</svg>);
}

// ════════════════════════════════════════════════════════════════════
// 1:1 MEETINGS — attendee meeting scheduler (organizer view)
// ════════════════════════════════════════════════════════════════════
function MeetingsPage({ event }) {
  const [tab, setTab] = React.useState("schedule");
  return (
    <PageShell title="1:1 Meetings" subtitle={`Attendee meeting scheduler · ${event.name}`}
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Exporting the meeting schedule…")}>Export</Btn><Btn variant="primary" icon="Gear" onClick={() => setTab("settings")}>Settings</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Meetings booked", value: "92", icon: "Calendar", delta: "12 today", deltaUp: true },
        { label: "Acceptance rate", value: "68%", icon: "Check", accent: true },
        { label: "Avg. per attendee", value: "3.4", icon: "Users" },
        { label: "No-shows", value: "4%", icon: "Clock" },
      ]} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "schedule", label: "Schedule" }, { id: "requests", label: "Requests" }, { id: "settings", label: "Settings" }]} />
      {tab === "schedule" && <MeetingsSchedule />}
      {tab === "requests" && <MeetingRequests />}
      {tab === "settings" && <MeetingSettings />}
    </PageShell>
  );
}

const MEET_PEOPLE = [
  ["AO", "linear-gradient(135deg,#C9A45E,#1F4D3A)"], ["KM", "linear-gradient(135deg,#1F4D3A,#2A6A50)"],
  ["TM", "linear-gradient(135deg,#2A6A50,#C9A45E)"], ["YB", "linear-gradient(135deg,#163828,#3E7E5E)"],
  ["FD", "linear-gradient(135deg,#3E7E5E,#C9A45E)"], ["LT", "linear-gradient(135deg,#1F4D3A,#163828)"],
];

function MeetingsSchedule() {
  const slots = ["10:00", "10:30", "11:00", "11:30", "12:00", "14:00", "14:30", "15:00"];
  const tables = ["Table 1", "Table 2", "Table 3", "Table 4", "Table 5"];
  // deterministic booked cells
  const booked = (r, c) => ((r * 7 + c * 3 + r * c) % 5) > 1;
  const pair = (r, c) => [MEET_PEOPLE[(r + c) % 6], MEET_PEOPLE[(r + c + 2) % 6]];
  return (
    <Panel title="Day 1 · meeting hall" action={<Pill tone="green" dot="#2D7A4F">Live</Pill>} pad="p-0">
      <div className="overflow-x-auto att-scroll">
        <div className="min-w-[680px] p-4">
          {/* header */}
          <div className="grid items-center gap-2 mb-2" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
            <span />
            {tables.map((t, i) => <div key={i} className="text-center font-mono text-[9.5px] tracking-[0.12em] uppercase text-muted">{t}</div>)}
          </div>
          {slots.map((s, r) => (
            <div key={r} className="grid items-stretch gap-2 mb-2" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
              <span className="font-mono text-[12px] text-ink-soft flex items-center">{s}</span>
              {tables.map((t, c) => {
                if (!booked(r, c)) return <div key={c} className="rounded-lg border border-dashed border-border bg-cream/40 h-[44px]" />;
                const [a, b] = pair(r, c);
                return (
                  <div key={c} className="rounded-lg bg-primary-soft/70 border border-primary/20 h-[44px] flex items-center justify-center gap-1 px-1">
                    <span className="w-6 h-6 rounded-full grid place-items-center text-cream font-display text-[9px] font-semibold" style={{ background: a[1] }}>{a[0]}</span>
                    <Icon.Arrow w={11} style={{ color: "#6B7A72" }} />
                    <span className="w-6 h-6 rounded-full grid place-items-center text-cream font-display text-[9px] font-semibold" style={{ background: b[1] }}>{b[0]}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function MeetingRequests() {
  const seed = [
    { from: ["Amara Okeke", "linear-gradient(135deg,#3E7E5E,#C9A45E)"], to: ["David Mwangi", "linear-gradient(135deg,#1F4D3A,#2A6A50)"], topic: "Discuss Series A for logistics", when: "Day 1 · 11:00", status: "pending" },
    { from: ["Zainab Bello", "linear-gradient(135deg,#2A6A50,#1F4D3A)"], to: ["Kwame Mensah", "linear-gradient(135deg,#C9A45E,#1F4D3A)"], topic: "Payments API integration", when: "Day 1 · 14:30", status: "pending" },
    { from: ["Thabo Nkosi", "linear-gradient(135deg,#163828,#3E7E5E)"], to: ["Fatou Diop", "linear-gradient(135deg,#3E7E5E,#C9A45E)"], topic: "Hiring senior engineers", when: "Day 2 · 10:30", status: "pending" },
  ];
  const [reqs, setReqs] = React.useState(seed);
  const act = (i, msg) => { setReqs((rs) => rs.filter((_, j) => j !== i)); window.toast && window.toast(msg); };
  if (reqs.length === 0) return <EmptyState icon="Check" title="All caught up" body="No pending meeting requests to review." />;
  return (
    <div className="grid gap-2.5">
      {reqs.map((r, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
          <div className="flex items-center -space-x-2 shrink-0">
            <span className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[11px] font-semibold ring-2 ring-cream" style={{ background: r.from[1] }}>{r.from[0].split(" ").map((x) => x[0]).join("")}</span>
            <span className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[11px] font-semibold ring-2 ring-cream" style={{ background: r.to[1] }}>{r.to[0].split(" ").map((x) => x[0]).join("")}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] text-ink"><span className="font-medium">{r.from[0]}</span> <span className="text-muted">→</span> <span className="font-medium">{r.to[0]}</span></div>
            <div className="text-[12.5px] text-ink-soft mt-0.5">{r.topic}</div>
            <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted mt-1">{r.when}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Btn size="sm" variant="ghost" icon="Check" onClick={() => act(i, "Meeting confirmed")}>Approve</Btn>
            <button onClick={() => act(i, "Request declined")} className="px-3 py-2 rounded-lg border border-red-300 text-red-700 text-[12.5px] font-medium hover:bg-red-50 transition-colors">Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function MeetingSettings() {
  const [on, setOn] = React.useState(true);
  const [len, setLen] = React.useState("30");
  const rows = [
    ["Let attendees book 1:1s", "Attendees request meetings from each other's profiles", true],
    ["Require organizer approval", "Review each meeting before it's confirmed", false],
    ["Auto-assign tables", "Place confirmed meetings at the next free table", true],
    ["Block double-booking", "Prevent overlapping meetings per attendee", true],
  ];
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Panel title="Availability">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/70">
          <div><div className="text-[13.5px] font-medium text-ink">Meeting scheduler</div><div className="text-[12px] text-muted mt-0.5">Enable 1:1 meetings for this event</div></div>
          <Toggle on={on} onClick={() => setOn(!on)} />
        </div>
        <div className="mb-4">
          <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-2">Meeting length</div>
          <SegTabs active={len} onChange={setLen} tabs={[{ id: "15", label: "15 min" }, { id: "30", label: "30 min" }, { id: "45", label: "45 min" }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Available from" value="10:00" mono />
          <Field label="Available until" value="16:00" mono />
          <Field label="Meeting tables" value="5" mono />
          <Field label="Location" value="Networking Hall" />
        </div>
      </Panel>
      <Panel title="Rules">
        <div className="grid gap-3.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3"><div><div className="text-[13.5px] text-ink font-medium">{r[0]}</div><div className="text-[12px] text-muted mt-0.5">{r[1]}</div></div><Toggle on={r[2]} /></div>
          ))}
        </div>
        <div className="mt-5"><Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Meeting settings saved")}>Save settings</Btn></div>
      </Panel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// BADGES — design & print on-site name badges
// ════════════════════════════════════════════════════════════════════
const BADGE_VARIANTS = [
  { id: "attendee", label: "Attendee", strip: "#1F4D3A", role: "Attendee" },
  { id: "speaker", label: "Speaker", strip: "#C9A45E", role: "Speaker" },
  { id: "vip", label: "VIP", strip: "#163828", role: "VIP" },
  { id: "staff", label: "Staff", strip: "#2A6A50", role: "Staff" },
];

function BadgePreview({ variant, opts }) {
  return (
    <div className="rounded-xl overflow-hidden bg-white border border-border shadow-lg mx-auto" style={{ width: 340, aspectRatio: "3.5 / 2.3" }}>
      <div style={{ height: 8, background: variant.strip }} />
      <div className="px-5 pt-3.5 pb-4 h-[calc(100%-8px)] flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md" style={{ background: "linear-gradient(135deg,#1F4D3A,#2A6A50 60%,#E8C57E)" }} />
            <span className="font-display text-[12px] font-bold text-primary">Africa Tech Fest</span>
          </div>
          <span className="font-mono text-[8px] tracking-[0.14em] uppercase px-1.5 py-0.5 rounded-full font-semibold" style={{ background: variant.strip, color: variant.id === "speaker" ? "#163828" : "#FAF6EE" }}>{variant.role}</span>
        </div>
        <div className="flex-1 flex items-center gap-3 mt-1">
          {opts.photo && <span className="w-12 h-12 rounded-full grid place-items-center text-cream font-display text-[15px] font-semibold shrink-0" style={{ background: "linear-gradient(135deg,#C9A45E,#1F4D3A)" }}>AO</span>}
          <div className="min-w-0">
            <div className="font-display text-[22px] font-bold text-ink tracking-[-0.02em] leading-none">Amina Osman</div>
            {opts.company && <div className="text-[12px] text-ink-soft mt-1.5">Founder · Sahel Pay</div>}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted">#AT-198 · 12 Mar</span>
          {opts.qr && <span className="shrink-0"><BadgeQR size={42} /></span>}
        </div>
      </div>
    </div>
  );
}

function BadgesPage({ event }) {
  const [variant, setVariant] = React.useState(BADGE_VARIANTS[0]);
  const [opts, setOpts] = React.useState({ photo: true, qr: true, company: true, strip: true });
  const tog = (k) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  return (
    <PageShell title="Badges" subtitle={`Design & print on-site name badges · ${event.name}`}
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Badge PDF generated — downloading…")}>Download PDF</Btn><Btn variant="primary" icon="Scan" onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Open kiosk print mode?", confirmLabel: "Launch kiosk", confirmIcon: "Scan", body: "Kiosk mode lets attendees self-check-in and print their badge on arrival. Run this on the device connected to your badge printer.", onConfirm: () => window.toast && window.toast("Kiosk print mode launched") })}>Kiosk mode</Btn></>}>
      {/* variant tabs */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {BADGE_VARIANTS.map((v) => (
          <button key={v.id} onClick={() => setVariant(v)} className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${variant.id === v.id ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border hover:border-primary/40"}`}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: v.strip }} />{v.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* preview stage */}
        <Panel title={null}>
          <div className="rounded-xl py-10 grid place-items-center" style={{ background: "#EFE9DC", backgroundImage: "radial-gradient(circle, rgba(15,31,24,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            <BadgePreview variant={variant} opts={opts} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted">3.5" × 2.3" · landscape · 300 DPI</span>
            <Btn size="sm" variant="ghost" icon="Eye" onClick={() => window.toast && window.toast("Printing a test badge…")}>Print test</Btn>
          </div>
        </Panel>

        {/* settings */}
        <div className="grid gap-4 content-start">
          <Panel title="Elements">
            <div className="grid gap-3.5">
              {[["photo", "Attendee photo", "Show headshot or initials"], ["qr", "QR code", "For session & access scanning"], ["company", "Company & role", "Below the name"], ["strip", "Tier color strip", "Color-code badge by ticket"]].map(([k, label, desc]) => (
                <div key={k} className="flex items-center justify-between gap-3"><div><div className="text-[13px] text-ink font-medium">{label}</div><div className="text-[11.5px] text-muted mt-0.5">{desc}</div></div><Toggle on={opts[k]} onClick={() => tog(k)} /></div>
              ))}
            </div>
          </Panel>
          <Panel title="Paper & printer">
            <div className="grid gap-3">
              <Field label="Badge size" value='3.5" × 2.3" (US standard)' />
              <Field label="Printer" value="Brother QL-820 · Hall A" mono />
              <div className="grid grid-cols-2 gap-3"><Field label="Per sheet" value="1" mono /><Field label="Margin" value="3mm" mono /></div>
            </div>
          </Panel>
          <div className="grid gap-2.5">
            <Btn variant="primary" full icon="IdCard" onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Print all badges?", confirmLabel: "Print 247 badges", confirmIcon: "IdCard", body: "Generate and queue print-ready badges for all 247 registered attendees, grouped by ticket tier. You can also print on-demand at check-in.", onConfirm: () => window.toast && window.toast("247 badges queued for printing") })}>Bulk print all</Btn>
            <Btn variant="ghost" full icon="Check" onClick={() => window.toast && window.toast("Badge design saved")}>Save design</Btn>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  meetings: MeetingsPage,
  badges: BadgesPage,
});
