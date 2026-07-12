// Platform · Developer (Studio): API Keys, Webhooks, Integrations, White Label

function ApiKeysPage() {
  const keys = [
    { name: "Production", key: "kdt_live_9f2a••••••••3e7c", created: "12 Jan 2026", used: "2 min ago", scope: "Read · Write" },
    { name: "Check-in app", key: "kdt_live_4b81••••••••a902", created: "03 Feb 2026", used: "1 hr ago", scope: "Check-in" },
    { name: "Analytics export", key: "kdt_live_7c50••••••••f118", created: "20 Feb 2026", used: "Yesterday", scope: "Read only" },
  ];
  return (
    <PageShell title="API Keys" subtitle="Authenticate requests to the Karta API"
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Create API key", subtitle: "Keys are shown once — copy it somewhere safe", fields: [{ label: "Key name", placeholder: "e.g. Production server" }, { label: "Scope", radios: [["Read only", "Read events, registrations, analytics"], ["Read · Write", "Full programmatic access"], ["Check-in", "Scan & check in attendees only"]], selected: 1 }], submitLabel: "Create key", submitIcon: "Key", onConfirm: () => window.toast && window.toast("API key created — copy it now") })}>Create key</Btn>}>
      <div className="bg-primary-soft/40 border border-primary/15 rounded-xl px-5 py-4 mb-5 flex items-start gap-3">
        <span className="text-primary mt-0.5"><Icon.Key w={16} /></span>
        <div className="text-[13px] text-ink-soft leading-[1.6]">
          Keep your keys secret. Use them in the <span className="font-mono text-[12px] text-primary">Authorization: Bearer</span> header. Rotate immediately if exposed.
        </div>
      </div>
      <Table head={["Name", "Key", "Scope", "Last used", "Created", ""]}>
        {keys.map((k, i) => (
          <Row key={i}>
            <Cell className="text-[13.5px] font-medium text-ink">{k.name}</Cell>
            <Cell><span className="font-mono text-[12px] text-ink-soft bg-cream border border-border rounded px-2 py-1">{k.key}</span></Cell>
            <Cell><Pill tone="forest">{k.scope}</Pill></Cell>
            <Cell className="font-mono text-[12px] text-muted">{k.used}</Cell>
            <Cell className="font-mono text-[12px] text-muted">{k.created}</Cell>
            <Cell><button onClick={() => window.openModal && window.openModal({ type: "confirm", danger: true, title: "Revoke “" + k.name + "”?", confirmLabel: "Revoke key", confirmIcon: "Trash", body: "Any service using this key will immediately stop working. This can’t be undone.", onConfirm: () => window.toast && window.toast("API key revoked") })} className="text-muted hover:text-danger transition-colors text-[12.5px] font-medium">Revoke</button></Cell>
          </Row>
        ))}
      </Table>
    </PageShell>
  );
}

