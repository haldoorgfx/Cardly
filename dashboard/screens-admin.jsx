// Platform · Admin (role-gated): Users, All Events, Platform Analytics, Changelog, Audit Log

function AdminUsersPage({ onOpenDetail }) {
  const users = [
    { n: "Adaeze Okafor", e: "adaeze@eventera.so", org: "Karta Events Co.", plan: "pro", events: 4, joined: "Jan 2026", status: "Active", g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Samuel Adeyemi", e: "sam@paystack.com", org: "Paystack", plan: "studio", events: 11, joined: "Nov 2025", status: "Active", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Grace Wanjiru", e: "grace@safboda.co", org: "SafBoda", plan: "free", events: 1, joined: "Mar 2026", status: "Active", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "Ibrahim Toure", e: "ibrahim@wave.com", org: "Wave", plan: "studio", events: 7, joined: "Dec 2025", status: "Active", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "Chioma Eze", e: "chioma@andela.com", org: "Andela", plan: "pro", events: 3, joined: "Feb 2026", status: "Suspended", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
  ];
  const planTone = { free: "neutral", pro: "forest", studio: "gold" };
  return (
    <PageShell title="Users" subtitle="All platform users across organizations" max="1180px"
      actions={<Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn>}>
      <StatCards cols={4} items={[
        { label: "Total users", value: "4,218", icon: "Users", delta: "6% mo", deltaUp: true },
        { label: "Paid accounts", value: "1,402", icon: "CreditCard" },
        { label: "Studio", value: "184", icon: "Sparkle", accent: true },
        { label: "Active today", value: "892", icon: "Bolt" },
      ]} />
      <Toolbar search="Search users…"><FilterBtn>All plans</FilterBtn><FilterBtn>Status</FilterBtn></Toolbar>
      <Table head={["User", "Organization", "Plan", "Events", "Joined", "Status"]}>
        {users.map((u, i) => (
          <Row key={i}>
            <Cell>
              <div onClick={() => onOpenDetail && onOpenDetail("user", u)} className="flex items-center gap-3 cursor-pointer">
                <Avatar initials={u.n.split(" ").map((x) => x[0]).join("")} grad={u.g} size={34} />
                <div className="min-w-0"><div className="text-[13.5px] font-medium text-ink leading-tight">{u.n}</div><div className="font-mono text-[11px] text-muted truncate">{u.e}</div></div>
              </div>
            </Cell>
            <Cell className="text-[13px] text-ink-soft">{u.org}</Cell>
            <Cell><Pill tone={planTone[u.plan]} className="capitalize">{u.plan}</Pill></Cell>
            <Cell className="font-mono text-[13px] text-ink">{u.events}</Cell>
            <Cell className="font-mono text-[12px] text-muted">{u.joined}</Cell>
            <Cell><Pill tone={u.status === "Active" ? "green" : "red"} dot={u.status === "Active" ? "#2D7A4F" : "#B8423C"}>{u.status}</Pill></Cell>
          </Row>
        ))}
      </Table>
    </PageShell>
  );
}

function AdminEventsPage() {
  const events = [
    { n: "Africa Tech Festival 2026", org: "Karta Events Co.", reg: 247, status: "live", created: "Jan 2026" },
    { n: "Paystack Build Summit", org: "Paystack", reg: 1840, status: "live", created: "Nov 2025" },
    { n: "Wave Agent Conference", org: "Wave", reg: 920, status: "ended", created: "Dec 2025" },
    { n: "Pan-African Climate Summit", org: "Karta Events Co.", reg: 38, status: "draft", created: "Feb 2026" },
    { n: "Andela Engineering Week", org: "Andela", reg: 410, status: "live", created: "Jan 2026" },
  ];
  return (
    <PageShell title="All Events" subtitle="Every event on the platform" max="1180px"
      actions={<Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn>}>
      <StatCards cols={4} items={[
        { label: "Total events", value: "12,840", icon: "Calendar", delta: "9% mo", deltaUp: true },
        { label: "Live now", value: "318", icon: "Bolt" },
        { label: "Registrations", value: "1.2M", icon: "Users" },
        { label: "Cards shared", value: "740k", icon: "IdCard", accent: true },
      ]} />
      <Toolbar search="Search events…"><FilterBtn>All statuses</FilterBtn></Toolbar>
      <Table head={["Event", "Organizer", "Registrations", "Status", "Created"]}>
        {events.map((e, i) => (
          <Row key={i}>
            <Cell className="text-[13.5px] font-medium text-ink">{e.n}</Cell>
            <Cell className="text-[13px] text-ink-soft">{e.org}</Cell>
            <Cell className="font-mono text-[13px] text-ink">{e.reg.toLocaleString()}</Cell>
            <Cell><Pill tone={e.status === "live" ? "green" : e.status === "draft" ? "amber" : "neutral"} dot={STATUS_STYLE[e.status].dot}>{STATUS_STYLE[e.status].label}</Pill></Cell>
            <Cell className="font-mono text-[12px] text-muted">{e.created}</Cell>
          </Row>
        ))}
      </Table>
    </PageShell>
  );
}

function AdminAnalyticsPage() {
  return (
    <PageShell title="Platform Analytics" subtitle="Business health at a glance"
      actions={<FilterBtn>Last 12 months</FilterBtn>}>
      <StatCards cols={4} items={[
        { label: "MRR", value: "$84.2k", icon: "Dollar", delta: "12% mo", deltaUp: true },
        { label: "Active orgs", value: "1,402", icon: "Briefcase", delta: "6% mo", deltaUp: true },
        { label: "Net revenue", value: "$1.01M", icon: "Chart" },
        { label: "Churn", value: "2.1%", icon: "Arrow", delta: "0.4%", deltaUp: false },
      ]} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
        <Panel title="Recurring revenue">
          <AreaChart color={CHART.goldDark} points={[
            { label: "Q1", v: 28 }, { label: "Q2", v: 44 }, { label: "Q3", v: 61 }, { label: "Q4", v: 84 },
          ]} />
        </Panel>
        <Panel title="Plan mix">
          <Donut size={150} segments={[
            { label: "Free", value: 2816, color: CHART.mist },
            { label: "Pro", value: 1218, color: CHART.sage },
            { label: "Studio", value: 184, color: CHART.goldDark },
          ]} centerLabel="4.2k" centerSub="ORGS" />
        </Panel>
      </div>
      <Panel title="New signups by month">
        <BarsChart data={[
          { label: "Oct", value: 210 }, { label: "Nov", value: 280 }, { label: "Dec", value: 240 },
          { label: "Jan", value: 360 }, { label: "Feb", value: 420 }, { label: "Mar", value: 510 },
        ]} height={180} />
      </Panel>
    </PageShell>
  );
}

function AdminChangelogPage() {
  const releases = [
    { v: "2.8", date: "28 May 2026", tag: "Latest", items: ["AI matchmaking for networking", "Sponsor lead retrieval", "Faster check-in sync"] },
    { v: "2.7", date: "02 May 2026", items: ["Multi-track agenda builder", "Karta Card video export", "Flutterwave payouts"] },
    { v: "2.6", date: "14 Apr 2026", items: ["Gamification & leaderboards", "Webhook retries", "Team roles & permissions"] },
    { v: "2.5", date: "20 Mar 2026", items: ["Live Q&A and polls", "White-label custom domains"] },
  ];
  return (
    <PageShell title="Changelog" subtitle="What's shipped on the platform" max="820px"
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Publish a release", subtitle: "Add a changelog entry", fields: [{ cols: 2, items: [{ label: "Version", value: "2.9", mono: true }, { label: "Date", value: "03 Jun 2026" }] }, { label: "What's new", area: true, placeholder: "One change per line…" }, { label: "Tag as latest", toggle: true, on: true, desc: "Show the “Latest” badge" }], submitLabel: "Publish release", submitIcon: "Check", onConfirm: () => window.toast && window.toast("Release published") })}>New release</Btn>}>
      <div className="relative pl-7">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        <div className="grid gap-7">
          {releases.map((r, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-7 top-1.5 w-3.5 h-3.5 rounded-full bg-accent ring-4 ring-cream" />
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="font-display text-[17px] font-semibold text-primary tracking-tight">v{r.v}</span>
                {r.tag && <Pill tone="gold">{r.tag}</Pill>}
                <span className="font-mono text-[11px] text-muted">{r.date}</span>
              </div>
              <div className="bg-surface border border-border rounded-2xl p-4 grid gap-2">
                {r.items.map((it, j) => (
                  <div key={j} className="flex items-start gap-2.5 text-[13.5px] text-ink-soft">
                    <span className="text-primary mt-0.5"><Icon.Check w={14} /></span>{it}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function AdminAuditPage() {
  const logs = [
    ["adaeze@eventera.so", "event.published", "Africa Tech Festival 2026", "41.79.x.x", "2 min ago"],
    ["sam@paystack.com", "api_key.created", "Production key", "102.89.x.x", "18 min ago"],
    ["system", "payout.processed", "₦4.2M · Africa Tech Fest", "—", "1 hr ago"],
    ["chioma@andela.com", "user.suspended", "by admin", "197.210.x.x", "3 hr ago"],
    ["emeka@eventera.so", "team.invited", "zainab@eventera.so", "41.79.x.x", "5 hr ago"],
    ["grace@safboda.co", "login.failed", "3 attempts", "105.112.x.x", "Yesterday"],
  ];
  const actionTone = (a) => a.includes("failed") || a.includes("suspended") ? "red" : a.includes("created") || a.includes("published") || a.includes("processed") ? "green" : "neutral";
  return (
    <PageShell title="Audit Log" subtitle="Security and administrative events" max="1180px"
      actions={<Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn>}>
      <Toolbar search="Search actions…"><FilterBtn>All actors</FilterBtn><FilterBtn>Action type</FilterBtn></Toolbar>
      <Table head={["Actor", "Action", "Target", "IP", "When"]}>
        {logs.map((l, i) => (
          <Row key={i}>
            <Cell><span className="font-mono text-[12.5px] text-ink">{l[0]}</span></Cell>
            <Cell><Pill tone={actionTone(l[1])}><span className="font-mono text-[11px]">{l[1]}</span></Pill></Cell>
            <Cell className="text-[13px] text-ink-soft">{l[2]}</Cell>
            <Cell className="font-mono text-[12px] text-muted">{l[3]}</Cell>
            <Cell className="font-mono text-[12px] text-muted">{l[4]}</Cell>
          </Row>
        ))}
      </Table>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "admin-users": AdminUsersPage,
  "admin-events": AdminEventsPage,
  "admin-analytics": AdminAnalyticsPage,
  "admin-changelog": AdminChangelogPage,
  "admin-audit": AdminAuditPage,
});
