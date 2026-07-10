// Event-level · Call for Speakers (CFP + abstract review) + Interactive Floor Plan.

// ════════════════════════════════════════════════════════════════════
// CALL FOR SPEAKERS — submission intake + reviewer scoring pipeline
// ════════════════════════════════════════════════════════════════════
const CFP_SUBS = [
  { id: "S-118", title: "Building offline-first payments for rural Africa", who: "Amara Okeke", org: "TLcom", track: "Fintech", fmt: "Talk · 30m", score: 4.6, reviews: 3, status: "shortlist", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)", abstract: "How we built a payments layer that works on 2G and syncs when connectivity returns — lessons from 4 markets." },
  { id: "S-117", title: "Scaling a 12-person eng team to 120", who: "David Mwangi", org: "Twiga", track: "Leadership", fmt: "Talk · 30m", score: 4.2, reviews: 3, status: "review", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", abstract: "The org-design decisions, hiring bar and rituals that kept velocity high through 10× growth." },
  { id: "S-116", title: "Workshop: Ship an AI agent in a weekend", who: "Kwame Mensah", org: "Paystack", track: "AI", fmt: "Workshop · 90m", score: 4.8, reviews: 4, status: "shortlist", g: "linear-gradient(135deg,#C9A45E,#1F4D3A)", abstract: "Hands-on: go from blank repo to a working, tool-using agent deployed to prod by Sunday." },
  { id: "S-115", title: "The regulation map for African fintech", who: "Zainab Bello", org: "Flutterwave", track: "Fintech", fmt: "Panel", score: 3.6, reviews: 2, status: "review", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)", abstract: "A country-by-country look at licensing, and how to sequence market entry." },
  { id: "S-114", title: "Designing for the next billion users", who: "Nadia Hassan", org: "Andela", track: "Design", fmt: "Talk · 30m", score: 4.4, reviews: 3, status: "accepted", g: "linear-gradient(135deg,#C9A45E,#2A6A50)", abstract: "Patterns for low-literacy, low-bandwidth, multi-language interfaces that actually convert." },
  { id: "S-113", title: "Crypto is not the answer (usually)", who: "Thabo Nkosi", org: "Yoco", track: "Fintech", fmt: "Talk · 30m", score: 2.4, reviews: 3, status: "declined", g: "linear-gradient(135deg,#163828,#3E7E5E)", abstract: "A sober look at where blockchain helps African commerce and where it's a distraction." },
];
const CFP_STATUS = { review: ["In review", "amber"], shortlist: ["Shortlisted", "forest"], accepted: ["Accepted", "green"], declined: ["Declined", "neutral"] };

function CallForSpeakersPage({ event }) {
  const loaded = useLoaded(500);
  const [tab, setTab] = React.useState("review");
  const [subs, setSubs] = React.useState(CFP_SUBS);
  const [open, setOpen] = React.useState(null);

  const counts = { review: 0, shortlist: 0, accepted: 0, declined: 0 };
  subs.forEach((s) => { counts[s.status]++; });
  const list = subs.filter((s) => s.status === tab);
  const setStatus = (id, status, msg) => { setSubs((a) => a.map((s) => s.id === id ? { ...s, status } : s)); setOpen(null); window.toast && window.toast(msg); };

  return (
    <PageShell title="Call for Speakers" subtitle={`Submissions & review · ${event.name}`}
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Public submission link copied to clipboard")}>Copy form link</Btn><Btn variant="primary" icon="Gear" onClick={() => window.openModal && window.openModal({ type: "form", title: "Call-for-speakers settings", subtitle: "Configure your public submission form", fields: [{ key: "deadline", label: "Submission deadline", placeholder: "28 Feb 2026" }, { key: "tracks", label: "Tracks", placeholder: "Fintech, AI, Design, Leadership" }, { cols: 2, items: [{ key: "reviewers", label: "Reviewers", placeholder: "5", mono: true }, { key: "perRev", label: "Reviews per talk", placeholder: "3", mono: true }] }, { key: "blind", toggle: true, on: true, label: "Blind review", desc: "Hide submitter identity from reviewers" }], submitLabel: "Save settings", submitIcon: "Check", toast: "CFP settings saved" })}>Settings</Btn></>}>

      <StatCards cols={4} items={[
        { label: "Submissions", value: String(subs.length), icon: "TypeT", delta: "open till 28 Feb", deltaUp: true },
        { label: "Avg. score", value: "4.0", icon: "Star", accent: true },
        { label: "Reviewers", value: "5", icon: "Users" },
        { label: "Accepted", value: String(counts.accepted), icon: "Check" },
      ]} />

      <Tabs active={tab} onChange={setTab} tabs={[
        { id: "review", label: `In review · ${counts.review}` },
        { id: "shortlist", label: `Shortlist · ${counts.shortlist}` },
        { id: "accepted", label: `Accepted · ${counts.accepted}` },
        { id: "declined", label: `Declined · ${counts.declined}` },
      ]} />

      {!loaded ? (
        <div className="grid gap-2.5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" rounded="rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon="TypeT" title="Nothing here yet" body="Submissions you move into this stage will appear here." />
      ) : (
        <div className="grid gap-2.5">
          {list.map((s) => (
            <div key={s.id} className="bg-surface border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex flex-col items-center justify-center w-14 shrink-0 rounded-xl bg-primary-soft/60 border border-primary/15 py-2">
                  <span className="font-mono text-[17px] text-primary leading-none">{s.score}</span>
                  <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-muted mt-1">score</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] text-muted">{s.id}</span>
                    <Pill tone="forest">{s.track}</Pill>
                    <Pill tone="neutral">{s.fmt}</Pill>
                  </div>
                  <button onClick={() => setOpen(open === s.id ? null : s.id)} className="block text-left font-display text-[15px] font-semibold text-ink tracking-tight mt-1.5 hover:text-primary transition-colors">{s.title}</button>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar initials={s.who.split(" ").map((x) => x[0]).join("")} grad={s.g} size={22} />
                    <span className="font-mono text-[11.5px] text-muted">{s.who} · {s.org} · {s.reviews} reviews</span>
                  </div>
                  {open === s.id && (
                    <div className="mt-3 pt-3 border-t border-border/70">
                      <p className="text-[13.5px] text-ink-soft leading-[1.6]">{s.abstract}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted mr-1">Your score</span>
                        {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => window.toast && window.toast("Scored " + n + "/5")} className="text-accent-dark hover:scale-110 transition-transform"><Icon.Star w={18} fill={n <= Math.round(s.score) ? "#E8C57E" : "none"} /></button>)}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {s.status !== "accepted" && <Btn size="sm" variant="primary" icon="Check" onClick={() => setStatus(s.id, "accepted", "Accepted — speaker notified & added to line-up")}>Accept</Btn>}
                  {s.status === "review" && <Btn size="sm" variant="ghost" icon="Star" onClick={() => setStatus(s.id, "shortlist", "Moved to shortlist")}>Shortlist</Btn>}
                  {s.status !== "declined" && <button onClick={() => setStatus(s.id, "declined", "Declined — polite rejection sent")} className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 text-[12.5px] font-medium hover:bg-red-50 transition-colors">Decline</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// FLOOR PLAN — interactive booth map + booking
// ════════════════════════════════════════════════════════════════════
const BOOTHS = [
  { id: "A1", x: 6, y: 12, w: 20, h: 16, tier: "platinum", co: "Paystack" },
  { id: "A2", x: 30, y: 12, w: 20, h: 16, tier: "platinum", co: "MTN" },
  { id: "B1", x: 6, y: 34, w: 14, h: 13, tier: "gold", co: "Flutterwave" },
  { id: "B2", x: 24, y: 34, w: 14, h: 13, tier: "gold", co: "AWS" },
  { id: "B3", x: 42, y: 34, w: 14, h: 13, tier: "gold", co: null },
  { id: "C1", x: 6, y: 53, w: 11, h: 11, tier: "silver", co: "Wave" },
  { id: "C2", x: 21, y: 53, w: 11, h: 11, tier: "silver", co: "Kuda" },
  { id: "C3", x: 36, y: 53, w: 11, h: 11, tier: "silver", co: null },
  { id: "C4", x: 51, y: 53, w: 11, h: 11, tier: "silver", co: null },
  { id: "D1", x: 70, y: 12, w: 24, h: 22, tier: "platinum", co: null },
  { id: "D2", x: 70, y: 40, w: 24, h: 11, tier: "gold", co: "Andela" },
];
const TIER_COLOR = { platinum: "#C9A45E", gold: "#E8C57E", silver: "#A8C2B5" };
const TIER_PRICE = { platinum: "$12,000", gold: "$6,500", silver: "$3,000" };

function FloorPlanPage({ event }) {
  const [sel, setSel] = React.useState("B3");
  const [booths, setBooths] = React.useState(BOOTHS);
  const booth = booths.find((b) => b.id === sel);
  const booked = booths.filter((b) => b.co).length;

  const assign = (b) => window.openModal && window.openModal({
    type: "form", title: "Assign booth " + b.id, subtitle: TIER_PRICE[b.tier] + " · " + b.tier + " tier",
    fields: [{ key: "co", label: "Exhibitor / sponsor", placeholder: "Company name", required: true }, { key: "contact", label: "Contact email", placeholder: "booth@company.com", mono: true, type: "email" }],
    submitLabel: "Assign booth", submitIcon: "Check",
    onConfirm: (v) => { setBooths((a) => a.map((x) => x.id === b.id ? { ...x, co: v.co || "Reserved" } : x)); window.toast && window.toast("Booth " + b.id + " assigned"); },
  });
  const release = (b) => window.openModal && window.openModal({
    type: "confirm", danger: true, title: "Release booth " + b.id + "?", confirmLabel: "Release booth", confirmIcon: "Trash",
    body: "This frees booth " + b.id + " (" + b.co + ") and makes it available again.",
    onConfirm: () => { setBooths((a) => a.map((x) => x.id === b.id ? { ...x, co: null } : x)); window.toast && window.toast("Booth " + b.id + " released"); },
  });

  return (
    <PageShell title="Floor Plan" subtitle={`Exhibition hall · ${booked}/${booths.length} booths booked`} max="1180px"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Exporting floor plan as PDF…")}>Export</Btn><Btn variant="primary" icon="Plus" onClick={() => window.toast && window.toast("Add a booth — drag to place it on the map")}>Add booth</Btn></>}>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        {/* map */}
        <Panel title="Hall A · interactive map" action={<span className="font-mono text-[10.5px] text-muted">tap a booth</span>}>
          <div className="relative rounded-xl overflow-hidden border border-border" style={{ background: "#EFE9DC", backgroundImage: "radial-gradient(circle, rgba(15,31,24,0.06) 1px, transparent 1px)", backgroundSize: "20px 20px", aspectRatio: "16 / 10" }}>
            {/* entrance + stage labels */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-muted">▼ Entrance</div>
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-primary/60">Main stage</div>
            {booths.map((b) => {
              const isSel = sel === b.id;
              const open = !b.co;
              return (
                <button key={b.id} onClick={() => setSel(b.id)}
                  className="absolute rounded-lg transition-all"
                  style={{
                    left: b.x + "%", top: b.y + "%", width: b.w + "%", height: b.h + "%",
                    background: open ? "rgba(255,255,255,0.7)" : TIER_COLOR[b.tier],
                    border: isSel ? "2px solid #1F4D3A" : open ? "1.5px dashed #B9B19C" : "1.5px solid rgba(15,31,24,0.12)",
                    boxShadow: isSel ? "0 6px 16px -6px rgba(15,31,24,0.4)" : "none",
                  }}>
                  <span className="absolute inset-0 grid place-items-center px-1">
                    <span className="text-center leading-tight">
                      <span className={`block font-mono text-[9px] ${open ? "text-muted" : "text-primary-dark/80"}`}>{b.id}</span>
                      {b.co && <span className="block font-display text-[9px] font-bold text-primary-dark truncate">{b.co}</span>}
                      {open && <span className="block font-mono text-[7.5px] tracking-[0.08em] uppercase text-muted/80">open</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          {/* legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {Object.entries(TIER_COLOR).map(([t, c]) => (
              <span key={t} className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-ink-soft capitalize"><span className="w-3 h-3 rounded-sm" style={{ background: c }} />{t} · {TIER_PRICE[t]}</span>
            ))}
            <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted"><span className="w-3 h-3 rounded-sm border border-dashed border-muted bg-white" />open</span>
          </div>
        </Panel>

        {/* detail */}
        <div className="grid gap-4 content-start">
          <Panel title={"Booth " + (booth ? booth.id : "")}>
            {booth && (
              <React.Fragment>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3.5 h-3.5 rounded-sm" style={{ background: TIER_COLOR[booth.tier] }} />
                  <span className="font-display text-[14px] font-semibold text-ink capitalize">{booth.tier}</span>
                  <span className="ml-auto font-mono text-[13px] text-primary">{TIER_PRICE[booth.tier]}</span>
                </div>
                {booth.co ? (
                  <React.Fragment>
                    <div className="rounded-xl bg-cream/60 border border-border p-3 mb-3">
                      <div className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mb-1">Assigned to</div>
                      <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg bg-surface border border-border grid place-items-center font-display text-[11px] font-bold text-primary">{booth.co.slice(0, 2)}</span><span className="text-[13.5px] font-medium text-ink">{booth.co}</span></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Btn size="sm" variant="ghost" icon="Eye" onClick={() => window.toast && window.toast("Opening " + booth.co + "'s booth profile")}>View booth</Btn>
                      <button onClick={() => release(booth)} className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-700 text-[12.5px] font-medium hover:bg-red-50 transition-colors">Release</button>
                    </div>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary-soft/30 p-3 mb-3 text-center">
                      <div className="text-[13px] text-ink-soft">This booth is <span className="font-medium text-primary">available</span></div>
                      <div className="font-mono text-[11px] text-muted mt-0.5">{booth.w > 18 ? "Large" : booth.w > 12 ? "Medium" : "Standard"} · ~{Math.round(booth.w * booth.h / 4)}m²</div>
                    </div>
                    <Btn variant="primary" full icon="Plus" onClick={() => assign(booth)}>Assign booth</Btn>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </Panel>
          <Panel title="Hall summary">
            <OnsiteRow label="Total booths">{booths.length}</OnsiteRow>
            <OnsiteRow label="Booked">{booked}</OnsiteRow>
            <OnsiteRow label="Available">{booths.length - booked}</OnsiteRow>
            <OnsiteRow label="Booth revenue" last><span className="font-mono text-primary">$71k</span></OnsiteRow>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function OnsiteRow({ label, children, last }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-border/60"}`}>
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">{label}</span>
      <span className="text-[13px] text-ink font-medium">{children}</span>
    </div>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "call-for-speakers": CallForSpeakersPage,
  "floor-plan": FloorPlanPage,
});
