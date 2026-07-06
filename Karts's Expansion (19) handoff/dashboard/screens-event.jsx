// Event Overview, Create Event wizard, and generic sub-feature stub.

function OverviewStat({ value, label, sub }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[19px] text-primary tracking-tight">{value}</span>
      <span className="text-[13px] text-ink-soft">{label}{sub && <span className="text-muted"> {sub}</span>}</span>
    </div>
  );
}

function ActionItems({ event, onNav }) {
  const items = [];
  if (event.attention?.includes("tickets")) items.push({ t: "No tickets set up.", cta: "Add tickets", id: "tickets", screen: "stub" });
  if (event.attention?.includes("agenda")) items.push({ t: "Your agenda has no sessions yet.", cta: "Build agenda", id: "agenda", screen: "agenda" });
  if (event.attention?.includes("speakers")) items.push({ t: "No speakers added.", cta: "Add speakers", id: "speakers", screen: "stub" });
  const publish = event.attention?.includes("publish");

  if (!items.length && !publish) {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl px-4 py-3 mb-6">
        <span className="text-emerald-600"><Icon.Check w={16} /></span>
        <span className="text-[13.5px] text-emerald-800">Your event is live and healthy — registrations and cards are flowing.</span>
      </div>
    );
  }

  return (
    <div className="mb-6 grid gap-2.5">
      {publish && (
        <div className="flex items-center justify-between gap-3 bg-accent/15 border border-accent/40 rounded-xl px-4 py-3">
          <span className="text-[13.5px] text-primary-dark font-medium">This event is still a draft — publish it to open registration.</span>
          <button onClick={() => window.openModal && window.openModal({ type: "confirm", title: "Publish “" + event.name + "”?", confirmLabel: "Publish event", confirmIcon: "Globe", body: "This makes the event page public and opens registration. Attendees will be able to find and register for it immediately.", onConfirm: () => window.toast && window.toast("Event published — registration is open") })} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent text-primary-dark text-[12.5px] font-semibold hover:bg-accent-dark transition-colors shrink-0">
            Publish event <Icon.Arrow w={13} />
          </button>
        </div>
      )}
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-3">
          <span className="text-[13.5px] text-ink-soft">{it.t}</span>
          <button onClick={() => onNav(it)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-primary/25 text-primary text-[12.5px] font-medium hover:bg-primary-soft/70 transition-colors shrink-0">
            {it.cta} <Icon.Arrow w={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function OverviewCard({ card, plan, onNav, onUpgrade }) {
  const IconC = Icon[card.icon] || Icon.Grid;
  const locked = !planMeets(plan, card.minPlan);
  return (
    <button
      onClick={() => (locked ? onUpgrade(card) : onNav(card))}
      className={`group text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
        card.gold
          ? "border-accent/60 hover:border-accent"
          : "bg-surface border-border hover:border-primary/40"
      }`}
      style={card.gold ? { background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" } : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl grid place-items-center ${card.gold ? "bg-accent/25 text-accent-dark" : "bg-primary-soft text-primary"}`}>
          <IconC w={20} />
        </span>
        {locked ? (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase bg-accent/20 text-accent-dark px-1.5 py-1 rounded font-semibold">
            <Icon.Lock w={10} /> {PLAN_LABEL[card.minPlan]}
          </span>
        ) : card.status ? (
          <span className={`font-mono text-[10px] tracking-[0.08em] ${card.gold ? "text-accent-dark" : "text-muted"}`}>{card.status}</span>
        ) : null}
      </div>
      <div className={`font-display text-[15px] font-semibold tracking-tight ${card.gold ? "text-accent-dark" : "text-ink"} flex items-center gap-1.5`}>
        {card.label}
        {card.gold && <Icon.Sparkle w={11} style={{ color: "#C9A45E" }} />}
      </div>
      <p className="text-[13px] text-ink-soft mt-1 leading-[1.5]">{card.desc}</p>
    </button>
  );
}

function EventOverview({ event, plan, onNav, onUpgrade }) {
  const st = STATUS_STYLE[event.status];
  const s = event.stats;
  return (
    <div>
      {/* Cover header */}
      <div className="relative h-[190px]" style={{ background: event.grad }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 120% at 90% 0%, rgba(232,197,126,0.3), transparent 55%)" }} />
        <svg aria-hidden viewBox="0 0 1200 190" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.1 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M -40 ${40 + i * 36} Q 320 ${-10 + i * 36} 640 ${70 + i * 36} T 1280 ${44 + i * 36}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-5">
          <span className={`self-start inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${st.cls} bg-cream/95 mb-3`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.live ? "animate-pulse" : ""}`} style={{ background: st.dot }} />
            {st.label}
          </span>
          <h1 className="font-title text-[28px] sm:text-[32px] font-bold text-cream tracking-[-0.03em] leading-tight">{event.name}</h1>
          <div className="flex items-center gap-2.5 mt-2 font-mono text-[12.5px] text-cream/80">
            <Icon.Calendar w={13} /> {event.date}
            <span className="text-cream/40">·</span>
            <Icon.Pin w={13} /> {event.venue}
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-7">
        {/* Quick stats strip */}
        <div className="bg-surface border border-border rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <OverviewStat value={s.registered} label="registered" />
          <span className="text-border hidden sm:inline">·</span>
          <OverviewStat value={s.revenue} label="revenue" />
          <span className="text-border hidden sm:inline">·</span>
          <OverviewStat value={s.checkinN} label="checked in" sub={`(${s.checkin}%)`} />
          <span className="text-border hidden sm:inline">·</span>
          <OverviewStat value={s.cards} label="cards shared" />
        </div>

        <ActionItems event={event} onNav={onNav} />

        {/* Navigation cards */}
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">Manage this event</div>
        <div className="grid sm:grid-cols-2 gap-4">
          {EVENT_CARDS.map((c) => (
            <OverviewCard key={c.id} card={c} plan={plan} onNav={onNav} onUpgrade={onUpgrade} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Create Event wizard ──────────────────────────────────────────────
function Field({ label, value, placeholder, w }) {
  return (
    <div className={w || ""}>
      <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>
      <div className={`bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] ${value ? "text-ink" : "text-muted"}`}>
        {value || placeholder}
      </div>
    </div>
  );
}

function CreateEventFlow({ onCancel, onCreated }) {
  const [step, setStep] = React.useState(1);
  const [online, setOnline] = React.useState(false);
  const [cover, setCover] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", start: "", end: "", place: "" });
  const [err, setErr] = React.useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const EvField = ({ label, k, placeholder }) => (
    <label className="block">
      <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>
      <input value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder}
        className={`w-full bg-surface border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none transition-colors placeholder:text-muted/70 ${err && k === "name" && !form.name.trim() ? "border-red-400" : "border-border focus:border-primary/50"}`} />
    </label>
  );

  const choices = [
    { id: "full", icon: "Grid", t: "Full event", d: "Agenda, tickets, speakers, networking — the whole platform." },
    { id: "simple", icon: "Ticket", t: "Simple registration", d: "Just tickets and a registration form." },
    { id: "later", icon: "Clock", t: "Set up later", d: "Create the shell now, add the details when you're ready." },
  ];

  const goStep2 = () => { if (!form.name.trim()) { setErr(true); window.toast && window.toast("Give your event a name first", { tone: "danger", icon: "Bell" }); return; } setStep(2); };

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <button onClick={onCancel} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors mb-6">
        <Icon.ChevLeft w={14} /> Back to events
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-7">
        {[1, 2].map((n) => (
          <React.Fragment key={n}>
            <div className={`flex items-center gap-2 ${step >= n ? "text-primary" : "text-muted"}`}>
              <span className={`w-6 h-6 rounded-full grid place-items-center font-mono text-[11px] ${step >= n ? "bg-primary text-cream" : "bg-primary-soft text-muted"}`}>{n}</span>
              <span className="text-[13px] font-medium">{n === 1 ? "Event basics" : "Quick setup"}</span>
            </div>
            {n === 1 && <span className="flex-1 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 ? (
        <div>
          <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] mb-1">Let's set up your event</h1>
          <p className="text-ink-soft text-[14px] mb-6">The essentials — you can change all of this later.</p>
          <div className="grid gap-4">
            <EvField label="Event name" k="name" placeholder="e.g. Africa Fintech Forum 2026" />
            <div className="grid grid-cols-2 gap-4">
              <EvField label="Starts" k="start" placeholder="14 May 2026 · 09:00" />
              <EvField label="Ends" k="end" placeholder="14 May 2026 · 18:00" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted">{online ? "Online event" : "Venue"}</div>
                <button onClick={() => setOnline(!online)} className="font-mono text-[10px] tracking-[0.1em] uppercase text-primary hover:underline">
                  {online ? "Switch to in-person" : "Online event"}
                </button>
              </div>
              <input value={online ? "Zoom · link generated on publish" : form.place} onChange={(e) => set("place", e.target.value)} readOnly={online} placeholder={online ? "" : "Venue name & address"}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-primary/50 transition-colors placeholder:text-muted/70" />
            </div>
            <button onClick={() => { setCover(!cover); window.toast && window.toast(cover ? "Cover removed" : "Cover photo added"); }} className={`rounded-lg px-3 py-4 flex items-center gap-2.5 border border-dashed transition-colors ${cover ? "border-primary/50 bg-primary-soft/40 text-primary" : "border-primary/40 text-primary hover:bg-primary-soft/30"}`}>
              <Icon.Layout w={17} />
              <span className="text-[13px] font-medium">{cover ? "Cover photo added ✓" : "Upload cover photo"}</span>
              {!cover && <span className="text-[12px] text-muted">— optional, add later</span>}
            </button>
          </div>
          <div className="mt-7 flex justify-end">
            <button onClick={goStep2} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-primary text-cream font-medium hover:bg-primary-dark transition-colors">
              Continue <Icon.Arrow w={15} />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] mb-1">How do you want to start?</h1>
          <p className="text-ink-soft text-[14px] mb-6">Pick a starting point. You can always add more later.</p>
          <div className="grid gap-3">
            {choices.map((c) => {
              const IconC = Icon[c.icon];
              return (
                <button key={c.id} onClick={() => { window.toast && window.toast("Event created — " + (form.name || "your event")); onCreated(); }} className="group flex items-center gap-4 text-left bg-surface border border-border rounded-2xl p-5 hover:border-primary/50 hover:-translate-y-0.5 transition-all">
                  <span className="w-11 h-11 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><IconC w={20} /></span>
                  <div className="flex-1">
                    <div className="font-display text-[15px] font-semibold text-ink tracking-tight">{c.t}</div>
                    <p className="text-[13px] text-ink-soft mt-0.5 leading-[1.5]">{c.d}</p>
                  </div>
                  <Icon.Arrow w={16} style={{ color: "#1F4D3A" }} />
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(1)} className="mt-5 text-[13px] text-muted hover:text-primary transition-colors">← Back</button>
        </div>
      )}
    </div>
  );
}

// ── Generic sub-feature stub ─────────────────────────────────────────
function SubStub({ item, event }) {
  const IconC = Icon[item.icon] || Icon.Grid;
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-surface border border-border rounded-2xl p-10 text-center">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-primary-soft text-primary mb-5">
          <IconC w={26} />
        </div>
        <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em]">{item.label}</h1>
        <p className="text-ink-soft text-[14px] mt-2 max-w-[440px] mx-auto leading-[1.6]">
          This section is already built and wired in the platform. The reorg connects it to the navigation — here it's a placeholder so you can confirm every link lands.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.06em] text-muted bg-cream border border-border rounded-lg px-3 py-2">
          <Icon.External w={13} />
          /dashboard/events/{event ? event.slug : "[id]"}/{item.id}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EventOverview, CreateEventFlow, SubStub });
