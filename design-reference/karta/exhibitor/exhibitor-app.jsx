// Exhibitor / sponsor self-serve portal.

const EX = {
  company: "Paystack", tier: "Platinum", booth: "A1", event: "Africa Tech Festival 2026",
  rep: "Samuel Adeyemi", initials: "SA", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)",
};

function Btn({ children, icon, variant = "ghost", onClick, full, className = "" }) {
  const L = icon ? Icon[icon] : null;
  const styles = {
    primary: "bg-primary text-cream hover:bg-primary-dark",
    accent: "bg-accent text-primary-dark hover:bg-accent-dark font-semibold",
    ghost: "border border-border text-ink-soft hover:border-primary/40 hover:text-primary",
  };
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors whitespace-nowrap ${styles[variant]} ${full ? "w-full" : ""} ${className}`}>
      {L && <L w={15} />}{children}
    </button>
  );
}
function Pill({ children, tone = "neutral", dot }) {
  const tones = { neutral: "bg-ink/5 text-ink-soft border-border", green: "bg-emerald-50 text-emerald-700 border-emerald-200", gold: "bg-accent/20 text-accent-dark border-accent/40", forest: "bg-primary-soft text-primary border-primary/20" };
  return <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${tones[tone]}`}>{dot && <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />}{children}</span>;
}
function Panel({ title, action, children, pad = "p-5", className = "" }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl ${className}`}>
      {(title || action) && <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border/70"><div className="font-display text-[14px] font-semibold text-ink tracking-tight">{title}</div>{action}</div>}
      <div className={pad}>{children}</div>
    </div>
  );
}
function Avatar({ initials, grad, size = 36 }) {
  return <span className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0" style={{ width: size, height: size, fontSize: size * 0.36, background: grad || "linear-gradient(135deg,#2A6A50,#C9A45E)" }}>{initials}</span>;
}
function Field({ label, value, area }) {
  return <div><div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div><div className={`bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] text-ink ${area ? "min-h-[72px] leading-[1.5]" : ""}`}>{value}</div></div>;
}
function toast(m) { const e = document.createElement("div"); e.className = "ex-toast"; e.textContent = m; document.getElementById("toaster").appendChild(e); setTimeout(() => e.remove(), 2600); }

function ExhibitorApp() {
  const [tab, setTab] = React.useState("overview");
  const tabs = [["overview", "Overview"], ["leads", "Leads"], ["booth", "Booth profile"], ["resources", "Resources"], ["team", "Team"]];
  return (
    <div className="min-h-screen bg-cream">
      {/* top bar */}
      <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg" style={{ background: "linear-gradient(135deg,#1F4D3A,#2A6A50 60%,#E8C57E)" }} />
            <div className="leading-none"><div className="font-display text-[15px] font-bold text-primary">Karta</div><div className="font-mono text-[8.5px] tracking-[0.16em] uppercase text-muted mt-0.5">Exhibitor Portal</div></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-mono text-[11px] text-muted">{EX.event}</span>
            <Avatar initials={EX.initials} grad={EX.g} size={32} />
          </div>
        </div>
      </header>

      {/* hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.26), transparent 55%)" }} />
        <div className="relative mx-auto max-w-[1080px] px-5 lg:px-8 py-8">
          <div className="flex items-center gap-2 mb-3">
            <Pill tone="gold">{EX.tier} sponsor</Pill>
            <span className="font-mono text-[11px] text-cream/70">Booth {EX.booth}</span>
          </div>
          <h1 className="font-title text-[28px] font-bold text-cream">{EX.company}</h1>
          <p className="text-cream/75 text-[14px] mt-1.5">Welcome back, {EX.rep}. Here's how your presence is performing.</p>
        </div>
      </div>

      {/* tabs */}
      <div className="sticky top-14 z-10 bg-cream/90 backdrop-blur border-b border-border">
        <div className="mx-auto max-w-[1080px] px-5 lg:px-8 flex gap-1 overflow-x-auto">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`relative px-3.5 py-3 text-[13.5px] font-medium whitespace-nowrap transition-colors ${tab === id ? "text-primary" : "text-muted hover:text-ink-soft"}`}>{label}{tab === id && <span className="absolute left-2.5 right-2.5 bottom-0 h-0.5 rounded-full bg-primary" />}</button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1080px] px-5 lg:px-8 py-7">
        {tab === "overview" && <Overview onScan={() => toast("Opening lead scanner — point at an attendee badge")} />}
        {tab === "leads" && <Leads />}
        {tab === "booth" && <Booth />}
        {tab === "resources" && <Resources />}
        {tab === "team" && <Team />}
      </main>
      <div id="toaster" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none" />
    </div>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl border p-5 ${accent ? "border-accent/50" : "border-border bg-surface"}`} style={accent ? { background: "linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))" } : undefined}>
      <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-2">{label}</div>
      <div className="font-mono text-[26px] text-primary tracking-tight leading-none">{value}</div>
      {sub && <div className="font-mono text-[11px] text-emerald-600 mt-2">{sub}</div>}
    </div>
  );
}

