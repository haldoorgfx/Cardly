// Attendee · Discover feed + public Event Page

function DiscoverScreen({ nav }) {
  const [cat, setCat] = React.useState("All");
  const list = cat === "All" ? DISCOVER : DISCOVER.filter((e) => e.cat === cat);
  const featured = DISCOVER.find((e) => e.featured);
  return (
    <Screen>
      {/* search */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5 h-11 px-3.5 rounded-xl bg-surface border border-border text-muted">
          <Icon.Search w={17} /><span className="text-[14px]">Search events, cities, topics…</span>
        </div>
      </div>
      {/* categories */}
      <div className="flex gap-2 overflow-x-auto att-noscroll px-4 py-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors ${cat === c ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border hover:border-primary/40"}`}>{c}</button>
        ))}
      </div>

      {/* featured hero */}
      {cat === "All" && featured && (
        <div className="px-4 pt-2 pb-1">
          <SectionLabel>Featured near you</SectionLabel>
          <div onClick={() => nav("event", { id: featured.id })} className="rounded-2xl overflow-hidden border border-border cursor-pointer">
            <Cover grad={featured.grad} h={186}>
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <Pill tone="dark">{featured.cat}</Pill>
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] uppercase text-cream/80 bg-black/20 px-2 py-1 rounded-full"><Icon.Users w={11} /> {featured.going.toLocaleString()} going</span>
                </div>
                <div>
                  <div className="font-display text-cream text-[22px] font-bold tracking-tight leading-tight">{featured.name}</div>
                  <div className="flex items-center gap-3 mt-1.5 font-mono text-[11.5px] text-cream/85">
                    <span className="inline-flex items-center gap-1"><Icon.Calendar w={12} style={{ color: "#E8C57E" }} /> {featured.when}</span>
                    <span className="inline-flex items-center gap-1"><Icon.Pin w={12} style={{ color: "#E8C57E" }} /> {featured.city}</span>
                  </div>
                </div>
              </div>
            </Cover>
          </div>
        </div>
      )}

      {/* feed */}
      <div className="px-4 pt-3 pb-5">
        <SectionLabel>{cat === "All" ? "Browse all events" : `${cat} events`}</SectionLabel>
        <div className="grid gap-3">
          {list.filter((e) => cat !== "All" || !e.featured).map((e) => (
            <div key={e.id} onClick={() => nav("event", { id: e.id })} className="flex gap-3.5 bg-surface border border-border rounded-2xl p-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="w-[88px] h-[88px] rounded-xl overflow-hidden shrink-0 relative" style={{ background: e.grad }}>
                <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 80% at 80% 10%, rgba(232,197,126,0.3), transparent 60%)" }} />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 text-center font-mono text-[8.5px] tracking-[0.1em] uppercase text-cream/90">{e.cat}</div>
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <div className="font-display text-[15px] font-semibold text-ink tracking-tight leading-snug line-clamp-2">{e.name}</div>
                <div className="flex items-center gap-2 mt-1.5 font-mono text-[11.5px] text-muted">
                  <Icon.Calendar w={12} /> {e.when}<span className="text-border">·</span>{e.city}
                </div>
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[12.5px] font-medium text-primary">{e.price}</span>
                  <span className="font-mono text-[10.5px] text-muted">{e.going.toLocaleString()} going</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function EventPageScreen({ nav, params }) {
  const e = FEATURED;
  const [tab, setTab] = React.useState("about");
  return (
    <Screen>
      <Cover grad={e.grad} h={230}>
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <button onClick={() => nav.back()} className="w-9 h-9 grid place-items-center rounded-full bg-black/25 text-cream backdrop-blur"><Icon.ChevLeft w={18} /></button>
            <div className="flex gap-2">
              <button className="w-9 h-9 grid place-items-center rounded-full bg-black/25 text-cream backdrop-blur"><Icon.Share w={16} /></button>
              <button className="w-9 h-9 grid place-items-center rounded-full bg-black/25 text-cream backdrop-blur"><Icon.Heart w={16} /></button>
            </div>
          </div>
          <div>
            <Pill tone="gold" className="bg-cream/95 mb-2.5">{e.org} presents</Pill>
            <div className="font-display text-cream text-[26px] font-bold tracking-[-0.02em] leading-[1.05]">{e.name}</div>
            <div className="flex items-center gap-3 mt-2.5 font-mono text-[12px] text-cream/85 flex-wrap">
              <span className="inline-flex items-center gap-1.5"><Icon.Calendar w={13} style={{ color: "#E8C57E" }} /> {e.dates}</span>
              <span className="inline-flex items-center gap-1.5"><Icon.Pin w={13} style={{ color: "#E8C57E" }} /> {e.venue}</span>
            </div>
          </div>
        </div>
      </Cover>

      {/* attendees + tabs */}
      <div className="px-5 pt-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="flex -space-x-2">
            {A_PEOPLE.slice(0, 4).map((p, i) => <Avatar key={i} initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={30} ring="#FAF6EE" />)}
          </div>
          <span className="text-[13px] text-ink-soft"><span className="font-medium text-ink">{e.going.toLocaleString()}</span> going · 12 friends</span>
        </div>
      </div>
      <div className="flex gap-1 px-3 border-b border-border sticky top-0 bg-cream/95 backdrop-blur z-10">
        {[["about", "About"], ["agenda", "Agenda"], ["speakers", "Speakers"], ["tickets", "Tickets"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`relative px-3.5 py-3 text-[13.5px] font-medium transition-colors ${tab === id ? "text-primary" : "text-muted"}`}>
            {l}{tab === id && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {tab === "about" && (
          <div>
            <p className="text-[14.5px] text-ink-soft leading-[1.65]">{e.about}</p>
            <div className="grid grid-cols-4 gap-2.5 mt-5">
              {e.stats.map((s, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl py-3 text-center">
                  <div className="font-mono text-[17px] text-primary">{s[0]}</div>
                  <div className="font-mono text-[8.5px] tracking-[0.08em] uppercase text-muted mt-1">{s[1]}</div>
                </div>
              ))}
            </div>
            <SectionLabel className="mt-6">Location</SectionLabel>
            <div className="rounded-2xl overflow-hidden border border-border">
              <div className="h-32 relative" style={{ background: "linear-gradient(135deg,#E8EFEB,#D8E4DC)" }}>
                <svg viewBox="0 0 400 130" className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
                  {[30, 70, 110].map((y, i) => <line key={i} x1="0" y1={y} x2="400" y2={y - 10} stroke="#A8C2B5" strokeWidth="1.5" />)}
                  {[120, 240, 330].map((x, i) => <line key={i} x1={x} y1="0" x2={x - 15} y2="130" stroke="#A8C2B5" strokeWidth="1.5" />)}
                </svg>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"><Icon.Pin w={28} /></span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <div><div className="text-[13.5px] font-medium text-ink">Djibouti Conference Centre</div><div className="font-mono text-[11px] text-muted mt-0.5">Plateau du Serpent, Djibouti City</div></div>
                <Btn size="sm" iconRight="External">Map</Btn>
              </div>
            </div>
          </div>
        )}
        {tab === "agenda" && (
          <div className="grid gap-2.5">
            {A_SESSIONS.slice(0, 5).map((s) => (
              <div key={s.id} onClick={() => nav("session", { id: s.id })} className="flex items-center gap-3.5 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="text-center w-12 shrink-0"><div className="font-mono text-[14px] text-primary">{s.time}</div><div className="font-mono text-[9px] text-muted">{s.len}</div></div>
                <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: s.tone === "gold" ? "#C9A45E" : s.tone === "sage" ? "#2A6A50" : "#1F4D3A" }} />
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink leading-snug line-clamp-1">{s.title}</div><div className="font-mono text-[11px] text-muted mt-0.5">{s.speaker} · {s.room}</div></div>
              </div>
            ))}
          </div>
        )}
        {tab === "speakers" && (
          <div className="grid grid-cols-2 gap-3">
            {A_SPEAKERS.map((s) => (
              <div key={s.id} onClick={() => nav("speaker", { id: s.id })} className="bg-surface border border-border rounded-2xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
                <Avatar initials={s.n.split(" ").map((x) => x[0]).join("")} grad={s.g} size={56} className="mx-auto" />
                <div className="font-display text-[13.5px] font-semibold text-ink tracking-tight mt-2.5">{s.n}</div>
                <div className="text-[11.5px] text-muted mt-0.5 leading-tight">{s.role}</div>
                <div className="font-mono text-[10px] text-primary mt-1">{s.org}</div>
              </div>
            ))}
          </div>
        )}
        {tab === "tickets" && (
          <div className="grid gap-2.5">
            {e.tickets.map((t) => (
              <div key={t.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3.5">
                <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Ticket w={16} /></span>
                <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[13.5px] font-medium text-ink">{t.name}</span>{t.popular && <Pill tone="gold">Popular</Pill>}</div><div className="text-[11.5px] text-muted mt-0.5">{t.desc}</div></div>
                <span className="font-mono text-[15px] text-primary shrink-0">{t.price === 0 ? "Free" : t.cur + t.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* sticky CTA */}
      <div className="sticky bottom-0 bg-cream/95 backdrop-blur border-t border-border px-5 py-3.5 flex items-center gap-3">
        <div className="shrink-0"><div className="font-mono text-[9px] tracking-[0.1em] uppercase text-muted">From</div><div className="font-mono text-[17px] text-primary leading-tight">$25</div></div>
        <Btn variant="primary" full iconRight="Arrow" onClick={() => nav("register")}>Get your ticket</Btn>
      </div>
    </Screen>
  );
}

window.A_SCREENS = Object.assign(window.A_SCREENS || {}, {
  discover: DiscoverScreen,
  event: EventPageScreen,
});
