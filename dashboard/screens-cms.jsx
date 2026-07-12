// Super-admin · Content (CMS): no-code control of the whole platform.
// Pages & content, plans & pricing, appearance/theme, email templates,
// announcements, navigation & feature flags. All controls are live & stateful.

// ── shared small bits ────────────────────────────────────────────────
function CmsField({ label, value, onChange, mono, area, placeholder }) {
  return (
    <label className="block">
      {label && <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{label}</div>}
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-primary/50 transition-colors resize-none leading-[1.5]" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none focus:border-primary/50 transition-colors ${mono ? "font-mono text-[12.5px]" : ""}`} />
      )}
    </label>
  );
}
function CmsBadge({ children }) {
  return <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] uppercase text-accent-dark bg-accent/15 border border-accent/30 px-2 py-0.5 rounded-full"><Icon.Sparkle w={9} /> {children}</span>;
}

// ════════════════════════════════════════════════════════════════════
// 1 · PAGES & CONTENT — edit marketing/site copy live
// ════════════════════════════════════════════════════════════════════
function CmsPagesPage() {
  const [page, setPage] = React.useState("landing");
  const [hero, setHero] = React.useState({ eyebrow: "The all-in-one event management platform", title: "Run unforgettable events, end to end.", sub: "Registration, tickets, agenda, check-in, networking and analytics in one place — plus the only platform where every attendee leaves with a personalized card to share.", cta: "Start free", cta2: "Book a demo" });
  const [secs, setSecs] = React.useState([
    { name: "Hero", on: true, locked: true }, { name: "Logo cloud", on: true }, { name: "Product tour", on: true },
    { name: "Metrics band", on: true }, { name: "Karta Card difference", on: true }, { name: "Use cases", on: true },
    { name: "Pricing", on: true }, { name: "Testimonials", on: false }, { name: "FAQ", on: true }, { name: "Final CTA", on: true },
  ]);
  const toggleSec = (i) => setSecs((a) => a.map((s, j) => j === i ? { ...s, on: !s.on } : s));
  const pages = [["landing", "Landing"], ["pricing", "Pricing"], ["about", "About"], ["help", "Help center"], ["directory", "Event directory"]];

  return (
    <PageShell title="Pages & Content" subtitle="Edit your public site — no code" max="1180px"
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Opening live preview…")}>Preview</Btn><Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Published to eventera.so — live now")}>Publish</Btn></>}>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {pages.map(([id, label]) => (
          <button key={id} onClick={() => setPage(id)} className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium border transition-colors ${page === id ? "bg-primary text-cream border-primary" : "bg-surface text-ink-soft border-border hover:border-primary/40"}`}>{label}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        {/* sections list */}
        <Panel title="Sections" action={<Btn icon="Plus" onClick={() => window.toast && window.toast("Add a section")}>Add</Btn>} pad="p-3">
          <div className="grid gap-1">
            {secs.map((s, i) => (
              <div key={i} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-cream/70 transition-colors">
                <span className="text-muted/40 cursor-grab"><Icon.Grid w={13} /></span>
                <span className={`flex-1 text-[13px] ${s.on ? "text-ink" : "text-muted"}`}>{s.name}</span>
                {s.locked ? <span className="text-muted/40"><Icon.Lock w={12} /></span> : <Toggle on={s.on} onClick={() => toggleSec(i)} />}
              </div>
            ))}
          </div>
        </Panel>

        {/* editor + live preview */}
        <div className="grid gap-5">
          <Panel title="Hero section" action={<CmsBadge>live edit</CmsBadge>}>
            <div className="grid gap-3.5">
              <CmsField label="Eyebrow" value={hero.eyebrow} onChange={(v) => setHero({ ...hero, eyebrow: v })} />
              <CmsField label="Headline" value={hero.title} onChange={(v) => setHero({ ...hero, title: v })} />
              <CmsField label="Subtext" area value={hero.sub} onChange={(v) => setHero({ ...hero, sub: v })} />
              <div className="grid grid-cols-2 gap-3">
                <CmsField label="Primary button" value={hero.cta} onChange={(v) => setHero({ ...hero, cta: v })} />
                <CmsField label="Secondary button" value={hero.cta2} onChange={(v) => setHero({ ...hero, cta2: v })} />
              </div>
            </div>
          </Panel>
          {/* live preview */}
          <div>
            <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted mb-2">Live preview</div>
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="relative px-6 py-10 text-center" style={{ background: "radial-gradient(70% 90% at 50% 0%, rgba(31,77,58,0.10), transparent 60%), #FAF6EE" }}>
                <span className="inline-flex items-center gap-1.5 bg-surface border border-primary/15 rounded-full px-3 py-1 text-[10.5px] font-medium text-ink-soft mb-4"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> {hero.eyebrow}</span>
                <div className="font-display text-[26px] font-bold text-primary tracking-[-0.03em] leading-[1.05] max-w-[440px] mx-auto">{hero.title}</div>
                <p className="text-[13px] text-ink-soft leading-[1.55] max-w-[420px] mx-auto mt-3">{hero.sub}</p>
                <div className="flex items-center justify-center gap-2.5 mt-5">
                  <span className="px-4 py-2 rounded-lg bg-primary text-cream text-[12.5px] font-medium">{hero.cta}</span>
                  <span className="px-4 py-2 rounded-lg bg-surface border border-border text-primary text-[12.5px] font-medium">{hero.cta2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2 · PLANS & PRICING — edit tiers, prices, limits, features
// ════════════════════════════════════════════════════════════════════
function CmsPricingPage() {
  const [plans, setPlans] = React.useState([
    { id: "free", name: "Free", price: 0, events: "1 event", regs: "50 / event", popular: false, on: true },
    { id: "pro", name: "Pro", price: 19, events: "Unlimited", regs: "500 / mo", popular: true, on: true },
    { id: "studio", name: "Studio", price: 49, events: "Unlimited", regs: "Unlimited", popular: false, on: true },
  ]);
  const set = (i, k, v) => setPlans((a) => a.map((p, j) => j === i ? { ...p, [k]: v } : p));
  const [cycle, setCycle] = React.useState("monthly");

  return (
    <PageShell title="Plans & Pricing" subtitle="Change prices, limits and tiers — applies platform-wide" max="1100px"
      actions={<><SegTabs active={cycle} onChange={setCycle} tabs={[{ id: "monthly", label: "Monthly" }, { id: "yearly", label: "Yearly" }]} /><Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Pricing published — live on the marketing site")}>Publish pricing</Btn></>}>
      <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
        <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Sparkle w={16} /></span>
        <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">No-code pricing.</span> Edits here update the marketing pricing page, the upgrade modals, and plan-gating across the platform.</div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {plans.map((p, i) => (
          <div key={p.id} className={`rounded-2xl border bg-surface overflow-hidden ${p.popular ? "border-accent" : "border-border"}`}>
            {p.popular && <div className="bg-accent text-primary-dark text-center font-mono text-[9px] tracking-[0.16em] uppercase py-1 font-semibold">Most popular</div>}
            <div className="p-5 grid gap-3.5">
              <div className="flex items-center justify-between">
                <CmsField value={p.name} onChange={(v) => set(i, "name", v)} />
                <Toggle on={p.on} onClick={() => set(i, "on", !p.on)} />
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-mono text-[15px] text-muted mb-1">$</span>
                <input value={p.price} onChange={(e) => set(i, "price", e.target.value.replace(/[^0-9]/g, ""))} className="w-20 bg-surface border border-border rounded-lg px-2.5 py-1.5 font-mono text-[22px] text-primary outline-none focus:border-primary/50" />
                <span className="text-[13px] text-muted mb-1.5">/ {cycle === "monthly" ? "mo" : "yr"}</span>
              </div>
              <CmsField label="Events" value={p.events} onChange={(v) => set(i, "events", v)} />
              <CmsField label="Registrations" value={p.regs} onChange={(v) => set(i, "regs", v)} />
              <button onClick={() => { setPlans((a) => a.map((x, j) => ({ ...x, popular: j === i }))); window.toast && window.toast(p.name + " marked most-popular"); }} className="text-[12px] text-primary font-medium hover:underline text-left">{p.popular ? "★ Featured plan" : "Make featured"}</button>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3 · APPEARANCE — theme, brand color, fonts, logo (no-code)
// ════════════════════════════════════════════════════════════════════
function CmsAppearancePage() {
  const PRESETS = [
    { id: "forest", label: "Forest (default)", primary: "#1F4D3A", accent: "#E8C57E" },
    { id: "midnight", label: "Midnight", primary: "#1E2A4A", accent: "#E8C57E" },
    { id: "wine", label: "Wine", primary: "#5A2036", accent: "#E8B45E" },
    { id: "clay", label: "Clay", primary: "#5A3320", accent: "#E8C57E" },
    { id: "ocean", label: "Ocean", primary: "#13384C", accent: "#6FC3C9" },
  ];
  const [theme, setTheme] = React.useState(PRESETS[0]);
  const [radius, setRadius] = React.useState(16);
  const [font, setFont] = React.useState("DM Sans");

  return (
    <PageShell title="Appearance" subtitle="Theme the whole platform without touching CSS" max="1100px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Theme applied across the platform")}>Apply theme</Btn>}>
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="grid gap-5 content-start">
          <Panel title="Brand color">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setTheme(p)} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${theme.id === p.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}>
                  <span className="flex -space-x-1.5"><span className="w-6 h-6 rounded-full border-2 border-surface" style={{ background: p.primary }} /><span className="w-6 h-6 rounded-full border-2 border-surface" style={{ background: p.accent }} /></span>
                  <span className="text-[13px] font-medium text-ink">{p.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">Primary</div><div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"><span className="w-5 h-5 rounded" style={{ background: theme.primary }} /><span className="font-mono text-[12px] text-ink">{theme.primary}</span></div></div>
              <div><div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">Accent</div><div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-2.5 py-2"><span className="w-5 h-5 rounded" style={{ background: theme.accent }} /><span className="font-mono text-[12px] text-ink">{theme.accent}</span></div></div>
            </div>
          </Panel>
          <Panel title="Typography & shape">
            <div className="grid gap-4">
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-2">Display font</div>
                <SegTabs active={font} onChange={setFont} tabs={[{ id: "DM Sans", label: "DM Sans" }, { id: "Inter", label: "Inter" }, { id: "Sora", label: "Sora" }]} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2"><span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted">Corner radius</span><span className="font-mono text-[11px] text-ink">{radius}px</span></div>
                <input type="range" min="0" max="24" value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${theme.primary} ${(radius / 24) * 100}%, #E8EFEB ${(radius / 24) * 100}%)` }} />
              </div>
            </div>
          </Panel>
          <Panel title="Logo">
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/2] rounded-xl border border-dashed border-primary/40 bg-cream/50 grid place-items-center text-primary"><div className="text-center"><Icon.Upload w={18} /><div className="text-[11px] mt-1.5 font-medium">Logo</div></div></div>
              <div className="aspect-[3/2] rounded-xl border border-dashed border-border grid place-items-center text-muted"><div className="text-center"><Icon.Upload w={18} /><div className="text-[11px] mt-1.5">Favicon</div></div></div>
            </div>
          </Panel>
        </div>

        {/* live preview */}
        <div>
          <div className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-muted mb-2">Live preview</div>
          <div className="rounded-2xl border border-border overflow-hidden bg-surface" style={{ borderRadius: radius + 4 }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: theme.primary }}>
              <div className="flex items-center gap-2"><span className="w-6 h-6" style={{ borderRadius: radius * 0.4, background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, outline: "1px solid rgba(255,255,255,0.3)" }} /><span className="font-bold text-cream text-[14px]" style={{ fontFamily: font }}>Karta</span></div>
              <span className="w-6 h-6 rounded-full" style={{ background: theme.accent }} />
            </div>
            <div className="p-4 grid gap-3">
              <div className="font-semibold text-ink text-[15px]" style={{ fontFamily: font }}>Sample card</div>
              <div className="text-[12.5px] text-ink-soft">This is how components look with your theme.</div>
              <div className="flex gap-2">
                <span className="px-3 py-1.5 text-cream text-[12px] font-medium" style={{ background: theme.primary, borderRadius: radius }}>Primary</span>
                <span className="px-3 py-1.5 text-[12px] font-medium" style={{ background: theme.accent, color: theme.primary, borderRadius: radius }}>Accent</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EFEB" }}><div className="h-full w-2/3" style={{ background: theme.primary }} /></div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4 · EMAIL TEMPLATES — system transactional emails
