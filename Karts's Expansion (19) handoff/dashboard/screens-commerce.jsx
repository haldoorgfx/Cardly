// Event-level · Commerce & comms: Orders (master-detail) + Communications hub.

// ════════════════════════════════════════════════════════════════════
// ORDERS — transactions, receipts, refunds, transfers
// ════════════════════════════════════════════════════════════════════
const ORDERS = [
  { id: "KA-2041", buyer: "Aisha Ahmed", email: "aisha@sahelpay.co", g: "linear-gradient(135deg,#C9A45E,#1F4D3A)", items: [["VIP package", 1, 80]], fee: 1.5, method: "Visa ····4242", status: "Paid", date: "2 Mar, 14:22", channel: "Online" },
  { id: "KA-2040", buyer: "Kwame Mensah", email: "kwame@paystack.com", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", items: [["General admission", 2, 25]], fee: 1.5, method: "Mobile money", status: "Paid", date: "2 Mar, 13:48", channel: "Online" },
  { id: "KA-2039", buyer: "Thandi Mokoena", email: "thandi@yoco.com", g: "linear-gradient(135deg,#2A6A50,#C9A45E)", items: [["General admission", 1, 25]], fee: 1.5, method: "Visa ····9821", status: "Pending", date: "2 Mar, 12:10", channel: "Online" },
  { id: "KA-2038", buyer: "Yusuf Bello", email: "yusuf@wave.com", g: "linear-gradient(135deg,#163828,#3E7E5E)", items: [["VIP package", 1, 80], ["Workshop add-on", 1, 15]], fee: 2.0, method: "Flutterwave", status: "Paid", date: "1 Mar, 19:05", channel: "Online" },
  { id: "KA-2037", buyer: "Liya Tesfaye", email: "liya@safaricom.co.ke", g: "linear-gradient(135deg,#1F4D3A,#163828)", items: [["General admission", 1, 25]], fee: 1.5, method: "Visa ····1142", status: "Refunded", date: "1 Mar, 16:33", channel: "Online" },
  { id: "KA-2036", buyer: "Adebayo Dada", email: "ade@kuda.com", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)", items: [["General admission", 4, 25]], fee: 3.0, method: "Bank transfer", status: "Paid", date: "1 Mar, 11:20", channel: "Invoice" },
];
const ORDER_STATUS = { Paid: "green", Pending: "amber", Refunded: "neutral", Failed: "red" };

function orderTotal(o) { return o.items.reduce((s, it) => s + it[1] * it[2], 0) + o.fee; }

function OrdersPage({ event }) {
  const loaded = useLoaded(500);
  const [tab, setTab] = React.useState("all");
  const [sel, setSel] = React.useState(ORDERS[0].id);
  const [orders, setOrders] = React.useState(ORDERS);
  const filtered = orders.filter((o) => tab === "all" || o.status.toLowerCase() === tab);
  const order = orders.find((o) => o.id === sel) || filtered[0] || orders[0];

  const setStatus = (id, status, msg) => { setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o)); if (msg) window.toast && window.toast(msg); };
  const refund = (o) => window.openModal && window.openModal({
    type: "confirm", danger: true, title: "Refund order " + o.id + "?", confirmLabel: "Refund $" + orderTotal(o).toFixed(2), confirmIcon: "CreditCard",
    body: "We'll refund " + o.buyer + " (" + "$" + orderTotal(o).toFixed(2) + ") to their original payment method and release the ticket. This can't be undone.",
    reason: true, reasonLabel: "Reason (internal)",
    onConfirm: () => setStatus(o.id, "Refunded", "Refund issued for " + o.id),
  });
  const transfer = (o) => window.openModal && window.openModal({
    type: "form", title: "Transfer ticket · " + o.id, subtitle: "Move this ticket to a new attendee",
    fields: [{ key: "name", label: "New attendee name", placeholder: "Jane Doe", required: true }, { key: "email", label: "New attendee email", placeholder: "jane@company.com", mono: true, type: "email", required: true }, { key: "notify", toggle: true, on: true, label: "Email both attendees", desc: "Send transfer confirmation" }],
    submitLabel: "Transfer ticket", submitIcon: "Arrow", toast: "Ticket transferred",
  });

  return (
    <PageShell title="Orders" subtitle={`${orders.length} orders · ${event.name}`}
      actions={<><Btn icon="External" onClick={() => window.toast && window.toast("Export started — we'll email you the CSV")}>Export</Btn><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "Create manual order", subtitle: "Record an offline or comp order", fields: [{ key: "name", label: "Buyer name", placeholder: "Jane Doe", required: true }, { key: "email", label: "Email", placeholder: "jane@company.com", mono: true, type: "email", required: true }, { cols: 2, items: [{ key: "ticket", label: "Ticket type", placeholder: "General admission" }, { key: "qty", label: "Qty", placeholder: "1", mono: true, type: "number" }] }, { key: "comp", toggle: true, label: "Mark as comp (free)", desc: "No payment collected" }], submitLabel: "Create order", submitIcon: "Plus", toast: "Order created" })}>Manual order</Btn></>}>

      <StatCards cols={4} items={[
        { label: "Gross revenue", value: "$4,248", icon: "Dollar", delta: "18% wk", deltaUp: true },
        { label: "Orders", value: "178", icon: "CreditCard" },
        { label: "Avg. order", value: "$23.86", icon: "Chart" },
        { label: "Refunded", value: "$25", icon: "Arrow", delta: "1 order", deltaUp: false },
      ]} />

      <Tabs active={tab} onChange={(t) => { setTab(t); }} tabs={[{ id: "all", label: "All" }, { id: "paid", label: "Paid" }, { id: "pending", label: "Pending" }, { id: "refunded", label: "Refunded" }]} />

      {!loaded ? (
        <div className="grid gap-2.5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" rounded="rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="CreditCard" title="No orders here" body="When attendees buy tickets, their orders appear here — ready to refund, transfer or export." />
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-5">
          {/* list */}
          <Panel title={null} pad="p-0">
            <div className="divide-y divide-border/60">
              {filtered.map((o) => (
                <button key={o.id} onClick={() => setSel(o.id)} className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors ${sel === o.id ? "bg-primary-soft/40" : "hover:bg-cream/50"}`}>
                  <Avatar initials={o.buyer.split(" ").map((x) => x[0]).join("")} grad={o.g} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="text-[13.5px] font-medium text-ink truncate">{o.buyer}</span><span className="font-mono text-[11px] text-muted">{o.id}</span></div>
                    <div className="font-mono text-[11px] text-muted mt-0.5">{o.date} · {o.method}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-[13.5px] text-primary">${orderTotal(o).toFixed(2)}</div>
                    <Pill tone={ORDER_STATUS[o.status]} className="mt-1">{o.status}</Pill>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          {/* detail */}
          <div className="grid gap-4 content-start">
            <Panel title={"Order " + order.id} action={<Pill tone={ORDER_STATUS[order.status]}>{order.status}</Pill>}>
              <div className="flex items-center gap-3 mb-4">
                <Avatar initials={order.buyer.split(" ").map((x) => x[0]).join("")} grad={order.g} size={40} />
                <div className="min-w-0"><div className="text-[14px] font-medium text-ink">{order.buyer}</div><div className="font-mono text-[11px] text-muted truncate">{order.email}</div></div>
              </div>
              <div className="grid gap-1.5">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]"><span className="text-ink-soft">{it[1]} × {it[0]}</span><span className="font-mono text-ink">${(it[1] * it[2]).toFixed(2)}</span></div>
                ))}
                <div className="flex items-center justify-between text-[12.5px] text-muted"><span>Service fee</span><span className="font-mono">${order.fee.toFixed(2)}</span></div>
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/70"><span className="text-[13px] font-medium text-ink">Total</span><span className="font-mono text-[15px] text-primary">${orderTotal(order).toFixed(2)}</span></div>
              </div>
            </Panel>
            <Panel title="Details">
              <OrderInfoRow label="Payment">{order.method}</OrderInfoRow>
              <OrderInfoRow label="Channel">{order.channel}</OrderInfoRow>
              <OrderInfoRow label="Date">{order.date}</OrderInfoRow>
              <OrderInfoRow label="Order ID" last><span className="font-mono text-[12px]">{order.id}</span></OrderInfoRow>
            </Panel>
            <div className="grid grid-cols-2 gap-2.5">
              <Btn variant="ghost" icon="External" onClick={() => window.toast && window.toast("Receipt re-sent to " + order.email)}>Resend receipt</Btn>
              <Btn variant="ghost" icon="Arrow" onClick={() => transfer(order)}>Transfer</Btn>
              {order.status !== "Refunded"
                ? <button onClick={() => refund(order)} className="col-span-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-300 text-red-700 text-[13px] font-medium hover:bg-red-50 transition-colors"><Icon.CreditCard w={15} /> Refund order</button>
                : <div className="col-span-2 text-center text-[12.5px] text-muted py-2">Refunded {order.date}</div>}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

// helper (locally named to avoid colliding with screens-details.jsx InfoRow)
function OrderInfoRow({ label, children, last }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? "" : "border-b border-border/60"}`}>
      <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted">{label}</span>
      <span className="text-[13px] text-ink">{children}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMMUNICATIONS — campaigns, automations, audience, channels
// ════════════════════════════════════════════════════════════════════
function CommunicationsPage({ event }) {
  const [tab, setTab] = React.useState("campaigns");
  return (
    <PageShell title="Communications" subtitle={`Reach your attendees · ${event.name}`}
      actions={<Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "compose" })}>New campaign</Btn>}>
      <StatCards cols={4} items={[
        { label: "Emails sent", value: "9,840", icon: "Bell", delta: "3 campaigns", deltaUp: true },
        { label: "Avg. open rate", value: "62%", icon: "Eye", accent: true },
        { label: "Click rate", value: "18%", icon: "Arrow" },
        { label: "Unsubscribed", value: "0.4%", icon: "X" },
      ]} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "campaigns", label: "Campaigns" }, { id: "automations", label: "Automations" }, { id: "audience", label: "Audience" }, { id: "channels", label: "Channels" }]} />
      {tab === "campaigns" && <CampaignsTab />}
      {tab === "automations" && <AutomationsTab />}
      {tab === "audience" && <AudienceTab />}
      {tab === "channels" && <ChannelsTab />}
    </PageShell>
  );
}

