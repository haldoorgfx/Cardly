// Attendee · Networking, Person, Messaging, Q&A/Polls/Leaderboard, Sponsors, Booth, Virtual, Feedback

function NetworkScreen({ nav }) {
  const [tab, setTab] = React.useState("foryou");
  return (
    <Screen>
      <div className="px-5 pt-4 pb-2"><h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em]">Network</h1><p className="text-[13px] text-muted mt-0.5">1,284 attendees · 28 connections</p></div>
      <div className="flex gap-1 px-4 border-b border-border sticky top-0 bg-cream/95 backdrop-blur z-10">
        {[["foryou", "For you"], ["all", "Attendees"], ["requests", "Requests"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`relative px-3.5 py-3 text-[13px] font-medium transition-colors ${tab === id ? "text-primary" : "text-muted"}`}>{l}{id === "requests" && <span className="ml-1.5 font-mono text-[10px] bg-accent text-primary-dark rounded-full px-1.5">3</span>}{tab === id && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full bg-primary" />}</button>
        ))}
      </div>
      <div className="px-5 py-4">
        {tab === "foryou" && (
          <React.Fragment>
            <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
              <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Sparkle w={16} /></span>
              <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">AI matchmaking</span> found {A_PEOPLE.length} people you should meet, based on your goals and sessions.</div>
            </div>
            <div className="grid gap-3">
              {A_PEOPLE.map((p) => (
                <div key={p.id} className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <div onClick={() => nav("person", { id: p.id })} className="cursor-pointer"><Avatar initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={48} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div onClick={() => nav("person", { id: p.id })} className="min-w-0 cursor-pointer"><div className="text-[14px] font-semibold text-ink truncate">{p.n}</div><div className="font-mono text-[11px] text-muted">{p.role} · {p.org}</div></div>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-accent-dark bg-accent/15 px-2 py-0.5 rounded-full shrink-0"><Icon.Sparkle w={10} /> {p.match}%</span>
                      </div>
                      <div className="text-[12px] text-ink-soft mt-2 flex items-center gap-1.5"><Icon.Network w={12} style={{ color: "#2A6A50" }} /> {p.shared}</div>
                      <div className="flex gap-2 mt-3">
                        <Btn size="sm" variant="primary" icon="Plus" onClick={() => nav("messaging", { id: p.id })}>Connect</Btn>
                        <Btn size="sm" variant="ghost" icon="Chat" onClick={() => nav("messaging", { id: p.id })}>Message</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </React.Fragment>
        )}
        {tab === "all" && (
          <div className="grid gap-2.5">
            {[...A_PEOPLE, ...A_SPEAKERS.map((s) => ({ id: s.id, n: s.n, role: s.role, org: s.org, g: s.g }))].map((p, i) => (
              <div key={i} onClick={() => nav("person", { id: p.id })} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3.5 py-3 cursor-pointer hover:border-primary/40 transition-colors">
                <Avatar initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={40} />
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink truncate">{p.n}</div><div className="font-mono text-[11px] text-muted truncate">{p.role} · {p.org}</div></div>
                <button onClick={(ev) => { ev.stopPropagation(); nav("messaging", { id: p.id }); }} className="w-8 h-8 grid place-items-center rounded-lg text-primary hover:bg-primary-soft transition-colors"><Icon.Plus w={16} /></button>
              </div>
            ))}
          </div>
        )}
        {tab === "requests" && (
          <div className="grid gap-2.5">
            {A_PEOPLE.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-3.5 py-3">
                <Avatar initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={40} />
                <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink truncate">{p.n}</div><div className="font-mono text-[11px] text-muted">wants to connect</div></div>
                <Btn size="sm" variant="primary">Accept</Btn>
                <button className="text-muted hover:text-ink px-1"><Icon.X w={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

function PersonScreen({ nav, params }) {
  const p = A_PEOPLE.find((x) => x.id === (params && params.id)) || A_PEOPLE[0];
  return (
    <Screen>
      <TopBar onBack={() => nav.back()} />
      <div className="px-5 pb-5 text-center">
        <Avatar initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={88} />
        <h1 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em] mt-3">{p.n}</h1>
        <div className="text-[13.5px] text-ink-soft mt-1">{p.role} · {p.org}</div>
        <div className="mt-2.5 inline-flex"><Pill tone="gold"><Icon.Sparkle w={11} /> {p.match}% match</Pill></div>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Btn variant="primary" icon="Chat" onClick={() => nav("messaging", { id: p.id })}>Message</Btn>
          <Btn variant="ghost" icon="Plus">Connect</Btn>
        </div>
      </div>
      <div className="px-5 grid gap-4 pb-5">
        <Card><div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-2">Why you match</div><div className="text-[13.5px] text-ink-soft flex items-center gap-2"><Icon.Network w={14} style={{ color: "#2A6A50" }} /> {p.shared}</div></Card>
        <div>
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-2">Looking for</div>
          <div className="flex flex-wrap gap-2">{p.goals.map((g, i) => <Pill key={i} tone="forest">{g}</Pill>)}</div>
        </div>
      </div>
    </Screen>
  );
}

function MessagingScreen({ nav, params }) {
  const p = A_PEOPLE.find((x) => x.id === (params && params.id)) || A_PEOPLE[0];
  const msgs = [
    { me: false, t: "Hi Amina! Loved your question in the fintech panel.", at: "10:42" },
    { me: true, t: "Thank you! Your point on FX hedging really landed.", at: "10:44" },
    { me: false, t: "Want to grab coffee at the Builders lounge after the demo day?", at: "10:45" },
    { me: true, t: "Yes — 3pm works. See you there 👋", at: "10:46" },
  ];
  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={() => nav.back()} right={<button className="w-9 h-9 grid place-items-center rounded-full text-ink-soft"><Icon.Search w={17} /></button>}
        title={<span className="flex items-center gap-2.5"><Avatar initials={p.n.split(" ").map((x) => x[0]).join("")} grad={p.g} size={30} /><span className="font-display text-[15px] font-semibold text-ink">{p.n}</span></span>} />
      <Screen className="px-4 py-4 flex flex-col gap-2.5" >
        <div className="text-center font-mono text-[10px] tracking-[0.1em] uppercase text-muted py-2">Today</div>
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[78%] ${m.me ? "self-end" : "self-start"}`}>
            <div className={`px-3.5 py-2.5 text-[13.5px] leading-snug rounded-2xl ${m.me ? "bg-primary text-cream rounded-br-md" : "bg-surface border border-border text-ink rounded-bl-md"}`}>{m.t}</div>
            <div className={`font-mono text-[9.5px] text-muted mt-1 ${m.me ? "text-right" : ""}`}>{m.at}</div>
          </div>
        ))}
      </Screen>
      <div className="border-t border-border bg-cream px-4 py-3 flex items-center gap-2.5">
        <div className="flex-1 h-10 px-3.5 rounded-full bg-surface border border-border flex items-center text-muted text-[13.5px]">Message…</div>
        <button className="w-10 h-10 grid place-items-center rounded-full bg-primary text-cream shrink-0"><Icon.Arrow w={17} /></button>
      </div>
    </div>
  );
}

function QAScreen({ nav, params }) {
  const [tab, setTab] = React.useState("qa");
  const [voted, setVoted] = React.useState(new Set());
  const qs = [
    { id: "q1", q: "How do you handle FX volatility when scaling across markets?", by: "Anonymous", votes: 47 },
    { id: "q2", q: "What regulatory hurdles surprised you most?", by: "Nia W.", votes: 31 },
    { id: "q3", q: "Will the sessions be recorded and shared?", by: "Yusuf B.", votes: 24 },
    { id: "q4", q: "Profitability vs growth — where do you land?", by: "Anonymous", votes: 18 },
  ];
  const v = (id) => { const n = new Set(voted); n.has(id) ? n.delete(id) : n.add(id); setVoted(n); };
  const poll = [["Hiring", 42], ["Funding", 28], ["Regulation", 19], ["Infrastructure", 11]];
  const total = poll.reduce((a, x) => a + x[1], 0);
  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={() => nav.back()} title="Scaling fintech" right={<Pill tone="green" dot="#2D7A4F">Live</Pill>} />
      <div className="flex gap-1 px-4 border-b border-border bg-cream">
        {[["qa", "Q&A"], ["polls", "Polls"], ["board", "Leaderboard"]].map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`relative px-3.5 py-3 text-[13px] font-medium transition-colors ${tab === id ? "text-primary" : "text-muted"}`}>{l}{tab === id && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full bg-primary" />}</button>
        ))}
      </div>
      <Screen className="px-5 py-4">
        {tab === "qa" && (
          <div className="grid gap-2.5">
            {qs.sort((a, b) => (b.votes + (voted.has(b.id) ? 1 : 0)) - (a.votes + (voted.has(a.id) ? 1 : 0))).map((q) => (
              <div key={q.id} className="flex items-start gap-3 bg-surface border border-border rounded-2xl px-4 py-3.5">
                <button onClick={() => v(q.id)} className={`flex flex-col items-center gap-0.5 shrink-0 w-10 py-1 rounded-lg transition-colors ${voted.has(q.id) ? "bg-primary-soft text-primary" : "text-muted hover:text-primary"}`}>
                  <Icon.Arrow w={15} style={{ transform: "rotate(-90deg)" }} /><span className="font-mono text-[13px]">{q.votes + (voted.has(q.id) ? 1 : 0)}</span>
                </button>
                <div className="min-w-0 flex-1"><div className="text-[13.5px] text-ink leading-snug">{q.q}</div><div className="font-mono text-[11px] text-muted mt-1.5">{q.by}</div></div>
              </div>
            ))}
          </div>
        )}
        {tab === "polls" && (
          <Card pad="p-5">
            <div className="font-display text-[15px] font-semibold text-ink tracking-tight mb-4">What's your biggest scaling challenge?</div>
            <div className="grid gap-3">
              {poll.map((o, i) => { const pct = Math.round((o[1] / total) * 100); return (
                <div key={i}><div className="flex items-center justify-between mb-1.5 text-[13px]"><span className="text-ink-soft">{o[0]}</span><span className="font-mono text-muted">{pct}%</span></div><div className="h-7 rounded-lg bg-primary-soft/60 overflow-hidden"><div className="h-full rounded-lg" style={{ width: pct + "%", background: i === 0 ? "#1F4D3A" : "#2A6A50" }} /></div></div>
              ); })}
            </div>
            <div className="font-mono text-[11px] text-muted mt-4">{total} votes · Live now</div>
          </Card>
        )}
        {tab === "board" && (
          <div className="grid gap-2">
            {A_LEADERBOARD.map((b, i) => {
              const medal = ["#E8C57E", "#B8C4CC", "#C8956B"];
              return (
                <div key={i} className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 border ${b.me ? "border-primary/40 bg-primary-soft/40" : "border-border bg-surface"}`}>
                  <span className="w-6 h-6 rounded-full grid place-items-center font-mono text-[11px] font-semibold shrink-0" style={i < 3 ? { background: medal[i], color: "#163828" } : { background: "#E8EFEB", color: "#6B7A72" }}>{i + 1}</span>
                  <Avatar initials={b.n.split(" ").map((x) => x[0]).join("")} grad={b.g} size={32} />
                  <span className="flex-1 text-[13px] font-medium text-ink truncate">{b.n}</span>
                  <span className="font-mono text-[13px] text-primary">{b.pts.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        )}
      </Screen>
      {tab === "qa" && (
        <div className="border-t border-border bg-cream px-4 py-3 flex items-center gap-2.5">
          <div className="flex-1 h-10 px-3.5 rounded-full bg-surface border border-border flex items-center text-muted text-[13.5px]">Ask a question…</div>
          <button className="w-10 h-10 grid place-items-center rounded-full bg-primary text-cream shrink-0"><Icon.Arrow w={17} /></button>
        </div>
      )}
    </div>
  );
}

function SponsorsScreen({ nav }) {
  const tiers = [["Platinum", "#C9A45E"], ["Gold", "#E8C57E"], ["Silver", "#A8C2B5"]];
  return (
    <Screen className="px-5 py-4">
      <h1 className="font-display text-[24px] font-semibold text-primary tracking-[-0.02em] mb-1">Sponsors</h1>
      <p className="text-[13px] text-muted mb-5">Visit booths, collect offers, and drop your card.</p>
      {tiers.map(([tier, color]) => (
        <div key={tier} className="mb-5">
          <div className="flex items-center gap-2 mb-3"><span className="w-3 h-3 rounded-sm" style={{ background: color }} /><span className="font-display text-[13px] font-semibold text-ink">{tier}</span></div>
          <div className="grid gap-2.5">
            {A_SPONSORS.filter((s) => s.tier === tier).map((s) => (
              <div key={s.id} onClick={() => nav("booth", { id: s.id })} className="flex items-center gap-3.5 bg-surface border border-border rounded-2xl p-3.5 cursor-pointer hover:border-primary/40 transition-colors">
                <span className="w-12 h-12 rounded-xl bg-cream border border-border grid place-items-center shrink-0 font-display text-[15px] font-bold text-primary/70">{s.n.slice(0, 2)}</span>
                <div className="min-w-0 flex-1"><div className="text-[14px] font-semibold text-ink">{s.n}</div><div className="text-[12px] text-muted mt-0.5 line-clamp-1">{s.desc}</div></div>
                <span className="font-mono text-[11px] text-muted shrink-0">Booth {s.booth}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Screen>
  );
}

function BoothScreen({ nav, params }) {
  const s = A_SPONSORS.find((x) => x.id === (params && params.id)) || A_SPONSORS[0];
  return (
    <Screen>
      <Cover grad={FEATURED.grad} h={130}>
        <div className="absolute inset-0 p-5 flex flex-col justify-between">
          <button onClick={() => nav.back()} className="w-9 h-9 grid place-items-center rounded-full bg-black/25 text-cream backdrop-blur self-start"><Icon.ChevLeft w={18} /></button>
          <Pill tone="dark">{s.tier} sponsor · Booth {s.booth}</Pill>
        </div>
      </Cover>
      <div className="px-5 -mt-8 relative">
        <span className="w-16 h-16 rounded-2xl bg-surface border border-border grid place-items-center font-display text-[20px] font-bold text-primary shadow-lg">{s.n.slice(0, 2)}</span>
        <h1 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em] mt-3">{s.n}</h1>
        <p className="text-[14px] text-ink-soft mt-1.5 leading-[1.6]">{s.desc}. Visit our booth for live demos, swag, and a chance to win.</p>
        <div className="flex gap-2.5 mt-4">
          <Btn variant="primary" icon="IdCard">Drop my card</Btn>
          <Btn variant="ghost" icon="External">Website</Btn>
        </div>
        <SectionLabel className="mt-6">Resources</SectionLabel>
        <div className="grid gap-2.5 pb-5">
          {[["Product one-pager", "PDF · 2.1 MB"], ["API documentation", "Link"], ["Careers — we're hiring", "12 roles"]].map((r, i) => (
            <div key={i} className="flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3"><span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center"><Icon.External w={14} /></span><div className="flex-1"><div className="text-[13px] font-medium text-ink">{r[0]}</div><div className="font-mono text-[11px] text-muted">{r[1]}</div></div><Icon.Arrow w={15} style={{ color: "#6B7A72" }} /></div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function VirtualScreen({ nav }) {
  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={() => nav.back()} title="Watch live" right={<Pill tone="green" dot="#34D399">842 watching</Pill>} />
      <Screen>
        <div className="bg-primary-dark aspect-video grid place-items-center relative">
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 35%, rgba(232,197,126,0.18), transparent 60%)" }} />
          <button className="relative w-16 h-16 rounded-full bg-cream/15 border border-cream/25 grid place-items-center text-accent backdrop-blur"><Icon.Video w={26} /></button>
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-red-500/90 text-white font-mono text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live</span>
        </div>
        <div className="px-5 py-4">
          <h1 className="font-display text-[18px] font-semibold text-primary tracking-tight leading-snug">Opening keynote: The next decade of African tech</h1>
          <div className="flex items-center gap-2.5 mt-2.5"><Avatar initials="IA" grad="linear-gradient(135deg,#163828,#3E7E5E)" size={32} /><div><div className="text-[13px] font-medium text-ink">Iyinoluwa Aboyeji</div><div className="font-mono text-[11px] text-muted">Future Africa</div></div></div>
          <SectionLabel className="mt-5">Live chat</SectionLabel>
          <div className="grid gap-2.5">
            {[["Fatou D.", "This vision is 🔥"], ["David M.", "How do we apply for the fund?"], ["Zainab B.", "Greetings from Lagos!"]].map((c, i) => (
              <div key={i} className="flex gap-2.5 text-[13px]"><span className="font-medium text-primary shrink-0">{c[0]}</span><span className="text-ink-soft">{c[1]}</span></div>
            ))}
          </div>
        </div>
      </Screen>
      <div className="border-t border-border bg-cream px-4 py-3 flex items-center gap-2.5">
        <div className="flex-1 h-10 px-3.5 rounded-full bg-surface border border-border flex items-center text-muted text-[13.5px]">Say something…</div>
        <button className="w-10 h-10 grid place-items-center rounded-full bg-primary text-cream shrink-0"><Icon.Arrow w={17} /></button>
      </div>
    </div>
  );
}

function FeedbackScreen({ nav, params }) {
  const [rating, setRating] = React.useState(0);
  const tags = ["Insightful", "Great speaker", "Well organized", "Too short", "Want more depth"];
  const [picked, setPicked] = React.useState(new Set());
  const tog = (t) => { const n = new Set(picked); n.has(t) ? n.delete(t) : n.add(t); setPicked(n); };
  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={() => nav.back()} title="Feedback" />
      <Screen className="px-5 py-6">
        <div className="text-center">
          <div className="font-display text-[20px] font-semibold text-primary tracking-[-0.02em]">How was this session?</div>
          <div className="text-[13px] text-muted mt-1.5">Scaling fintech across borders</div>
          <div className="flex items-center justify-center gap-2 mt-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110"><Icon.Star w={34} fill={n <= rating ? "#E8C57E" : "none"} style={{ color: n <= rating ? "#E8C57E" : "#C7CCC8" }} /></button>
            ))}
          </div>
        </div>
        <div className="mt-7">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-3">What stood out?</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button key={t} onClick={() => tog(t)} className={`px-3.5 py-2 rounded-full text-[12.5px] font-medium border transition-colors ${picked.has(t) ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border"}`}>{t}</button>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-2">Anything else? (optional)</div>
          <div className="bg-surface border border-border rounded-2xl px-4 py-3 text-[13.5px] text-muted min-h-[88px]">Share your thoughts…</div>
        </div>
      </Screen>
      <div className="border-t border-border bg-cream px-5 py-3.5"><Btn variant="primary" full size="lg" onClick={() => nav.back()}>Submit feedback</Btn></div>
    </div>
  );
}

window.A_SCREENS = Object.assign(window.A_SCREENS || {}, {
  network: NetworkScreen, person: PersonScreen, messaging: MessagingScreen,
  qa: QAScreen, sponsors: SponsorsScreen, booth: BoothScreen, virtual: VirtualScreen, feedback: FeedbackScreen,
});
