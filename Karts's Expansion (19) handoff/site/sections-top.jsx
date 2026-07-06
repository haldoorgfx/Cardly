// Sections 1-3: Nav (with Product mega-dropdown), Hero (platform composite), Trust strip

// Shared editorial title style — responsive clamp size with live-tweakable
// weight / scale / tracking (driven by CSS vars set from the Tweaks panel).
function titleStyle(min, vw, max, lh = 1.04) {
  return {
    fontSize: `calc(var(--title-scale, 1) * clamp(${min}px, ${vw}vw, ${max}px))`,
    fontWeight: "var(--title-weight, 700)",
    letterSpacing: "var(--title-tracking, -0.035em)",
    lineHeight: lh,
  };
}
window.titleStyle = titleStyle;

// Platform features used in the Product mega-dropdown
const PRODUCT_MENU = {
  Manage: [
    { icon: "Ticket", name: "Registration & Tickets", desc: "Free and paid tickets, custom forms" },
    { icon: "Grid", name: "Agenda Builder", desc: "Multi-track schedule, drag-and-drop" },
    { icon: "User", name: "Speaker Directory", desc: "Profiles, sessions, bios" },
    { icon: "Chart", name: "Analytics", desc: "Real-time event metrics" },
    { icon: "Scan", name: "QR Check-in", desc: "Scan attendees on the door" },
  ],
  Engage: [
    { icon: "Network", name: "Networking", desc: "Connect attendees with AI matchmaking" },
    { icon: "Chat", name: "Live Q&A & Polls", desc: "Session engagement tools" },
    { icon: "Trophy", name: "Gamification", desc: "Points, leaderboard, badges" },
    { icon: "Briefcase", name: "Sponsor Tools", desc: "Exhibitor booths, lead retrieval" },
    { icon: "IdCard", name: "Karta Card", desc: "Personalized cards for every attendee", gold: true },
  ],
};

