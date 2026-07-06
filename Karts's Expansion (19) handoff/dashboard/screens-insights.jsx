// Insights: Event Analytics (e-analytics), Platform Analytics (p-analytics)

function EventAnalyticsPage({ event }) {
  return (
    <PageShell title="Analytics" subtitle="Africa Tech Festival 2026 · live"
      actions={<><FilterBtn>Last 30 days</FilterBtn><Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Registrations", value: "247", icon: "Users", delta: "18% wk", deltaUp: true },
        { label: "Revenue", value: "₦4.2M", icon: "Dollar", delta: "22% wk", deltaUp: true },
        { label: "Check-in rate", value: "77%", icon: "Scan" },
        { label: "Cards shared", value: "164", icon: "IdCard", accent: true },
      ]} />

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
        <Panel title="Registrations over time">
          <AreaChart points={[
            { label: "W1", v: 18 }, { label: "W2", v: 44 }, { label: "W3", v: 72 },
            { label: "W4", v: 110 }, { label: "W5", v: 168 }, { label: "Now", v: 247 },
          ]} />
        </Panel>
        <Panel title="Registration funnel">
          <Funnel steps={[
            { label: "Visited event page", value: 3910, icon: "Layout", color: CHART.mist },
            { label: "Started registration", value: 980, icon: "Users", color: CHART.leaf },
            { label: "Completed", value: 247, icon: "Check", color: CHART.sage },
            { label: "Shared a card", value: 164, icon: "Share", color: CHART.goldDark },
          ]} />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Panel title="By ticket type">
          <Donut size={140} segments={[
            { label: "General", value: 150, color: CHART.forest },
            { label: "Early bird", value: 60, color: CHART.sage },
            { label: "VIP", value: 24, color: CHART.gold },
            { label: "Student", value: 13, color: CHART.mist },
          ]} centerLabel="247" centerSub="SOLD" />
        </Panel>
        <Panel title="Traffic sources">
          <div className="grid gap-3 pt-1">
            {[["Instagram", 38], ["WhatsApp", 27], ["Direct", 18], ["LinkedIn", 11], ["Other", 6]].map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 text-[13px]">
                  <span className="text-ink-soft">{r[0]}</span>
                  <span className="font-mono text-muted">{r[1]}%</span>
                </div>
                <ProgressBar pct={r[1]} color={i === 0 ? CHART.goldDark : CHART.forest} height={7} />
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Card virality">
          <div className="text-center py-2">
            <div className="font-mono text-[34px] text-primary tracking-tight leading-none">31,200</div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">people reached</div>
            <div className="mt-4 pt-4 border-t border-border/70 grid grid-cols-2 gap-3 text-left">
              <div>
                <div className="font-mono text-[18px] text-primary">164</div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted mt-0.5">cards shared</div>
              </div>
              <div>
                <div className="font-mono text-[18px] text-primary">189×</div>
                <div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted mt-0.5">avg reach/card</div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}

function PlatformAnalyticsPage() {
  return (
    <PageShell title="Analytics" subtitle="Across all your events"
      actions={<><FilterBtn>Last 90 days</FilterBtn><Btn icon="External" onClick={() => window.toast && window.toast("Export started — we’ll email you the file")}>Export</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Total events", value: "4", icon: "Calendar" },
        { label: "Registrations", value: "897", icon: "Users", delta: "14% mo", deltaUp: true },
        { label: "Revenue", value: "₦4.2M", icon: "Dollar", delta: "22% mo", deltaUp: true },
        { label: "Cards shared", value: "753", icon: "IdCard", accent: true },
      ]} />
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
        <Panel title="Registrations across events">
          <BarsChart unit="" data={[
            { label: "Tech Fest", value: 247, color: CHART.forest },
            { label: "Climate", value: 38, color: CHART.sage },
            { label: "Halal", value: 0, color: CHART.mist, dim: true },
            { label: "UoN '26", value: 612, color: CHART.leaf },
          ]} height={200} />
        </Panel>
        <Panel title="Revenue trend">
          <AreaChart points={[
            { label: "Dec", v: 60 }, { label: "Jan", v: 90 }, { label: "Feb", v: 150 }, { label: "Mar", v: 240 },
          ]} color={CHART.goldDark} />
        </Panel>
      </div>
      <Panel title="Event performance" pad="p-0">
        <Table head={["Event", "Status", "Registrations", "Revenue", "Cards", "Check-in"]}>
          {EVENTS.map((e, i) => {
            const st = STATUS_STYLE[e.status];
            return (
              <Row key={i}>
                <Cell>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg shrink-0" style={{ background: e.grad }} />
                    <span className="text-[13.5px] font-medium text-ink truncate max-w-[200px]">{e.name}</span>
                  </div>
                </Cell>
                <Cell><Pill tone={e.status === "live" ? "green" : e.status === "draft" ? "amber" : "neutral"} dot={st.dot}>{st.label}</Pill></Cell>
                <Cell className="font-mono text-[13px] text-ink">{e.stats.registered}</Cell>
                <Cell className="font-mono text-[13px] text-ink">{e.stats.revenue}</Cell>
                <Cell className="font-mono text-[13px] text-ink">{e.stats.cards}</Cell>
                <Cell className="font-mono text-[13px] text-muted">{e.stats.checkin}%</Cell>
              </Row>
            );
          })}
        </Table>
      </Panel>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "e-analytics": EventAnalyticsPage,
  "p-analytics": PlatformAnalyticsPage,
});