function WebhooksPage() {
  const hooks = [
    { url: "https://api.acme.com/karta/webhook", events: "registration.created, checkin.*", status: "Active", last: "200 · 2m ago" },
    { url: "https://hooks.zapier.com/hooks/abc123", events: "card.shared", status: "Active", last: "200 · 1h ago" },
    { url: "https://crm.partner.io/ingest", events: "registration.*", status: "Failing", last: "500 · 3h ago" },
  ];
  const deliveries = [
    ["registration.created", "200", "2 min ago"],
    ["checkin.completed", "200", "8 min ago"],
    ["card.shared", "200", "14 min ago"],
    ["registration.created", "500", "3 hr ago"],
  ];
  return (
    <PageShell title="Webhooks" subtitle="Receive real-time event notifications"
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Add webhook endpoint", subtitle: "We’ll POST events to this URL", fields: [{ label: "Endpoint URL", placeholder: "https://api.yoursite.com/karta", mono: true }, { label: "Events", placeholder: "registration.created, checkin.completed", mono: true }], submitLabel: "Add endpoint", submitIcon: "Plug", onConfirm: () => window.toast && window.toast("Webhook endpoint added") })}>Add endpoint</Btn>}>
      <SectionLabel>Endpoints</SectionLabel>
      <div className="grid gap-2.5 mb-7">
        {hooks.map((h, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
            <span className={`w-9 h-9 rounded-lg grid place-items-center shrink-0 ${h.status === "Active" ? "bg-primary-soft text-primary" : "bg-red-50 text-red-600"}`}><Icon.Plug w={16} /></span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[12.5px] text-ink truncate">{h.url}</div>
              <div className="font-mono text-[11px] text-muted mt-0.5 truncate">{h.events}</div>
            </div>
            <span className="font-mono text-[11px] text-muted hidden sm:inline">{h.last}</span>
            <Pill tone={h.status === "Active" ? "green" : "red"} dot={h.status === "Active" ? "#2D7A4F" : "#B8423C"}>{h.status}</Pill>
          </div>
        ))}
      </div>
      <Panel title="Recent deliveries" pad="p-0">
        <Table head={["Event", "Response", "When"]}>
          {deliveries.map((d, i) => (
            <Row key={i}>
              <Cell><span className="font-mono text-[12.5px] text-ink">{d[0]}</span></Cell>
              <Cell><Pill tone={d[1] === "200" ? "green" : "red"}>{d[1]}</Pill></Cell>
              <Cell className="font-mono text-[12px] text-muted">{d[2]}</Cell>
            </Row>
          ))}
        </Table>
      </Panel>
    </PageShell>
  );
}

