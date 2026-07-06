// Unified dashboard — screen content for each role hat. Every screen renders
// INSIDE the same shell (sidebar + topbar) — no PublicNav, no separate footer,
// no token-gated portal. This is the structural fix from the audit.

function HatCard({ icon, label, desc, onClick, gold }) {
  const IconC = Icon[icon] || Icon.Grid;
  return (
    <button onClick={onClick} className={`group text-left bg-surface border rounded-2xl p-5 sm:p-6 flex flex-col transition-colors hover:border-primary/40 ${gold ? "border-accent/50" : "border-border"}`}>
      <div className="flex items-start justify-between mb-4">
        <span className="grid place-items-center w-11 h-11 rounded-xl shrink-0 bg-primary-soft text-primary"><IconC w={20} /></span>
        <Icon.Arrow w={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary mt-1" />
      </div>
      <div className="font-display text-[16px] font-semibold tracking-tight text-ink">{label}</div>
      <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-soft">{desc}</p>
    </button>
  );
}

function HomeScreen({ hats, onNav }) {
  const hatList = [
    hats.tickets && { key: "my-tickets", icon: "Ticket", label: "My tickets & agenda", desc: "Your registrations, Eventera Cards, and personal agenda." },
    hats.speaking && { key: "speaking", icon: "User", label: "Speaking", desc: "Sessions you present, with times and rooms." },
    hats.sponsoring && { key: "sponsoring", icon: "Briefcase", label: "Sponsoring", desc: "Your booths, leads, and exhibitor resources." },
    hats.organizing && { key: "org-events", icon: "Grid", label: "Organizing", desc: "Everything you run — events, registrations, revenue." },
    hats.admin && { key: "admin-stats", icon: "Shield", label: "Admin", desc: "Platform stats, accounts, and revenue." },
  ].filter(Boolean);

  return (
    <PageShell title="Home" subtitle={hatList.length ? "Everything you do on Eventera, in one place." : "Discover events near you and pick up your first ticket."}>
      {hatList.length === 0 ? (
        <EmptyState icon="Grid" title="Nothing here yet" body="Once you register for an event, speak at one, or sponsor one, it'll show up here." cta={<Btn variant="primary" icon="Arrow">Discover events</Btn>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {hatList.map((h) => <HatCard key={h.key} icon={h.icon} label={h.label} desc={h.desc} onClick={() => onNav(h.key)} />)}
        </div>
      )}
    </PageShell>
  );
}

function TicketCard({ t }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="h-20 relative" style={{ background: t.grad }}>
        <div className="absolute inset-0 p-4 flex flex-col justify-end">
          <Pill tone={t.status === "checked_in" ? "green" : "gold"} className="!bg-white/20 !text-cream !border-white/30 w-fit mb-1.5">{t.status === "checked_in" ? "Checked in" : "Confirmed"}</Pill>
          <div className="font-display text-[15px] font-semibold text-cream tracking-tight truncate">{t.event}</div>
        </div>
      </div>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12.5px] text-ink-soft truncate">{t.date} · {t.venue}</div>
          <div className="text-[12px] text-muted mt-1 truncate">{t.ticket}</div>
        </div>
        {t.card && <Btn variant="soft" icon="IdCard" className="shrink-0">Eventera Card</Btn>}
      </div>
    </div>
  );
}

