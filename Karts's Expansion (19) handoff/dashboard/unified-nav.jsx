// Unified dashboard — sidebar + topbar + demo hat-switcher.
// This sidebar is the FIX for the audit bug: My tickets / Speaking / Sponsoring
// are plain in-shell nav items — clicking them swaps the content pane only,
// same as any organizer page. No link-out, no separate shell, no token portal.

const ROLE_NAV_ITEMS = [
  { id: "home", label: "Home", icon: "Home", hat: "always" },
  { id: "my-tickets", label: "My tickets", icon: "Ticket", hat: "tickets" },
  { id: "speaking", label: "Speaking", icon: "User", hat: "speaking" },
  { id: "sponsoring", label: "Sponsoring", icon: "Briefcase", hat: "sponsoring" },
  { id: "organizing", label: "Organizing", icon: "Grid", hat: "organizing" },
];

const WORKSPACE_ITEMS = [
  { id: "org-events", label: "Events", icon: "Calendar" },
  { id: "org-analytics", label: "Analytics", icon: "Chart" },
  { id: "org-team", label: "Team", icon: "Users" },
  { id: "org-settings", label: "Settings", icon: "Gear" },
];

const ADMIN_ITEMS = [
  { id: "admin-stats", label: "Platform Stats", icon: "Chart" },
  { id: "admin-users", label: "Accounts", icon: "Users" },
  { id: "admin-audit", label: "Activity Log", icon: "ListChecks" },
];

function UNavItem({ item, active, onClick }) {
  const IconC = Icon[item.icon] || Icon.Grid;
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${
        active ? "bg-primary text-cream font-medium" : "text-ink-soft hover:bg-primary-soft/70 hover:text-primary"
      }`}
    >
      <span className={active ? "text-cream" : "text-primary/70 group-hover:text-primary"}><IconC w={17} /></span>
      <span className="flex-1 text-left truncate">{item.label}</span>
    </button>
  );
}

function USectionLabel({ children }) {
  return <div className="px-3 pt-3 pb-1.5 font-mono text-[9.5px] tracking-[0.2em] uppercase text-muted/80">{children}</div>;
}

function UnifiedSidebar({ hats, activeId, onNav, open, onClose }) {
  const visibleRoleItems = ROLE_NAV_ITEMS.filter((it) => it.hat === "always" || hats[it.hat]);
  return (
    <React.Fragment>
      <div onClick={onClose} className={`fixed inset-0 z-40 bg-ink/40 lg:hidden transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <aside className={`fixed inset-y-0 left-0 z-50 w-[256px] bg-cream border-r border-border flex flex-col h-screen transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="px-3 pt-4 pb-3 border-b border-border/70 relative">
          <button onClick={onClose} className="lg:hidden absolute top-3.5 right-3 w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors"><Icon.X w={18} /></button>
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-block w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)" }} />
            <div className="min-w-0">
              <div className="font-display text-[16px] font-bold tracking-tight text-primary leading-none">Eventera</div>
              <div className="text-[11px] text-ink-soft truncate mt-1">Adaeze Okafor</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {/* Role-gated top-level entries — one shell, every hat the account holds */}
          <div className="mb-1.5">
            <div className="grid gap-0.5 pt-2">
              {visibleRoleItems.map((item) => (
                <UNavItem key={item.id} item={item} active={activeId === item.id || (item.id === "organizing" && activeId.startsWith("org-"))} onClick={() => onNav(item.id)} />
              ))}
            </div>
          </div>

          {hats.organizing && (
            <div className="mb-1.5">
              <USectionLabel>Workspace</USectionLabel>
              <div className="grid gap-0.5">
                {WORKSPACE_ITEMS.map((item) => (
                  <UNavItem key={item.id} item={item} active={activeId === item.id} onClick={() => onNav(item.id)} />
                ))}
              </div>
            </div>
          )}

          {hats.admin && (
            <div className="mb-1.5">
              <USectionLabel>Admin</USectionLabel>
              <div className="grid gap-0.5">
                {ADMIN_ITEMS.map((item) => (
                  <UNavItem key={item.id} item={item} active={activeId === item.id} onClick={() => onNav(item.id)} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-3 py-3 border-t border-border/70">
          <button className="w-full flex items-center gap-3 px-2.5 py-[7px] rounded-lg text-[13.5px] text-ink-soft hover:bg-primary-soft/70 transition-colors text-left">
            <Icon.External w={15} className="shrink-0" /> Sign out
          </button>
        </div>
      </aside>
    </React.Fragment>
  );
}

// ── Demo hat switcher — stands in for the account's real role set. Toggling a
// hat off makes its nav item + screen disappear immediately, same as the real
// getVisibleSections() flags. ──────────────────────────────────────────────
function HatSwitcher({ hats, setHats }) {
  const HAT_LABEL = { tickets: "Attendee", speaking: "Speaker", sponsoring: "Sponsor", organizing: "Organizer", admin: "Admin" };
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/30 bg-primary-soft/30 pl-2 pr-1.5 py-1 flex-wrap">
      <span className="hidden sm:inline font-mono text-[8.5px] tracking-[0.18em] uppercase text-primary/70">Demo hats</span>
      <div className="flex items-center gap-0.5 flex-wrap">
        {Object.keys(HAT_LABEL).map((k) => (
          <button
            key={k}
            onClick={() => setHats((h) => ({ ...h, [k]: !h[k] }))}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${hats[k] ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border hover:text-primary"}`}
          >
            {HAT_LABEL[k]}
          </button>
        ))}
      </div>
    </div>
  );
}

function UTopbar({ title, hats, setHats, onMenu }) {
  return (
    <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur border-b border-border shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13.5px] min-w-0">
          <button onClick={onMenu} className="lg:hidden w-9 h-9 -ml-1.5 grid place-items-center rounded-lg text-ink hover:bg-primary-soft transition-colors shrink-0"><Icon.Menu w={20} /></button>
          <span className="text-ink font-medium truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <HatSwitcher hats={hats} setHats={setHats} />
          <div className="w-9 h-9 rounded-full grid place-items-center text-cream font-display text-[12px] font-semibold shrink-0" style={{ background: "linear-gradient(135deg,#2A6A50,#C9A45E)" }}>AO</div>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { ROLE_NAV_ITEMS, WORKSPACE_ITEMS, ADMIN_ITEMS, UnifiedSidebar, UTopbar, HatSwitcher });
