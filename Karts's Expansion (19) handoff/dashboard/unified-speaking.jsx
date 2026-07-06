// Unified dashboard — Speaking (speaker role).
// Same content as the standalone speaker portal, restyled onto the
// dashboard's own primitives (PageShell/Panel/StatCards/Table) instead of
// its own topbar+tabs shell.

const SPEAKING_SESSIONS = [
  { t: "Opening keynote: The next decade of African tech", day: "Day 1 · 12 Mar", time: "09:30–10:15", room: "Auditorium A", track: "Main Stage", status: "Confirmed", materials: true },
  { t: "Workshop: Ship payments in a weekend", day: "Day 1 · 12 Mar", time: "10:30–12:00", room: "Lab 1", track: "Builders", status: "Needs slides", materials: false },
];

function SpeakingSessionRow({ s }) {
  return (
    <Panel pad="p-4" className="flex items-start gap-4">
      <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Calendar w={18} /></span>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[14.5px] font-semibold text-ink tracking-tight leading-snug">{s.t}</div>
        <div className="flex items-center gap-2.5 mt-1.5 font-mono text-[11px] text-muted flex-wrap">
          <span>{s.day}</span><span className="text-border">·</span><span>{s.time}</span><span className="text-border">·</span><span><Icon.Pin w={10} className="inline" /> {s.room}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Pill tone="neutral">{s.track}</Pill>
          <Pill tone={s.status === "Confirmed" ? "green" : "amber"}>{s.status}</Pill>
        </div>
      </div>
      <Btn variant="ghost" icon="Plus">{s.materials ? "Slides ✓" : "Upload slides"}</Btn>
    </Panel>
  );
}

