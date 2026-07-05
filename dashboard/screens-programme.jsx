// Event-level · Programme: Speakers, Sessions

function SpeakersPage({ event, onOpenDetail, onModal }) {
  const speakers = [
    { n: "Shola Akinlade", role: "CEO & Co-founder", org: "Paystack", sessions: 1, featured: true, g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", tag: "Keynote" },
    { n: "Iyinoluwa Aboyeji", role: "General Partner", org: "Future Africa", sessions: 2, featured: true, g: "linear-gradient(135deg,#163828,#3E7E5E)", tag: "Keynote" },
    { n: "Odunayo Eweniyi", role: "Co-founder", org: "PiggyVest", sessions: 1, g: "linear-gradient(135deg,#2A6A50,#C9A45E)", tag: "Panel" },
    { n: "Kwame Mensah", role: "Product Engineer", org: "Paystack", sessions: 1, g: "linear-gradient(135deg,#C9A45E,#1F4D3A)", tag: "Workshop" },
    { n: "Fatou Diop", role: "Head of Growth", org: "Wave", sessions: 2, g: "linear-gradient(135deg,#3E7E5E,#C9A45E)", tag: "Fireside" },
    { n: "Liya Tesfaye", role: "VP Engineering", org: "Safaricom", sessions: 1, g: "linear-gradient(135deg,#1F4D3A,#163828)", tag: "Panel" },
    { n: "Tunde Kehinde", role: "Co-founder", org: "Lidya", sessions: 1, g: "linear-gradient(135deg,#2A6A50,#1F4D3A)", tag: "Workshop" },
    { n: "Nia Williams", role: "Director", org: "Andela", sessions: 1, g: "linear-gradient(135deg,#163828,#2A6A50)", tag: "Panel" },
  ];
  return (
    <PageShell title="Speakers" subtitle="8 speakers · 12 sessions assigned"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Speaker portal link copied to clipboard")}>Speaker portal</Btn><Btn variant="primary" icon="Plus" onClick={() => onModal && onModal({ type: "add-speaker" })}>Add speaker</Btn></>}>
      <Toolbar search="Search speakers…">
        <FilterBtn>All tracks</FilterBtn>
        <FilterBtn>Featured</FilterBtn>
      </Toolbar>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {speakers.map((s, i) => (
          <div key={i} onClick={() => onOpenDetail && onOpenDetail("speaker", { ...s, initials: s.n.split(" ").map((x) => x[0]).join("") })} className="group bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <Avatar initials={s.n.split(" ").map((x) => x[0]).join("")} grad={s.g} size={52} />
              {s.featured && <Pill tone="gold"><Icon.Sparkle w={10} /> Featured</Pill>}
            </div>
            <div className="font-display text-[15px] font-semibold text-ink tracking-tight">{s.n}</div>
            <div className="text-[12.5px] text-ink-soft mt-0.5">{s.role}</div>
            <div className="font-mono text-[11px] text-muted mt-0.5">{s.org}</div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/70">
              <Pill tone="forest">{s.tag}</Pill>
              <span className="font-mono text-[11px] text-muted">{s.sessions} session{s.sessions > 1 ? "s" : ""}</span>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function SessionsPage({ event, onOpenDetail, onModal }) {
  const [day, setDay] = React.useState("d1");
  const sessions = [
    { time: "09:30", len: "45m", title: "Opening keynote: The next decade of African tech", track: "Main Stage", room: "Auditorium A", speakers: "Iyinoluwa Aboyeji", tone: "forest", status: "Confirmed" },
    { time: "10:30", len: "60m", title: "Scaling fintech across borders", track: "Main Stage", room: "Auditorium A", speakers: "Panel · 4 speakers", tone: "forest", status: "Confirmed" },
    { time: "10:30", len: "90m", title: "Workshop: Ship payments in a weekend", track: "Builders", room: "Lab 1", speakers: "Kwame Mensah", tone: "sage", status: "Confirmed" },
    { time: "12:00", len: "45m", title: "LP panel: Funding the next wave", track: "Investor Lounge", room: "Suite 3", speakers: "Panel · 3 speakers", tone: "gold", status: "Draft" },
    { time: "14:00", len: "45m", title: "Fireside: Building Paystack", track: "Main Stage", room: "Auditorium A", speakers: "Shola Akinlade", tone: "forest", status: "Confirmed" },
    { time: "15:00", len: "120m", title: "Demo Day: 12 startups pitch", track: "Builders", room: "Lab 1", speakers: "Hosted", tone: "sage", status: "Confirmed" },
  ];
  const TONE = { forest: "#1F4D3A", sage: "#2A6A50", gold: "#C9A45E" };
  return (
    <PageShell title="Sessions" subtitle="12 sessions across 3 days · 3 tracks"
      actions={<><Btn icon="Grid" onClick={() => window.toast && window.toast("Switched to grid view")}>Grid view</Btn><Btn variant="primary" icon="Plus" onClick={() => onModal && onModal({ type: "add-session" })}>Add session</Btn></>}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <SegTabs active={day} onChange={setDay} tabs={[{ id: "d1", label: "Day 1 · 12 Mar" }, { id: "d2", label: "Day 2 · 13 Mar" }, { id: "d3", label: "Day 3 · 14 Mar" }]} />
        <div className="flex items-center gap-2"><FilterBtn>All tracks</FilterBtn><FilterBtn>All rooms</FilterBtn></div>
      </div>
      <div className="grid gap-2.5">
        {sessions.map((s, i) => (
          <div key={i} onClick={() => onOpenDetail && onOpenDetail("session", s)} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-5 hover:border-primary/40 transition-colors cursor-pointer">
            <div className="text-center shrink-0 w-[56px]">
              <div className="font-mono text-[15px] text-primary tracking-tight">{s.time}</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">{s.len}</div>
            </div>
            <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: TONE[s.tone] }} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[14.5px] font-semibold text-ink tracking-tight leading-snug">{s.title}</div>
              <div className="flex items-center gap-2.5 mt-1.5 font-mono text-[11px] text-muted flex-wrap">
                <span className="inline-flex items-center gap-1"><Icon.User w={11} /> {s.speakers}</span>
                <span className="text-border">·</span>
                <span className="inline-flex items-center gap-1"><Icon.Pin w={11} /> {s.room}</span>
              </div>
            </div>
            <Pill tone="forest" className="hidden sm:inline-flex">{s.track}</Pill>
            <Pill tone={s.status === "Confirmed" ? "green" : "amber"}>{s.status}</Pill>
            <button className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors shrink-0"><Icon.Gear w={15} /></button>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  speakers: SpeakersPage,
  sessions: SessionsPage,
});