function Overview({ onScan }) {
  return (
    <React.Fragment>
      <div className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))" }}>
        <div className="flex items-center gap-3"><span className="w-11 h-11 rounded-xl bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Scan w={20} /></span><div><div className="font-display text-[15px] font-semibold text-primary-dark">Capture leads at your booth</div><div className="text-[13px] text-ink-soft mt-0.5">Scan an attendee's badge or Karta Card to save them instantly.</div></div></div>
        <Btn variant="accent" icon="Scan" onClick={onScan}>Scan a lead</Btn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Leads captured" value="142" sub="↑ 18 today" />
        <Stat label="Booth visits" value="638" sub="↑ 9% vs day 1" />
        <Stat label="Resources opened" value="214" />
        <Stat label="Meetings booked" value="11" accent />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Lead quality">
          <div className="grid gap-3">
            {[["Hot · ready to buy", 38, "#1F4D3A"], ["Warm · interested", 64, "#2A6A50"], ["Cold · browsing", 40, "#A8C2B5"]].map((r, i) => {
              const pct = Math.round((r[1] / 142) * 100);
              return <div key={i}><div className="flex items-center justify-between mb-1.5 text-[13px]"><span className="text-ink-soft">{r[0]}</span><span className="font-mono text-muted">{r[1]} · {pct}%</span></div><div className="h-2.5 rounded-full bg-primary-soft/60 overflow-hidden"><div className="h-full rounded-full" style={{ width: pct + "%", background: r[2] }} /></div></div>;
            })}
          </div>
        </Panel>
        <Panel title="Your sessions">
          <div className="grid gap-2.5">
            {[["Sponsored keynote", "Day 1 · 11:00 · Main Stage"], ["Product demo at booth", "Day 1 · 15:00 · Booth A1"], ["Partner mixer", "Day 2 · 17:30 · Rooftop"]].map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-3.5 py-2.5"><span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Calendar w={14} /></span><div className="min-w-0"><div className="text-[13px] font-medium text-ink">{s[0]}</div><div className="font-mono text-[10.5px] text-muted mt-0.5">{s[1]}</div></div></div>
            ))}
          </div>
        </Panel>
      </div>
    </React.Fragment>
  );
}