function UnifiedSpeaking() {
  const [tab, setTab] = React.useState("overview");
  return (
    <PageShell title="Speaking" subtitle="Africa Tech Festival 2026 · your sessions, profile and speaker card."
      actions={<Pill tone="gold"><Icon.Sparkle w={11} /> You're speaking</Pill>}>
      <SegTabs tabs={[{ id: "overview", label: "Overview" }, { id: "profile", label: "Profile" }, { id: "sessions", label: "Sessions" }, { id: "card", label: "Speaker card" }, { id: "resources", label: "Resources" }]} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          <div>
            <SectionLabel>Your checklist</SectionLabel>
            <div className="grid gap-2.5 mb-7">
              {[["Complete your profile", true], ["Confirm your 2 sessions", true], ["Upload slides for your workshop", false], ["Add a headshot", true]].map(([t, done], i) => (
                <Panel key={i} pad="px-4 py-3" className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${done ? "bg-success/15 text-success" : "border-2 border-border"}`}>{done && <Icon.Check w={13} />}</span>
                  <span className={`flex-1 text-[13.5px] ${done ? "text-muted line-through" : "text-ink font-medium"}`}>{t}</span>
                  {!done && <button className="text-[12.5px] text-primary font-medium">Do it →</button>}
                </Panel>
              ))}
            </div>
            <SectionLabel>Your sessions</SectionLabel>
            <div className="grid gap-2.5">{SPEAKING_SESSIONS.map((s, i) => <SpeakingSessionRow key={i} s={s} />)}</div>
          </div>
          <div className="grid gap-5 content-start">
            <Panel title="Key dates">
              <div className="grid gap-3">
                {[["Slides due", "05 Mar"], ["Tech check", "11 Mar · 16:00"], ["Your keynote", "12 Mar · 09:30"]].map((d, i) => (
                  <div key={i} className="flex items-center justify-between"><span className="text-[13px] text-ink-soft">{d[0]}</span><span className="font-mono text-[12.5px] text-primary">{d[1]}</span></div>
                ))}
              </div>
            </Panel>
            <Panel title="Your speaker card">
              <div className="rounded-2xl overflow-hidden relative" style={{ height: 150, background: "linear-gradient(155deg,#0D1F17,#1F4D3A 70%,#163828)" }}>
                <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 60% at 50% 30%, rgba(232,197,126,0.22), transparent 65%)" }} />
                <div className="relative h-full flex flex-col items-center justify-center text-cream">
                  <Avatar initials="KM" size={40} />
                  <div className="font-display text-[13.5px] font-semibold mt-2">Kwame Mensah</div>
                  <div className="font-mono text-[10px] text-cream/70 mt-0.5 tracking-[0.14em] uppercase">Speaker · 12 Mar</div>
                </div>
              </div>
              <Btn variant="primary" icon="Share" className="w-full justify-center mt-4">Share my card</Btn>
            </Panel>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <Avatar initials="KM" size={72} />
              <Btn variant="ghost" icon="Plus">Change headshot</Btn>
            </div>
            <div className="grid sm:grid-cols-2 gap-4"><Field label="Full name" value="Kwame Mensah" /><Field label="Pronouns" value="he/him" /></div>
            <div className="grid sm:grid-cols-2 gap-4"><Field label="Role" value="Product Engineer" /><Field label="Company" value="Paystack" /></div>
            <Field label="Bio" value="Kwame leads product engineering at Paystack, shipping payment infrastructure used by thousands of African businesses." />
            <div className="flex justify-end"><Btn variant="primary" icon="Check">Save profile</Btn></div>
          </div>
          <Panel title="Directory preview" className="self-start text-center" pad="p-5">
            <Avatar initials="KM" size={64} />
            <div className="font-display text-[15px] font-semibold text-ink mt-2.5">Kwame Mensah</div>
            <div className="text-[12px] text-muted">Product Engineer · Paystack</div>
            <div className="mt-2 inline-flex"><Pill tone="gold"><Icon.Sparkle w={10} /> Keynote</Pill></div>
          </Panel>
        </div>
      )}

      {tab === "sessions" && (
        <div>
          <div className="grid gap-2.5">{SPEAKING_SESSIONS.map((s, i) => <SpeakingSessionRow key={i} s={s} />)}</div>
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary-soft/40 px-5 py-4 flex items-start gap-3">
            <span className="text-primary mt-0.5"><Icon.Bell w={16} /></span>
            <div className="text-[13px] text-ink-soft leading-relaxed"><span className="font-medium text-ink">Slides are due 05 Mar.</span> Upload a PDF or link — it loads on the session screen and shares with attendees after.</div>
          </div>
        </div>
      )}

      {tab === "card" && (
        <div className="max-w-[420px] mx-auto text-center">
          <div className="rounded-2xl overflow-hidden relative mx-auto" style={{ width: 250, height: 350, background: "linear-gradient(155deg,#0D1F17,#1F4D3A 70%,#163828)", boxShadow: "0 20px 44px -16px rgba(13,31,23,0.4)" }}>
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 45% at 50% 38%, rgba(232,197,126,0.2), transparent 65%)" }} />
            <div className="relative h-full flex flex-col items-center justify-center text-cream gap-2">
              <Avatar initials="KM" size={64} />
              <div className="font-display text-[16px] font-semibold">Kwame Mensah</div>
              <div className="font-mono text-[10.5px] text-cream/70 tracking-[0.14em] uppercase">Speaker · 12 Mar · Lagos</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2.5 mt-6">
            <Btn variant="primary" icon="Share">Share card</Btn>
            <Btn variant="ghost">Download</Btn>
          </div>
        </div>
      )}

      {tab === "resources" && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[["Speaker brief & code of conduct", "PDF · 1.2 MB", "Layout"], ["AV & stage guidelines", "PDF · 800 KB", "Video"], ["Slide template (16:9)", "Keynote / PPTX", "Grid"], ["Travel & accommodation", "Link", "Pin"]].map((r, i) => {
            const IconC = Icon[r[2]] || Icon.Layout;
            return (
              <Panel key={i} pad="p-4" className="flex items-center gap-3 cursor-pointer hover:border-primary/40 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><IconC w={17} /></span>
                <div className="flex-1"><div className="text-[13.5px] font-medium text-ink">{r[0]}</div><div className="font-mono text-[11px] text-muted mt-0.5">{r[1]}</div></div>
                <Icon.External w={15} className="text-muted" />
              </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

Object.assign(window, { UnifiedSpeaking });