function CampaignsTab() {
  const camps = [
    { subj: "Africa Tech Fest is in 3 days 🎉", aud: "All attendees · 247", status: "Sent", when: "2 days ago", open: 64, click: 21 },
    { subj: "Your VIP perks & schedule", aud: "VIP · 13", status: "Sent", when: "4 days ago", open: 81, click: 38 },
    { subj: "Speakers announced — see the line-up", aud: "All attendees · 198", status: "Sent", when: "1 week ago", open: 58, click: 16 },
    { subj: "Last chance: early-bird ends Friday", aud: "Prospects · 1,204", status: "Scheduled", when: "in 2 days", open: null, click: null },
    { subj: "Post-event: thank you + your card", aud: "Checked-in · 189", status: "Draft", when: "—", open: null, click: null },
  ];
  const tone = { Sent: "green", Scheduled: "amber", Draft: "neutral" };
  return (
    <div className="grid gap-2.5">
      {camps.map((c, i) => (
        <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors">
          <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Bell w={17} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5"><span className="text-[14px] font-medium text-ink truncate">{c.subj}</span><Pill tone={tone[c.status]} dot={c.status === "Scheduled" ? "#C9A45E" : null}>{c.status}</Pill></div>
            <div className="font-mono text-[11px] text-muted mt-1">{c.aud} · {c.when}</div>
          </div>
          {c.open != null ? (
            <div className="hidden sm:flex items-center gap-5 shrink-0">
              <div className="text-center"><div className="font-mono text-[14px] text-primary">{c.open}%</div><div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-muted">open</div></div>
              <div className="text-center"><div className="font-mono text-[14px] text-ink-soft">{c.click}%</div><div className="font-mono text-[8.5px] tracking-[0.1em] uppercase text-muted">click</div></div>
            </div>
          ) : (
            <Btn size="sm" variant="ghost" icon="Pencil" onClick={() => window.openModal && window.openModal({ type: "compose" })}>Edit</Btn>
          )}
        </div>
      ))}
    </div>
  );
}

