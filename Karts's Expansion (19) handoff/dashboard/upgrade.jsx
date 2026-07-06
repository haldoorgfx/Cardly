// Upgrade slide-over — shown when a free/pro user clicks a gated feature.

const FEATURE_INFO = {
  team: "Invite teammates to co-manage events with roles and permissions. Hand off check-in, the agenda and registrations without sharing a single login.",
  networking: "Let attendees build profiles, message 1:1, and get matched to the right people by interests and goals. Turn your event into a network, not just a room.",
  "q-and-a": "Run live Q&A and polls in every session. Surface the best questions and keep remote and in-room attendees equally engaged.",
  gamification: "Award points for check-ins, sessions and connections, with a live leaderboard and badges that keep attendees moving all day.",
  sponsors: "Give sponsors branded booths, lead retrieval and a measurable showcase — so you can prove ROI and sell next year's package.",
  virtual: "Stream sessions to a polished online venue with chat and recordings, so remote attendees get the full experience.",
};

function UpgradeSlideOver({ feature, onClose }) {
  const open = !!feature;
  const targetPlan = feature && feature.minPlan ? feature.minPlan : "pro";
  const info = feature && FEATURE_INFO[feature.id];
  const IconC = feature ? (Icon[feature.icon] || Icon.Sparkle) : Icon.Sparkle;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/30 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />
      {/* panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[380px] max-w-[90vw] bg-cream border-l border-border shadow-2xl flex flex-col transition-transform duration-250 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {open && (
          <React.Fragment>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/70">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent-dark inline-flex items-center gap-1.5">
                <Icon.Sparkle w={12} /> {PLAN_LABEL[targetPlan]} feature
              </span>
              <button onClick={onClose} className="w-8 h-8 grid place-items-center rounded-lg text-muted hover:bg-primary-soft hover:text-primary transition-colors">
                <Icon.X w={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div
                className="relative rounded-2xl p-6 mb-6 overflow-hidden"
                style={{ background: "linear-gradient(140deg, #163828 0%, #1F4D3A 60%, #2A6A50 110%)" }}
              >
                <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 90% at 100% 0%, rgba(232,197,126,0.34), transparent 60%)" }} />
                <div className="relative">
                  <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-cream/10 text-accent border border-cream/15 mb-4"><IconC w={22} /></span>
                  <div className="font-display text-[20px] font-semibold text-cream tracking-tight">{feature.label}</div>
                </div>
              </div>

              <p className="text-ink-soft text-[14.5px] leading-[1.6]">
                {info || "Unlock the full Karta platform — networking, live engagement, sponsor tools and more."}
              </p>

              <div className="mt-6 font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-3">
                What you get on {PLAN_LABEL[targetPlan]}
              </div>
              <ul className="space-y-2.5">
                {(targetPlan === "studio"
                  ? ["AI matchmaking & networking", "Live Q&A, polls & gamification", "Sponsor tools & lead retrieval", "API access & multiple brand kits"]
                  : ["Unlimited events", "Agenda, speakers & networking", "1:1 messaging", "Watermark removed"]
                ).map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-soft">
                    <span className="mt-0.5 text-primary"><Icon.Check w={15} /></span>{f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 py-5 border-t border-border/70 grid gap-2.5">
              <button className="cardly-cta inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary text-cream font-medium hover:bg-primary-dark transition-colors">
                Upgrade to {PLAN_LABEL[targetPlan]} <Icon.Arrow w={15} />
              </button>
              <button onClick={onClose} className="text-[13px] text-muted hover:text-primary transition-colors">Learn more about plans</button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

window.UpgradeSlideOver = UpgradeSlideOver;