function KartaWordmark({ onDark = false, size = 22 }) {
  return (
    <a href="#" className="flex items-center gap-2 group">
      <span
        aria-hidden
        className="inline-block rounded-md"
        style={{
          width: size * 0.92,
          height: size * 0.92,
          background: onDark
            ? "linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)"
            : "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)",
        }}
      />
      <span
        className={`font-display font-bold tracking-tight ${onDark ? "text-cream" : "text-primary"}`}
        style={{ fontSize: size }}
      >
        Karta
      </span>
    </a>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 1 — Top navigation with Product mega-dropdown
// ────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = React.useState(false);
  const [product, setProduct] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined" && /[?&]nav=open/.test(window.location.search)) {
      setOpen(true);
    }
  }, []);

  const MenuItem = ({ item }) => {
    const IconC = Icon[item.icon];
    return (
      <a
        href="#"
        className="group flex items-start gap-3 rounded-xl p-2.5 hover:bg-primary-soft/60 transition-colors"
      >
        <span
          className={`mt-0.5 w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
            item.gold
              ? "bg-accent/20 text-accent-dark"
              : "bg-primary-soft text-primary"
          }`}
        >
          <IconC w={16} />
        </span>
        <span className="min-w-0">
          <span className={`flex items-center gap-1.5 font-display text-[14px] font-semibold tracking-tight ${item.gold ? "text-accent-dark" : "text-ink"}`}>
            {item.name}
            {item.gold && <Icon.Sparkle w={11} style={{ color: "#C9A45E" }} />}
          </span>
          <span className="block text-[12px] text-muted leading-snug mt-0.5">{item.desc}</span>
        </span>
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 h-[64px] flex items-center justify-between">
        <KartaWordmark size={21} />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-[14px] text-ink-soft">
          <div
            className="relative"
            onMouseEnter={() => setProduct(true)}
            onMouseLeave={() => setProduct(false)}
          >
            <button className={`inline-flex items-center gap-1 py-5 transition-colors ${product ? "text-primary" : "hover:text-primary"}`}>
              Product
              <Icon.ChevDown w={14} style={{ transform: product ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {/* Mega-dropdown */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 top-[60px] w-[600px] transition-all duration-150 ${
                product ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
            >
              <div className="bg-cream border border-border rounded-2xl p-3 shadow-2xl shadow-ink/15">
                <div className="grid grid-cols-2 gap-2">
                  {["Manage", "Engage"].map((col) => (
                    <div key={col} className={col === "Engage" ? "pl-3 border-l border-border/70" : ""}>
                      <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted px-2.5 pt-1.5 pb-2">
                        {col}
                      </div>
                      <div className="grid">
                        {PRODUCT_MENU[col].map((it, i) => (
                          <MenuItem key={i} item={it} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
                  <span className="text-[13px] text-ink-soft">
                    Everything one organizer needs, in one place.
                  </span>
                  <a href="#" className="inline-flex items-center gap-1.5 text-primary font-medium text-[13px] hover:gap-2.5 transition-all">
                    See the full platform <Icon.Arrow w={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
          <a href="#use-cases" className="hover:text-primary transition-colors">Use cases</a>
          <a href="pricing-page.html" className="hover:text-primary transition-colors">Pricing</a>
          <a href="#" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            What's new
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <a href="#" className="px-3 py-2 text-[14px] text-ink-soft hover:text-primary">Sign in</a>
          <a href="#" className="cardly-cta px-4 py-2.5 rounded-md bg-primary text-cream text-[14px] font-medium hover:bg-primary-dark inline-flex items-center gap-1.5">
            Start free <Icon.Arrow w={15} />
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-10 h-10 grid place-items-center rounded-lg text-ink hover:bg-primary-soft"
          aria-label="Menu"
        >
          {open ? <Icon.X w={20} /> : <Icon.Menu w={20} />}
        </button>
      </div>

      {open && <MobileMenu setOpen={setOpen} />}
    </header>
  );
}

function MobileMenu({ setOpen }) {
  return (
    <div className="md:hidden fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: "#FAF6EE",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(15, 31, 24, 0.045) 1px, transparent 1px), radial-gradient(60% 50% at 20% 18%, rgba(31, 77, 58, 0.25), transparent 60%), radial-gradient(50% 45% at 90% 85%, rgba(232, 197, 126, 0.30), transparent 60%)",
          backgroundSize: "24px 24px, 100% 100%, 100% 100%",
        }}
      />
      <div className="relative flex flex-col min-h-screen">
        <div className="h-[64px] px-5 flex items-center justify-between">
          <KartaWordmark size={21} />
          <button
            onClick={() => setOpen(false)}
            className="w-10 h-10 grid place-items-center rounded-lg text-ink hover:bg-primary-soft"
            aria-label="Close menu"
          >
            <Icon.X w={22} />
          </button>
        </div>
        <div className="px-5 pt-5 pb-10 flex-1 flex flex-col">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">Platform</div>
          <div className="grid grid-cols-2 gap-2 mb-7">
            {[...PRODUCT_MENU.Manage, ...PRODUCT_MENU.Engage].map((it, i) => {
              const IconC = Icon[it.icon];
              return (
                <a key={i} href="#" onClick={() => setOpen(false)} className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3 py-2.5">
                  <span className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${it.gold ? "bg-accent/20 text-accent-dark" : "bg-primary-soft text-primary"}`}>
                    <IconC w={14} />
                  </span>
                  <span className={`text-[12.5px] font-medium leading-tight ${it.gold ? "text-accent-dark" : "text-ink"}`}>{it.name}</span>
                </a>
              );
            })}
          </div>
          <nav className="flex flex-col">
            {[["Use cases", "#use-cases"], ["Pricing", "pricing-page.html"], ["What's new", "#"]].map(([label, href], i) => (
              <a
                key={i}
                href={href}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between py-4 border-b border-border/70 font-display font-semibold text-ink text-[26px] tracking-[-0.025em] hover:text-primary transition-colors"
              >
                {label}
                <span className="text-primary group-hover:translate-x-1 transition-transform"><Icon.Arrow w={20} /></span>
              </a>
            ))}
          </nav>
          <div className="mt-7 grid gap-3">
            <a href="#" className="cardly-cta inline-flex items-center justify-between px-5 py-4 rounded-full bg-primary text-cream font-medium">
              Start free <Icon.Arrow w={16} />
            </a>
            <a href="#" className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full border border-ink/15 text-ink font-medium hover:border-primary hover:text-primary transition-colors">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 2 — Hero with 3-screen platform composite
// ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="cardly-mesh cardly-mesh-hero" />
      {/* Headline block — centered */}
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 pt-14 lg:pt-20 text-center">
        <div className="inline-flex items-center gap-2 bg-surface/80 border border-primary/15 rounded-full pl-2.5 pr-3.5 py-1.5 mb-7 shadow-sm">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase text-primary"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> New</span>
          <span className="w-px h-3.5 bg-border" />
          <span className="font-sans text-[12.5px] font-medium text-ink-soft">The all-in-one event management platform</span>
        </div>
        <h1 className="font-display text-primary mx-auto max-w-[820px]" style={titleStyle(38, 5.6, 66, 1.02)}>
          Run unforgettable events, end to end.
        </h1>
        <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.6] max-w-[600px] mx-auto">
          Registration, tickets, agenda, check-in, networking and analytics in one place —
          plus the only platform where every attendee leaves with a personalized card to share.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#" className="cardly-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-primary text-cream font-medium hover:bg-primary-dark">
            Start free <Icon.Arrow w={16} />
          </a>
          <a href="#platform" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-surface border border-border text-primary font-medium hover:border-primary/40 transition-colors">
            Book a demo
          </a>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5"><Icon.Check w={14} /> Free for your first event</span>
          <span className="inline-flex items-center gap-1.5"><Icon.Check w={14} /> No credit card</span>
          <span className="inline-flex items-center gap-1.5"><Icon.Check w={14} /> Live in 10 minutes</span>
        </div>
      </div>

      {/* Product shot — the real dashboard */}
      <div className="relative mx-auto max-w-[1120px] px-5 lg:px-10 mt-12 lg:mt-16 pb-4">
        <div aria-hidden className="hero-card-halo" style={{ inset: "-6% -2% 18% -2%" }} />
        <div className="relative">
          <DashboardPreview />
          {/* floating Karta Card — the differentiator, peeking in */}
          <div className="hidden lg:block absolute -bottom-10 -right-6 z-10 hero-float-soft" style={{ filter: "drop-shadow(0 26px 44px rgba(15,31,24,0.4))" }}>
            <div className="relative">
              <div aria-hidden className="absolute" style={{ inset: "-30%", background: "radial-gradient(50% 50% at 50% 50%, rgba(232,197,126,0.55), transparent 62%)", filter: "blur(22px)" }} />
              <div className="relative"><MiniCard width={150} variant="gold" org="AFRICA TECH FEST" event="Africa Tech Festival 2026" role="I'M SPEAKING AT" name="Kwame Mensah" initials="KM" title="Product Engineer" date="12 MAR" location="LAGOS" /></div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-surface border border-border rounded-full px-2.5 py-1 shadow-md whitespace-nowrap">
                <Icon.Sparkle w={11} style={{ color: "#C9A45E" }} />
                <span className="font-mono text-[8.5px] tracking-[0.12em] uppercase text-ink-soft">Auto-generated</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 3 — Trust strip (logos + stats)
// ────────────────────────────────────────────────────────────────────
function TrustStripHero() {
  const logos = ["Paystack", "MTN Group", "UNDP", "Andela", "Flutterwave", "Safaricom"];
  return (
    <section className="relative pt-16 lg:pt-20">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10">
        <p className="text-center font-mono text-[10.5px] tracking-[0.22em] uppercase text-muted mb-7">
          Trusted by teams running world-class events
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-9 gap-y-5">
          {logos.map((l, i) => (
            <span key={i} className="font-display font-bold text-[18px] sm:text-[20px] tracking-tight text-primary/35 hover:text-primary/60 transition-colors">{l}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, TrustStripHero, KartaWordmark, PRODUCT_MENU });
