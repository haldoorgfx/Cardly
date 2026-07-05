// Attendee · Me (profile hub, card collection, my events, quick links, settings)

function MeScreen({ nav }) {
  const links = [
    { id: "speakers", label: "Speakers", icon: "User" },
    { id: "sponsors", label: "Sponsors", icon: "Briefcase" },
    { id: "virtual", label: "Watch live", icon: "Video" },
    { id: "qa", label: "Live Q&A", icon: "Chat" },
    { id: "feedback", label: "Give feedback", icon: "Star" },
    { id: "booth", label: "Booths", icon: "Grid" },
  ];
  return (
    <Screen>
      {/* profile header */}
      <div className="relative">
        <Cover grad={FEATURED.grad} h={96} />
        <div className="px-5 -mt-9 relative">
          <Avatar initials={ME.initials} grad={ME.g} size={72} ring="#FAF6EE" />
          <h1 className="font-display text-[20px] font-semibold text-primary tracking-[-0.02em] mt-2.5">{ME.name}</h1>
          <div className="text-[13px] text-ink-soft">{ME.role}</div>
          <div className="flex items-center gap-2 mt-2">
            <Pill tone="gold">{ME.tier} · #{ME.ticketNo}</Pill>
            <Pill tone="forest"><Icon.Pin w={10} /> {ME.city}</Pill>
          </div>
        </div>
      </div>

      {/* points / rank */}
      <div className="px-5 mt-5">
        <div className="rounded-2xl p-4 flex items-center gap-4 text-cream relative overflow-hidden" style={{ background: "linear-gradient(135deg,#163828,#1F4D3A 60%,#2A6A50)" }}>
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 90% at 90% 0%, rgba(232,197,126,0.28), transparent 55%)" }} />
          <div className="relative flex items-center gap-2.5"><span className="w-11 h-11 rounded-xl bg-cream/10 border border-cream/20 grid place-items-center text-accent"><Icon.Trophy w={20} /></span></div>
          <div className="relative flex-1">
            <div className="font-mono text-[22px] leading-none">{ME.points} <span className="text-[12px] text-cream/60">pts</span></div>
            <div className="text-[12px] text-cream/70 mt-1">Rank #{ME.rank} · earn more by connecting & attending</div>
          </div>
          <button onClick={() => nav("qa", { tab: "board" })} className="relative text-[12.5px] font-medium text-accent">Leaderboard ›</button>
        </div>
      </div>

      {/* my Karta card */}
      <div className="px-5 mt-5">
        <SectionLabel action={<button onClick={() => nav("wallet")} className="text-[11px] text-primary font-medium">My ticket ›</button>}>Your Karta Card</SectionLabel>
        <div className="flex gap-3.5 items-center bg-surface border border-border rounded-2xl p-3.5">
          <KartaCard w={86} name={ME.name} role={ME.role} tier={ME.tier} no={ME.ticketNo} accent={CARD_ACCENTS[0]} initials={ME.initials} photo={ME.g} />
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-semibold text-ink">AfriTech Summit 2026</div>
            <div className="text-[12px] text-muted mt-0.5">Shared 3× · ~560 reached</div>
            <div className="flex gap-2 mt-2.5"><Btn size="sm" variant="primary" icon="Share">Share</Btn><Btn size="sm" variant="ghost" onClick={() => nav("reveal", { ticket: FEATURED.tickets[1], accent: CARD_ACCENTS[0], name: ME.name, role: ME.role, photo: true })}>View</Btn></div>
          </div>
        </div>
      </div>

      {/* quick links */}
      <div className="px-5 mt-6">
        <SectionLabel>At this event</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5">
          {links.map((l) => { const IconC = Icon[l.icon]; return (
            <button key={l.id} onClick={() => nav(l.id)} className="bg-surface border border-border rounded-2xl py-4 grid place-items-center gap-2 hover:border-primary/40 transition-colors">
              <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><IconC w={18} /></span>
              <span className="text-[11.5px] font-medium text-ink-soft">{l.label}</span>
            </button>
          ); })}
        </div>
      </div>

      {/* my events */}
      <div className="px-5 mt-6">
        <SectionLabel>My events</SectionLabel>
        <div className="grid gap-2.5">
          {MY_EVENTS.map((e) => (
            <div key={e.id} className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl p-3">
              <span className="w-12 h-12 rounded-xl shrink-0 relative overflow-hidden" style={{ background: e.grad }}><span aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 80% at 80% 10%, rgba(232,197,126,0.3), transparent 60%)" }} /></span>
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink truncate">{e.name}</div><div className="font-mono text-[11px] text-muted mt-0.5">{e.when}</div></div>
              <Pill tone={e.status === "upcoming" ? "green" : "neutral"} dot={e.status === "upcoming" ? "#2D7A4F" : null}>{e.status === "upcoming" ? "Upcoming" : e.tier}</Pill>
            </div>
          ))}
        </div>
      </div>

      {/* settings */}
      <div className="px-5 mt-6 pb-6">
        <SectionLabel>Account</SectionLabel>
        <div className="bg-surface border border-border rounded-2xl divide-y divide-border/60">
          {[["Edit profile", "User"], ["Notifications", "Bell"], ["Privacy & visibility", "Shield"], ["Help & support", "Chat"], ["Sign out", "External"]].map((r, i) => { const IconC = Icon[r[1]] || Icon.Gear; return (
            <button key={i} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-cream/60 ${i === 4 ? "text-red-600" : "text-ink-soft"}`}>
              <IconC w={16} /><span className="flex-1 text-[13.5px] font-medium">{r[0]}</span>{i < 4 && <Icon.Arrow w={14} style={{ color: "#6B7A72" }} />}
            </button>
          ); })}
        </div>
        <div className="text-center font-mono text-[10px] tracking-[0.1em] uppercase text-muted/70 mt-5">Karta · attendee app · v1.0</div>
      </div>
    </Screen>
  );
}

window.A_SCREENS = Object.assign(window.A_SCREENS || {}, { me: MeScreen });
