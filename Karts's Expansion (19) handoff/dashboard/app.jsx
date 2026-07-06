// Dashboard prototype shell — context state, topbar, overlays, modals, routing.

const NEW_EVENT = {
  id: "fintech", name: "Africa Fintech Forum 2026", slug: "africa-fintech-forum", status: "draft",
  date: "14 May 2026", venue: "Lagos, Nigeria", grad: GRAD.sage,
  stats: { registered: 0, revenue: "$0", checkin: 0, checkinN: 0, cards: 0 },
  attention: ["tickets", "agenda", "publish"],
};

const DETAIL_PARENT = { attendee: "registrations", speaker: "speakers", session: "sessions", sponsor: "sponsors", user: "admin-users" };

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
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary-soft/30 pl-1.5 sm:pl-2.5 pr-1.5 py-1">
      <span className="hidden sm:inline font-mono text-[8.5px] tracking-[0.18em] uppercase text-primary/70">Demo</span>
      <div className="flex items-center gap-0.5 bg-surface rounded-md p-0.5 border border-border">
        {["free", "pro", "studio"].map((p) => (
          <button key={p} onClick={() => setPlan(p)} className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors ${plan === p ? "bg-primary text-cream" : "text-ink-soft hover:text-primary"}`}>{p}</button>
        ))}
      </div>
      <button onClick={() => setRole(role === "admin" ? "member" : "admin")} className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-colors ${role === "admin" ? "bg-ink text-cream border-ink" : "border-border text-ink-soft hover:text-primary"}`} title="Toggle admin role">
        {role === "admin" ? "Admin" : "Member"}
      </button>
    </div>
  );
}

