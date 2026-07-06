// Entity detail (drill-in) pages: Attendee, Speaker, Session, Sponsor, Admin User.
// Each takes { data, event, onBack, onModal, onOpenDetail }.

function DetailHeader({ onBack, parent, children }) {
  return (
    <div className="mb-6">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-primary transition-colors mb-4">
        <Icon.ChevLeft w={15} /> {parent}
      </button>
      {children}
    </div>
  );
}

function InfoRow({ label, children, last }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${last ? "" : "border-b border-border/60"}`}>
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">{label}</span>
      <span className="text-[13.5px] text-ink text-right">{children}</span>
    </div>
  );
}

function Timeline({ items }) {
  return (
    <div className="relative pl-6">
      <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-border" />
      <div className="grid gap-4">
        {items.map((it, i) => (
          <div key={i} className="relative">
            <span className="absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ring-surface" style={{ background: it.color || CHART.sage }} />
            <div className="text-[13px] text-ink leading-snug">{it.text}</div>
            <div className="font-mono text-[11px] text-muted mt-0.5">{it.when}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Attendee ─────────────────────────────────────────────────────────
function AttendeeDetail({ data, event, onBack }) {
  const a = data || {};
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: "1100px" }}>
      <DetailHeader onBack={onBack} parent="Registrations">
        <div className="flex items-start gap-4">
          <Avatar initials={a.initials || "AA"} grad={a.g} size={64} />
          <div className="flex-1 min-w-0">
            <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] leading-tight">{a.name || "Aisha Ahmed"}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Pill tone={a.ticket === "VIP" ? "gold" : a.ticket === "Speaker" ? "forest" : "neutral"}>{a.ticket || "General"}</Pill>
              {a.st === "checked" ? <Pill tone="green" dot="#2D7A4F">Checked in</Pill> : <Pill tone="neutral" dot="#A8C2B5">Registered</Pill>}
            </div>
            <div className="font-mono text-[12.5px] text-muted mt-2">{a.e || "aisha@example.com"}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Btn icon="Chat">Message</Btn>
            <Btn variant="primary" icon="Scan">Check in</Btn>
          </div>
        </div>
      </DetailHeader>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-5">
          <Panel title="Activity">
            <Timeline items={[
              { text: "Generated their Karta Card", when: "12 Mar · 09:42", color: CHART.goldDark },
              { text: "Checked in at main entrance", when: "12 Mar · 09:38", color: CHART.sage },
              { text: "Registered · General admission", when: "28 Feb · 14:10", color: CHART.forest },
              { text: "Visited event page from Instagram", when: "28 Feb · 14:06", color: CHART.mist },
            ]} />
          </Panel>
          <Panel title="Sessions registered">
            <div className="grid gap-2.5">
              {["Opening keynote", "Scaling fintech across borders", "Founder networking"].map((s, i) => (
                <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-4 py-2.5">
                  <span className="text-primary"><Icon.Calendar w={15} /></span>
                  <span className="text-[13.5px] text-ink flex-1">{s}</span>
                  <span className="font-mono text-[11px] text-muted">Day 1</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-5 content-start">
          <Panel title="Registration">
            <InfoRow label="Order ID">#ATF-2041</InfoRow>
            <InfoRow label="Ticket">{a.ticket || "General"} · ₦15,000</InfoRow>
            <InfoRow label="Paid">Paystack ····42</InfoRow>
            <InfoRow label="Organization">Andela</InfoRow>
            <InfoRow label="Registered">{a.when || "28 Feb 2026"}</InfoRow>
            <InfoRow label="Karta Card" last>{a.card ? "Generated · shared" : "Not yet"}</InfoRow>
          </Panel>
          {a.card !== false && (
            <Panel title="Their Karta Card">
              <div className="grid place-items-center py-2"><MiniEventCard event={event} w={160} /></div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Speaker ──────────────────────────────────────────────────────────
function SpeakerDetail({ data, event, onBack }) {
  const s = data || {};
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: "1100px" }}>
      <DetailHeader onBack={onBack} parent="Speakers">
        <div className="flex items-start gap-4">
          <Avatar initials={s.initials || "KM"} grad={s.g} size={64} />
          <div className="flex-1 min-w-0">
            <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] leading-tight">{s.name || "Kwame Mensah"}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {s.featured && <Pill tone="gold"><Icon.Sparkle w={10} /> Featured</Pill>}
              <Pill tone="forest">{s.org || "Paystack"}</Pill>
            </div>
            <div className="text-[13.5px] text-ink-soft mt-2">{s.role || "Product Engineer"}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Btn icon="External" onClick={() => window.toast && window.toast("Speaker portal link copied")}>Speaker portal</Btn>
            <Btn variant="primary" icon="Gear" onClick={() => window.openModal && window.openModal({ type: "add-speaker" })}>Edit</Btn>
          </div>
        </div>
      </DetailHeader>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-5">
          <Panel title="Bio">
            <p className="text-[14px] text-ink-soft leading-[1.65]">
              {s.name || "Kwame Mensah"} leads product engineering at {s.org || "Paystack"}, where they've shipped payment infrastructure used by thousands of African businesses. A frequent speaker on fintech, distributed systems, and building for emerging markets.
            </p>
          </Panel>
          <Panel title="Assigned sessions" action={<Btn icon="Plus" onClick={() => window.toast && window.toast("Assign a session")}>Assign</Btn>}>
            <div className="grid gap-2.5">
              {[["Opening keynote", "Day 1 · 09:30", "Main Stage"], ["Workshop: Ship payments in a weekend", "Day 1 · 10:30", "Lab 1"]].map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-4 py-3">
                  <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Calendar w={15} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-ink truncate">{r[0]}</div>
                    <div className="font-mono text-[11px] text-muted mt-0.5">{r[1]} · {r[2]}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-5 content-start">
          <Panel title="Details">
            <InfoRow label="Role">{s.role || "Product Engineer"}</InfoRow>
            <InfoRow label="Company">{s.org || "Paystack"}</InfoRow>
            <InfoRow label="Sessions">{s.sessions || 2}</InfoRow>
            <InfoRow label="Portal" last><Pill tone="green" dot="#2D7A4F">Confirmed</Pill></InfoRow>
          </Panel>
          <Panel title="Links">
            <div className="grid gap-2">
              {[["Twitter / X", "Twitter"], ["LinkedIn", "Linkedin"], ["Website", "External"]].map((l, i) => {
                const IconC = Icon[l[1]] || Icon.External;
                return (
                  <a key={i} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border text-ink-soft hover:border-primary/40 hover:text-primary transition-colors text-[13px]">
                    <IconC w={15} /> {l[0]}
                  </a>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Session ──────────────────────────────────────────────────────────
function SessionDetail({ data, event, onBack }) {
  const s = data || {};
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: "1100px" }}>
      <DetailHeader onBack={onBack} parent="Sessions">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <Pill tone="forest">{s.track || "Main Stage"}</Pill>
              <Pill tone={s.status === "Draft" ? "amber" : "green"}>{s.status || "Confirmed"}</Pill>
            </div>
            <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] leading-tight">{s.title || "Scaling fintech across borders"}</h1>
            <div className="flex items-center gap-3 mt-2 font-mono text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5"><Icon.Clock w={13} /> {s.time || "10:30"} · {s.len || "60m"}</span>
              <span className="inline-flex items-center gap-1.5"><Icon.Pin w={13} /> {s.room || "Auditorium A"}</span>
            </div>
          </div>
          <Btn variant="primary" icon="Gear">Edit session</Btn>
        </div>
      </DetailHeader>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-5">
          <Panel title="Description">
            <p className="text-[14px] text-ink-soft leading-[1.65]">
              A panel of operators who've scaled payments and lending across multiple African markets discuss FX, regulation, and the playbook for going cross-border without breaking what works at home.
            </p>
          </Panel>
          <Panel title="Speakers">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[["Shola Akinlade", "Paystack", "linear-gradient(135deg,#1F4D3A,#2A6A50)"], ["Fatou Diop", "Wave", "linear-gradient(135deg,#3E7E5E,#C9A45E)"], ["Tunde Kehinde", "Lidya", "linear-gradient(135deg,#163828,#3E7E5E)"]].map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-3.5 py-2.5">
                  <Avatar initials={r[0].split(" ").map((x) => x[0]).join("")} grad={r[2]} size={32} />
                  <div className="min-w-0"><div className="text-[13px] font-medium text-ink truncate">{r[0]}</div><div className="font-mono text-[10.5px] text-muted">{r[1]}</div></div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Live Q&A">
            <div className="grid gap-2.5">
              {[["How do you handle FX volatility?", 47], ["What regulatory hurdles surprised you?", 31]].map((q, i) => (
                <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-4 py-2.5">
                  <span className="font-mono text-[13px] text-primary w-7">{q[1]}</span>
                  <span className="text-[13.5px] text-ink flex-1">{q[0]}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="grid gap-5 content-start">
          <Panel title="Attendance">
            <div className="text-center py-1">
              <div className="font-mono text-[30px] text-primary tracking-tight leading-none">182</div>
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted mt-1.5">registered · cap 250</div>
              <div className="mt-3"><ProgressBar pct={73} /></div>
            </div>
          </Panel>
          <Panel title="Details">
            <InfoRow label="Track">{s.track || "Main Stage"}</InfoRow>
            <InfoRow label="Room">{s.room || "Auditorium A"}</InfoRow>
            <InfoRow label="Time">{s.time || "10:30"}</InfoRow>
            <InfoRow label="Duration">{s.len || "60m"}</InfoRow>
            <InfoRow label="Recording" last><Pill tone="forest">Enabled</Pill></InfoRow>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Sponsor ──────────────────────────────────────────────────────────
function SponsorDetail({ data, event, onBack }) {
  const s = data || {};
  const leads = [
    ["Nia Williams", "Andela", "Hot", "red"],
    ["Yusuf Bello", "Kuda", "Warm", "amber"],
    ["Liya Tesfaye", "Safaricom", "Warm", "amber"],
    ["Adebayo Dada", "Flutterwave", "Cold", "neutral"],
  ];
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: "1100px" }}>
      <DetailHeader onBack={onBack} parent="Sponsors">
        <div className="flex items-start gap-4">
          <span className="w-16 h-16 rounded-2xl bg-cream border border-border grid place-items-center shrink-0">
            <span className="font-display text-[18px] font-bold text-primary/70 tracking-tight">{(s.n || "Paystack").slice(0, 2)}</span>
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] leading-tight">{s.n || "Paystack"}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Pill tone="gold">{s.tier || "Platinum"}</Pill>
              <Pill tone="neutral">Booth A1 · Main hall</Pill>
            </div>
          </div>
          <Btn variant="primary" icon="External">Export leads</Btn>
        </div>
      </DetailHeader>

      <StatCards cols={4} items={[
        { label: "Leads", value: s.leads || 142, icon: "Users" },
        { label: "Booth visits", value: "486", icon: "Pin" },
        { label: "Package", value: "$25k", icon: "Dollar", accent: true },
        { label: "Sessions", value: "2", icon: "Calendar" },
      ]} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <Panel title="Leads captured" pad="p-0">
          <Table head={["Name", "Company", "Interest", ""]}>
            {leads.map((l, i) => (
              <Row key={i}>
                <Cell className="text-[13.5px] font-medium text-ink">{l[0]}</Cell>
                <Cell className="text-[13px] text-ink-soft">{l[1]}</Cell>
                <Cell><Pill tone={l[3]}>{l[2]}</Pill></Cell>
                <Cell><button className="text-muted hover:text-primary transition-colors"><Icon.External w={15} /></button></Cell>
              </Row>
            ))}
          </Table>
        </Panel>
        <div className="grid gap-5 content-start">
          <Panel title="Package includes">
            <div className="grid gap-2">
              {["Platinum booth (6m²)", "Logo on all event pages", "2 speaking slots", "Lead retrieval scanner", "Attendee list access", "Logo on Karta Cards"].map((f, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[13px] text-ink-soft"><span className="text-primary mt-0.5"><Icon.Check w={14} /></span>{f}</div>
              ))}
            </div>
          </Panel>
          <Panel title="Contact">
            <InfoRow label="Rep">Samuel Adeyemi</InfoRow>
            <InfoRow label="Email">sam@paystack.com</InfoRow>
            <InfoRow label="Status" last><Pill tone="green" dot="#2D7A4F">Confirmed</Pill></InfoRow>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ── Admin user ───────────────────────────────────────────────────────
function UserDetail({ data, onBack }) {
  const u = data || {};
  const planTone = { free: "neutral", pro: "forest", studio: "gold" };
  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" style={{ maxWidth: "1100px" }}>
      <DetailHeader onBack={onBack} parent="Users">
        <div className="flex items-start gap-4">
          <Avatar initials={u.n ? u.n.split(" ").map((x) => x[0]).join("") : "SA"} grad={u.g} size={64} />
          <div className="flex-1 min-w-0">
            <h1 className="font-title text-[24px] font-semibold text-primary tracking-[-0.025em] leading-tight">{u.n || "Samuel Adeyemi"}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Pill tone={planTone[u.plan || "studio"]} className="capitalize">{u.plan || "studio"}</Pill>
              <Pill tone={u.status === "Suspended" ? "red" : "green"} dot={u.status === "Suspended" ? "#B8423C" : "#2D7A4F"}>{u.status || "Active"}</Pill>
            </div>
            <div className="font-mono text-[12.5px] text-muted mt-2">{u.e || "sam@paystack.com"} · {u.org || "Paystack"}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Btn icon="External">Impersonate</Btn>
            <button className="px-3.5 py-2 rounded-lg border border-red-300 text-red-700 text-[13px] font-medium hover:bg-red-50 transition-colors whitespace-nowrap">{u.status === "Suspended" ? "Reinstate" : "Suspend"}</button>
          </div>
        </div>
      </DetailHeader>

      <StatCards cols={4} items={[
        { label: "Events", value: u.events || 11, icon: "Calendar" },
        { label: "Registrations", value: "8,420", icon: "Users" },
        { label: "Lifetime value", value: "$1,240", icon: "Dollar", accent: true },
        { label: "Member since", value: u.joined || "Nov 2025", icon: "Clock" },
      ]} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <Panel title="Their events" pad="p-0">
          <Table head={["Event", "Registrations", "Status"]}>
            {[["Paystack Build Summit", "1,840", "live"], ["Developer Day Lagos", "420", "ended"], ["Fintech Mixer Q1", "180", "ended"]].map((e, i) => (
              <Row key={i}>
                <Cell className="text-[13.5px] font-medium text-ink">{e[0]}</Cell>
                <Cell className="font-mono text-[13px] text-ink">{e[1]}</Cell>
                <Cell><Pill tone={e[2] === "live" ? "green" : "neutral"} dot={STATUS_STYLE[e[2]].dot}>{STATUS_STYLE[e[2]].label}</Pill></Cell>
              </Row>
            ))}
          </Table>
        </Panel>
        <div className="grid gap-5 content-start">
          <Panel title="Account">
            <InfoRow label="Plan"><span className="capitalize">{u.plan || "studio"}</span> · $49/mo</InfoRow>
            <InfoRow label="Org">{u.org || "Paystack"}</InfoRow>
            <InfoRow label="Seats">4 / 3 used</InfoRow>
            <InfoRow label="Billing" last><Pill tone="green">Current</Pill></InfoRow>
          </Panel>
          <Panel title="Recent activity">
            <Timeline items={[
              { text: "Published an event", when: "2 min ago", color: CHART.sage },
              { text: "Created an API key", when: "18 min ago", color: CHART.forest },
              { text: "Upgraded to Studio", when: "Nov 2025", color: CHART.goldDark },
            ]} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.DETAILS = Object.assign(window.DETAILS || {}, {
  attendee: AttendeeDetail,
  speaker: SpeakerDetail,
  session: SessionDetail,
  sponsor: SponsorDetail,
  user: UserDetail,
});
