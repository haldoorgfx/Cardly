// Platform · Workspace: Templates, Brand Kit, Team, Billing, Settings

function TemplatesPage() {
  const templates = [
    { name: "Tech Conference", desc: "Multi-track agenda, speakers, networking", grad: GRAD.forest, icon: "Grid", tag: "Popular" },
    { name: "Workshop / Training", desc: "Single track, limited seats, materials", grad: GRAD.sage, icon: "User" },
    { name: "Webinar", desc: "Online, registration + stream", grad: GRAD.deep, icon: "Video" },
    { name: "Gala / Fundraiser", desc: "Ticketed dinner, tables, donations", grad: GRAD.gold, icon: "Trophy" },
    { name: "Hackathon", desc: "Teams, submissions, judging", grad: GRAD.forest, icon: "Bolt" },
    { name: "Community Meetup", desc: "Free RSVP, simple agenda", grad: GRAD.sage, icon: "Users" },
    { name: "Religious Gathering", desc: "Sessions, registration, WhatsApp", grad: GRAD.deep, icon: "Calendar" },
    { name: "Product Launch", desc: "Activation, press, brand cards", grad: GRAD.gold, icon: "Sparkle" },
  ];
  return (
    <PageShell title="Templates" subtitle="Start a new event from a proven setup"
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.toast && window.toast("Opening event setup…")}>Blank event</Btn>}>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((t, i) => {
          const IconC = Icon[t.icon];
          return (
            <div key={i} className="group bg-surface border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="relative h-[96px] grid place-items-center" style={{ background: t.grad }}>
                <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 80% at 80% 10%, rgba(232,197,126,0.28), transparent 60%)" }} />
                <span className="relative text-cream/90"><IconC w={30} /></span>
                {t.tag && <span className="absolute top-2.5 left-2.5"><Pill tone="gold" className="bg-cream/95">{t.tag}</Pill></span>}
              </div>
              <div className="p-4">
                <div className="font-display text-[14.5px] font-semibold text-ink tracking-tight">{t.name}</div>
                <p className="text-[12.5px] text-ink-soft mt-1 leading-[1.5]">{t.desc}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-primary text-[12.5px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Use template <Icon.Arrow w={13} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function BrandKitPage() {
  const colors = [["Forest", "#1F4D3A"], ["Deep", "#163828"], ["Sage", "#2A6A50"], ["Gold", "#E8C57E"], ["Cream", "#FAF6EE"], ["Ink", "#0F1F18"]];
  return (
    <PageShell title="Brand Kit" subtitle="Applied to event pages and Karta Cards"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Brand kit saved — applied to all cards")}>Save brand kit</Btn>}>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="grid gap-5 content-start">
          <Panel title="Logo">
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-[3/2] rounded-xl border border-dashed border-primary/40 bg-cream/60 grid place-items-center text-primary">
                <div className="text-center"><Icon.Layout w={20} /><div className="text-[11px] mt-1.5 font-medium">Primary logo</div></div>
              </div>
              <div className="aspect-[3/2] rounded-xl border border-dashed border-border bg-primary grid place-items-center text-cream/70">
                <div className="text-center"><Icon.Layout w={20} /><div className="text-[11px] mt-1.5">Logo on dark</div></div>
              </div>
            </div>
          </Panel>
          <Panel title="Colors">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {colors.map((c, i) => (
                <div key={i} className="text-center">
                  <div className="aspect-square rounded-xl border border-border mb-1.5" style={{ background: c[1] }} />
                  <div className="text-[11px] text-ink font-medium">{c[0]}</div>
                  <div className="font-mono text-[9px] text-muted">{c[1]}</div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Typography">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <div><div className="font-display text-[18px] font-semibold text-ink">DM Sans</div><div className="font-mono text-[10px] text-muted">Display · headings</div></div>
                <Pill tone="forest">Heading</Pill>
              </div>
              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <div><div className="text-[15px] text-ink" style={{ fontFamily: "Inter" }}>Inter</div><div className="font-mono text-[10px] text-muted">Body · UI</div></div>
                <Pill tone="neutral">Body</Pill>
              </div>
            </div>
          </Panel>
        </div>
        <Panel title="Card preview">
          <div className="grid place-items-center py-4 bg-cream/50 rounded-xl">
            <MiniEventCard event={EVENTS[0]} w={200} />
          </div>
          <p className="text-[12.5px] text-muted text-center mt-4 leading-[1.5]">Your brand kit is automatically applied to every attendee's Karta Card.</p>
        </Panel>
      </div>
    </PageShell>
  );
}

function TeamPage({ onModal }) {
  const members = [
    { n: "Adaeze Okafor", e: "adaeze@karta.app", role: "Owner", events: "All events", status: "Active", g: "linear-gradient(135deg,#2A6A50,#C9A45E)" },
    { n: "Emeka Nwosu", e: "emeka@karta.app", role: "Admin", events: "All events", status: "Active", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    { n: "Zainab Bello", e: "zainab@karta.app", role: "Editor", events: "2 events", status: "Active", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    { n: "David Mwangi", e: "david@karta.app", role: "Check-in staff", events: "Africa Tech Fest", status: "Active", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)" },
    { n: "invited@partner.org", e: "Pending invite", role: "Editor", events: "1 event", status: "Pending", g: "linear-gradient(135deg,#A8C2B5,#6B7A72)" },
  ];
  const roleTone = { Owner: "gold", Admin: "forest", Editor: "neutral", "Check-in staff": "neutral" };
  return (
    <PageShell title="Team" subtitle="4 members · 1 pending invite"
      actions={<Btn variant="primary" icon="Plus" onClick={() => onModal && onModal({ type: "invite" })}>Invite member</Btn>}>
      <Toolbar search="Search members…"><FilterBtn>All roles</FilterBtn></Toolbar>
      <Table head={["Member", "Role", "Event access", "Status", ""]}>
        {members.map((m, i) => (
          <Row key={i}>
            <Cell>
              <div className="flex items-center gap-3">
                <Avatar initials={m.status === "Pending" ? "?" : m.n.split(" ").map((x) => x[0]).join("")} grad={m.g} size={34} />
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium text-ink leading-tight">{m.status === "Pending" ? m.n : m.n}</div>
                  <div className="font-mono text-[11px] text-muted truncate">{m.e}</div>
                </div>
              </div>
            </Cell>
            <Cell><Pill tone={roleTone[m.role] || "neutral"}>{m.role}</Pill></Cell>
            <Cell className="text-[13px] text-ink-soft">{m.events}</Cell>
            <Cell><Pill tone={m.status === "Active" ? "green" : "amber"} dot={m.status === "Active" ? "#2D7A4F" : "#C9A45E"}>{m.status}</Pill></Cell>
            <Cell><button className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors"><Icon.Gear w={15} /></button></Cell>
          </Row>
        ))}
      </Table>
      <div className="mt-4 bg-primary-soft/40 border border-primary/15 rounded-xl px-5 py-4 flex items-start gap-3">
        <span className="text-primary mt-0.5"><Icon.Shield w={16} /></span>
        <div className="text-[13px] text-ink-soft leading-[1.6]">
          <span className="font-medium text-ink">Roles control access.</span> Owners and Admins manage everything; Editors manage assigned events; Check-in staff can only scan attendees at the door.
        </div>
      </div>
    </PageShell>
  );
}

function BillingPage() {
  const invoices = [
    ["Mar 2026", "Pro plan · monthly", "$19.00", "Paid"],
    ["Feb 2026", "Pro plan · monthly", "$19.00", "Paid"],
    ["Jan 2026", "Pro plan · monthly", "$19.00", "Paid"],
    ["Dec 2025", "Free plan", "$0.00", "—"],
  ];
  return (
    <PageShell title="Billing" subtitle="Manage your plan and payment method"
      actions={<Btn variant="accent" icon="Sparkle" onClick={() => window.openUpgrade && window.openUpgrade({ label: "the full platform", id: "plan", minPlan: "studio", icon: "Sparkle" })}>Upgrade to Studio</Btn>}>
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 mb-5">
        <div className="rounded-2xl p-6 relative overflow-hidden text-cream" style={{ background: "linear-gradient(135deg,#163828,#1F4D3A 60%,#2A6A50)" }}>
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 90% at 90% 0%, rgba(232,197,126,0.28), transparent 55%)" }} />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-cream/60">Current plan</div>
                <div className="font-display text-[26px] font-bold mt-1">Pro</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[24px]">$19</div>
                <div className="font-mono text-[10px] text-cream/55">/month</div>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5"><span className="text-cream/70">Events</span><span>3 / ∞</span></div>
                <div className="h-1.5 rounded-full bg-cream/15 overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: "30%" }} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5"><span className="text-cream/70">Registrations this month</span><span>247 / 500</span></div>
                <div className="h-1.5 rounded-full bg-cream/15 overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: "49%" }} /></div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-cream/15 font-mono text-[11px] text-cream/60">Renews 1 Apr 2026</div>
          </div>
        </div>
        <Panel title="Payment method">
          <div className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-4 py-3.5 mb-3">
            <span className="w-10 h-7 rounded bg-primary grid place-items-center text-cream"><Icon.CreditCard w={16} /></span>
            <div className="flex-1">
              <div className="font-mono text-[13px] text-ink">•••• 4242</div>
              <div className="font-mono text-[10.5px] text-muted">Expires 09/27</div>
            </div>
            <button className="text-[12.5px] text-primary font-medium hover:underline">Update</button>
          </div>
          <div className="text-[12.5px] text-muted leading-[1.6]">Billed monthly in USD. African mobile money and bank transfer available on annual plans.</div>
        </Panel>
      </div>
      <Panel title="Invoices" pad="p-0">
        <Table head={["Date", "Description", "Amount", "Status", ""]}>
          {invoices.map((inv, i) => (
            <Row key={i}>
              <Cell className="font-mono text-[12.5px] text-ink">{inv[0]}</Cell>
              <Cell className="text-[13px] text-ink-soft">{inv[1]}</Cell>
              <Cell className="font-mono text-[12.5px] text-ink">{inv[2]}</Cell>
              <Cell>{inv[3] === "Paid" ? <Pill tone="green">Paid</Pill> : <span className="text-muted text-[13px]">—</span>}</Cell>
              <Cell><button className="text-muted hover:text-primary transition-colors"><Icon.External w={15} /></button></Cell>
            </Row>
          ))}
        </Table>
      </Panel>
    </PageShell>
  );
}

function SettingsPage() {
  return (
    <PageShell title="Settings" subtitle="Account and workspace preferences" max="820px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("Changes saved")}>Save changes</Btn>}>
      <Panel title="Profile" className="mb-5">
        <div className="flex items-center gap-4 mb-5">
          <Avatar initials="AO" size={56} />
          <Btn icon="Layout">Change photo</Btn>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" value="Adaeze Okafor" />
          <Field label="Email" value="adaeze@karta.app" mono />
          <Field label="Organization" value="Karta Events Co." />
          <Field label="Role" value="Owner" />
        </div>
      </Panel>
      <Panel title="Preferences" className="mb-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Timezone" value="WAT · Lagos (GMT+1)" />
          <Field label="Language" value="English" />
          <Field label="Currency" value="NGN · ₦ Naira" />
          <Field label="Date format" value="DD MMM YYYY" />
        </div>
      </Panel>
      <Panel title="Notifications" className="mb-5">
        <div className="grid gap-3.5">
          {[
            ["New registrations", "Email me when someone registers", true],
            ["Daily summary", "A digest of each event's activity", true],
            ["Card shares", "Notify when attendees share cards", false],
            ["Product updates", "News about new Karta features", true],
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div><div className="text-[13.5px] text-ink font-medium">{r[0]}</div><div className="text-[12px] text-muted mt-0.5">{r[1]}</div></div>
              <Toggle on={r[2]} />
            </div>
          ))}
        </div>
      </Panel>
      <div className="bg-red-50/60 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-display text-[14px] font-semibold text-red-700">Delete account</div>
          <div className="text-[12.5px] text-red-600/80 mt-0.5">Permanently remove your account and all events. This can't be undone.</div>
        </div>
        <button className="shrink-0 px-3.5 py-2 rounded-lg border border-red-300 text-red-700 text-[13px] font-medium hover:bg-red-100 transition-colors">Delete</button>
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  templates: TemplatesPage,
  "brand-kit": BrandKitPage,
  team: TeamPage,
  billing: BillingPage,
  settings: SettingsPage,
});
