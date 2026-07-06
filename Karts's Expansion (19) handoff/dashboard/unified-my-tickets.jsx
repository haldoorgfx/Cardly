// Unified dashboard — My tickets (attendee role).
// Previously its own page outside the shell (own nav/footer); now a native
// dashboard screen using the same PageShell/Panel/Table primitives as every
// other page.

const MY_TICKET_EVENTS = [
  { name: "Africa Tech Festival 2026", when: "12–14 Mar 2026 · Lagos", tier: "VIP", status: "upcoming", grad: GRAD.forest },
  { name: "Pan-African Climate Summit", when: "22 Apr 2026 · Nairobi", tier: "General", status: "upcoming", grad: GRAD.sage },
  { name: "University of Nairobi · Class of 2026", when: "Dec 2025 · Nairobi", tier: "Alumni", status: "past", grad: GRAD.deep },
];

function UnifiedMyTickets({ onNav }) {
  const links = [
    { id: "agenda", label: "My agenda", icon: "Calendar" },
    { id: "messages", label: "Messages", icon: "Chat" },
    { id: "people", label: "People", icon: "Users" },
    { id: "saved", label: "Saved events", icon: "Star" },
    { id: "following", label: "Following", icon: "User" },
    { id: "wallet", label: "Karta Card", icon: "IdCard" },
  ];
  return (
    <PageShell title="My tickets" subtitle="Registrations, agenda and the people you're connected to.">
      <StatCards
        cols={3}
        items={[
          { value: "2", label: "Upcoming events", icon: "Ticket" },
          { value: "6", label: "Sessions saved", icon: "Calendar" },
          { value: "148", label: "People followed you back", icon: "Users" },
        ]}
      />

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div>
          <SectionLabel>My events</SectionLabel>
          <div className="grid gap-2.5 mb-7">
            {MY_TICKET_EVENTS.map((e, i) => (
              <div key={i} className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl p-3.5">
                <span className="w-12 h-12 rounded-xl shrink-0 relative overflow-hidden" style={{ background: e.grad }}>
                  <span aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 80% at 80% 10%, rgba(232,197,126,0.3), transparent 60%)" }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink truncate">{e.name}</div>
                  <div className="font-mono text-[11px] text-muted mt-0.5">{e.when}</div>
                </div>
                <Pill tone="gold">{e.tier}</Pill>
                <Pill tone={e.status === "upcoming" ? "green" : "neutral"} dot={e.status === "upcoming" ? "#2D7A4F" : null}>{e.status === "upcoming" ? "Upcoming" : "Past"}</Pill>
              </div>
            ))}
          </div>

          <SectionLabel>At this event</SectionLabel>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {links.map((l) => {
              const IconC = Icon[l.icon] || Icon.Grid;
              return (
                <button key={l.id} onClick={() => onNav && onNav(l.id)} className="bg-surface border border-border rounded-2xl py-4 grid place-items-center gap-2 hover:border-primary/40 transition-colors">
                  <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><IconC w={18} /></span>
                  <span className="text-[11px] font-medium text-ink-soft text-center leading-tight">{l.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 content-start">
          <Panel title="Your Karta Card">
            <div className="rounded-2xl overflow-hidden relative" style={{ height: 170, background: "linear-gradient(155deg,#0D1F17,#1F4D3A 70%,#163828)" }}>
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 30%, rgba(232,197,126,0.22), transparent 65%)" }} />
              <div className="relative h-full flex flex-col items-center justify-center text-cream">
                <Avatar initials="AO" size={44} />
                <div className="font-display text-[14px] font-semibold mt-2">Adaeze Okafor</div>
                <div className="font-mono text-[10px] text-cream/70 mt-0.5 tracking-[0.14em] uppercase">VIP · #0142</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4"><Btn variant="primary" icon="Share" className="flex-1">Share</Btn><Btn variant="ghost" icon="Arrow" className="flex-1">View</Btn></div>
          </Panel>
          <Panel title="Account">
            <div className="grid gap-0.5 -mx-1">
              {[["Profile & preferences", "User"], ["Notification settings", "Bell"], ["Privacy & visibility", "Shield"]].map((r, i) => {
                const IconC = Icon[r[1]] || Icon.Gear;
                return (
                  <button key={i} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-ink-soft hover:bg-cream/70 transition-colors">
                    <IconC w={15} /><span className="flex-1 text-[13px] font-medium">{r[0]}</span><Icon.Arrow w={13} style={{ color: "#6B7A72" }} />
                  </button>
                );
              })}
            </div>
            <p className="text-[11.5px] text-muted mt-2 px-1">Moved from “Account” into Settings — one place, no separate account area.</p>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

Object.assign(window, { UnifiedMyTickets });
