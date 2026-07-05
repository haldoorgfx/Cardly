// Unified dashboard — root app. One shell, one nav, every hat.
function UnifiedApp() {
  const [hats, setHats] = React.useState(HAT_DEFAULT);
  const [activeId, setActiveId] = React.useState("home");
  const [navOpen, setNavOpen] = React.useState(false);

  function onNav(id) { setActiveId(id); setNavOpen(false); }

  const LABELS = {
    home: "Home", "my-tickets": "My tickets", speaking: "Speaking", sponsoring: "Sponsoring",
    "org-events": "Organizing", "org-analytics": "Analytics", "org-team": "Team", "org-settings": "Settings",
    "admin-stats": "Admin · Platform Stats", "admin-users": "Admin · Accounts", "admin-audit": "Admin · Activity Log",
  };

  let content;
  if (activeId === "home") content = <HomeScreen hats={hats} onNav={onNav} />;
  else if (activeId === "my-tickets" && hats.tickets) content = <MyTicketsScreen />;
  else if (activeId === "speaking" && hats.speaking) content = <SpeakingScreen />;
  else if (activeId === "sponsoring" && hats.sponsoring) content = <SponsoringScreen />;
  else if (activeId.startsWith("org-") && hats.organizing) content = <StubScreen label={LABELS[activeId]} />;
  else if (activeId.startsWith("admin-") && hats.admin) content = <StubScreen label={LABELS[activeId]} />;
  else content = <HomeScreen hats={hats} onNav={onNav} />;

  // If the active screen's hat got switched off via the demo, bounce to Home
  // — mirrors the real server-side "verify role before rendering" access rule.
  React.useEffect(() => {
    const needsHat = { "my-tickets": "tickets", speaking: "speaking", sponsoring: "sponsoring" }[activeId];
    if (needsHat && !hats[needsHat]) setActiveId("home");
    if (activeId.startsWith("org-") && !hats.organizing) setActiveId("home");
    if (activeId.startsWith("admin-") && !hats.admin) setActiveId("home");
  }, [hats]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-cream text-ink">
      <UnifiedSidebar hats={hats} activeId={activeId} onNav={onNav} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <UTopbar title={LABELS[activeId] || "Home"} hats={hats} setHats={setHats} onMenu={() => setNavOpen(true)} />
        <div className="flex-1 overflow-y-auto">{content}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<UnifiedApp />);