function IntegrationsPage() {
  const CATS = [
    { cat: "Payments", apps: [
      { n: "Stripe", d: "Cards, subscriptions & payouts", ic: "CreditCard", on: true },
      { n: "Flutterwave", d: "Pan-African card & bank payments", ic: "Dollar", on: true },
      { n: "Paystack", d: "Payments across Nigeria & Ghana", ic: "Dollar", on: false },
      { n: "M-Pesa", d: "Mobile money for East Africa", ic: "CreditCard", on: false },
    ]},
    { cat: "Communication", apps: [
      { n: "Slack", d: "Registration & sales alerts in Slack", ic: "Chat", on: true },
      { n: "Twilio SMS", d: "Text reminders & check-in codes", ic: "Send", on: false },
      { n: "Intercom", d: "Live chat support on your pages", ic: "Chat", on: false },
      { n: "Mailchimp", d: "Sync attendees to audiences", ic: "Send", on: false },
    ]},
    { cat: "CRM & marketing", apps: [
      { n: "HubSpot", d: "Sync registrants as contacts", ic: "Briefcase", on: false },
      { n: "Salesforce", d: "Push leads to your CRM", ic: "Briefcase", on: false },
      { n: "Google Analytics", d: "Track event-page traffic", ic: "Chart", on: true },
      { n: "Meta Pixel", d: "Retarget visitors with ads", ic: "Share", on: false },
    ]},
    { cat: "Productivity & automation", apps: [
      { n: "Zapier", d: "Automate 6,000+ apps", ic: "Bolt", on: true },
      { n: "Google Calendar", d: "Add sessions to attendee calendars", ic: "Calendar", on: false },
      { n: "Notion", d: "Export attendees & agenda to Notion", ic: "Layout", on: false },
      { n: "Webhooks", d: "Build your own with our API", ic: "Plug", on: true },
    ]},
    { cat: "Streaming", apps: [
      { n: "Zoom", d: "Run virtual sessions over Zoom", ic: "Video", on: false },
      { n: "YouTube Live", d: "Stream the main stage publicly", ic: "Video", on: false },
    ]},
  ];
  const [connected, setConnected] = React.useState(() => {
    const s = new Set();
    CATS.forEach((c) => c.apps.forEach((a) => a.on && s.add(a.n)));
    return s;
  });
  const connect = (a) => window.openModal && window.openModal({
    type: "confirm", title: "Connect " + a.n + "?", confirmLabel: "Connect " + a.n, confirmIcon: "Plug",
    body: "You’ll be redirected to " + a.n + " to authorize Karta. You can disconnect anytime from this page.",
    onConfirm: () => { setConnected((s) => new Set(s).add(a.n)); window.toast && window.toast(a.n + " connected"); },
  });
  const manage = (a) => window.openModal && window.openModal({
    type: "confirm", danger: true, title: "Disconnect " + a.n + "?", confirmLabel: "Disconnect", confirmIcon: "X",
    body: "Karta will stop syncing with " + a.n + ". Your existing data is kept.",
    onConfirm: () => { setConnected((s) => { const n = new Set(s); n.delete(a.n); return n; }); window.toast && window.toast(a.n + " disconnected"); },
  });
  const total = CATS.reduce((n, c) => n + c.apps.length, 0);
  return (
    <PageShell title="Integrations" subtitle={`Connect Karta to your stack · ${connected.size} of ${total} connected`}
      actions={<Btn icon="Search" onClick={() => window.toast && window.toast("Opening the integration directory")}>Browse all</Btn>}>
      <div className="rounded-2xl p-4 mb-6 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
        <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Sparkle w={16} /></span>
        <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">Connect your account, don’t rebuild.</span> Plug in the tools you already use — payments, CRM, comms and automation — and Karta keeps them in sync.</div>
      </div>
      <div className="grid gap-7">
        {CATS.map((c, ci) => (
          <div key={ci}>
            <SectionLabel>{c.cat}</SectionLabel>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {c.apps.map((a, i) => {
                const IconC = Icon[a.ic] || Icon.Plug;
                const isOn = connected.has(a.n);
                return (
                  <div key={i} className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <span className="w-11 h-11 rounded-xl bg-cream border border-border grid place-items-center text-primary"><IconC w={20} /></span>
                      {isOn ? <Pill tone="green" dot="#2D7A4F">Connected</Pill> : <Pill tone="neutral">Not connected</Pill>}
                    </div>
                    <div className="font-display text-[14.5px] font-semibold text-ink tracking-tight">{a.n}</div>
                    <p className="text-[12.5px] text-ink-soft mt-1 leading-[1.5] flex-1">{a.d}</p>
                    <button onClick={() => isOn ? manage(a) : connect(a)} className={`mt-4 w-full py-2 rounded-lg text-[12.5px] font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${isOn ? "border border-border text-ink-soft hover:border-primary/40 hover:text-primary" : "bg-primary text-cream hover:bg-primary-dark cardly-cta"}`}>
                      {isOn ? <><Icon.Gear w={13} /> Manage</> : <><Icon.Plug w={13} /> Connect</>}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

function WhiteLabelPage() {
  return (
    <PageShell title="White Label" subtitle="Make Karta yours — remove our branding" max="900px"
      actions={<Btn variant="primary" icon="Check" onClick={() => window.toast && window.toast("White-label settings saved")}>Save</Btn>}>
      <Panel title="Custom domain" className="mb-5">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
          <Field label="Your domain" value="events.yourbrand.com" mono />
          <Pill tone="green" dot="#2D7A4F" className="mb-2.5">DNS verified</Pill>
        </div>
        <div className="mt-3 font-mono text-[11.5px] text-muted">Attendees see your domain instead of eventera.so — on event pages and Karta Cards.</div>
      </Panel>
      <Panel title="Branding" className="mb-5">
        <div className="grid gap-3.5">
          {[
            ["Remove “Powered by Karta”", "Hide Karta branding on public pages", true],
            ["Remove Karta watermark on cards", "Cards show only your brand", true],
            ["Custom email sender", "Send from your own domain", true],
            ["Branded check-in app", "Your logo on the scanner", false],
          ].map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div><div className="text-[13.5px] text-ink font-medium">{r[0]}</div><div className="text-[12px] text-muted mt-0.5">{r[1]}</div></div>
              <Toggle on={r[2]} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Email sender">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="From name" value="YourBrand Events" />
          <Field label="From address" value="events@yourbrand.com" mono />
        </div>
      </Panel>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "api-keys": ApiKeysPage,
  webhooks: WebhooksPage,
  integrations: IntegrationsPage,
  "white-label": WhiteLabelPage,
});
