// Sections 1-7: Nav, Hero, Social proof, Problem, Solution, Use cases, How it works

// ────────────────────────────────────────────────────────────────────
// SECTION 1 — Top navigation
// ────────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== "undefined" && /[?&]nav=open/.test(window.location.search)) {
      setOpen(true);
    }
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur border-b border-border/60">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 h-[68px] flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="inline-block w-6 h-6 rounded-md"
            style={{
              background:
                "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)",
            }}
          />
          <span className="font-display text-[22px] font-bold tracking-tight text-primary">
            Cardly
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-9 text-[14px] text-ink-soft">
          <a href="#use-cases" className="hover:text-primary transition-colors">
            Use cases
          </a>
          <a href="#how" className="hover:text-primary transition-colors">
            How it works
          </a>
          <a href="#pricing" className="hover:text-primary transition-colors">
            Pricing
          </a>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <a
            href="#"
            className="px-3 py-2 text-[14px] text-ink-soft hover:text-primary"
          >
            Sign in
          </a>
          <a
            href="#"
            className="cardly-cta px-4 py-2.5 rounded-full bg-primary text-cream text-[14px] font-medium hover:bg-primary-dark inline-flex items-center gap-1.5"
          >
            Start free
            <Icon.Arrow w={15} />
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
      {open && (
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
            <div className="h-[68px] px-5 flex items-center justify-between">
              <a href="#" className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block w-6 h-6 rounded-md"
                  style={{
                    background:
                      "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)",
                  }}
                />
                <span className="font-display text-[22px] font-bold tracking-tight text-primary">
                  Cardly
                </span>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 grid place-items-center rounded-lg text-ink hover:bg-primary-soft"
                aria-label="Close menu"
              >
                <Icon.X w={22} />
              </button>
            </div>
            <div className="px-5 pt-6 pb-10 flex-1 flex flex-col">
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-5">
                Menu
              </div>
              <nav className="flex flex-col">
                {[
                  ["Use cases", "#use-cases"],
                  ["How it works", "#how"],
                  ["Pricing", "#pricing"],
                  ["About", "#about"],
                ].map(([label, href], i) => (
                  <a
                    key={i}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-5 border-b border-border/70 font-display font-semibold text-ink text-[30px] tracking-[-0.025em] hover:text-primary transition-colors"
                  >
                    {label}
                    <span className="text-primary translate-x-0 group-hover:translate-x-1 transition-transform">
                      <Icon.Arrow w={20} />
                    </span>
                  </a>
                ))}
              </nav>
              <div className="mt-8 grid gap-3">
                <a
                  href="#"
                  className="cardly-cta inline-flex items-center justify-between px-5 py-4 rounded-full bg-primary text-cream font-medium"
                >
                  Start free
                  <Icon.Arrow w={16} />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-full border border-ink/15 text-ink font-medium hover:border-primary hover:text-primary transition-colors"
                >
                  Sign in
                </a>
              </div>
              <div className="mt-auto pt-10 flex items-center justify-between">
                <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                  cardly.app
                </div>
                <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-primary">
                  <span
                    className="inline-flex items-center gap-1"
                    aria-hidden
                  >
                    <span
                      className="inline-block w-3 h-2 rounded-sm"
                      style={{
                        background:
                          "linear-gradient(to bottom, #6AB04C 33%, #FFFFFF 33% 66%, #44A5E0 66%)",
                      }}
                    />
                    <span
                      className="inline-block w-2 h-2"
                      style={{
                        background: "#D62828",
                        clipPath: "polygon(0 0, 100% 50%, 0 100%)",
                      }}
                    />
                  </span>
                  Made in Djibouti
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 2 — Hero
// ────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Mesh-gradient wash */}
      <div aria-hidden className="cardly-mesh cardly-mesh-hero" />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* LEFT */}
        <div className="order-2 lg:order-1">
          <div className="font-mono text-[11px] tracking-[0.18em] text-primary/80 mb-5 uppercase">
            For event teams, brands &amp; campaigns
          </div>
          <h1 className="font-display font-bold text-ink leading-[0.96] tracking-[-0.035em] text-[46px] sm:text-[60px] lg:text-[72px]">
            Every supporter.
            <br />
            Every speaker.
            <br />
            Every attendee.
            <span className="text-primary"> Their own branded card.</span>
          </h1>
          <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[560px]">
            Cardly turns one design into thousands of personalized shareable cards.
            Your audience adds their name and photo on their phone — and shares it
            everywhere.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#"
              className="cardly-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-cream font-medium hover:bg-primary-dark"
            >
              Start free <Icon.Arrow w={16} />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-ink/15 text-ink font-medium hover:border-primary hover:text-primary transition-colors"
            >
              See how it works <Icon.Arrow w={16} />
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon.Check w={14} /> Free for up to 50 cards
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon.Check w={14} /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon.Check w={14} /> Works on every phone
            </span>
          </div>
        </div>

        {/* RIGHT — hero card stack */}
        <div className="order-1 lg:order-2 relative h-[460px] sm:h-[540px] lg:h-[600px]">
          {/* Halo behind cards */}
          <div aria-hidden className="hero-card-halo" />

          {/* Back card 1 — Speaker, slight left */}
          <div className="absolute left-[8%] top-[6%] sm:left-[4%] sm:top-[4%]">
            <div className="opacity-70 scale-[0.78] origin-top-left">
              <CardPreview
                width={300}
                tilt={-8}
                org="AFRICA TECH FESTIVAL"
                event="Africa Tech Festival 2026"
                role="I'M SPEAKING AT"
                name="Kwame Mensah"
                initials="KM"
                title="Product Engineer · Paystack"
                date="12 MAR 2026"
                location="LAGOS"
              />
            </div>
          </div>

          {/* Back card 2 — Volunteer, slight right */}
          <div className="absolute right-[6%] bottom-[6%] hidden sm:block">
            <div className="opacity-75 scale-[0.7] origin-bottom-right">
              <CardPreview
                width={280}
                tilt={6}
                org="UNITED FOR EAST AFRICA"
                event="United for East Africa"
                role="I'M VOLUNTEERING AT"
                name="Liya Tesfaye"
                initials="LT"
                title="Campaign Lead"
                date="OCT 2025"
                location="ADDIS"
              />
            </div>
          </div>

          {/* Hero front card */}
          <div className="absolute inset-0 grid place-items-center">
            <div
              className="hero-float relative"
              style={{ transform: "rotate(-3deg)", filter: "drop-shadow(0 30px 50px rgba(15, 31, 24, 0.25))" }}
            >
              <CardPreview width={340} />
            </div>
          </div>

          {/* Floating "Live preview" tag */}
          <div className="absolute right-2 top-8 sm:right-6 sm:top-12 hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
              Live preview
            </span>
          </div>
          <div className="absolute left-2 bottom-10 sm:left-6 sm:bottom-16 hidden sm:flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1.5 shadow-sm">
            <Icon.Share w={12} style={{ color: "#1F4D3A" }} />
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
              247 shared today
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 3 — Social proof strip
// ────────────────────────────────────────────────────────────────────
function SocialProof() {
  const logos = [
    { mono: "AU", name: "African Union" },
    { mono: "UNDP", name: "UNDP" },
    { mono: "MTN", name: "MTN Group" },
    { mono: "GIZ", name: "GIZ" },
    { mono: "PSK", name: "Paystack" },
    { mono: "AFD", name: "Afro Future" },
  ];
  return (
    <section className="border-y border-border bg-cream/40 backdrop-blur-sm">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-10">
        <div className="text-center font-mono text-[10px] tracking-[0.22em] text-muted uppercase mb-7">
          Used for campaigns by
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-ink-soft/70">
          {logos.map((l, i) => (
            <div
              key={i}
              className={`flex items-center gap-2.5 ${i >= 3 ? "hidden sm:flex" : ""}`}
            >
              <span className="w-8 h-8 rounded-full border border-ink-soft/30 grid place-items-center font-mono text-[10px] tracking-[0.08em] font-semibold">
                {l.mono}
              </span>
              <span className="font-display font-semibold text-[15px] tracking-tight">
                {l.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 4 — The Problem
// ────────────────────────────────────────────────────────────────────
function Problem() {
  const posts = [
    { tag: "branding chaos", color: "#B8423C", initials: "JM", caption: "guys come thru" },
    { tag: "wrong colors", color: "#C9A45E", initials: "FK", caption: "see u all there!!" },
    { tag: "low quality", color: "#6B7A72", initials: "TO", caption: "📢📢📢" },
    { tag: "off-brand", color: "#3A4A42", initials: "RA", caption: "we outside" },
  ];
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[720px] mx-auto text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] text-danger/90 uppercase mb-5">
            The problem
          </div>
          <h2 className="font-display font-bold text-ink text-[38px] sm:text-[50px] lg:text-[60px] leading-[1.0] tracking-[-0.035em]">
            You need every attendee to share.{" "}
            <span className="text-ink-soft">They never do.</span>
          </h2>
          <p className="mt-6 text-ink-soft text-[17px] lg:text-[18px] leading-[1.6]">
            You spend months planning a campaign. You design beautiful brand assets.
            Then the day comes — and your attendees post about it however they want,
            if they post at all. The brand inconsistency is real. The reach is half
            what it could be. The "social media kit" you sent in WhatsApp? Half-opened,
            mostly ignored.
          </p>
        </div>

        {/* Chaos visual */}
        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1000px] mx-auto">
          {posts.map((p, i) => (
            <div
              key={i}
              className="relative bg-surface border border-border rounded-2xl p-4 shadow-sm"
              style={{ transform: `rotate(${[-3, 2, -1.5, 2.5][i]}deg)` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-full grid place-items-center text-cream font-display text-[11px] font-semibold"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </div>
                <div className="font-display text-[13px] font-semibold text-ink">
                  @user_{i + 12}
                </div>
              </div>
              <div
                className="aspect-square rounded-lg mb-3 overflow-hidden relative"
                style={{
                  background: `linear-gradient(${[120,40,200,310][i]}deg, ${p.color}, ${p.color}aa)`,
                }}
              >
                <div
                  className="absolute inset-2 border-2 border-dashed rounded-md grid place-items-center"
                  style={{ borderColor: "rgba(250,246,238,0.4)" }}
                >
                  <span className="font-display text-cream text-[18px] sm:text-[22px] font-bold tracking-tight text-center px-3 leading-tight opacity-80">
                    {["pan african YOUTH forum", "I'M GOING!!", "youth forum 2025", "djibouti vibes"][i]}
                  </span>
                </div>
                <span
                  className="absolute top-1.5 right-1.5 font-mono text-[9px] tracking-[0.16em] uppercase px-1.5 py-0.5 rounded text-cream"
                  style={{ background: "rgba(15,31,24,0.55)" }}
                >
                  {p.tag}
                </span>
              </div>
              <div className="text-[12px] text-ink-soft truncate">{p.caption}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
          → Four supporters. Four different brands.
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 5 — The Solution
// ────────────────────────────────────────────────────────────────────
function Solution() {
  const steps = [
    {
      n: "01",
      icon: <Icon.Pencil w={20} />,
      title: "Design",
      body: "Upload your campaign artwork. Mark editable zones for name, photo, role.",
    },
    {
      n: "02",
      icon: <Icon.Send w={20} />,
      title: "Publish",
      body: "One link. WhatsApp, email, or QR. No accounts. No app downloads.",
    },
    {
      n: "03",
      icon: <Icon.Share w={20} />,
      title: "Attendees share",
      body: "Personalized card in 30 seconds. One tap to Instagram, WhatsApp, X.",
    },
  ];
  return (
    <section className="relative overflow-hidden bg-primary-soft/30 border-y border-border/70">
      <div aria-hidden className="cardly-mesh cardly-mesh-solution" />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center">
        <div>
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            The fix
          </div>
          <h2 className="font-display font-bold text-ink text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.0] tracking-[-0.035em]">
            One design. Thousands of personalized versions.{" "}
            <span className="text-primary">Zero designer hours.</span>
          </h2>
          <p className="mt-6 text-ink-soft text-[17px] lg:text-[18px] leading-[1.6] max-w-[540px]">
            Upload your campaign design once. Mark which parts should be filled in
            by attendees — name, photo, role, whatever you need. Share the link.
            Watch your audience generate their own branded share cards, on their
            phones, in under 30 seconds.
          </p>
        </div>

        {/* Three steps */}
        <div className="relative">
          <div className="grid gap-4">
            {steps.map((s, i) => (
              <div
                key={i}
                className="relative bg-surface border border-border rounded-2xl p-5 sm:p-6 flex items-start gap-4 sm:gap-5 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="font-mono text-[10px] tracking-[0.18em] text-muted absolute top-4 right-5">
                  STEP {s.n}
                </div>
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl grid place-items-center bg-primary-soft text-primary shrink-0">
                  {s.icon}
                </div>
                <div className="pt-0.5 pr-12">
                  <div className="font-display text-[20px] sm:text-[22px] font-semibold text-ink tracking-tight">
                    {s.title}
                  </div>
                  <p className="text-ink-soft text-[14px] sm:text-[15px] mt-1.5 leading-[1.55]">
                    {s.body}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <svg
                    aria-hidden
                    className="absolute -bottom-3 left-9 sm:left-10"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1F4D3A"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M12 4v16M6 14l6 6 6-6" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 6 — Use case grid
// ────────────────────────────────────────────────────────────────────
function UseCases() {
  const cases = [
    {
      label: "Conferences",
      icon: <Icon.Mic w={18} />,
      title: "Conference attendees and speakers",
      body: "Every speaker, sponsor, and attendee gets their own branded variant of your event card.",
      card: {
        variant: "forest",
        org: "AFRICA TECH FESTIVAL",
        event: "Africa Tech Festival 2026",
        role: "I'M SPEAKING AT",
        name: "Kwame Mensah",
        initials: "KM",
        title: "Product Engineer",
        date: "12 MAR 2026",
        location: "LAGOS",
      },
    },
    {
      label: "NGOs",
      icon: <Icon.Heart w={18} />,
      title: "Awareness and fundraising campaigns",
      body: "Your supporters announce they're backing your cause — branded to your campaign.",
      card: {
        variant: "cream",
        org: "PAN-AFRICAN CLIMATE",
        event: "I stand for the climate.",
        role: "I'M SUPPORTING",
        name: "Fatou Diop",
        initials: "FD",
        title: "Supporter, Dakar",
        date: "EARTH DAY",
        location: "GLOBAL",
      },
    },
    {
      label: "Political campaigns",
      icon: <Icon.Flag w={18} />,
      title: "Endorsement and rally cards",
      body: "Volunteers, endorsers, and supporters generate cards that look professional and personal at once.",
      card: {
        variant: "duotone",
        org: "UNITED FOR EAST AFRICA",
        event: "I'm with the movement.",
        role: "I'M ENDORSING",
        name: "Liya Tesfaye",
        initials: "LT",
        title: "Volunteer Captain",
        date: "OCT 2025",
        location: "ADDIS",
      },
    },
    {
      label: "Religious organizations",
      icon: <Icon.Sun w={18} />,
      title: "Event registration and community drives",
      body: "Members announce attendance at your conference, fast, or fundraiser.",
      card: {
        variant: "gold",
        org: "GLOBAL HALAL SUMMIT",
        event: "Global Halal Summit",
        role: "I'M ATTENDING",
        name: "Yusuf Bello",
        initials: "YB",
        title: "Delegate, Kano",
        date: "18 JUL 2026",
        location: "ISTANBUL",
      },
    },
    {
      label: "Brand activations",
      icon: <Icon.Shop w={18} />,
      title: "Product launches and store openings",
      body: "Your customers and partners share branded launch announcements that drive real reach.",
      card: {
        variant: "forest",
        org: "MTN BRAND ACTIVATION",
        event: "MTN 5G is here.",
        role: "I'M CELEBRATING",
        name: "Chidinma O.",
        initials: "CO",
        title: "MTN Ambassador",
        date: "01 SEP 2026",
        location: "ACCRA",
      },
    },
    {
      label: "Educational institutions",
      icon: <Icon.Cap w={18} />,
      title: "Graduations, alumni, and scholarship campaigns",
      body: "Graduates, alumni, and scholarship recipients each get their own moment to share.",
      card: {
        variant: "cream",
        org: "UNIVERSITY OF NAIROBI",
        event: "Class of 2026.",
        role: "I JUST GRADUATED",
        name: "Wanjiku Kariuki",
        initials: "WK",
        title: "BSc Computer Science",
        date: "DEC 2026",
        location: "NAIROBI",
      },
    },
  ];

  return (
    <section id="use-cases" className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[760px] mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            Who it's for
          </div>
          <h2 className="font-display font-bold text-ink text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em]">
            Built for the campaign you're running this quarter.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[640px]">
            Six campaign types we've shipped cards for. Your audience, your brand, in
            their hands.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 lg:gap-5">
          {cases.map((c, i) => (
            <article
              key={i}
              className="cardly-edge group relative bg-surface border border-border rounded-2xl p-6 lg:p-7 flex gap-5 lg:gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="w-9 h-9 rounded-full bg-primary-soft text-primary grid place-items-center">
                    {c.icon}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-primary uppercase">
                    {c.label}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-ink text-[19px] lg:text-[22px] leading-[1.15] tracking-[-0.02em]">
                  {c.title}
                </h3>
                <p className="text-ink-soft text-[14px] lg:text-[15px] mt-2.5 leading-[1.55]">
                  {c.body}
                </p>
                <a
                  href="#"
                  className="mt-5 inline-flex items-center gap-1.5 text-primary font-medium text-[13px] hover:gap-2.5 transition-all"
                >
                  See example <Icon.Arrow w={14} />
                </a>
              </div>
              <div className="shrink-0 self-center">
                <MiniCard width={130} {...c.card} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 7 — How it works walkthrough
// ────────────────────────────────────────────────────────────────────
function EditorMock({ stage = 1 }) {
  // Stylized editor screenshot
  return (
    <div className="relative bg-surface rounded-2xl border border-border overflow-hidden shadow-xl shadow-ink/10">
      {/* App chrome */}
      <div className="h-9 bg-cream border-b border-border flex items-center gap-1.5 px-3">
        <span className="w-2.5 h-2.5 rounded-full bg-ink/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink/10" />
        <span className="w-2.5 h-2.5 rounded-full bg-ink/10" />
        <div className="ml-4 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
          cardly · editor · pan-african youth forum
        </div>
      </div>
      <div className="grid grid-cols-[170px_1fr_140px] h-[280px] sm:h-[320px]">
        {/* Left sidebar */}
        <div className="border-r border-border bg-cream/60 p-3 flex flex-col gap-2">
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
            Zones
          </div>
          {[
            { l: "Name", active: stage >= 2 },
            { l: "Photo", active: stage >= 2 },
            { l: "Role", active: stage >= 2 },
            { l: "Date", active: false },
          ].map((z, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${
                z.active ? "bg-primary text-cream" : "bg-surface border border-border text-ink-soft"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  z.active ? "bg-accent" : "bg-ink-soft/40"
                }`}
              />
              {z.l}
            </div>
          ))}
          <div className="mt-auto font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
            Variants
          </div>
          <div className="text-[10px] text-ink-soft px-2">Attendee · Speaker · Sponsor</div>
        </div>
        {/* Canvas */}
        <div className="relative grid place-items-center bg-[radial-gradient(circle_at_center,#F1E9D6_0%,#FAF6EE_70%)] p-4">
          <div className="relative">
            <CardPreview width={170} />
            {stage >= 2 && (
              <React.Fragment>
                <ZoneMark x={18} y={22} w={120} h={14} label="ORG" />
                <ZoneMark x={18} y={48} w={132} h={28} label="EVENT" />
                <ZoneMark x={18} y={148} w={36} h={36} label="PHOTO" circle />
                <ZoneMark x={66} y={150} w={88} h={14} label="NAME" />
                <ZoneMark x={66} y={168} w={70} h={10} label="ROLE" />
              </React.Fragment>
            )}
          </div>
        </div>
        {/* Right inspector */}
        <div className="border-l border-border bg-cream/60 p-3 flex flex-col gap-2.5">
          <div className="font-mono text-[9px] tracking-[0.18em] text-muted uppercase">
            Field
          </div>
          <div className="bg-surface border border-border rounded-md p-2">
            <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">Label</div>
            <div className="text-[11px] text-ink mt-0.5 font-medium">Name</div>
          </div>
          <div className="bg-surface border border-border rounded-md p-2">
            <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">Max chars</div>
            <div className="text-[11px] text-ink mt-0.5 font-medium">24</div>
          </div>
          <div className="bg-surface border border-border rounded-md p-2">
            <div className="font-mono text-[8px] text-muted tracking-[0.16em] uppercase">Required</div>
            <div className="text-[11px] text-success mt-0.5 font-medium">Yes</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function ZoneMark({ x, y, w, h, label, circle }) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
      }}
    >
      <div
        className="absolute inset-0 border-2 border-dashed pointer-events-none"
        style={{
          borderColor: "#E8C57E",
          borderRadius: circle ? "50%" : 4,
          background: "rgba(232, 197, 126, 0.12)",
        }}
      />
      <span
        className="absolute -top-3 left-0 font-mono text-[7px] tracking-[0.14em] uppercase px-1 rounded text-ink"
        style={{ background: "#E8C57E" }}
      >
        {label}
      </span>
    </div>
  );
}

function PhoneMock() {
  return (
    <div
      className="relative mx-auto bg-ink rounded-[34px] p-2 shadow-xl shadow-ink/20"
      style={{ width: 220 }}
    >
      <div
        className="rounded-[26px] overflow-hidden bg-cream relative"
        style={{ height: 420 }}
      >
        <div className="h-6 bg-ink rounded-b-2xl mx-auto w-24 -mt-px" />
        <div className="px-4 pt-3 pb-4">
          <div className="font-mono text-[8px] tracking-[0.18em] text-muted uppercase">
            cardly.app/y2025
          </div>
          <div className="font-display text-[16px] text-ink font-semibold leading-tight mt-2">
            Get your card for the Youth Forum.
          </div>
          <div className="mt-3 flex justify-center">
            <CardPreview width={160} />
          </div>
          <div className="mt-3 space-y-2">
            <div className="bg-surface border border-border rounded-lg px-2.5 py-2">
              <div className="font-mono text-[8px] tracking-[0.16em] text-muted uppercase">
                Your name
              </div>
              <div className="text-[12px] text-ink mt-0.5">Aisha Ahmed</div>
            </div>
            <div className="bg-surface border border-border rounded-lg px-2.5 py-2">
              <div className="font-mono text-[8px] tracking-[0.16em] text-muted uppercase">
                Your role
              </div>
              <div className="text-[12px] text-ink mt-0.5">Climate Policy Lead</div>
            </div>
            <button className="w-full bg-primary text-cream rounded-lg py-2 text-[12px] font-medium mt-1">
              Download my card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Upload your design",
      body: "Drop in any design from Canva, Figma, Illustrator — any PNG or JPG works. Cardly handles any aspect ratio, portrait or landscape.",
      caption: "Works at any aspect ratio.",
      visual: <EditorMock stage={1} />,
    },
    {
      n: "02",
      title: "Mark editable zones",
      body: "Click to add text fields, photo zones, dropdowns, and custom fields where you want attendees to personalize. Different roles? Add variants — Attendee, Speaker, Sponsor.",
      caption: "Each zone is one tap to edit.",
      visual: <EditorMock stage={2} />,
    },
    {
      n: "03",
      title: "Share the link",
      body: "Send one link via WhatsApp, email, or QR code. Attendees open it on their phone, type their name, upload a photo, and download their card in under 30 seconds.",
      caption: "No app downloads. No accounts.",
      visual: <PhoneMock />,
    },
  ];

  return (
    <section id="how" className="">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[760px] mb-14 lg:mb-20">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            How it works
          </div>
          <h2 className="font-display font-bold text-ink text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em]">
            Three steps. About ten minutes.
          </h2>
        </div>

        <div className="space-y-16 lg:space-y-24">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <div className="font-mono text-[10px] tracking-[0.22em] text-muted uppercase">
                  Step {s.n}
                </div>
                <h3 className="mt-3 font-display font-bold text-ink text-[28px] sm:text-[34px] lg:text-[38px] leading-[1.05] tracking-[-0.02em]">
                  {s.title}
                </h3>
                <p className="mt-4 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6] max-w-[520px]">
                  {s.body}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-primary">
                  <span className="w-5 h-px bg-primary" />
                  {s.caption}
                </div>
              </div>
              <div>{s.visual}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 lg:mt-20 flex justify-center">
          <a
            href="#"
            className="cardly-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-cream font-medium hover:bg-primary-dark"
          >
            Start your first campaign <Icon.Arrow w={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, {
  Nav,
  Hero,
  SocialProof,
  Problem,
  Solution,
  UseCases,
  HowItWorks,
});
