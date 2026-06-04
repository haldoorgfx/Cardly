// Attendee · Schedule, Session detail, Speakers, Speaker profile, Wallet/Ticket

function ScheduleScreen({ nav }) {
  const [day, setDay] = React.useState(1);
  const [mine, setMine] = React.useState(false);
  const [saved, setSaved] = React.useState(() => new Set(A_SESSIONS.filter((s) => s.saved).map((s) => s.id)));
  const toggle = (id) => { const n = new Set(saved); n.has(id) ? n.delete(id) : n.add(id); setSaved(n); };
  let list = A_SESSIONS.filter((s) => s.day === day);
  if (mine) list = list.filter((s) => saved.has(s.id));
  const tone = (t) => t === "gold" ? "#C9A45E" : t === "sage" ? "#2A6A50" : "#1F4D3A";

  return (
    <Screen>
      <div className="px-5 pt-4 pb-2">
        <h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em]">Schedule</h1>
        <p className="text-[13px] text-muted mt-0.5">AfriTech Summit · 3 days · {saved.size} saved</p>
      </div>
      {/* day tabs */}
      <div className="flex gap-2 px-5 py-2 overflow-x-auto att-noscroll">
        {[[1, "Day 1 · 12 Mar"], [2, "Day 2 · 13 Mar"], [3, "Day 3 · 14 Mar"]].map(([d, l]) => (
          <button key={d} onClick={() => setDay(d)} className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors ${day === d ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border"}`}>{l}</button>
        ))}
      </div>
      {/* all vs mine */}
      <div className="flex items-center gap-1 px-5 py-1.5">
        <div className="inline-flex bg-surface border border-border rounded-lg p-0.5">
          {[["all", "All sessions"], ["mine", "My agenda"]].map(([id, l]) => (
            <button key={id} onClick={() => setMine(id === "mine")} className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${(mine ? "mine" : "all") === id ? "bg-primary text-cream" : "text-ink-soft"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 grid gap-2.5">
        {list.length === 0 && (
          <div className="text-center py-12 text-muted"><Icon.Calendar w={28} className="mx-auto" /><div className="text-[13.5px] mt-3">No saved sessions yet.<br />Tap the star on any session to build your agenda.</div></div>
        )}
        {list.map((s) => (
          <div key={s.id} className="flex items-stretch gap-3.5 bg-surface border border-border rounded-2xl p-3.5">
            <div onClick={() => nav("session", { id: s.id })} className="flex items-stretch gap-3.5 flex-1 min-w-0 cursor-pointer">
              <div className="text-center w-12 shrink-0 self-center"><div className="font-mono text-[14px] text-primary">{s.time}</div><div className="font-mono text-[9px] text-muted mt-0.5">{s.len}</div></div>
              <span className="w-1 rounded-full shrink-0" style={{ background: tone(s.tone) }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1"><Pill tone={s.tone === "gold" ? "gold" : "forest"}>{s.tag}</Pill></div>
                <div className="text-[13.5px] font-medium text-ink leading-snug line-clamp-2">{s.title}</div>
                <div className="font-mono text-[11px] text-muted mt-1 flex items-center gap-1.5"><Icon.Pin w={11} /> {s.room} · {s.speaker}</div>
              </div>
            </div>
            <button onClick={() => toggle(s.id)} className={`self-start w-9 h-9 grid place-items-center rounded-lg transition-colors ${saved.has(s.id) ? "text-accent-dark" : "text-muted hover:text-primary"}`}>
              <Icon.Star w={18} fill={saved.has(s.id) ? "#E8C57E" : "none"} />
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function SessionDetailScreen({ nav, params }) {
  const s = A_SESSIONS.find((x) => x.id === (params && params.id)) || A_SESSIONS[1];
  const [saved, setSaved] = React.useState(s.saved);
  const speakers = A_SPEAKERS.slice(0, s.speaker.includes("Panel") ? 4 : 1);
  return (
    <Screen>
      <Cover grad={FEATURED.grad} h={150}>
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          <button onClick={() => nav.back()} className="w-9 h-9 grid place-items-center rounded-full bg-black/25 text-cream backdrop-blur self-start"><Icon.ChevLeft w={18} /></button>
          <div className="flex items-center gap-2"><Pill tone="dark">{s.track}</Pill><Pill tone="dark">{s.tag}</Pill></div>
        </div>
      </Cover>
      <div className="px-5 py-5">
        <h1 className="font-display text-[21px] font-semibold text-primary tracking-[-0.02em] leading-snug">{s.title}</h1>
        <div className="flex items-center gap-3 mt-3 font-mono text-[12px] text-muted flex-wrap">
          <span className="inline-flex items-center gap-1.5"><Icon.Clock w={13} /> Day {s.day} · {s.time} · {s.len}</span>
          <span className="inline-flex items-center gap-1.5"><Icon.Pin w={13} /> {s.room}</span>
        </div>
        <div className="flex gap-2.5 mt-4">
          <Btn variant={saved ? "soft" : "primary"} icon={saved ? "Check" : "Plus"} onClick={() => setSaved(!saved)}>{saved ? "Saved to agenda" : "Add to my agenda"}</Btn>
          <Btn variant="ghost" icon="Bell">Remind me</Btn>
        </div>

        <p className="text-[14px] text-ink-soft leading-[1.65] mt-5">A deep look at the operators scaling payments and lending across multiple African markets — covering FX, regulation, and the playbook for going cross-border without breaking what works at home.</p>

        <SectionLabel className="mt-6">{speakers.length > 1 ? "Speakers" : "Speaker"}</SectionLabel>
        <div className="grid gap-2.5">
          {speakers.map((sp) => (
            <div key={sp.id} onClick={() => nav("speaker", { id: sp.id })} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3.5 py-3 cursor-pointer hover:border-primary/40 transition-colors">
              <Avatar initials={sp.n.split(" ").map((x) => x[0]).join("")} grad={sp.g} size={40} />
              <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink truncate">{sp.n}</div><div className="font-mono text-[11px] text-muted">{sp.role} · {sp.org}</div></div>
              <Icon.Arrow w={15} style={{ color: "#6B7A72" }} />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-accent/40 p-4 flex items-center justify-between gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))" }}>
          <div className="flex items-center gap-2.5"><span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center"><Icon.Chat w={16} /></span><div><div className="text-[13.5px] font-semibold text-primary-dark">Live Q&A is open</div><div className="text-[11.5px] text-ink-soft">Ask questions & vote in real time</div></div></div>
          <Btn variant="accent" size="sm" onClick={() => nav("qa", { id: s.id })}>Join</Btn>
        </div>
      </div>
    </Screen>
  );
}

function SpeakersScreen({ nav }) {
  return (
    <Screen>
      <div className="px-5 pt-4 pb-3"><h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em]">Speakers</h1><p className="text-[13px] text-muted mt-0.5">{A_SPEAKERS.length} speakers · 12 sessions</p></div>
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        {A_SPEAKERS.map((s) => (
          <div key={s.id} onClick={() => nav("speaker", { id: s.id })} className="bg-surface border border-border rounded-2xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors relative">
            {s.featured && <span className="absolute top-2.5 right-2.5 text-accent-dark"><Icon.Sparkle w={13} /></span>}
            <Avatar initials={s.n.split(" ").map((x) => x[0]).join("")} grad={s.g} size={60} />
            <div className="font-display text-[14px] font-semibold text-ink tracking-tight mt-2.5">{s.n}</div>
            <div className="text-[11.5px] text-muted mt-0.5 leading-tight">{s.role}</div>
            <div className="font-mono text-[10px] text-primary mt-1">{s.org}</div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function SpeakerProfileScreen({ nav, params }) {
  const s = A_SPEAKERS.find((x) => x.id === (params && params.id)) || A_SPEAKERS[0];
  return (
    <Screen>
      <TopBar onBack={() => nav.back()} />
      <div className="px-5 pb-5 text-center">
        <Avatar initials={s.n.split(" ").map((x) => x[0]).join("")} grad={s.g} size={88} />
        <h1 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em] mt-3">{s.n}</h1>
        <div className="text-[13.5px] text-ink-soft mt-1">{s.role}</div>
        <div className="font-mono text-[12px] text-primary mt-0.5">{s.org}</div>
        {s.featured && <div className="mt-2.5 inline-flex"><Pill tone="gold"><Icon.Sparkle w={11} /> Keynote speaker</Pill></div>}
        <div className="flex items-center justify-center gap-2 mt-4">
          <Btn variant="primary" icon="Plus">Follow</Btn>
          <Btn variant="ghost" icon="Twitter" />
          <Btn variant="ghost" icon="Linkedin" />
        </div>
      </div>
      <div className="px-5">
        <p className="text-[14px] text-ink-soft leading-[1.65]">{s.n} leads {s.role.toLowerCase()} work at {s.org}, shipping infrastructure used across the continent. A frequent voice on building for emerging markets.</p>
        <SectionLabel className="mt-6">Sessions</SectionLabel>
        <div className="grid gap-2.5 pb-5">
          {A_SESSIONS.filter((x) => x.speaker.includes(s.n.split(" ")[0]) || x.id === "s2").slice(0, 2).map((x) => (
            <div key={x.id} onClick={() => nav("session", { id: x.id })} className="flex items-center gap-3.5 bg-surface border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="text-center w-12 shrink-0"><div className="font-mono text-[13px] text-primary">{x.time}</div><div className="font-mono text-[9px] text-muted">D{x.day}</div></div>
              <div className="min-w-0 flex-1"><div className="text-[13px] font-medium text-ink leading-snug line-clamp-1">{x.title}</div><div className="font-mono text-[11px] text-muted mt-0.5">{x.room}</div></div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function WalletScreen({ nav }) {
  const e = FEATURED;
  return (
    <Screen className="px-5 py-4">
      <h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em] mb-4">My Tickets</h1>
      {/* the ticket */}
      <div className="rounded-3xl overflow-hidden border border-border bg-surface">
        <Cover grad={e.grad} h={120}>
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            <Pill tone="dark">{ME.tier} · Admit one</Pill>
            <div><div className="font-display text-cream text-[18px] font-bold tracking-tight leading-tight">{e.name}</div><div className="font-mono text-[11px] text-cream/80 mt-1">{e.dates} · {e.venue}</div></div>
          </div>
        </Cover>
        {/* perforation */}
        <div className="relative h-5 bg-surface">
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cream border border-border" />
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-cream border border-border" />
          <div className="absolute left-4 right-4 top-1/2 border-t border-dashed border-border" />
        </div>
        <div className="px-5 pb-5 pt-1 grid place-items-center">
          <QR size={172} />
          <div className="font-mono text-[12px] text-ink mt-3 tracking-[0.1em]">TICKET #AT-{ME.ticketNo}</div>
          <div className="text-[12px] text-muted mt-0.5">{ME.name} · {ME.role}</div>
          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <Btn variant="ghost" icon="Plus">Apple Wallet</Btn>
            <Btn variant="ghost" icon="Plus">Google Wallet</Btn>
          </div>
        </div>
      </div>

      {/* your card */}
      <SectionLabel className="mt-6" action={<button onClick={() => nav("reveal", { ticket: e.tickets[1], accent: CARD_ACCENTS[0], name: ME.name, role: ME.role, photo: true })} className="text-[11px] text-primary font-medium">View ›</button>}>Your Karta Card</SectionLabel>
      <div className="flex gap-3.5 items-center bg-surface border border-border rounded-2xl p-3.5">
        <KartaCard w={92} name={ME.name} role={ME.role} tier={ME.tier} no={ME.ticketNo} accent={CARD_ACCENTS[0]} initials={ME.initials} photo={ME.g} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink">Shared 3 times</div>
          <div className="text-[12px] text-muted mt-0.5 leading-snug">Your card has reached ~560 people on social.</div>
          <div className="flex gap-2 mt-3"><Btn size="sm" variant="primary" icon="Share">Share</Btn><Btn size="sm" variant="ghost">Download</Btn></div>
        </div>
      </div>
    </Screen>
  );
}

window.A_SCREENS = Object.assign(window.A_SCREENS || {}, {
  schedule: ScheduleScreen,
  session: SessionDetailScreen,
  speakers: SpeakersScreen,
  speaker: SpeakerProfileScreen,
  wallet: WalletScreen,
});
