// Dashboard prototype shell — context state, topbar, demo switcher, routing.

const NEW_EVENT = {
  id: "fintech", name: "Africa Fintech Forum 2026", slug: "africa-fintech-forum", status: "draft",
  date: "14 May 2026", venue: "Lagos, Nigeria", grad: GRAD.sage,
  stats: { registered: 0, revenue: "$0", checkin: 0, checkinN: 0, cards: 0 },
  attention: ["tickets", "agenda", "publish"],
};

function labelForId(id) {
  for (const g of [...EVENT_NAV, ...PLATFORM_NAV]) {
    const f = g.items.find((it) => it.id === id);
    if (f) return f.label;
  }
  const c = EVENT_CARDS.find((c) => c.id === id);
  return c ? c.label : "";
}

function DemoSwitcher({ plan, role, setPlan, setRole }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary-soft/30 pl-2.5 pr-1.5 py-1">
      <span className="font-mono text-[8.5px] tracking-[0.18em] uppercase text-primary/70">Demo</span>
      <div className="flex items-center gap-0.5 bg-surface rounded-md p-0.5 border border-border">
        {["free", "pro", "studio"].map((p) => (
          <button
            key={p}
            onClick={() => setPlan(p)}
            className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors ${plan === p ? "bg-primary text-cream" : "text-ink-soft hover:text-primary"}`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => setRole(role === "admin" ? "member" : "admin")}
        className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${role === "admin" ? "bg-ink text-cream border-ink" : "border-border text-ink-soft hover:text-primary"}`}
        title="Toggle admin role"
      >
        {role === "admin" ? "Admin" : "Member"}
      </button>
    </div>
  );
}

function Topbar({ level, event, activeId, plan, role, setPlan, setRole }) {
  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-border shrink-0">
      <div className="px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[13.5px] min-w-0">
          {level === "event" ? (
            <React.Fragment>
              <span className="text-muted truncate max-w-[200px]">{event.name}</span>
              <span className="text-border">/</span>
              <span className="text-ink font-medium">{labelForId(activeId)}</span>
            </React.Fragment>
          ) : (
            <span className="text-ink font-medium">{labelForId(activeId) || "Events"}</span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <DemoSwitcher plan={plan} role={role} setPlan={setPlan} setRole={setRole} />
          <div className="hidden md:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-surface border border-border text-muted text-[12.5px]">
            <Icon.Search w={14} /> Search
          </div>
          <button className="w-9 h-9 grid place-items-center rounded-lg text-ink-soft hover:bg-primary-soft hover:text-primary transition-colors"><Icon.Bell w={16} /></button>
          <span className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[12px] font-semibold" style={{ background: "linear-gradient(135deg,#2A6A50,#C9A45E)" }}>AO</span>
        </div>
      </div>
    </header>
  );
}

function App() {
  const [plan, setPlan] = React.useState("pro");
  const [role, setRole] = React.useState("member");
  const [level, setLevel] = React.useState("platform");
  const [activeId, setActiveId] = React.useState("events");
  const [screen, setScreen] = React.useState("home");
  const [currentEvent, setCurrentEvent] = React.useState(EVENTS[0]);
  const [stubItem, setStubItem] = React.useState(null);
  const [hasEvents, setHasEvents] = React.useState(true);
  const [upgradeFeature, setUpgradeFeature] = React.useState(null);

  const scrollRef = React.useRef(null);
  const toTop = () => { if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  function openEvent(e) {
    setCurrentEvent(e);
    setLevel("event");
    setActiveId("overview");
    setScreen("event");
    toTop();
  }
  function backToEvents() {
    setLevel("platform");
    setActiveId("events");
    setScreen("home");
    toTop();
  }
  function navTo(item) {
    setActiveId(item.id);
    if (item.screen === "home") { setScreen("home"); }
    else if (item.screen === "event") { setScreen("event"); }
    else if (item.screen === "registrations") { setScreen("registrations"); }
    else if (item.screen === "agenda") { setScreen("agenda"); }
    else { setStubItem(item); setScreen("stub"); }
    toTop();
  }
  function startCreate() { setScreen("create"); toTop(); }
  function onCreated() { openEvent(NEW_EVENT); }

  // Render the main screen
  let content;
  if (screen === "create") {
    content = <CreateEventFlow onCancel={backToEvents} onCreated={onCreated} />;
  } else if (level === "platform" && screen === "home") {
    content = <DashboardHome events={EVENTS} hasEvents={hasEvents} onOpenEvent={openEvent} onCreate={startCreate} />;
  } else if (level === "platform" && screen === "stub") {
    content = <SubStub item={stubItem} event={null} />;
  } else if (screen === "event") {
    content = <EventOverview event={currentEvent} plan={plan} onNav={navTo} onUpgrade={setUpgradeFeature} />;
  } else if (screen === "registrations") {
    content = <Registrations event={currentEvent} />;
  } else if (screen === "agenda") {
    content = <Agenda event={currentEvent} />;
  } else {
    content = <SubStub item={stubItem} event={currentEvent} />;
  }

  // Empty-state demo toggle (platform home only)
  const showEmptyToggle = level === "platform" && (screen === "home");

  return (
    <div className="flex h-screen overflow-hidden bg-cream text-ink">
      <Sidebar
        level={level}
        plan={plan}
        role={role}
        activeId={activeId}
        event={currentEvent}
        onNav={navTo}
        onUpgrade={setUpgradeFeature}
        onBackToEvents={backToEvents}
        onUpgradeCta={() => setUpgradeFeature({ label: "the full platform", id: "plan", minPlan: plan === "free" ? "pro" : "studio", icon: "Sparkle" })}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar level={level} event={currentEvent} activeId={activeId} plan={plan} role={role} setPlan={setPlan} setRole={setRole} />
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {showEmptyToggle && (
            <div className="px-8 pt-4 -mb-2">
              <button
                onClick={() => setHasEvents(!hasEvents)}
                className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted hover:text-primary border border-dashed border-border rounded-md px-2.5 py-1 transition-colors"
              >
                Demo: show {hasEvents ? "empty" : "populated"} state
              </button>
            </div>
          )}
          {content}
        </div>
      </div>

      <UpgradeSlideOver feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