// ════════════════════════════════════════════════════════════════════
function CmsEmailsPage() {
  const seed = [
    { name: "Welcome email", trig: "On signup", on: true, subj: "Welcome to Karta 🎉" },
    { name: "Registration confirmation", trig: "On registration", on: true, subj: "You're in! Your ticket + card" },
    { name: "Payment receipt", trig: "On payment", on: true, subj: "Your receipt for {event}" },
    { name: "Event reminder", trig: "24h before", on: true, subj: "{event} is tomorrow" },
    { name: "Password reset", trig: "On request", on: true, subj: "Reset your password" },
    { name: "Payout processed", trig: "On payout", on: false, subj: "Your payout is on the way" },
  ];
  const [items, setItems] = React.useState(seed);
  const [sel, setSel] = React.useState(0);
  const toggle = (i) => setItems((a) => a.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  const t = items[sel];

  return (
    <PageShell title="Email Templates" subtitle="Edit the system emails Karta sends" max="1180px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Template saved")}>Save template</Btn>}>
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        <Panel title="Templates" pad="p-0">
          <div className="divide-y divide-border/60">
            {items.map((m, i) => (
              <button key={i} onClick={() => setSel(i)} className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-colors ${sel === i ? "bg-primary-soft/40" : "hover:bg-cream/50"}`}>
                <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${m.on ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted"}`}><Icon.Bell w={14} /></span>
                <div className="min-w-0 flex-1"><div className="text-[13px] font-medium text-ink truncate">{m.name}</div><div className="font-mono text-[10.5px] text-muted">{m.trig}</div></div>
                <Toggle on={m.on} onClick={() => toggle(i)} />
              </button>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 content-start">
          <Panel title={t.name} action={<Btn icon="External" onClick={() => window.toast && window.toast("Test email sent to you")}>Send test</Btn>}>
            <div className="grid gap-3.5">
              <CmsField label="Subject line" value={t.subj} onChange={(v) => setItems((a) => a.map((x, j) => j === sel ? { ...x, subj: v } : x))} />
              <CmsField label="Body" area value={"Hi {first_name},\n\nThanks for joining {event}. Your Karta Card is ready to share."} onChange={() => {}} />
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-2">Merge tags</div>
                <div className="flex flex-wrap gap-1.5">{["{first_name}", "{event}", "{date}", "{ticket}", "{venue}", "{qr}"].map((v) => <span key={v} className="font-mono text-[10.5px] bg-cream border border-border text-ink-soft px-2 py-1 rounded">{v}</span>)}</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5 · ANNOUNCEMENTS — platform-wide banners
// ════════════════════════════════════════════════════════════════════
function CmsAnnouncementsPage() {
  const [banner, setBanner] = React.useState({ text: "🎉 New: AI matchmaking is live for all Pro events.", tone: "accent", on: true });
  const [items, setItems] = React.useState([
    { text: "Scheduled maintenance Sunday 02:00–03:00 UTC", aud: "All organizers", when: "Scheduled", on: false },
    { text: "Flutterwave payouts now available in 12 countries", aud: "Studio plan", when: "Sent 2d ago", on: true },
  ]);
  const tones = [["accent", "#E8C57E", "#163828"], ["forest", "#1F4D3A", "#FAF6EE"], ["info", "#1E3A55", "#FAF6EE"], ["warn", "#B45309", "#FFF7ED"]];
  return (
    <PageShell title="Announcements" subtitle="Banners & notices across the platform" max="1000px"
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "New announcement", subtitle: "Show a banner to a group of users", fields: [{ key: "text", label: "Message", placeholder: "What do you want to say?", required: true }, { key: "aud", label: "Audience", radios: [["All users"], ["Organizers only"], ["Studio plan"], ["Specific event"]], selected: 0 }, { key: "schedule", label: "Schedule for later", toggle: true }], submitLabel: "Publish announcement", submitIcon: "Sparkle", toast: "Announcement published" })}>New announcement</Btn>}>
      <Panel title="Top banner" className="mb-5" action={<Toggle on={banner.on} onClick={() => setBanner({ ...banner, on: !banner.on })} />}>
        {banner.on && (
          <div className="rounded-lg px-4 py-2.5 mb-4 text-[13px] font-medium text-center" style={{ background: (tones.find((t) => t[0] === banner.tone) || tones[0])[1], color: (tones.find((t) => t[0] === banner.tone) || tones[0])[2] }}>{banner.text}</div>
        )}
        <CmsField label="Banner text" value={banner.text} onChange={(v) => setBanner({ ...banner, text: v })} />
        <div className="mt-3">
          <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-2">Style</div>
          <div className="flex gap-2">{tones.map(([id, bg, fg]) => <button key={id} onClick={() => setBanner({ ...banner, tone: id })} className={`w-8 h-8 rounded-lg border-2 ${banner.tone === id ? "border-primary" : "border-transparent"}`} style={{ background: bg }} />)}</div>
        </div>
      </Panel>
      <Panel title="Scheduled & past" pad="p-0">
        <div className="divide-y divide-border/60">
          {items.map((a, i) => (
            <div key={i} className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Sparkle w={15} /></span>
              <div className="min-w-0 flex-1"><div className="text-[13px] font-medium text-ink truncate">{a.text}</div><div className="font-mono text-[10.5px] text-muted mt-0.5">{a.aud} · {a.when}</div></div>
              <Toggle on={a.on} onClick={() => setItems((x) => x.map((y, j) => j === i ? { ...y, on: !y.on } : y))} />
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 6 · NAVIGATION & FEATURES — toggle modules platform-wide
// ════════════════════════════════════════════════════════════════════
function CmsNavigationPage() {
  const seed = [
    { group: "Core", mods: [["Registration & tickets", true, true], ["Orders & payments", true, true], ["Check-in & badges", true, false], ["Communications", true, false]] },
    { group: "Engagement", mods: [["Networking & matchmaking", true, false], ["1:1 meetings", true, false], ["Q&A & polls", true, false], ["Gamification", false, false]] },
    { group: "Programme", mods: [["Agenda & sessions", true, false], ["Speakers", true, false], ["Call for speakers", true, false]] },
    { group: "Partners", mods: [["Sponsors & exhibitors", true, false], ["Floor plan & booths", true, false], ["Virtual / streaming", false, false]] },
    { group: "Signature", mods: [["Karta Card", true, true], ["Card Studio", true, false]] },
  ];
  const [data, setData] = React.useState(seed);
  const toggle = (gi, mi) => setData((d) => d.map((g, j) => j === gi ? { ...g, mods: g.mods.map((m, k) => k === mi ? [m[0], !m[1], m[2]] : m) } : g));
  return (
    <PageShell title="Navigation & Features" subtitle="Turn platform modules on or off — for every organizer" max="980px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Module configuration saved")}>Save</Btn>}>
      <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
        <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Grid w={16} /></span>
        <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">Feature control.</span> Switching a module off hides it from every organizer's dashboard and event navigation. Locked modules are core and always on.</div>
      </div>
      <div className="grid gap-5">
        {data.map((g, gi) => (
          <Panel key={gi} title={g.group}>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3.5">
              {g.mods.map((m, mi) => (
                <div key={mi} className="flex items-center justify-between gap-3">
                  <span className={`text-[13.5px] ${m[1] ? "text-ink font-medium" : "text-muted"}`}>{m[0]}{m[2] && <span className="ml-2 font-mono text-[9px] tracking-[0.1em] uppercase text-muted">core</span>}</span>
                  {m[2] ? <span className="text-muted/50"><Icon.Lock w={13} /></span> : <Toggle on={m[1]} onClick={() => toggle(gi, mi)} />}
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "cms-pages": CmsPagesPage,
  "cms-pricing": CmsPricingPage,
  "cms-appearance": CmsAppearancePage,
  "cms-emails": CmsEmailsPage,
  "cms-announcements": CmsAnnouncementsPage,
  "cms-navigation": CmsNavigationPage,
});
