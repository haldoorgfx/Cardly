// Super-admin · Operations: Moderation, Support, Finance, Refunds, Plans & Flags, System Health

// ── Moderation (Trust & Safety) ──────────────────────────────────────
function ModerationPage() {
  const [tab, setTab] = React.useState("events");
  const seed = {
    events: [
      { id: "e1", who: "Crypto Riches Expo", meta: "Reported by 8 attendees", reason: "Suspected scam / fake event", sev: "High", g: "linear-gradient(135deg,#5a2036,#a04a68)" },
      { id: "e2", who: "Detox Wellness Retreat", meta: "Auto-flagged", reason: "Misleading health claims", sev: "Medium", g: "linear-gradient(135deg,#1f120c,#5a3320)" },
      { id: "e3", who: "Free iPhone Giveaway Party", meta: "Reported by 3 attendees", reason: "Spam / phishing link", sev: "High", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    ],
    users: [
      { id: "u1", who: "promo_blast_2026", meta: "ade.spam@mail.co", reason: "Mass unsolicited messaging", sev: "Medium", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)" },
      { id: "u2", who: "ticket_reseller", meta: "resell@mail.co", reason: "Reselling above face value", sev: "Low", g: "linear-gradient(135deg,#163828,#3E7E5E)" },
    ],
    content: [
      { id: "c1", who: "Session Q&A · AfriTech", meta: "Posted by Anonymous", reason: "Hate speech", sev: "High", g: "linear-gradient(135deg,#5a2036,#a04a68)" },
      { id: "c2", who: "Booth comment · Kuda", meta: "Posted by guest_88", reason: "Harassment", sev: "Medium", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)" },
    ],
  };
  const [queues, setQueues] = React.useState(seed);
  const sevTone = { High: "red", Medium: "amber", Low: "neutral" };
  const resolve = (id, msg) => { setQueues((q) => ({ ...q, [tab]: q[tab].filter((x) => x.id !== id) })); window.toast && window.toast(msg); };
  const remove = (item) => window.openModal && window.openModal({
    type: "confirm", danger: true, title: "Remove “" + item.who + "”?", confirmLabel: "Remove", confirmIcon: "Trash",
    body: "This takes the item down immediately and notifies the owner. This can’t be undone.",
    reason: true, reasonLabel: "Reason sent to owner", reasonPlaceholder: "Violates our event policy…",
    onConfirm: () => resolve(item.id, "Removed — owner notified"),
  });
  const bulk = () => window.openModal && window.openModal({
    type: "confirm", title: "Review all " + queues[tab].length + " items?", confirmLabel: "Approve all", confirmIcon: "Check",
    body: "Approve every item in this queue. Flagged content that needs removal should be handled individually.",
    onConfirm: () => { setQueues((q) => ({ ...q, [tab]: [] })); window.toast && window.toast("Queue cleared"); },
  });
  const list = queues[tab];
  return (
    <PageShell title="Moderation" subtitle="Trust & Safety review queue" max="1100px"
      actions={<><Btn icon="Gear" onClick={() => window.toast && window.toast("Opening moderation rules")}>Rules</Btn><Btn variant="primary" icon="Shield" onClick={bulk}>Bulk review</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Open reports", value: "23", icon: "Shield", delta: "6 today", deltaUp: false },
        { label: "Resolved today", value: "41", icon: "Check" },
        { label: "Avg. response", value: "1.8h", icon: "Clock" },
        { label: "Auto-flagged", value: "12", icon: "Bolt", accent: true },
      ]} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: "events", label: "Events" }, { id: "users", label: "Users" }, { id: "content", label: "Content" }]} />
      {list.length === 0 ? (
        <EmptyState icon="Check" title="Queue clear" body="Nothing left to review here. Nice work." />
      ) : (
        <div className="grid gap-2.5">
          {list.map((q) => (
            <div key={q.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl shrink-0" style={{ background: q.g }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5"><span className="font-display text-[14.5px] font-semibold text-ink tracking-tight truncate">{q.who}</span><Pill tone={sevTone[q.sev]}>{q.sev}</Pill></div>
                <div className="text-[13px] text-ink-soft mt-1">{q.reason}</div>
                <div className="font-mono text-[11px] text-muted mt-0.5">{q.meta}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Btn size="sm" variant="ghost" icon="Check" onClick={() => resolve(q.id, "Approved — kept live")}>Approve</Btn>
                <button onClick={() => remove(q)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-300 text-red-700 text-[12.5px] font-medium hover:bg-red-50 transition-colors whitespace-nowrap"><Icon.X w={14} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

// ── Support (helpdesk) ───────────────────────────────────────────────
function SupportPage() {
  const [active, setActive] = React.useState(0);
  const seed = [
    { subj: "Payout hasn't arrived for AfriTech", who: "Sahel Ventures", pri: "Urgent", status: "Open", when: "12m", g: "linear-gradient(135deg,#2A6A50,#C9A45E)", chan: "Email", assignee: "Unassigned" },
    { subj: "How do I enable AI matchmaking?", who: "Grace Wanjiru", pri: "Normal", status: "Open", when: "1h", g: "linear-gradient(135deg,#3E7E5E,#C9A45E)", chan: "Chat", assignee: "Unassigned" },
    { subj: "Refund request for duplicate ticket", who: "Attendee · Liya T.", pri: "High", status: "Pending", when: "2h", g: "linear-gradient(135deg,#1F4D3A,#2A6A50)", chan: "Email", assignee: "Unassigned" },
    { subj: "Custom domain not verifying", who: "Paystack Events", pri: "Normal", status: "Open", when: "4h", g: "linear-gradient(135deg,#163828,#3E7E5E)", chan: "Email", assignee: "Unassigned" },
    { subj: "Bulk import failed (CSV)", who: "Andela", pri: "High", status: "Resolved", when: "Yesterday", g: "linear-gradient(135deg,#2A6A50,#1F4D3A)", chan: "Chat", assignee: "You" },
  ];
  const [tickets, setTickets] = React.useState(seed);
  const priTone = { Urgent: "red", High: "amber", Normal: "neutral" };
  const t = tickets[active];
  const patch = (i, fields, msg) => { setTickets((ts) => ts.map((x, j) => j === i ? { ...x, ...fields } : x)); if (msg) window.toast && window.toast(msg); };
  return (
    <PageShell title="Support" subtitle="Organizer & attendee help desk" max="1180px"
      actions={<><Btn icon="Search" onClick={() => window.toast && window.toast("Search tickets")}>Search</Btn><Btn variant="primary" icon="Plus" onClick={() => window.openModal && window.openModal({ type: "form", title: "New ticket", subtitle: "Log a support request", fields: [{ label: "Subject", placeholder: "Short summary" }, { cols: 2, items: [{ label: "Requester", placeholder: "name@org.com", mono: true }, { label: "Priority", value: "Normal" }] }, { label: "Details", area: true, placeholder: "What's going on…" }], submitLabel: "Create ticket", submitIcon: "Plus", onConfirm: () => window.toast && window.toast("Ticket created") })}>New ticket</Btn></>}>
      <StatCards cols={4} items={[
        { label: "Open tickets", value: "38", icon: "Chat" },
        { label: "First response", value: "22m", icon: "Clock", delta: "8% mo", deltaUp: true },
        { label: "CSAT", value: "94%", icon: "Star", accent: true },
        { label: "Backlog > 24h", value: "5", icon: "Bell", delta: "2", deltaUp: false },
      ]} />
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <Panel title="Tickets" pad="p-0">
          <div className="divide-y divide-border/60">
            {tickets.map((tk, i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors ${active === i ? "bg-primary-soft/40" : "hover:bg-cream/50"}`}>
                <Avatar initials={tk.who.split(" ").map((x) => x[0]).join("").slice(0, 2)} grad={tk.g} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-[13.5px] font-medium text-ink truncate flex-1">{tk.subj}</span><Pill tone={priTone[tk.pri]}>{tk.pri}</Pill></div>
                  <div className="font-mono text-[11px] text-muted mt-1">{tk.who} · {tk.chan} · {tk.when}</div>
                </div>
                <Pill tone={tk.status === "Resolved" ? "green" : tk.status === "Pending" ? "amber" : "forest"}>{tk.status}</Pill>
              </button>
            ))}
          </div>
        </Panel>
        <div className="grid gap-4 content-start">
          <Panel title="Conversation">
            <div className="flex items-center gap-2.5 mb-3"><Avatar initials={t.who.split(" ").map((x) => x[0]).join("").slice(0, 2)} grad={t.g} size={34} /><div><div className="text-[13px] font-medium text-ink">{t.who}</div><div className="font-mono text-[10.5px] text-muted">{t.chan} · {t.when} ago</div></div></div>
            <div className="text-[13.5px] font-semibold text-ink mb-2">{t.subj}</div>
            <p className="text-[13px] text-ink-soft leading-[1.6]">Hi team — {t.subj.toLowerCase()}. Could you take a look? This is time-sensitive for our event this week. Thanks!</p>
            <div className="mt-4 bg-cream border border-border rounded-xl px-3.5 py-3 text-[13px] text-muted">Type a reply…</div>
            <div className="flex items-center gap-2 mt-3">
              <Btn variant="primary" size="sm" icon="Send" onClick={() => window.toast && window.toast("Reply sent to " + t.who)}>Reply</Btn>
              <Btn variant="ghost" size="sm" onClick={() => patch(active, { assignee: "You" }, "Assigned to you")}>Assign</Btn>
              <Btn variant="ghost" size="sm" icon="Check" onClick={() => patch(active, { status: "Resolved" }, "Ticket resolved")}>Resolve</Btn>
            </div>
          </Panel>
          <Panel title="Details">
            <InfoRow label="Priority"><Pill tone={priTone[t.pri]}>{t.pri}</Pill></InfoRow>
            <InfoRow label="Channel">{t.chan}</InfoRow>
            <InfoRow label="Assignee">{t.assignee}</InfoRow>
            <InfoRow label="Status" last><Pill tone={t.status === "Resolved" ? "green" : t.status === "Pending" ? "amber" : "forest"}>{t.status}</Pill></InfoRow>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

window.SCREENS = Object.assign(window.SCREENS || {}, {
  "admin-moderation": ModerationPage,
  "admin-support": SupportPage,
});