function AutomationsTab() {
  const seed = [
    { name: "Registration confirmation", desc: "Sent instantly when someone registers", trig: "On registration", on: true, sent: "247 sent" },
    { name: "Reminder · 24h before", desc: "Nudge with schedule + their Karta Card", trig: "1 day before event", on: true, sent: "198 sent" },
    { name: "Reminder · 1h before", desc: "Doors open + venue directions", trig: "1 hour before", on: true, sent: "scheduled" },
    { name: "Post-event thank you", desc: "Recap, feedback survey + shareable card", trig: "Event ends", on: false, sent: "off" },
    { name: "Abandoned registration", desc: "Recover people who didn't finish checkout", trig: "2h after drop-off", on: false, sent: "off" },
  ];
  const [items, setItems] = React.useState(seed);
  const toggle = (i) => setItems((a) => a.map((x, j) => j === i ? { ...x, on: !x.on } : x));
  return (
    <React.Fragment>
      <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))" }}>
        <span className="w-9 h-9 rounded-lg bg-accent/25 text-accent-dark grid place-items-center shrink-0"><Icon.Bolt w={16} /></span>
        <div className="text-[12.5px] text-ink-soft leading-snug"><span className="font-semibold text-primary-dark">Automated emails</span> run on their own — set them once and every attendee gets the right message at the right time.</div>
      </div>
      <div className="grid gap-2.5">
        {items.map((a, i) => (
          <div key={i} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
            <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${a.on ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted"}`}><Icon.Bolt w={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-ink">{a.name}</div>
              <div className="text-[12.5px] text-muted mt-0.5">{a.desc}</div>
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted/80 mt-1.5">{a.trig} · {a.sent}</div>
            </div>
            <Toggle on={a.on} onClick={() => toggle(i)} />
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

function AudienceTab() {
  const segs = [
    { name: "All attendees", n: 247, icon: "Users", desc: "Everyone registered" },
    { name: "VIP ticket holders", n: 13, icon: "Star", desc: "VIP package buyers" },
    { name: "Checked in", n: 189, icon: "Check", desc: "Attended on the day" },
    { name: "Not checked in", n: 58, icon: "Clock", desc: "Registered, didn't attend" },
    { name: "Speakers", n: 8, icon: "User", desc: "Confirmed speakers" },
    { name: "Prospects", n: 1204, icon: "Network", desc: "Visited, didn't register" },
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {segs.map((s, i) => {
        const IconC = Icon[s.icon] || Icon.Users;
        return (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 hover:border-primary/40 transition-colors">
            <div className="flex items-center justify-between mb-3"><span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><IconC w={18} /></span><span className="font-mono text-[18px] text-primary">{s.n.toLocaleString()}</span></div>
            <div className="font-display text-[14px] font-semibold text-ink tracking-tight">{s.name}</div>
            <div className="text-[12px] text-muted mt-0.5">{s.desc}</div>
            <button onClick={() => window.openModal && window.openModal({ type: "compose" })} className="mt-3.5 w-full py-2 rounded-lg border border-border text-ink-soft text-[12.5px] font-medium hover:border-primary/40 hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5"><Icon.Bell w={13} /> Email segment</button>
          </div>
        );
      })}
    </div>
  );
}

function ChannelsTab() {
  const chans = [
    { n: "Email", d: "Resend · events@karta.app", ic: "Bell", on: true, note: "Verified sender" },
    { n: "WhatsApp", d: "Reminders & tickets via WhatsApp", ic: "Chat", on: true, note: "Twilio connected" },
    { n: "SMS", d: "Text reminders & check-in codes", ic: "Send", on: false, note: "Connect Twilio" },
    { n: "Push notifications", d: "In-app alerts for attendees", ic: "Bell", on: true, note: "Live" },
  ];
  const [items, setItems] = React.useState(chans);
  const toggle = (i) => { setItems((a) => a.map((x, j) => j === i ? { ...x, on: !x.on } : x)); };
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map((c, i) => {
        const IconC = Icon[c.ic] || Icon.Bell;
        return (
          <div key={i} className="bg-surface border border-border rounded-2xl p-5 flex items-start gap-3.5">
            <span className={`w-11 h-11 rounded-xl grid place-items-center shrink-0 ${c.on ? "bg-primary-soft text-primary" : "bg-ink/5 text-muted"}`}><IconC w={19} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><span className="font-display text-[14.5px] font-semibold text-ink tracking-tight">{c.n}</span><Toggle on={c.on} onClick={() => toggle(i)} /></div>
              <div className="text-[12.5px] text-ink-soft mt-1 leading-snug">{c.d}</div>
              <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted mt-2 inline-flex items-center gap-1.5">{c.on && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}{c.note}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  orders: OrdersPage,
  communications: CommunicationsPage,
});
