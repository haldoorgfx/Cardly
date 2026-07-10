// Dashboard Home — populated + empty states, and the event card.

function StatItem({ value, label, last }) {
  return (
    <div className="flex items-center gap-5">
      <div>
        <span className="font-mono text-[20px] text-primary tracking-tight">{value}</span>
        <span className="ml-2 text-[13px] text-ink-soft">{label}</span>
      </div>
      {!last && <span className="text-border hidden sm:inline">·</span>}
    </div>
  );
}

function EventCard({ event, onOpen }) {
  const st = STATUS_STYLE[event.status];
  const s = event.stats;
  return (
    <div className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors flex flex-col">
      {/* Cover */}
      <div className="relative h-[88px]" style={{ background: event.grad }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 90% at 92% 8%, rgba(232,197,126,0.28), transparent 60%)" }} />
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-[9.5px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border ${st.cls} bg-cream/95`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.live ? "animate-pulse" : ""}`} style={{ background: st.dot }} />
          {st.label}
        </span>
      </div>
      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-display text-[15px] font-semibold text-ink tracking-tight leading-snug line-clamp-1">{event.name}</div>
        <div className="flex items-center gap-2 mt-1 font-mono text-[12px] text-muted">
          <Icon.Calendar w={12} /> {event.date}
          <span className="text-border">·</span>
          {event.venue}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] text-ink-soft">
          <span><span className="text-primary">{s.registered}</span> registered</span>
          {event.status !== "draft" && <><span className="text-border">·</span><span><span className="text-primary">{s.revenue}</span></span></>}
          {s.checkin > 0 && <><span className="text-border">·</span><span><span className="text-primary">{s.checkin}%</span> check-in</span></>}
        </div>
        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-2">
          <button onClick={() => onOpen(event)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-cream text-[12.5px] font-medium hover:bg-primary-dark transition-colors">
            Manage <Icon.Arrow w={13} />
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-ink-soft text-[12.5px] hover:border-primary/40 hover:text-primary transition-colors">
            View public
          </button>
          {event.status === "live" && (
            <button className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-primary text-[12.5px] hover:bg-primary-soft/70 transition-colors" title="Check-in scanner">
              <Icon.Scan w={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AttentionStrip({ events, onOpen }) {
  const need = events.filter((e) => e.attention && e.attention.length);
  if (!need.length) return null;
  const LABELS = { agenda: "agenda empty", tickets: "no tickets", publish: "not published", speakers: "no speakers" };
  return (
    <div className="mb-8">
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-amber-700/90 mb-3 flex items-center gap-2">
        <Icon.Clock w={13} /> Needs attention
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {need.map((e) => (
          <button
            key={e.id}
            onClick={() => onOpen(e)}
            className="flex items-center gap-3 text-left bg-amber-50/60 border border-amber-200/70 rounded-xl px-4 py-3 hover:border-amber-300 transition-colors"
          >
            <span className="w-9 h-9 rounded-lg shrink-0" style={{ background: e.grad }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-ink truncate">{e.name}</div>
              <div className="text-[12px] text-amber-700 mt-0.5">
                {e.attention.map((a) => LABELS[a] || a).join(" · ")}
              </div>
            </div>
            <Icon.Arrow w={15} style={{ color: "#B45309" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardHome({ events, hasEvents, onOpenEvent, onCreate }) {
  if (!hasEvents) {
    const steps = [
      { n: "1", icon: "Calendar", t: "Set up your event", d: "Name, date, venue, cover photo." },
      { n: "2", icon: "Ticket", t: "Add tickets and registration", d: "Free or paid, with a custom form." },
      { n: "3", icon: "Grid", t: "Build your agenda", d: "Sessions, speakers, schedule." },
    ];
    return (
      <div className="max-w-[840px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-primary-soft text-primary mb-6">
          <Icon.Calendar w={26} />
        </div>
        <h1 className="font-display text-[30px] font-normal text-primary tracking-[-0.02em]">Create your first event</h1>
        <p className="mt-3 text-ink-soft text-[15px] leading-[1.6] max-w-[480px] mx-auto">
          Set up your event page, add tickets, build your agenda, and get your personalized Karta Card ready for every attendee.
        </p>
        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
          {steps.map((s) => {
            const IconC = Icon[s.icon];
            return (
              <div key={s.n} className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center"><IconC w={18} /></span>
                  <span className="font-mono text-[11px] text-muted">0{s.n}</span>
                </div>
                <div className="font-display text-[15px] font-semibold text-ink tracking-tight">{s.t}</div>
                <p className="text-[13px] text-ink-soft mt-1.5 leading-[1.5]">{s.d}</p>
              </div>
            );
          })}
        </div>
        <button onClick={onCreate} className="mt-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-cream font-medium hover:bg-primary-dark transition-colors">
          Create your first event <Icon.Arrow w={16} />
        </button>
      </div>
    );
  }

  const totalReg = events.reduce((a, e) => a + e.stats.registered, 0);
  const totalCards = events.reduce((a, e) => a + e.stats.cards, 0);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] font-semibold text-primary tracking-[-0.02em]">Events</h1>
          <p className="text-ink-soft text-[14px] mt-0.5">Everything you're organizing, in one place.</p>
        </div>
        <button onClick={onCreate} className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-cream text-[14px] font-medium hover:bg-primary-dark transition-colors">
          <Icon.Plus w={16} /> Create event
        </button>
      </div>

      {/* Stats strip */}
      <div className="bg-surface border border-border rounded-2xl px-6 py-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <StatItem value={events.length} label="events" />
        <StatItem value={totalReg.toLocaleString()} label="registrations" />
        <StatItem value="$4,200" label="revenue" />
        <StatItem value={totalCards.toLocaleString()} label="cards shared" last />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2.5 mb-9">
        <button onClick={onCreate} className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-cream text-[13.5px] font-medium hover:bg-primary-dark transition-colors">
          <Icon.Plus w={15} /> Create event
        </button>
        <button className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-ink-soft text-[13.5px] hover:border-primary/40 hover:text-primary transition-colors">
          <Icon.Users w={15} /> View all registrations
        </button>
        <button className="whitespace-nowrap inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-ink-soft text-[13.5px] hover:border-primary/40 hover:text-primary transition-colors">
          <Icon.Scan w={15} /> Open check-in scanner
        </button>
      </div>

      <AttentionStrip events={events} onOpen={onOpenEvent} />

      {/* Events grid */}
      <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">Your events</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((e) => (
          <EventCard key={e.id} event={e} onOpen={onOpenEvent} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardHome, EventCard });
