// Topbar overlays + modals.

// ── Notifications panel ──────────────────────────────────────────────
function NotificationsPanel({ open, onClose }) {
  const groups = [
    { when: "Today", items: [
      { icon: "Users", text: "12 new registrations for Africa Tech Festival", time: "2m", unread: true, color: CHART.forest },
      { icon: "IdCard", text: "Aisha Ahmed shared their Karta Card", time: "18m", unread: true, color: CHART.goldDark },
      { icon: "Dollar", text: "₦240,000 in ticket sales today", time: "1h", color: CHART.sage },
    ]},
    { when: "Earlier", items: [
      { icon: "Briefcase", text: "Paystack confirmed as Platinum sponsor", time: "Yesterday", color: CHART.forest },
      { icon: "Clock", text: "Pan-African Climate Summit agenda is still empty", time: "2d", color: CHART.goldDark },
    ]},
  ];
  return (
    <Dropdown open={open} onClose={onClose} width={380} anchor="right">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-border/70">
        <span className="font-display text-[14px] font-semibold text-ink">Notifications</span>
        <button onClick={() => window.toast && window.toast("All notifications marked read")} className="font-mono text-[10px] tracking-[0.1em] uppercase text-primary hover:underline">Mark all read</button>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        {groups.map((g, i) => (
          <div key={i}>
            <div className="px-4 pt-3 pb-1.5 font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted">{g.when}</div>
            {g.items.map((n, j) => {
              const IconC = Icon[n.icon];
              return (
                <button key={j} onClick={() => window.toast && window.toast("Opening notification")} className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-cream/70 transition-colors text-left">
                  <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0 mt-0.5" style={{ background: "rgba(31,77,58,0.08)", color: n.color }}><IconC w={15} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-ink leading-snug">{n.text}</span>
                    <span className="font-mono text-[10.5px] text-muted mt-0.5 block">{n.time}</span>
                  </span>
                  {n.unread && <span className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-border/70 text-center">
        <button onClick={() => window.toast && window.toast("Opening all notifications")} className="text-[12.5px] text-primary font-medium hover:underline">View all notifications</button>
      </div>
    </Dropdown>
  );
}

// ── Account menu ─────────────────────────────────────────────────────
function AccountMenu({ open, onClose, plan }) {
  const items = [
    [["Your profile", "User"], ["Account settings", "Gear"], ["Billing & plan", "CreditCard"]],
    [["Help center", "Chat"], ["Keyboard shortcuts", "Bolt"], ["What's new", "Sparkle"]],
  ];
  return (
    <Dropdown open={open} onClose={onClose} width={260} anchor="right">
      <div className="px-4 py-3.5 border-b border-border/70 flex items-center gap-3">
        <Avatar initials="AO" size={40} />
        <div className="min-w-0">
          <div className="text-[13.5px] font-semibold text-ink leading-tight truncate">Adaeze Okafor</div>
          <div className="font-mono text-[11px] text-muted truncate">adaeze@eventera.so</div>
        </div>
      </div>
      <div className="py-1.5">
        {items.map((grp, gi) => (
          <div key={gi} className={gi > 0 ? "border-t border-border/60 pt-1.5 mt-1.5" : ""}>
            {grp.map((it, i) => {
              const IconC = Icon[it[1]] || Icon.Gear;
              return (
                <button key={i} onClick={() => { onClose(); window.toast && window.toast(it[0]); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-cream/70 transition-colors text-left text-[13px] text-ink-soft hover:text-primary">
                  <IconC w={15} /> {it[0]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 pt-1">
        <div className="rounded-xl p-3 mb-2" style={{ background: "linear-gradient(135deg, rgba(232,197,126,0.18), rgba(31,77,58,0.06))" }}>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-accent-dark"><Icon.Sparkle w={12} /> {PLAN_LABEL[plan]} plan</div>
          <div className="text-[11.5px] text-ink-soft mt-0.5">{plan === "studio" ? "You're on the full platform." : "Upgrade for more features."}</div>
        </div>
        <button onClick={() => { onClose(); window.toast && window.toast("Signed out"); }} className="w-full flex items-center gap-2.5 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors text-left text-[13px] text-red-600">
          <Icon.External w={15} /> Sign out
        </button>
      </div>
    </Dropdown>
  );
}

// ── Generic anchored dropdown ────────────────────────────────────────
function Dropdown({ open, onClose, width = 300, anchor = "right", children }) {
  if (!open) return null;
  return (
    <React.Fragment>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="absolute top-[52px] z-50 bg-cream border border-border rounded-2xl shadow-2xl shadow-ink/15 overflow-hidden"
        style={{ width: `min(${width}px, calc(100vw - 24px))`, [anchor]: 0, animation: "dropIn .14s ease-out" }}
      >
        {children}
      </div>
    </React.Fragment>
  );
}

// ── Global search palette (⌘K) ───────────────────────────────────────
function SearchPalette({ open, onClose, onJump }) {
  if (!open) return null;
  const groups = [
    { label: "Events", items: [["Africa Tech Festival 2026", "Calendar"], ["Pan-African Climate Summit", "Calendar"], ["Global Halal Summit", "Calendar"]] },
    { label: "Quick actions", items: [["Create new event", "Plus"], ["Open check-in scanner", "Scan"], ["View all registrations", "Users"], ["Invite a team member", "Users"]] },
    { label: "Settings", items: [["Brand Kit", "Palette"], ["Billing & plan", "CreditCard"], ["API Keys", "Key"]] },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40" style={{ animation: "fadeIn .12s ease-out" }} onClick={onClose} />
      <div className="relative w-full max-w-[560px] bg-cream border border-border rounded-2xl shadow-2xl overflow-hidden" style={{ animation: "popIn .16s ease-out" }}>
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Icon.Search w={18} style={{ color: "#6B7A72" }} />
          <span className="flex-1 text-[15px] text-muted">Search events, people, actions…</span>
          <kbd className="font-mono text-[10px] tracking-[0.06em] text-muted bg-surface border border-border rounded px-1.5 py-1">ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {groups.map((g, gi) => (
            <div key={gi} className="px-2">
              <div className="px-3 pt-2.5 pb-1 font-mono text-[9.5px] tracking-[0.16em] uppercase text-muted">{g.label}</div>
              {g.items.map((it, i) => {
                const IconC = Icon[it[1]] || Icon.Arrow;
                return (
                  <button key={i} onClick={() => { onClose(); window.toast && window.toast("Opening · " + it[0]); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-soft/70 transition-colors text-left group">
                    <span className="w-8 h-8 rounded-lg bg-surface border border-border grid place-items-center text-primary shrink-0"><IconC w={15} /></span>
                    <span className="flex-1 text-[13.5px] text-ink">{it[0]}</span>
                    <Icon.Arrow w={14} style={{ color: "#6B7A72" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modal shell ──────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, footer, width = 480 }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/40" style={{ animation: "fadeIn .12s ease-out" }} onClick={onClose} />
      <div className="relative w-full bg-cream border border-border rounded-2xl shadow-2xl overflow-hidden" style={{ maxWidth: width, animation: "popIn .16s ease-out" }}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-border/70">
          <div>
            <div className="font-display text-[17px] font-semibold text-primary tracking-tight">{title}</div>
            {subtitle && <div className="text-[13px] text-ink-soft mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors shrink-0"><Icon.X w={18} /></button>
        </div>
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border/70 flex items-center justify-end gap-2.5 bg-surface/50">{footer}</div>}
      </div>
    </div>
  );
}

// Bespoke create/edit flows expressed as field schemas (all inputs are real & typeable).
const MODAL_SCHEMAS = {
  "create-ticket": { title: "Create ticket type", subtitle: "Add a new ticket to this event", submitLabel: "Create ticket", submitIcon: "Check", toast: "Ticket type created", fields: [
    { key: "name", label: "Ticket name", placeholder: "General admission", required: true },
    { cols: 2, items: [{ key: "price", label: "Price (₦)", placeholder: "15,000", mono: true }, { key: "qty", label: "Quantity", placeholder: "300", mono: true, type: "number" }] },
    { cols: 2, items: [{ key: "start", label: "Sales start", placeholder: "20 Feb 2026" }, { key: "end", label: "Sales end", placeholder: "11 Mar 2026" }] },
    { key: "hidden", toggle: true, label: "Hidden ticket", desc: "Only available via direct link" },
  ]},
  "add-session": { title: "Add session", subtitle: "Add a session to your agenda", width: 520, submitLabel: "Add session", submitIcon: "Check", toast: "Session added to agenda", fields: [
    { key: "title", label: "Session title", placeholder: "Scaling fintech across borders", required: true },
    { cols: 3, items: [{ key: "day", label: "Day", placeholder: "Day 1" }, { key: "start", label: "Start", placeholder: "10:30", mono: true }, { key: "dur", label: "Duration", placeholder: "60 min" }] },
    { cols: 2, items: [{ key: "track", label: "Track", placeholder: "Main Stage" }, { key: "room", label: "Room", placeholder: "Auditorium A" }] },
    { key: "speakers", label: "Speakers", placeholder: "Shola Akinlade, Fatou Diop" },
  ]},
  "invite": { title: "Invite team member", subtitle: "They'll get an email to join your workspace", submitLabel: "Send invite", submitIcon: "Plus", toast: "Invite sent", fields: [
    { key: "email", label: "Email address", placeholder: "teammate@company.com", mono: true, type: "email", required: true },
    { key: "role", label: "Role", radios: [["Admin", "Manage everything across all events"], ["Editor", "Manage assigned events"], ["Check-in staff", "Scan attendees only"]], selected: 1 },
  ]},
  "add-speaker": { title: "Add speaker", subtitle: "Add someone to your speaker line-up", submitLabel: "Add speaker", submitIcon: "Plus", toast: "Speaker added", fields: [
    { key: "name", label: "Full name", placeholder: "Jane Doe", required: true },
    { cols: 2, items: [{ key: "role", label: "Role", placeholder: "CEO" }, { key: "company", label: "Company", placeholder: "Acme Inc." }] },
    { key: "bio", label: "Bio", area: true, placeholder: "Short speaker bio…" },
  ]},
  "compose": { title: "Compose email", subtitle: "Send an update to your attendees", width: 560, submitLabel: "Send to 247", submitIcon: "Bell", toast: "Email sent to 247 attendees", fields: [
    { key: "subject", label: "Subject", placeholder: "Africa Tech Fest is in 3 days 🎉", required: true },
    { key: "body", label: "Message", area: true, rows: 5, placeholder: "Hi {first_name}, we can't wait to see you…" },
  ]},
};

function ConfirmModal({ modal, onClose }) {
  const [reason, setReason] = React.useState("");
  return (
    <Modal title={modal.title} subtitle={modal.subtitle} onClose={onClose} width={modal.width || 440}
      footer={<><span className="mr-auto" /><Btn onClick={onClose}>Cancel</Btn><Btn variant={modal.danger ? "danger" : "primary"} icon={modal.confirmIcon || "Check"} onClick={() => { modal.onConfirm && modal.onConfirm(reason); onClose(); }}>{modal.confirmLabel || "Confirm"}</Btn></>}>
      {modal.body && <p className="text-[14px] text-ink-soft leading-[1.6]">{modal.body}</p>}
      {modal.reason && <div className="mt-4"><TextArea label={modal.reasonLabel || "Reason (optional)"} value={reason} onChange={setReason} placeholder={modal.reasonPlaceholder || "Add a note…"} /></div>}
    </Modal>
  );
}

function FormModal({ modal, onClose }) {
  // flatten fields → initial values
  const flat = [];
  (modal.fields || []).forEach((f) => { if (f.cols) f.items.forEach((g) => flat.push(g)); else flat.push(f); });
  const init = {};
  flat.forEach((f, i) => { const k = f.key || ("f" + i); if (f.toggle) init[k] = !!f.on; else if (f.radios) init[k] = f.selected ?? 0; else init[k] = f.value || ""; });
  const [vals, setVals] = React.useState(init);
  const [errors, setErrors] = React.useState({});
  const set = (k, v) => setVals((s) => ({ ...s, [k]: v }));
  const keyOf = (f, i) => f.key || ("f" + i);

  const submit = () => {
    const errs = {};
    flat.forEach((f, i) => { const k = keyOf(f, i); if (f.required && !String(vals[k] || "").trim()) errs[k] = (f.label || "This") + " is required"; if (f.type === "email" && vals[k] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vals[k])) errs[k] = "Enter a valid email"; });
    setErrors(errs);
    if (Object.keys(errs).length) { window.toast && window.toast("Please fix the highlighted fields", { tone: "danger", icon: "Bell" }); return; }
    modal.onConfirm && modal.onConfirm(vals);
    if (modal.toast) window.toast && window.toast(modal.toast);
    onClose();
  };

  let idx = -1;
  const renderField = (f) => {
    idx++; const k = keyOf(f, idx);
    if (f.area) return <TextArea key={k} label={f.label} value={vals[k]} onChange={(v) => set(k, v)} placeholder={f.placeholder} rows={f.rows} error={errors[k]} />;
    if (f.toggle) return <div key={k} className="flex items-center justify-between gap-3 pt-0.5"><div><div className="text-[13.5px] text-ink font-medium">{f.label}</div>{f.desc && <div className="text-[12px] text-muted mt-0.5">{f.desc}</div>}</div><Toggle on={vals[k]} onClick={() => set(k, !vals[k])} /></div>;
    if (f.radios) return (
      <div key={k}>
        {f.label && <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">{f.label}</div>}
        <div className="grid gap-2">
          {f.radios.map((r, j) => (
            <button type="button" key={j} onClick={() => set(k, j)} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${vals[k] === j ? "border-primary/50 bg-primary-soft/40" : "border-border bg-surface hover:border-primary/30"}`}>
              <span className={`w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 ${vals[k] === j ? "border-primary" : "border-border"}`}>{vals[k] === j && <span className="w-2 h-2 rounded-full bg-primary" />}</span>
              <span><span className="block text-[13.5px] font-medium text-ink">{r[0]}</span>{r[1] && <span className="block text-[12px] text-muted">{r[1]}</span>}</span>
            </button>
          ))}
        </div>
      </div>
    );
    return <TextInput key={k} label={f.label} value={vals[k]} onChange={(v) => set(k, v)} placeholder={f.placeholder} mono={f.mono} type={f.type} error={errors[k]} autoFocus={idx === 0} />;
  };

  return (
    <Modal title={modal.title} subtitle={modal.subtitle} onClose={onClose} width={modal.width || 480}
      footer={<><span className="mr-auto" /><Btn onClick={onClose}>Cancel</Btn><Btn variant={modal.submitVariant || "primary"} icon={modal.submitIcon || "Check"} onClick={submit}>{modal.submitLabel || "Save"}</Btn></>}>
      <div className="grid gap-4">
        {modal.intro && <p className="text-[13.5px] text-ink-soft leading-[1.55] -mt-1">{modal.intro}</p>}
        {modal.type === "add-speaker" && <div className="flex items-center gap-3"><span className="w-14 h-14 rounded-full border border-dashed border-primary/40 bg-cream grid place-items-center text-primary shrink-0"><Icon.Layout w={18} /></span><Btn icon="Layout" onClick={() => window.toast && window.toast("Choose a headshot")}>Upload headshot</Btn></div>}
        {modal.type === "compose" && <div><div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">Recipients</div><div className="flex flex-wrap gap-2"><Pill tone="forest">All attendees · 247</Pill><Pill tone="neutral">+ Add segment</Pill></div></div>}
        {(modal.fields || []).map((f, i) => f.cols
          ? <div key={i} className={`grid grid-cols-${f.cols} gap-4`}>{f.items.map((g) => renderField(g))}</div>
          : renderField(f))}
        {modal.type === "compose" && <div className="flex items-center gap-2 text-[12px] text-muted"><Icon.Sparkle w={13} style={{ color: "#C9A45E" }} /> Tip: emails with the attendee's Karta Card get 2× the open rate.</div>}
      </div>
    </Modal>
  );
}

function ModalRouter({ modal, onClose }) {
  if (!modal) return null;
  if (modal.type === "confirm") return <ConfirmModal modal={modal} onClose={onClose} />;
  const schema = MODAL_SCHEMAS[modal.type];
  if (schema) return <FormModal modal={{ ...schema, ...modal, fields: modal.fields || schema.fields }} onClose={onClose} />;
  if (modal.type === "form") return <FormModal modal={modal} onClose={onClose} />;
  return null;
}

// ── Toasts (global) ──────────────────────────────────────────────────
function Toaster() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    window.toast = (msg, opts = {}) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, msg, icon: opts.icon || "Check", tone: opts.tone || "default" }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 2800);
    };
    return () => { delete window.toast; };
  }, []);
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => {
        const IconC = Icon[t.icon] || Icon.Check;
        return (
          <div key={t.id} className="pointer-events-auto flex items-center gap-2.5 bg-ink text-cream rounded-xl pl-3 pr-4 py-2.5 shadow-2xl shadow-ink/30" style={{ animation: "toastIn .2s ease-out" }}>
            <span className={`w-6 h-6 rounded-full grid place-items-center shrink-0 ${t.tone === "danger" ? "bg-red-500/25 text-red-300" : "bg-accent/25 text-accent"}`}><IconC w={13} /></span>
            <span className="text-[13px] font-medium">{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}

window.Overlays = { NotificationsPanel, AccountMenu, SearchPalette, ModalRouter, Toaster };