function Topbar({ level, event, activeId, detail, plan, role, setPlan, setRole, overlay, setOverlay, onMenu }) {
  const crumbDetail = detail ? labelForId(DETAIL_PARENT[detail.type]) : null;
  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-border shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13.5px] min-w-0">
          <button onClick={onMenu} className="lg:hidden w-9 h-9 -ml-1.5 grid place-items-center rounded-lg text-ink hover:bg-primary-soft transition-colors shrink-0"><Icon.Menu w={20} /></button>
          <div className="hidden sm:flex items-center gap-2 min-w-0">
          {level === "event" ? (
            <React.Fragment>
              <span className="text-muted truncate max-w-[180px]">{event.name}</span>
              <span className="text-border">/</span>
              {detail ? (
                <React.Fragment>
                  <span className="text-muted">{crumbDetail}</span>
                  <span className="text-border">/</span>
                  <span className="text-ink font-medium">{detail.data?.name || detail.data?.title || detail.data?.n || "Detail"}</span>
                </React.Fragment>
              ) : (
                <span className="text-ink font-medium">{labelForId(activeId)}</span>
              )}
            </React.Fragment>
          ) : detail ? (
            <React.Fragment>
              <span className="text-muted">{crumbDetail}</span>
              <span className="text-border">/</span>
              <span className="text-ink font-medium">{detail.data?.n || detail.data?.name || "Detail"}</span>
            </React.Fragment>
          ) : (
            <span className="text-ink font-medium">{labelForId(activeId) || "Events"}</span>
          )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <DemoSwitcher plan={plan} role={role} setPlan={setPlan} setRole={setRole} />
          <button onClick={() => setOverlay("search")} className="hidden md:flex items-center gap-1.5 h-9 pl-3 pr-2 rounded-lg bg-surface border border-border text-muted text-[12.5px] hover:border-primary/40 transition-colors">
            <Icon.Search w={14} /> Search <kbd className="font-mono text-[10px] bg-cream border border-border rounded px-1.5 py-0.5 ml-1">⌘K</kbd>
          </button>
          <div className="relative">
            <button onClick={() => setOverlay(overlay === "notifications" ? null : "notifications")} className={`relative w-9 h-9 grid place-items-center rounded-lg transition-colors ${overlay === "notifications" ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-primary-soft hover:text-primary"}`}>
              <Icon.Bell w={16} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent ring-2 ring-cream" />
            </button>
            <Overlays.NotificationsPanel open={overlay === "notifications"} onClose={() => setOverlay(null)} />
          </div>
          <div className="relative">
            <button onClick={() => setOverlay(overlay === "account" ? null : "account")} className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[12px] font-semibold ring-2 ring-transparent hover:ring-primary/30 transition-all" style={{ background: "linear-gradient(135deg,#2A6A50,#C9A45E)" }}>AO</button>
            <Overlays.AccountMenu open={overlay === "account"} onClose={() => setOverlay(null)} plan={plan} />
          </div>
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
  const [detail, setDetail] = React.useState(null);
  const [overlay, setOverlay] = React.useState(null);
  const [modal, setModal] = React.useState(null);
  const [navOpen, setNavOpen] = React.useState(false);

  const scrollRef = React.useRef(null);
  const toTop = () => { if (scrollRef.current) scrollRef.current.scrollTop = 0; };

  function openEvent(e) { setCurrentEvent(e); setLevel("event"); setActiveId("overview"); setScreen("event"); setDetail(null); setNavOpen(false); toTop(); }
  function backToEvents() { setLevel("platform"); setActiveId("events"); setScreen("home"); setDetail(null); setNavOpen(false); toTop(); }
  function navTo(item) {
    setDetail(null);
    setActiveId(item.id);
    setNavOpen(false);
    if (item.screen === "home") setScreen("home");
    else if (item.screen === "event") setScreen("event");
    else { setStubItem(item); setScreen("page"); }
    toTop();
  }
  function openDetail(type, data) { setDetail({ type, data }); setNavOpen(false); toTop(); }
  function startCreate() { setScreen("create"); setDetail(null); setNavOpen(false); toTop(); }
  function onCreated() { openEvent(NEW_EVENT); }

  // ⌘K to open search, Esc to close overlays/modals
  React.useEffect(() => {
    window.openModal = setModal;
    window.openUpgrade = setUpgradeFeature;
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOverlay("search"); }
      if (e.key === "Escape") { setOverlay(null); setModal(null); setUpgradeFeature(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); delete window.openModal; delete window.openUpgrade; };
  }, []);

  const SCREENS = window.SCREENS || {};
  const DETAILS = window.DETAILS || {};
  const screenProps = { event: currentEvent, plan, onNav: navTo, onUpgrade: setUpgradeFeature, onOpenDetail: openDetail, onModal: setModal };

  let content;
  if (screen === "create") {
    content = <CreateEventFlow onCancel={backToEvents} onCreated={onCreated} />;
  } else if (detail && DETAILS[detail.type]) {
    const D = DETAILS[detail.type];
    content = <D data={detail.data} event={currentEvent} onBack={() => setDetail(null)} onModal={setModal} onOpenDetail={openDetail} />;
  } else if (level === "platform" && screen === "home") {
    content = <DashboardHome events={EVENTS} hasEvents={hasEvents} onOpenEvent={openEvent} onCreate={startCreate} />;
  } else if (screen === "event") {
    content = <EventOverview event={currentEvent} plan={plan} onNav={navTo} onUpgrade={setUpgradeFeature} />;
  } else {
    const Comp = SCREENS[activeId];
    content = Comp ? <Comp {...screenProps} /> : <NotFound item={stubItem} onBack={level === "event" ? () => openEvent(currentEvent) : backToEvents} />;
  }

  const showEmptyToggle = level === "platform" && screen === "home" && !detail;

  return (
    <div className="flex h-screen overflow-hidden bg-cream text-ink">
      <Sidebar
        level={level} plan={plan} role={role} activeId={activeId} event={currentEvent}
        onNav={navTo} onUpgrade={setUpgradeFeature} onBackToEvents={backToEvents}
        open={navOpen} onClose={() => setNavOpen(false)}
        onUpgradeCta={() => setUpgradeFeature({ label: "the full platform", id: "plan", minPlan: plan === "free" ? "pro" : "studio", icon: "Sparkle" })}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar level={level} event={currentEvent} activeId={activeId} detail={detail} plan={plan} role={role} setPlan={setPlan} setRole={setRole} overlay={overlay} setOverlay={setOverlay} onMenu={() => setNavOpen(true)} />
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {showEmptyToggle && (
            <div className="px-4 sm:px-6 lg:px-8 pt-4 -mb-2">
              <button onClick={() => setHasEvents(!hasEvents)} className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted hover:text-primary border border-dashed border-border rounded-md px-2.5 py-1 transition-colors">
                Demo: show {hasEvents ? "empty" : "populated"} state
              </button>
            </div>
          )}
          {content}
        </div>
      </div>

      <UpgradeSlideOver feature={upgradeFeature} onClose={() => setUpgradeFeature(null)} />
      <Overlays.SearchPalette open={overlay === "search"} onClose={() => setOverlay(null)} />
      <Overlays.ModalRouter modal={modal} onClose={() => setModal(null)} />
      <Overlays.Toaster />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
