// Sections 4-7: Platform features, Karta difference, 5-step lifecycle, use cases

// ────────────────────────────────────────────────────────────────────
// SECTION 4 — Product tour: alternating rows showing the real product
// ────────────────────────────────────────────────────────────────────
function TourRow({ label, heading, body, bullets, mock, reverse }) {
  return (
    <div className={`grid lg:grid-cols-2 gap-8 lg:gap-14 items-center`}>
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-accent-dark mb-4">{label}</div>
        <h3 className="font-display text-primary text-[26px] sm:text-[30px] font-semibold tracking-[-0.025em] leading-[1.1]">{heading}</h3>
        <p className="mt-4 text-ink-soft text-[15.5px] lg:text-[16px] leading-[1.6] max-w-[460px]">{body}</p>
        <ul className="mt-6 grid gap-2.5 max-w-[460px]">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14.5px] text-ink-soft"><span className="mt-0.5 w-5 h-5 rounded-full bg-primary-soft text-primary grid place-items-center shrink-0"><Icon.Check w={12} /></span>{b}</li>
          ))}
        </ul>
      </div>
      <div className={`relative ${reverse ? "lg:order-1" : ""}`}>
        <div aria-hidden className="absolute -inset-6 rounded-3xl" style={{ background: "radial-gradient(60% 60% at 60% 40%, rgba(31,77,58,0.10), transparent 70%)" }} />
        <div className="relative">{mock}</div>
      </div>
    </div>
  );
}