function MyTicketsScreen() {
  return (
    <PageShell title="My tickets" subtitle={`${MY_TICKETS.length} upcoming · ${PAST_TICKETS.length} past event · 3 Eventera Cards collected`}>
      <SectionLabel>Upcoming</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {MY_TICKETS.map((t) => <TicketCard key={t.id} t={t} />)}
      </div>

      <Panel title="My agenda" action={<Pill tone="forest">{MY_AGENDA.length} sessions saved</Pill>} pad="p-0" className="mb-8">
        <div className="divide-y divide-border/60">
          {MY_AGENDA.map((a) => (
            <div key={a.id} className="flex items-start gap-3.5 px-5 py-3.5">
              <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0 mt-0.5"><Icon.Clock w={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium text-ink">{a.title}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] text-ink-soft">
                  <span>{a.day} · {a.time}</span><span>·</span><span>{a.room}</span><span>·</span><span className="text-muted">{a.event}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <SectionLabel>Past events</SectionLabel>
      <div className="grid sm:grid-cols-2 gap-4">
        {PAST_TICKETS.map((t) => <TicketCard key={t.id} t={t} />)}
      </div>
    </PageShell>
  );
}

function SpeakingScreen() {
  return (
    <PageShell title="Speaking" subtitle="The events you speak at and your sessions.">
      {SPEAKING_GROUPS.map((g) => (
        <Panel key={g.event} title={g.event} action={<Pill tone="forest">{g.sessions.length} sessions</Pill>} pad="p-0" className="mb-6">
          <div className="divide-y divide-border/60">
            {g.sessions.map((s) => (
              <div key={s.id} className="flex items-start gap-3.5 px-5 py-3.5">
                <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0 mt-0.5"><Icon.Mic w={15} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{s.title}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] text-ink-soft">
                    <span className="inline-flex items-center gap-1.5"><Icon.Clock w={12} /> {s.time}</span>
                    <span className="inline-flex items-center gap-1.5"><Icon.Pin w={12} /> {s.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}

      <Panel title="Call for papers" action={<span className="text-[12px] text-muted">Submit a talk proposal and track its status.</span>}>
        <div className="grid gap-2.5 mb-2">
          {OPEN_CFPS.map((c) => (
            <div key={c.event} className="flex flex-wrap items-center justify-between gap-3 bg-cream/60 border border-border rounded-xl px-4 py-3">
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium text-ink">{c.event}</div>
                <div className="text-[12px] text-ink-soft mt-0.5">Deadline {c.deadline} · {c.daysLeft} days left</div>
              </div>
              <Btn variant="primary" icon="Arrow">Submit abstract</Btn>
            </div>
          ))}
        </div>
        <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mt-4 mb-2">Your submissions</div>
        <div className="grid gap-2">
          {MY_SUBMISSIONS.map((s) => {
            const st = SUB_STATUS[s.status];
            return (
              <div key={s.id} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-4 py-3">
                <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Check w={14} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium text-ink">{s.title}</div>
                  <div className="text-[12px] text-ink-soft mt-0.5">{s.event} · Submitted {s.submitted}</div>
                </div>
                <Pill tone={st.tone}>{st.label}</Pill>
              </div>
            );
          })}
        </div>
      </Panel>
    </PageShell>
  );
}

// ── Sponsoring — the previously-broken flow. Instead of an "Open portal"
// link to /exhibitor/[token], the booth workspace tabs render right here. ──
function SponsorOverview({ b }) {
  return (
    <React.Fragment>
      <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))" }}>
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Scan w={20} /></span>
          <div>
            <div className="font-display text-[15px] font-semibold text-ink">Scan a badge to capture a lead</div>
            <div className="text-[12.5px] text-ink-soft mt-0.5">Works from any device at your booth — no separate app.</div>
          </div>
        </div>
        <Btn variant="accent" icon="Scan">Scan a lead</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Leads captured" value={b.leads} icon="Users" />
        <StatCard label="Hot leads" value={b.hot} icon="Sparkle" accent />
        <StatCard label="Resources opened" value="214" icon="ListChecks" />
        <StatCard label="Booth" value={b.booth} icon="Pin" />
      </div>
    </React.Fragment>
  );
}

function SponsorLeads() {
  return (
    <Panel title={`Captured leads · ${SPONSOR_LEADS.length}`} action={<Btn icon="External">Export CSV</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {SPONSOR_LEADS.map((l, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
            <Avatar initials={l[0].split(" ").map((x) => x[0]).join("")} size={38} grad={["linear-gradient(135deg,#3E7E5E,#C9A45E)", "linear-gradient(135deg,#1F4D3A,#2A6A50)"][i % 2]} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-ink">{l[0]}</div>
              <div className="text-[12px] text-ink-soft">{l[1]}</div>
            </div>
            <Pill tone={l[3]}>{l[2]}</Pill>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SponsorBooth({ b }) {
  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5">
      <Panel title="Booth profile">
        <div className="grid gap-4">
          <Field label="Company name" value={b.company} />
          <Field label="Tagline" value="Modern payments for Africa" />
          <div className="grid grid-cols-2 gap-4"><Field label="Tier" value={b.tier} /><Field label="Booth" value={`${b.booth} · Hall A`} /></div>
        </div>
        <div className="mt-5"><Btn variant="primary" icon="Check">Save profile</Btn></div>
      </Panel>
      <Panel title="Visibility">
        <div className="flex items-center justify-between"><div><div className="text-[13px] text-ink font-medium">Featured booth</div><div className="text-[11.5px] text-muted mt-0.5">{b.tier} perk</div></div><Toggle on onClick={() => {}} /></div>
      </Panel>
    </div>
  );
}

function SponsorResources() {
  return (
    <Panel title="Booth resources" action={<Btn icon="Plus">Add resource</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {SPONSOR_RESOURCES.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
            <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Layout w={15} /></span>
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{r[0]}</div><div className="text-[12px] text-ink-soft">{r[1]}</div></div>
            <span className="text-[11.5px] text-muted shrink-0">{r[2]}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SponsorTeam() {
  return (
    <Panel title="Booth team" action={<Btn icon="Plus">Invite</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {SPONSOR_TEAM.map((m, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
            <Avatar initials={m[0].split(" ").map((x) => x[0]).join("")} size={36} grad={m[2]} />
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{m[0]}</div><div className="text-[12px] text-ink-soft">{m[1]}</div></div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SponsoringScreen() {
  const [tab, setTab] = React.useState("overview");
  const b = SPONSOR_BOOTHS[0];
  return (
    <PageShell title="Sponsoring" subtitle="Your booths, leads, and exhibitor resources — managed right here, no separate portal.">
      <div className="flex items-center gap-2 mb-4">
        <Pill tone="gold">{b.tier} sponsor</Pill>
        <span className="font-mono text-[11px] text-muted">Booth {b.booth} · {b.event}</span>
      </div>
      <Tabs tabs={[{ id: "overview", label: "Overview" }, { id: "leads", label: "Leads" }, { id: "booth", label: "Booth profile" }, { id: "resources", label: "Resources" }, { id: "team", label: "Team" }]} active={tab} onChange={setTab} />
      {tab === "overview" && <SponsorOverview b={b} />}
      {tab === "leads" && <SponsorLeads />}
      {tab === "booth" && <SponsorBooth b={b} />}
      {tab === "resources" && <SponsorResources />}
      {tab === "team" && <SponsorTeam />}
    </PageShell>
  );
}

function StubScreen({ label }) {
  return (
    <PageShell title={label}>
      <EmptyState icon="Grid" title={`${label} — organizer workspace`} body="Same shell, same nav pattern — the ~55 existing organizer routes plug in here unchanged." />
    </PageShell>
  );
}

Object.assign(window, { HomeScreen, MyTicketsScreen, SpeakingScreen, SponsoringScreen, StubScreen });
