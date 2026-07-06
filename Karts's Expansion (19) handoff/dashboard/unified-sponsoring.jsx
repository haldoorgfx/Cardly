// Unified dashboard — Sponsoring (sponsor role).
// This replaces the separate token-gated exhibitor portal at /exhibitor/[token].
// Same overview/leads/booth/resources/team content, now native to the shell —
// the "Open portal" link-out is gone; it's just a page in the dashboard.

const SPONSOR_LEADS = [
  ["Amara Okeke", "Investor · TLcom Capital", "Hot", "green"], ["David Mwangi", "Founder · Twiga Foods", "Warm", "gold"],
  ["Zainab Bello", "Product Lead · Flutterwave", "Hot", "green"], ["Thabo Nkosi", "Engineer · Yoco", "Cold", "neutral"],
  ["Nadia Hassan", "Designer · Andela", "Warm", "gold"], ["Liya Tesfaye", "VP Eng · Safaricom", "Hot", "green"],
];

function UnifiedSponsoring() {
  const [tab, setTab] = React.useState("overview");
  return (
    <PageShell title="Sponsoring" subtitle="Paystack · Platinum sponsor · Booth A1, Africa Tech Festival 2026"
      actions={<Btn variant="accent" icon="Scan">Scan a lead</Btn>}>
      <SegTabs tabs={[{ id: "overview", label: "Overview" }, { id: "leads", label: "Leads" }, { id: "booth", label: "Booth profile" }, { id: "resources", label: "Resources" }, { id: "team", label: "Team" }]} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div>
          <StatCards
            items={[
              { value: "142", label: "Leads captured", icon: "Users", delta: "↑ 18 today" },
              { value: "638", label: "Booth visits", icon: "Grid", delta: "↑ 9% vs day 1" },
              { value: "214", label: "Resources opened", icon: "Layout" },
              { value: "11", label: "Meetings booked", icon: "Calendar", accent: true },
            ]}
          />
          <div className="grid lg:grid-cols-2 gap-5">
            <Panel title="Lead quality">
              <div className="grid gap-3">
                {[["Hot · ready to buy", 38, "#1F4D3A"], ["Warm · interested", 64, "#2A6A50"], ["Cold · browsing", 40, "#A8C2B5"]].map((r, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5 text-[13px]"><span className="text-ink-soft">{r[0]}</span><span className="font-mono text-muted">{r[1]} · {Math.round((r[1] / 142) * 100)}%</span></div>
                    <ProgressBar pct={(r[1] / 142) * 100} color={r[2]} height={10} />
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Your sessions">
              <div className="grid gap-2.5">
                {[["Sponsored keynote", "Day 1 · 11:00 · Main Stage"], ["Product demo at booth", "Day 1 · 15:00 · Booth A1"], ["Partner mixer", "Day 2 · 17:30 · Rooftop"]].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 bg-cream/60 border border-border rounded-xl px-3.5 py-2.5">
                    <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Calendar w={14} /></span>
                    <div className="min-w-0"><div className="text-[13px] font-medium text-ink">{s[0]}</div><div className="font-mono text-[10.5px] text-muted mt-0.5">{s[1]}</div></div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "leads" && (
        <Table head={["Contact", "Role · Company", "Quality", ""]}>
          {SPONSOR_LEADS.map((l, i) => (
            <Row key={i}>
              <Cell><div className="flex items-center gap-2.5"><Avatar initials={l[0].split(" ").map((x) => x[0]).join("")} size={30} /><span className="text-[13.5px] font-medium text-ink">{l[0]}</span></div></Cell>
              <Cell className="font-mono text-[11.5px] text-muted">{l[1]}</Cell>
              <Cell><Pill tone={l[3]}>{l[2]}</Pill></Cell>
              <Cell><button className="text-muted hover:text-primary transition-colors"><Icon.Arrow w={15} /></button></Cell>
            </Row>
          ))}
        </Table>
      )}

      {tab === "booth" && (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <Panel title="Booth profile">
            <div className="grid gap-4">
              <Field label="Company name" value="Paystack" />
              <Field label="Tagline" value="Modern online and offline payments for Africa" />
              <Field label="About" value="Paystack helps businesses in Africa get paid by anyone, anywhere in the world. Over 200,000 businesses rely on our payments infrastructure." />
              <div className="grid grid-cols-2 gap-4"><Field label="Website" value="paystack.com" /><Field label="Booth" value="A1 · Hall A" /></div>
            </div>
            <div className="mt-5"><Btn variant="primary" icon="Check">Save profile</Btn></div>
          </Panel>
          <div className="grid gap-5 content-start">
            <Panel title="Logo">
              <div className="aspect-[3/2] rounded-xl border border-dashed border-primary/40 bg-cream/50 grid place-items-center">
                <div className="text-center text-primary"><Icon.Upload w={20} /><div className="text-[11.5px] mt-1.5 font-medium">Upload logo</div></div>
              </div>
            </Panel>
            <Panel title="Visibility">
              <div className="flex items-center justify-between"><div><div className="text-[13px] text-ink font-medium">Featured booth</div><div className="text-[11.5px] text-muted mt-0.5">Platinum perk</div></div><Pill tone="green" dot="#2D7A4F">On</Pill></div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "resources" && (
        <Table head={["Resource", "Type", "Engagement"]}>
          {[["Product one-pager", "PDF · 2.1 MB", "84 opens"], ["API documentation", "Link", "62 opens"], ["Case study · Bolt", "PDF · 4.4 MB", "38 opens"], ["We're hiring — 12 roles", "Link", "30 opens"]].map((r, i) => (
            <Row key={i}>
              <Cell className="text-[13.5px] font-medium text-ink">{r[0]}</Cell>
              <Cell className="font-mono text-[11.5px] text-muted">{r[1]}</Cell>
              <Cell className="font-mono text-[11.5px] text-muted">{r[2]}</Cell>
            </Row>
          ))}
        </Table>
      )}

      {tab === "team" && (
        <Table head={["Member", "Role", ""]}>
          {[["Samuel Adeyemi", "Booth lead"], ["Chioma Eze", "Sales"], ["Tunde Bello", "Engineer"]].map((m, i) => (
            <Row key={i}>
              <Cell><div className="flex items-center gap-2.5"><Avatar initials={m[0].split(" ").map((x) => x[0]).join("")} size={30} /><span className="text-[13.5px] font-medium text-ink">{m[0]}</span></div></Cell>
              <Cell className="text-[13px] text-ink-soft">{m[1]}</Cell>
              <Cell>{i === 0 && <Pill tone="forest">You</Pill>}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </PageShell>
  );
}

Object.assign(window, { UnifiedSponsoring });