function Leads() {
  const leads = [
    ["Amara Okeke", "Investor · TLcom Capital", "Hot", "green"], ["David Mwangi", "Founder · Twiga Foods", "Warm", "gold"],
    ["Zainab Bello", "Product Lead · Flutterwave", "Hot", "green"], ["Thabo Nkosi", "Engineer · Yoco", "Cold", "neutral"],
    ["Nadia Hassan", "Designer · Andela", "Warm", "gold"], ["Liya Tesfaye", "VP Eng · Safaricom", "Hot", "green"],
  ];
  return (
    <Panel title="Captured leads · 142" action={<Btn icon="External" onClick={() => toast("Lead list exported — check your email")}>Export CSV</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {leads.map((l, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
            <Avatar initials={l[0].split(" ").map((x) => x[0]).join("")} size={38} grad={["linear-gradient(135deg,#3E7E5E,#C9A45E)", "linear-gradient(135deg,#1F4D3A,#2A6A50)"][i % 2]} />
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink truncate">{l[0]}</div><div className="font-mono text-[11px] text-muted truncate">{l[1]}</div></div>
            <Pill tone={l[3]}>{l[2]}</Pill>
            <button onClick={() => toast("Opening " + l[0] + "'s profile")} className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors shrink-0"><Icon.Arrow w={15} /></button>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Booth() {
  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5">
      <div className="grid gap-5 content-start">
        <Panel title="Booth profile">
          <div className="grid gap-4">
            <Field label="Company name" value="Paystack" />
            <Field label="Tagline" value="Modern online and offline payments for Africa" />
            <Field label="About" area value="Paystack helps businesses in Africa get paid by anyone, anywhere in the world. Over 200,000 businesses rely on our payments infrastructure." />
            <div className="grid grid-cols-2 gap-4"><Field label="Website" value="paystack.com" /><Field label="Booth" value="A1 · Hall A" /></div>
          </div>
          <div className="mt-5"><Btn variant="primary" icon="Check" onClick={() => toast("Booth profile saved")}>Save profile</Btn></div>
        </Panel>
      </div>
      <div className="grid gap-5 content-start">
        <Panel title="Logo">
          <div className="aspect-[3/2] rounded-xl border border-dashed border-primary/40 bg-cream/50 grid place-items-center"><div className="text-center text-primary"><Icon.Upload w={20} /><div className="text-[11.5px] mt-1.5 font-medium">Upload logo</div></div></div>
        </Panel>
        <Panel title="Visibility">
          <div className="flex items-center justify-between"><div><div className="text-[13px] text-ink font-medium">Featured booth</div><div className="text-[11.5px] text-muted mt-0.5">Platinum perk</div></div><Pill tone="green" dot="#2D7A4F">On</Pill></div>
        </Panel>
      </div>
    </div>
  );
}

function Resources() {
  const res = [["Product one-pager", "PDF · 2.1 MB", "84 opens"], ["API documentation", "Link", "62 opens"], ["Case study · Bolt", "PDF · 4.4 MB", "38 opens"], ["We're hiring — 12 roles", "Link", "30 opens"]];
  return (
    <Panel title="Booth resources" action={<Btn icon="Plus" onClick={() => toast("Add a resource for attendees")}>Add resource</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {res.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5"><span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.External w={15} /></span><div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{r[0]}</div><div className="font-mono text-[11px] text-muted mt-0.5">{r[1]}</div></div><span className="font-mono text-[11px] text-muted">{r[2]}</span></div>
        ))}
      </div>
    </Panel>
  );
}

function Team() {
  const team = [["Samuel Adeyemi", "Booth lead", "linear-gradient(135deg,#1F4D3A,#2A6A50)"], ["Chioma Eze", "Sales", "linear-gradient(135deg,#3E7E5E,#C9A45E)"], ["Tunde Bello", "Engineer", "linear-gradient(135deg,#163828,#3E7E5E)"]];
  return (
    <Panel title="Booth team" action={<Btn icon="Plus" onClick={() => toast("Invite a teammate to the booth")}>Invite</Btn>} pad="p-0">
      <div className="divide-y divide-border/60">
        {team.map((m, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-3.5"><Avatar initials={m[0].split(" ").map((x) => x[0]).join("")} grad={m[2]} size={38} /><div className="min-w-0 flex-1"><div className="text-[13.5px] font-medium text-ink">{m[0]}</div><div className="font-mono text-[11px] text-muted mt-0.5">{m[1]}</div></div>{i === 0 && <Pill tone="forest">You</Pill>}</div>
        ))}
      </div>
    </Panel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ExhibitorApp />);
