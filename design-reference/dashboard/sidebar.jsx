// Context-aware sidebar — Level 1 (platform) and Level 2 (event).

function NavItem({ item, active, locked, planLabel, onClick }) {
  const IconC = Icon[item.icon] || Icon.Grid;
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 pl-3 pr-2.5 py-2 rounded-lg text-[13.5px] transition-colors ${
        active
          ? "bg-primary text-cream font-medium"
          : "text-ink-soft hover:bg-primary-soft/70 hover:text-primary"
      }`}
    >
      <span className={active ? "text-cream" : locked ? "text-muted" : "text-primary/70 group-hover:text-primary"}>
        <IconC w={17} />
      </span>
      <span className="flex-1 text-left truncate">{item.label}</span>
      {locked && (
        <span className="inline-flex items-center gap-1 font-mono text-[8.5px] tracking-[0.12em] uppercase bg-accent/20 text-accent-dark px-1.5 py-0.5 rounded font-semibold">
          <Icon.Lock w={9} /> {planLabel}
        </span>
      )}
    </button>
  );
}

function SidebarSection({ section, plan, role, activeId, onNav, onUpgrade }) {
  // Section-level visibility
  if (section.requirePlan && !planMeets(plan, section.requirePlan)) return null;
  if (section.requireRole === "admin" && !(role === "admin" || role === "super_admin")) return null;

  return (
    <div className="mb-1.5">
      <div className="px-3 pt-3 pb-1.5 font-mono text-[9.5px] tracking-[0.2em] uppercase text-muted/80 flex items-center gap-1.5">
        {section.title}
        {section.requirePlan && <Icon.Sparkle w={9} style={{ color: "#C9A45E" }} />}
        {section.requireRole && <Icon.Shield w={10} style={{ color: "#6B7A72" }} />}
      </div>
      <div className="grid gap-0.5">
        {section.items.map((item) => {
          const locked = !planMeets(plan, item.minPlan);
          return (
            <NavItem
              key={item.id}
              item={item}
              active={activeId === item.id}
              locked={locked}
              planLabel={item.minPlan ? PLAN_LABEL[item.minPlan] : ""}
              onClick={() => (locked ? onUpgrade(item) : onNav(item))}
            />
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({ level, plan, role, activeId, event, onNav, onUpgrade, onBackToEvents, onUpgradeCta }) {
  const nav = level === "event" ? EVENT_NAV : PLATFORM_NAV;
  const st = event ? STATUS_STYLE[event.status] : null;

  return (
    <aside className="w-[256px] shrink-0 bg-cream border-r border-border flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="px-3 pt-4 pb-3 border-b border-border/70">
        {level === "event" ? (
          <div>
            <button
              onClick={onBackToEvents}
              className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-primary transition-colors mb-3"
            >
              <Icon.ChevLeft w={14} /> All events
            </button>
            <div className="font-display text-[15px] font-semibold text-primary leading-tight tracking-tight line-clamp-2">
              {event.name}
            </div>
            <span className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${st.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
              {st.label}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="inline-block w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)" }} />
            <div className="min-w-0">
              <div className="font-display text-[16px] font-bold tracking-tight text-primary leading-none">Karta</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-ink-soft truncate">Adaeze Okafor</span>
                <span className="font-mono text-[8.5px] tracking-[0.1em] uppercase px-1.5 py-0.5 rounded bg-primary-soft text-primary font-semibold">{PLAN_LABEL[plan]}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {nav.map((section, i) => (
          <SidebarSection
            key={i}
            section={section}
            plan={plan}
            role={role}
            activeId={activeId}
            onNav={onNav}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border/70">
        {level === "event" ? (
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-surface border border-border text-[12.5px] text-ink-soft hover:border-primary/40 hover:text-primary transition-colors"
          >
            View public page <Icon.External w={14} />
          </a>
        ) : (
          <div>
            {plan !== "studio" && (
              <div className="mb-2.5">
                <div className="flex items-center justify-between text-[10.5px] font-mono text-muted mb-1.5">
                  <span>{plan === "free" ? "1 / 1 event" : "3 / ∞ events"}</span>
                  <span>{plan === "free" ? "50 / 50 regs" : ""}</span>
                </div>
                <div className="h-1.5 rounded-full bg-primary-soft overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: plan === "free" ? "100%" : "38%" }} />
                </div>
              </div>
            )}
            <button
              onClick={() => onUpgradeCta()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-[12.5px] font-medium transition-colors bg-primary text-cream hover:bg-primary-dark"
            >
              <Icon.Sparkle w={13} style={{ color: "#E8C57E" }} />
              {plan === "studio" ? "Studio plan" : "Upgrade plan"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