function PlatformFeatures() {
  const more = [
    { icon: "User", name: "Speaker directory" },
    { icon: "Network", name: "Attendee networking" },
    { icon: "Chat", name: "Live Q&A & polls" },
    { icon: "Briefcase", name: "Sponsor tools" },
    { icon: "Scan", name: "Offline QR check-in" },
    { icon: "Trophy", name: "Gamification" },
  ];
  return (
    <section id="platform" className="relative">
      <div className="mx-auto max-w-[1180px] px-5 lg:px-10 pt-24 lg:pt-32 pb-20 lg:pb-28">
        <div className="text-center max-w-[720px] mx-auto mb-16 lg:mb-24">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">The complete toolkit</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 52)}>
            One platform. Every phase of your event.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55]">
            Stop stitching together a ticketing tool, a spreadsheet, and a design app. Karta runs the whole thing.
          </p>
        </div>

        <div className="grid gap-20 lg:gap-28">
          <TourRow
            label="Registration & ticketing"
            heading="A booking page that actually converts"
            body="Spin up a beautiful public event page with free or paid tickets, custom forms, and African payment methods built in — no developer required."
            bullets={["Early-bird, VIP, group & promo pricing", "Stripe, Flutterwave, Paystack & M-Pesa", "Custom registration questions"]}
            mock={<EventPageMock />}
          />
          <TourRow
            reverse
            label="Programme"
            heading="Build a multi-track agenda in minutes"
            body="Drag sessions onto a clean time grid, assign speakers and rooms, and publish to attendees instantly. Changes sync everywhere in real time."
            bullets={["Unlimited tracks, days & rooms", "Speaker profiles & session pages", "Personal agendas for every attendee"]}
            mock={<AgendaMock />}
          />
          <TourRow
            label="On the day & after"
            heading="Check people in, then see what worked"
            body="Scan attendees at the door from any phone — even offline — and watch a live dashboard of registrations, revenue, attendance and card shares."
            bullets={["Offline-ready QR check-in", "Real-time registration funnel", "Revenue, engagement & virality analytics"]}
            mock={<DashboardMock />}
          />
        </div>

        {/* Everything else, included */}
        <div className="mt-20 lg:mt-28">
          <div className="text-center font-mono text-[10.5px] tracking-[0.22em] uppercase text-muted mb-7">And everything else, included</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {more.map((f, i) => {
              const IconC = Icon[f.icon];
              return (
                <div key={i} className="cardly-edge bg-surface border border-border rounded-2xl p-5 flex flex-col items-center text-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><IconC w={20} /></span>
                  <span className="text-[12.5px] font-medium text-ink leading-tight">{f.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Metrics band — premium social-proof numbers on forest
// ────────────────────────────────────────────────────────────────────
function MetricsBand() {
  const metrics = [
    ["12,800+", "events powered"],
    ["1.2M", "attendees registered"],
    ["740k", "cards shared"],
    ["40+", "countries"],
  ];
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0D1F17 0%,#1F4D3A 60%,#235741 120%)" }}>
      <div aria-hidden className="cardly-mesh cardly-mesh-cta" />
      <div className="relative mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6 text-center">
          {metrics.map((m, i) => (
            <div key={i}>
              <div className="font-mono text-cream text-[34px] sm:text-[42px] tracking-tight leading-none">{m[0]}</div>
              <div className="font-mono text-[10.5px] tracking-[0.16em] uppercase text-accent mt-3">{m[1]}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 5 — "The feature Eventbrite can't give you" (card reveal)
// ────────────────────────────────────────────────────────────────────
function KartaDifference() {
  const bullets = [
    "Generated automatically at registration — no designer needed",
    "Their photo, their name, your brand — every card unique",
    "One tap to Instagram, WhatsApp, X, LinkedIn",
    "Every share reaches people who haven't heard of your event yet",
  ];
  return (
    <section className="relative overflow-hidden bg-primary-soft/30 border-y border-border/70">
      <div aria-hidden className="cardly-mesh cardly-mesh-solution" />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-center">
        {/* LEFT */}
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase rounded-full px-3 py-1 mb-5" style={{ color: "#C9A45E", border: "1px solid rgba(201,164,94,0.5)" }}>
            The Karta difference
          </div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            Every attendee leaves with a card worth sharing.
          </h2>
          <p className="mt-5 text-ink-soft text-[16px] lg:text-[17px] leading-[1.6] max-w-[460px]">
            On every other platform, registration ends with a confirmation email. On
            Karta, it ends with a moment. The moment your attendee generates their
            personalized event card, they become your best marketing channel.
          </p>
          <ul className="mt-7 space-y-3 max-w-[470px]">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink-soft leading-[1.5]">
                <span className="mt-0.5 text-primary shrink-0"><Icon.Check w={16} /></span>
                {b}
              </li>
            ))}
          </ul>
          <a href="#how" className="mt-7 inline-flex items-center gap-1.5 font-medium text-[14px] hover:gap-2.5 transition-all" style={{ color: "#C9A45E" }}>
            See how it works <Icon.Arrow w={14} />
          </a>
        </div>

        {/* RIGHT — reveal sequence */}
        <div className="relative h-[440px] sm:h-[480px]">
          <div aria-hidden className="hero-card-halo" style={{ inset: "-10%" }} />
          {/* Back — registration form */}
          <div className="absolute left-0 top-[4%] w-[62%] hidden sm:block" style={{ transform: "rotate(-5deg)", opacity: 0.82 }}>
            <RegFormMock generating />
          </div>
          {/* Front — finished card with gold glow */}
          <div className="absolute right-[4%] bottom-0 sm:right-[6%]">
            <div className="relative">
              <div
                aria-hidden
                className="absolute"
                style={{ inset: "-26%", background: "radial-gradient(50% 50% at 50% 50%, rgba(232,197,126,0.6), transparent 62%)", filter: "blur(26px)" }}
              />
              <div className="relative hero-float-soft" style={{ filter: "drop-shadow(0 26px 44px rgba(15,31,24,0.4))" }}>
                <CardPreview width={236} />
              </div>
              <div className="absolute -top-2 -left-3 sm:-left-6 flex items-center gap-1.5 bg-surface border border-border rounded-full px-3 py-1.5 shadow-md">
                <Icon.Sparkle w={12} style={{ color: "#C9A45E" }} />
                <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink-soft">Generated in 2s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 6 — "How Karta works" (5-step lifecycle)
// ────────────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: "1", title: "Create your event", sub: "Design your event page. Add cover photo, description, venue, date.", visual: <EventCreateMock /> },
    { n: "2", title: "Set up tickets", sub: "Free or paid. Early bird, VIP, general — with promo codes.", visual: <TicketsMock /> },
    { n: "3", title: "Build your agenda", sub: "Multi-track schedule, speakers, session descriptions.", visual: <AgendaMock /> },
    { n: "4", title: "Attendees register", sub: "They fill a form, pay if needed, and get their Karta Card.", visual: <RegFormMock /> },
    { n: "5", title: "You track everything", sub: "Check-ins, session attendance, networking, card shares — in real time.", visual: <DashboardMock /> },
  ];
  return (
    <section id="how" className="relative">
      <div className="mx-auto max-w-[1240px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="text-center max-w-[680px] mx-auto mb-14 lg:mb-20">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">How Karta works</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            From first ticket to last card shared.
          </h2>
        </div>

        <div className="relative grid gap-y-12 lg:grid-cols-5 lg:gap-x-5">
          {/* Connecting line (desktop) */}
          <div aria-hidden className="hidden lg:block absolute top-[11px] left-[10%] right-[10%] h-px" style={{ background: "linear-gradient(to right, rgba(201,164,94,0.25), #C9A45E, rgba(201,164,94,0.25))" }} />
          {steps.map((s, i) => (
            <div key={i} className="relative flex flex-col">
              {/* dot + number */}
              <div className="flex items-center gap-3 lg:flex-col lg:items-start mb-4">
                <span className="relative z-10 w-[22px] h-[22px] rounded-full bg-accent grid place-items-center font-mono text-[11px] font-semibold text-primary-dark shrink-0 ring-4 ring-cream">
                  {s.n}
                </span>
                <h3 className="font-display text-[18px] font-semibold text-primary tracking-tight lg:mt-3.5">{s.title}</h3>
              </div>
              <p className="text-ink-soft text-[13.5px] leading-[1.5] mb-5 lg:min-h-[58px]">{s.sub}</p>
              <div className="mt-auto">{s.visual}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <a href="#" className="cardly-cta inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-primary text-cream font-medium hover:bg-primary-dark">
            Start your first event <Icon.Arrow w={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 7 — "Built for every type of event" (use-case covers)
// ────────────────────────────────────────────────────────────────────
function CoverArt({ from, via, to, angle = 135, icon, glow }) {
  const IconC = Icon[icon];
  return (
    <div className="relative h-[150px] overflow-hidden" style={{ background: `linear-gradient(${angle}deg, ${from} 0%, ${via} 55%, ${to} 100%)` }}>
      <div aria-hidden className="absolute inset-0" style={{ background: glow }} />
      {/* topo lines */}
      <svg aria-hidden viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.12 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d={`M -40 ${30 + i * 30} Q 110 ${-5 + i * 30} 220 ${55 + i * 30} T 460 ${35 + i * 30}`} fill="none" stroke="#E8C57E" strokeWidth="1.2" />
        ))}
      </svg>
      <div className="absolute right-4 bottom-4 opacity-30" style={{ color: "#FAF6EE" }}>
        <IconC w={48} />
      </div>
    </div>
  );
}

function UseCases() {
  const cases = [
    { cat: "Tech Conferences", body: "Multi-track agendas, speaker directories, startup networking.", icon: "Grid", art: { from: "#163828", via: "#1F4D3A", to: "#2A6A50", glow: "radial-gradient(60% 80% at 90% 10%, rgba(232,197,126,0.3), transparent 60%)" } },
    { cat: "NGO Campaigns", body: "Supporter cards, awareness drives, fundraising registration.", icon: "Network", art: { from: "#1F4D3A", via: "#2A6A50", to: "#3E7E5E", angle: 150, glow: "radial-gradient(70% 70% at 10% 90%, rgba(232,197,126,0.26), transparent 60%)" } },
    { cat: "Political Events", body: "Rally registration, volunteer coordination, endorsement cards.", icon: "Users", art: { from: "#163828", via: "#1F4D3A", to: "#1F4D3A", angle: 120, glow: "radial-gradient(60% 90% at 80% 100%, rgba(201,164,94,0.3), transparent 55%)" } },
    { cat: "Corporate Events", body: "Brand activations, product launches, lead retrieval for sponsors.", icon: "Briefcase", art: { from: "#1F4D3A", via: "#2A6A50", to: "#C9A45E", angle: 130, glow: "radial-gradient(55% 80% at 95% 50%, rgba(232,197,126,0.34), transparent 55%)" } },
    { cat: "Religious Organizations", body: "Community conferences, Ramadan iftar events, charity drives.", icon: "Sun", art: { from: "#163828", via: "#1F4D3A", to: "#2A6A50", angle: 160, glow: "radial-gradient(70% 70% at 30% 20%, rgba(232,197,126,0.28), transparent 60%)" } },
  ];
  return (
    <section id="use-cases" className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[760px] mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">Use cases</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            Whatever you're organizing, Karta handles it.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {cases.map((c, i) => (
            <article key={i} className="cardly-edge group bg-surface border border-border rounded-2xl overflow-hidden flex flex-col">
              <CoverArt {...c.art} icon={c.icon} />
              <div className="p-6 flex-1">
                <h3 className="font-display text-[18px] font-semibold text-primary tracking-tight">{c.cat}</h3>
                <p className="mt-2 text-ink-soft text-[14px] leading-[1.55]">{c.body}</p>
              </div>
            </article>
          ))}

          {/* African Summits — the hometown card */}
          <article className="group rounded-2xl overflow-hidden flex flex-col relative" style={{ background: "linear-gradient(160deg, #163828 0%, #1F4D3A 100%)" }}>
            <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 100% 0%, rgba(232,197,126,0.22), transparent 55%)" }} />
            <div className="relative h-[150px] overflow-hidden flex items-end p-6">
              <svg aria-hidden viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.14 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <path key={i} d={`M -40 ${30 + i * 30} Q 110 ${-5 + i * 30} 220 ${55 + i * 30} T 460 ${35 + i * 30}`} fill="none" stroke="#E8C57E" strokeWidth="1.2" />
                ))}
              </svg>
              <div className="relative inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-primary-dark bg-accent px-2.5 py-1 rounded-full font-semibold">
                <span className="inline-flex items-center gap-0.5" aria-hidden>
                  <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "linear-gradient(to bottom, #6AB04C 33%, #FFFFFF 33% 66%, #44A5E0 66%)" }} />
                  <span className="inline-block w-2 h-2" style={{ background: "#D62828", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
                </span>
                Built for Africa
              </div>
            </div>
            <div className="relative p-6 pt-0 flex-1">
              <h3 className="font-display text-[18px] font-semibold tracking-tight" style={{ color: "#E8C57E" }}>African Summits</h3>
              <p className="mt-2 text-cream/80 text-[14px] leading-[1.55]">
                Mobile-first, WhatsApp-native, Flutterwave payments. Built for how Africa events run.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { PlatformFeatures, TourRow, MetricsBand, KartaDifference, HowItWorks, UseCases, CoverArt });
