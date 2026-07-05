// Attendee · Registration flow (4 steps) + Card Reveal

function RegisterScreen({ nav }) {
  const e = FEATURED;
  const [step, setStep] = React.useState(0);
  const [ticket, setTicket] = React.useState(e.tickets[1]);
  const [accent, setAccent] = React.useState(CARD_ACCENTS[0]);
  const [name, setName] = React.useState(ME.name);
  const [role, setRole] = React.useState(ME.role);
  const [photo, setPhoto] = React.useState(false);
  const steps = ["Ticket", "Details", "Payment", "Your card"];
  const fee = 1.5;

  const next = () => { if (step < 3) setStep(step + 1); else nav("reveal", { ticket, accent, name, role, photo }, true); };
  const back = () => { if (step > 0) setStep(step - 1); else nav.back(); };

  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={back} title="Register" />
      <Screen className="px-5 py-4">
        {/* progress */}
        <div className="flex items-center gap-1.5 mb-6">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5">
                <span className={`w-6 h-6 rounded-full grid place-items-center font-mono text-[11px] transition-colors ${i < step ? "bg-primary-soft text-primary" : i === step ? "bg-primary text-cream" : "border border-border text-muted"}`}>{i < step ? "✓" : i + 1}</span>
                <span className={`text-[12px] font-medium hidden xs:inline ${i <= step ? "text-primary" : "text-muted"}`}>{s}</span>
              </div>
              {i < 3 && <span className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        {step === 0 && (
          <div>
            <h2 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em]">Choose your ticket</h2>
            <p className="text-[13px] text-muted mt-1 mb-5">{e.name} · {e.dates}</p>
            <div className="grid gap-2.5">
              {e.tickets.map((t) => {
                const sel = ticket.id === t.id;
                return (
                  <button key={t.id} onClick={() => setTicket(t)} className={`flex items-center gap-3.5 text-left rounded-2xl border p-4 transition-all ${sel ? "border-primary bg-primary-soft/40" : "border-border bg-surface"}`}>
                    <span className={`w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${sel ? "border-primary" : "border-border"}`}>{sel && <span className="w-2.5 h-2.5 rounded-full bg-primary" />}</span>
                    <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-display text-[15px] font-medium text-ink">{t.name}</span>{t.popular && <Pill tone="gold">Popular</Pill>}</div><div className="text-[12px] text-muted mt-0.5">{t.desc}</div></div>
                    <span className="font-mono text-[16px] text-primary shrink-0">{t.price === 0 ? "Free" : t.cur + t.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em]">Your details</h2>
            <p className="text-[13px] text-muted mt-1 mb-5">This is how you'll appear on the attendee list and your Karta Card.</p>
            <div className="grid gap-3.5">
              <RegField label="Full name" value={name} onChange={setName} />
              <RegField label="Email" value="amina.osman@sahelpay.co" />
              <RegField label="Company / role" value={role} onChange={setRole} />
              <div>
                <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted mb-1.5">Add your photo — appears on your card</div>
                <button onClick={() => setPhoto(!photo)} className={`w-full rounded-2xl border-[1.5px] border-dashed h-28 grid place-items-center transition-colors ${photo ? "border-primary bg-primary-soft/30" : "border-border bg-surface hover:border-accent"}`}>
                  {photo ? (
                    <div className="text-center"><Avatar initials={ME.initials} grad={ME.g} size={56} /><div className="text-[12px] text-primary mt-2 font-medium">Photo added ✓</div></div>
                  ) : (
                    <div className="text-center text-muted"><Icon.Layout w={24} className="mx-auto" /><div className="text-[12.5px] mt-1.5">Tap to add your photo</div></div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em]">Payment</h2>
            <p className="text-[13px] text-muted mt-1 mb-4">Secured by Karta Pay. You won't be charged until you confirm.</p>
            <div className="inline-flex items-center gap-2 font-mono text-[11px] text-muted mb-4"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Encrypted · PCI-DSS</div>
            <div className="grid gap-3.5">
              <div className="grid grid-cols-3 gap-2">
                {["Card", "Mobile money", "Bank"].map((m, i) => (
                  <div key={i} className={`rounded-xl border px-2 py-2.5 text-center text-[12px] font-medium ${i === 0 ? "border-primary bg-primary-soft/40 text-primary" : "border-border text-ink-soft"}`}>{m}</div>
                ))}
              </div>
              <RegField label="Card number" value="4242 4242 4242 4242" mono />
              <div className="grid grid-cols-2 gap-3"><RegField label="Expiry" value="08 / 27" mono /><RegField label="CVC" value="123" mono /></div>
              <RegField label="Name on card" value={name} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-[22px] font-semibold text-primary tracking-[-0.02em]">Personalize your card</h2>
            <p className="text-[13px] text-muted mt-1 mb-5">Pick an accent. Your Karta Card generates the moment you confirm.</p>
            <div className="grid place-items-center mb-5">
              <KartaCard w={210} name={name} role={role} tier={ticket.id === "vip" ? "VIP" : ticket.name} no={ME.ticketNo} accent={accent} initials={ME.initials} photo={photo ? ME.g : null} />
            </div>
            <div className="flex items-center justify-center gap-3">
              {CARD_ACCENTS.map((a) => (
                <button key={a.id} onClick={() => setAccent(a)} className={`w-10 h-10 rounded-full transition-transform ${accent.id === a.id ? "ring-2 ring-offset-2 ring-primary scale-105" : ""}`} style={{ background: a.grad }} />
              ))}
            </div>
            <p className="text-[12px] text-muted text-center mt-5 max-w-[300px] mx-auto leading-relaxed">The gold frame, your name and ticket tier are locked to the {e.name} template. Everything else is yours.</p>
          </div>
        )}
      </Screen>

      {/* footer: summary + nav */}
      <div className="border-t border-border bg-cream px-5 py-3.5">
        {step < 3 && (
          <div className="flex items-center justify-between mb-3 text-[13px]">
            <span className="text-ink-soft">{ticket.name}{ticket.price > 0 && <span className="text-muted"> + ${fee.toFixed(2)} fee</span>}</span>
            <span className="font-mono text-[16px] text-primary">{ticket.price === 0 ? "Free" : "$" + (ticket.price + fee).toFixed(2)}</span>
          </div>
        )}
        <Btn variant="primary" full size="lg" iconRight={step === 3 ? "Sparkle" : "Arrow"} onClick={next}>
          {step === 3 ? "Confirm & generate card" : step === 2 ? `Pay ${ticket.price === 0 ? "free" : "$" + (ticket.price + fee).toFixed(2)}` : "Continue"}
        </Btn>
      </div>
    </div>
  );
}

function RegField({ label, value, onChange, mono }) {
  return (
    <label className="block">
      <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-muted block mb-1.5">{label}</span>
      <input value={value} onChange={onChange ? (e) => onChange(e.target.value) : undefined} readOnly={!onChange}
        className={`w-full bg-surface border border-border rounded-xl px-3.5 py-3 text-[14.5px] text-ink focus:border-accent outline-none transition-colors ${mono ? "font-mono text-[13.5px]" : ""}`} />
    </label>
  );
}

// ── Card Reveal — the moment ─────────────────────────────────────────
function RevealScreen({ nav, params }) {
  const p = params || {};
  const [saved, setSaved] = React.useState(false);
  const stageRef = React.useRef(null);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#E8C57E", "#C9A45E", "#1F4D3A", "#2D7A4F", "#F5E9CC"];
    const nodes = [];
    for (let i = 0; i < 30; i++) {
      const c = document.createElement("div");
      c.style.cssText = `position:absolute;width:8px;height:8px;top:-16px;left:${12 + Math.random() * 76}%;background:${colors[i % colors.length]};border-radius:${Math.random() > 0.5 ? "50%" : "1px"};z-index:0;pointer-events:none;`;
      const x = (Math.random() * 2 - 1) * 120;
      c.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${x}px, ${stage.offsetHeight * 0.78}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }],
        { duration: (2.6 + Math.random() * 1.8) * 1000, delay: Math.random() * 0.5 * 1000, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" });
      stage.appendChild(c); nodes.push(c);
    }
    return () => nodes.forEach((n) => n.remove());
  }, []);

  return (
    <div className="flex flex-col h-full">
      <TopBar onBack={() => nav.back()} transparent right={<button onClick={() => nav.reset("schedule")} className="text-[13px] text-muted hover:text-primary px-2">Skip</button>} />
      <div ref={stageRef} className="flex-1 overflow-y-auto att-scroll relative flex flex-col items-center justify-center px-6 py-6" style={{
        background: "radial-gradient(ellipse 60% 42% at 50% 40%, rgba(232,197,126,0.28), transparent 62%), radial-gradient(ellipse 75% 55% at 50% 60%, rgba(31,77,58,0.12), transparent 66%)",
      }}>
        <div className="relative z-10 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] uppercase text-accent-dark mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" style={{ boxShadow: "0 0 0 4px rgba(232,197,126,0.25)" }} /> Your card · Ready
        </div>
        <div className="relative z-10 att-breathe">
          <KartaCard w={272} name={p.name || ME.name} role={p.role || ME.role} tier={p.ticket ? (p.ticket.id === "vip" ? "VIP" : p.ticket.name) : "VIP"} no={ME.ticketNo} accent={p.accent || CARD_ACCENTS[0]} initials={ME.initials} photo={p.photo ? ME.g : null} glow />
        </div>
        <div className="relative z-10 w-full max-w-[290px] mt-8">
          <Btn variant="primary" full size="lg" icon={saved ? "Check" : "Share"} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}>{saved ? "Saved to your device" : "Download card"}</Btn>
          <div className="flex items-center justify-center gap-3 mt-4">
            {[["WhatsApp", "#25D366"], ["Instagram", "#C13584"], ["X", "#0F1F18"], ["LinkedIn", "#0A66C2"], ["Facebook", "#1877F2"]].map((s, i) => {
              const map = { WhatsApp: "Chat", Instagram: "Instagram", X: "Twitter", LinkedIn: "Linkedin", Facebook: "Share" };
              const IconC = Icon[map[s[0]]] || Icon.Share;
              return <button key={i} className="w-11 h-11 rounded-full bg-surface border border-border grid place-items-center hover:border-accent hover:-translate-y-0.5 transition-all" style={{ color: s[1] }} title={s[0]}><IconC w={18} /></button>;
            })}
          </div>
          <button onClick={() => nav.reset("schedule")} className="block w-full text-center mt-6 text-[14px] text-primary font-medium">Enter the event →</button>
        </div>
      </div>
    </div>
  );
}

window.A_SCREENS = Object.assign(window.A_SCREENS || {}, {
  register: RegisterScreen,
  reveal: RevealScreen,
});
