// Event-level · Engagement (Pro): Networking, Q&A & Polls, Gamification
// Event-level · Partners (Studio): Sponsors, Virtual

function NetworkingPage({ event }) {
  const top = [
    { n: "Fatou Diop", c: 28, g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "Kwame Mensah", c: 24, g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Odunayo Eweniyi", c: 21, g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Tunde Kehinde", c: 19, g: "linear-gradient(135deg,#163828,#3E7E5E)" },
  ];
  return (
    <PageShell title="Networking" subtitle="Attendee connections & AI matchmaking"
      actions={<Btn variant="primary" icon="Gear" onClick={() => window.openModal && window.openModal({ type: "form", title: "Matchmaking settings", subtitle: "Tune AI attendee suggestions", fields: [{ label: "Match attendees by", toggle: true, on: true, desc: "Shared interests & goals" }, { label: "Suggest sessions", toggle: true, on: true, desc: "Recommend sessions per attendee" }, { label: "Daily suggestions per person", value: "5", mono: true }], submitLabel: "Save settings", submitIcon: "Check", onConfirm: () => window.toast && window.toast("Matchmaking settings saved") })}>Matchmaking settings</Btn>}>
      <StatCards cols={4} items={[
        { label: "Connections made", value: "486", icon: "Network", delta: "9% wk", deltaUp: true },
        { label: "Messages sent", value: "1,204", icon: "Chat" },
        { label: "Meetings booked", value: "92", icon: "Calendar" },
        { label: "Match acceptance", value: "68%", icon: "Check", accent: true },
      ]} />
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5">
        <Panel title="Connections over time">
          <AreaChart points={[
            { label: "Mon", v: 40 }, { label: "Tue", v: 95 }, { label: "Wed", v: 160 },
            { label: "Thu", v: 130 }, { label: "Fri", v: 210 }, { label: "Sat", v: 260 },
          ]} color={CHART.sage} />
        </Panel>
        <Panel title="Top connectors">
          <div className="grid gap-2.5">
            {top.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-[12px] text-muted w-4">{i + 1}</span>
                <Avatar initials={t.n.split(" ").map((x) => x[0]).join("")} grad={t.g} size={32} />
                <span className="flex-1 text-[13.5px] text-ink font-medium truncate">{t.n}</span>
                <span className="font-mono text-[12px] text-primary">{t.c}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-5">
        <Panel title="AI matchmaking">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              ["Match by interests", "Pair attendees with shared topics", true],
              ["Match by goals", "Founders ↔ investors, hiring, etc.", true],
              ["Suggest sessions", "Recommend sessions per attendee", false],
            ].map((r, i) => (
              <div key={i} className="bg-cream/60 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center"><Icon.Sparkle w={15} /></span>
                  <Toggle on={r[2]} />
                </div>
                <div className="text-[13.5px] font-medium text-ink">{r[0]}</div>
                <div className="text-[12px] text-muted mt-0.5">{r[1]}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

function QandAPage({ event }) {
  const [tab, setTab] = React.useState("qa");
  const questions = [
    { q: "How do you handle FX volatility when scaling across African markets?", a: "Scaling fintech across borders", votes: 47, by: "Anonymous", status: "live" },
    { q: "What's your hiring philosophy for early engineers?", a: "Fireside: Building Paystack", votes: 38, by: "Nia W.", status: "answered" },
    { q: "Will sessions be recorded and shared afterwards?", a: "General", votes: 31, by: "Yusuf B.", status: "live" },
    { q: "How important is profitability vs growth for African startups?", a: "LP panel", votes: 24, by: "Anonymous", status: "live" },
  ];
  const polls = [
    { q: "What's your biggest scaling challenge?", opts: [["Hiring", 42], ["Funding", 28], ["Regulation", 19], ["Infrastructure", 11]] },
    { q: "Which market are you expanding to next?", opts: [["Nigeria", 34], ["Kenya", 26], ["Egypt", 22], ["South Africa", 18]] },
  ];
  return (
    <PageShell title="Q&A & Polls" subtitle="Live session engagement"
      actions={tab === "qa" ? <Btn variant="primary" icon="Plus" onClick={() => window.toast && window.toast("Q&A opened for attendees")}>Open Q&A</Btn> : <Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Create poll", subtitle: "Ask the room a question", fields: [{ label: "Question", placeholder: "What's your biggest challenge?" }, { label: "Options", area: true, placeholder: "One option per line…" }], submitLabel: "Launch poll", submitIcon: "Plus", onConfirm: () => window.toast && window.toast("Poll is live") })}>Create poll</Btn>}>>
      <SegTabs active={tab} onChange={setTab} tabs={[{ id: "qa", label: "Q&A" }, { id: "polls", label: "Polls" }]} />
      {tab === "qa" ? (
        <div className="grid gap-2.5">
          {questions.map((q, i) => (
            <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-primary/40 transition-colors">
              <div className="flex flex-col items-center gap-0.5 shrink-0 w-10">
                <button className="text-primary hover:scale-110 transition-transform"><Icon.Arrow w={16} style={{ transform: "rotate(-90deg)" }} /></button>
                <span className="font-mono text-[14px] text-ink">{q.votes}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] text-ink leading-snug">{q.q}</div>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-[11px] text-muted">
                  <span>{q.by}</span><span className="text-border">·</span><span>{q.a}</span>
                </div>
              </div>
              <Pill tone={q.status === "live" ? "green" : "neutral"} dot={q.status === "live" ? "#2D7A4F" : null}>{q.status === "live" ? "Live" : "Answered"}</Pill>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5">
          {polls.map((p, i) => {
            const total = p.opts.reduce((a, o) => a + o[1], 0);
            return (
              <Panel key={i} title={null}>
                <div className="font-display text-[15px] font-semibold text-ink tracking-tight mb-4">{p.q}</div>
                <div className="grid gap-3">
                  {p.opts.map((o, j) => {
                    const pct = Math.round((o[1] / total) * 100);
                    return (
                      <div key={j}>
                        <div className="flex items-center justify-between mb-1.5 text-[13px]">
                          <span className="text-ink-soft">{o[0]}</span>
                          <span className="font-mono text-muted">{pct}%</span>
                        </div>
                        <ProgressBar pct={pct} color={j === 0 ? CHART.forest : CHART.sage} height={9} />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-border/70 font-mono text-[11px] text-muted">{total} votes · Live now</div>
              </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function GamificationPage({ event }) {
  const board = [
    { n: "Fatou Diop", pts: 1240, badges: 7, g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "Kwame Mensah", pts: 1180, badges: 6, g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Odunayo Eweniyi", pts: 1090, badges: 6, g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Tunde Kehinde", pts: 960, badges: 5, g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "Nia Williams", pts: 880, badges: 5, g: "linear-gradient(135deg,#163828,#2A6A50)" },
    { n: "Yusuf Bello", pts: 820, badges: 4, g: "linear-gradient(135deg,#1F4D3A,#163828)" },
  ];
  const rules = [
    ["Check in to the event", "+100", "Scan"],
    ["Attend a session", "+50", "Calendar"],
    ["Make a connection", "+30", "Network"],
    ["Ask a question", "+20", "Chat"],
    ["Share your Karta Card", "+150", "Share"],
  ];
  const medal = ["#E8C57E", "#B8C4CC", "#C8956B"];
  return (
    <PageShell title="Gamification" subtitle="Points, badges & leaderboard"
      actions={<Btn variant="primary" icon="Gear" onClick={() => window.openModal && window.openModal({ type: "form", title: "Configure points", subtitle: "Set how attendees earn points", fields: [{ cols: 2, items: [{ label: "Check in", value: "100", mono: true }, { label: "Attend session", value: "50", mono: true }] }, { cols: 2, items: [{ label: "Make a connection", value: "30", mono: true }, { label: "Share a card", value: "150", mono: true }] }], submitLabel: "Save points", submitIcon: "Check", onConfirm: () => window.toast && window.toast("Points configuration saved") })}>Configure points</Btn>}>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <Panel title="Leaderboard" pad="p-0">
          <div className="divide-y divide-border/60">
            {board.map((b, i) => (
              <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
                <span className="w-7 h-7 rounded-full grid place-items-center font-mono text-[12px] font-semibold shrink-0" style={i < 3 ? { background: medal[i], color: "#163828" } : { background: "#E8EFEB", color: "#6B7A72" }}>{i + 1}</span>
                <Avatar initials={b.n.split(" ").map((x) => x[0]).join("")} grad={b.g} size={34} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-ink truncate">{b.n}</div>
                  <div className="font-mono text-[10.5px] text-muted mt-0.5">{b.badges} badges</div>
                </div>
                <span className="font-mono text-[15px] text-primary">{b.pts.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Panel>
        <div className="grid gap-5 content-start">
          <Panel title="How points are earned">
            <div className="grid gap-2.5">
              {rules.map((r, i) => {
                const IconC = Icon[r[2]];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><IconC w={15} /></span>
                    <span className="flex-1 text-[13px] text-ink-soft">{r[0]}</span>
                    <span className="font-mono text-[12.5px] text-primary font-medium">{r[1]}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title="Badges">
            <div className="flex flex-wrap gap-2">
              {["Early bird", "Connector", "Curious", "Socialite", "Night owl", "Top 10"].map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-accent/15 border border-accent/40 text-accent-dark rounded-full px-3 py-1.5 text-[12px] font-medium">
                  <Icon.Trophy w={12} /> {b}
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function SponsorsPage({ event, onOpenDetail }) {
  const tiers = [
    { tier: "Platinum", color: "#C9A45E", sponsors: [{ n: "Paystack", leads: 142 }, { n: "MTN", leads: 118 }] },
    { tier: "Gold", color: "#E8C57E", sponsors: [{ n: "Flutterwave", leads: 86 }, { n: "Andela", leads: 71 }, { n: "Kuda", leads: 64 }] },
    { tier: "Silver", color: "#A8C2B5", sponsors: [{ n: "Wave", leads: 38 }, { n: "Lidya", leads: 29 }, { n: "PiggyVest", leads: 24 }, { n: "Safaricom", leads: 18 }] },
  ];
  return (
    <PageShell title="Sponsors" subtitle="9 sponsors · 590 leads captured"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Lead export started")}>Lead export</Btn><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Add sponsor", subtitle: "Add a partner to this event", fields: [{ label: "Sponsor name", placeholder: "Acme Inc." }, { cols: 2, items: [{ label: "Tier", value: "Gold" }, { label: "Booth", value: "B3", mono: true }] }, { label: "Description", area: true, placeholder: "One-line sponsor blurb…" }], submitLabel: "Add sponsor", submitIcon: "Plus", onConfirm: () => window.toast && window.toast("Sponsor added") })}>Add sponsor</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Sponsors", value: "9", icon: "Briefcase" },
        { label: "Leads captured", value: "590", icon: "Users", delta: "11% wk", deltaUp: true },
        { label: "Booth visits", value: "2,140", icon: "Pin" },
        { label: "Sponsor revenue", value: "$48k", icon: "Dollar", accent: true },
      ]} />
      <div className="grid gap-5">
        {tiers.map((t, i) => (
          <div key={i}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-3.5 h-3.5 rounded-sm" style={{ background: t.color }} />
              <span className="font-display text-[14px] font-semibold text-ink tracking-tight">{t.tier}</span>
              <span className="font-mono text-[11px] text-muted">{t.sponsors.length} sponsors</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {t.sponsors.map((s, j) => (
                <div key={j} onClick={() => onOpenDetail && onOpenDetail("sponsor", { ...s, tier: t.tier })} className="bg-surface border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors cursor-pointer">
                  <div className="h-12 rounded-lg bg-cream border border-border grid place-items-center mb-3">
                    <span className="font-display text-[15px] font-bold text-primary/70 tracking-tight">{s.n}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted">Leads</span>
                    <span className="font-mono text-[14px] text-primary">{s.leads}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function VirtualPage({ event }) {
  const streams = [
    { title: "Opening keynote", track: "Main Stage", status: "Live", viewers: 842, tone: "green" },
    { title: "Scaling fintech across borders", track: "Main Stage", status: "Upcoming", viewers: 0, tone: "amber" },
    { title: "Workshop: Ship payments in a weekend", track: "Builders", status: "Upcoming", viewers: 0, tone: "amber" },
    { title: "Founder AMA (Day 1)", track: "Main Stage", status: "Recorded", viewers: 1240, tone: "neutral" },
  ];
  return (
    <PageShell title="Virtual" subtitle="Stream sessions to online attendees"
      actions={<><Btn icon="Gear" onClick={() => window.toast && window.toast("Stream settings")}>Stream settings</Btn><Btn variant="primary" icon="Video" onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Go live now?", confirmLabel: "Go live", confirmIcon: "Video", body: "Start streaming the Main Stage to all virtual attendees. They’ll be notified the session is live.", onConfirm: () => window.toast && window.toast("You’re live — 842 watching") })}>Go live</Btn></>}>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5 mb-5">
        <div className="bg-primary-dark rounded-2xl overflow-hidden relative aspect-video grid place-items-center">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 30%, rgba(232,197,126,0.18), transparent 60%)" }} />
          <div className="relative text-center">
            <span className="inline-grid place-items-center w-16 h-16 rounded-full bg-cream/10 border border-cream/20 text-accent mb-3"><Icon.Video w={28} /></span>
            <div className="font-display text-cream text-[16px] font-semibold">Main Stage — Live now</div>
            <div className="font-mono text-[11px] text-cream/55 mt-1">842 watching</div>
          </div>
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-red-500/90 text-white font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 content-start">
          <StatCard label="Live viewers" value="842" icon="Users" />
          <StatCard label="Peak today" value="1.2k" icon="Chart" />
          <StatCard label="Avg. watch" value="34m" icon="Clock" />
          <StatCard label="Recordings" value="6" icon="Video" accent />
        </div>
      </div>
      <Panel title="Sessions" pad="p-0">
        <div className="divide-y divide-border/60">
          {streams.map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Video w={16} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-ink truncate">{s.title}</div>
                <div className="font-mono text-[11px] text-muted mt-0.5">{s.track}</div>
              </div>
              {s.viewers > 0 && <span className="font-mono text-[11.5px] text-muted hidden sm:inline">{s.viewers.toLocaleString()} views</span>}
              <Pill tone={s.tone} dot={s.tone === "green" ? "#2D7A4F" : null}>{s.status}</Pill>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  networking: NetworkingPage,
  "q-and-a": QandAPage,
  gamification: GamificationPage,
  sponsors: SponsorsPage,
  virtual: VirtualPage,
});
