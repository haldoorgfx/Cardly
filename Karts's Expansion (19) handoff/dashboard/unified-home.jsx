// Unified dashboard — Home. The one role-hub every account lands on.
// Cards below only render for roles active on the account; "Upcoming for
// you" merges items across every role into a single timeline.

function RoleCard({ icon, label, title, body, stat, cta, onClick, grad }) {
  const IconC = Icon[icon] || Icon.Grid;
  return (
    <button onClick={onClick} className="text-left bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors group">
      <div className="flex items-start justify-between">
        <span className="w-10 h-10 rounded-xl grid place-items-center text-cream shrink-0" style={{ background: grad || "linear-gradient(135deg,#2A6A50,#C9A45E)" }}><IconC w={18} /></span>
        {stat && <span className="font-mono text-[11px] text-muted">{stat}</span>}
      </div>
      <div className="font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted mt-3.5">{label}</div>
      <div className="font-display text-[16px] font-semibold text-ink tracking-tight mt-1">{title}</div>
      <p className="text-ink-soft text-[13px] mt-1.5 leading-[1.5]">{body}</p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary group-hover:gap-2.5 transition-all">{cta} <Icon.Arrow w={13} style={{ transform: "rotate(-45deg)" }} /></div>
    </button>
  );
}

function UnifiedHome({ roles, onNav }) {
  const timeline = [
    { role: "attendee", icon: "Ticket", t: "Africa Tech Festival 2026", d: "Doors open · 12 Mar, 08:30", tone: "forest" },
    { role: "speaker", icon: "Calendar", t: "Opening keynote — your session", d: "12 Mar, 09:30 · Auditorium A", tone: "gold" },
    { role: "sponsor", icon: "Briefcase", t: "3 new leads captured at your booth", d: "Booth A1 · updated 2h ago", tone: "forest" },
    { role: "attendee", icon: "Chat", t: "New message from an organizer", d: "Africa Tech Festival 2026", tone: "neutral" },
  ].filter((i) => roles[i.role]);

  return (
    <PageShell title="Home" subtitle="Everything tied to your account, in one place.">
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {roles.attendee && (
          <RoleCard icon="Ticket" label="Attendee" title="My tickets" stat="2 upcoming"
            body="Your registrations, agenda, saved events and the people you follow."
            cta="Open my tickets" onClick={() => onNav("my-tickets")} grad="linear-gradient(135deg,#1F4D3A,#2A6A50)" />
        )}
        {roles.speaker && (
          <RoleCard icon="User" label="Speaker" title="Speaking" stat="2 sessions"
            body="Your sessions, profile, slides and speaker card for Africa Tech Festival."
            cta="Open speaking" onClick={() => onNav("speaking")} grad="linear-gradient(135deg,#163828,#3E7E5E)" />
        )}
        {roles.sponsor && (
          <RoleCard icon="Briefcase" label="Sponsor" title="Sponsoring" stat="142 leads"
            body="Booth performance, captured leads, resources and your booth team."
            cta="Open sponsoring" onClick={() => onNav("sponsoring")} grad="linear-gradient(135deg,#2A6A50,#C9A45E)" />
        )}
        {roles.organizer && (
          <RoleCard icon="Grid" label="Organizer" title="Organizing" stat="4 events"
            body="Run your events — registration, agenda, check-in, analytics and more."
            cta="Open organizing" onClick={() => onNav("organizing")} grad="linear-gradient(135deg,#1F4D3A,#0D1F17)" />
        )}
      </div>

      {timeline.length > 0 && (
        <div>
          <SectionLabel>Upcoming for you</SectionLabel>
          <div className="grid gap-2.5">
            {timeline.map((i, idx) => {
              const IconC = Icon[i.icon] || Icon.Bell;
              return (
                <div key={idx} className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl px-4 py-3.5">
                  <span className="w-9 h-9 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><IconC w={16} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-medium text-ink truncate">{i.t}</div>
                    <div className="font-mono text-[11px] text-muted mt-0.5">{i.d}</div>
                  </div>
                  <Pill tone={i.tone === "gold" ? "gold" : i.tone === "forest" ? "forest" : "neutral"}>{ROLE_META[i.role].label}</Pill>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageShell>
  );
}

Object.assign(window, { UnifiedHome });
