// Sections 4-7: Platform features, Karta difference, 5-step lifecycle, use cases

// ────────────────────────────────────────────────────────────────────
// SECTION 4 — "One platform. Every phase of your event."
// ────────────────────────────────────────────────────────────────────
function PlatformFeatures() {
  const features = [
    { icon: "Ticket", name: "Registration & Tickets", body: "Free and paid tickets, custom forms, Stripe + Flutterwave." },
    { icon: "Layout", name: "Event Pages", body: "Beautiful public pages with photos, agenda preview, and ticket CTAs." },
    { icon: "Scan", name: "QR Check-in", body: "Scan attendees at the door with any phone. Offline-ready." },
    { icon: "Grid", name: "Agenda Builder", body: "Multi-track drag-and-drop schedule on a clean time grid." },
    { icon: "User", name: "Speaker Directory", body: "Full profiles, session assignments, and speaker portals." },
    { icon: "Network", name: "Attendee Networking", body: "Profiles, 1:1 messaging, and curated AI connection suggestions." },
    { icon: "Chat", name: "Live Q&A & Polls", body: "Real-time session engagement that actually gets used." },
    { icon: "Briefcase", name: "Sponsor Tools", body: "Exhibitor booths, lead retrieval, and sponsor showcases." },
    { icon: "Chart", name: "Analytics", body: "Registration funnel, session engagement, revenue, and card virality." },
  ];
  return (
    <section id="platform" className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="text-center max-w-[680px] mx-auto mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">Everything for your event</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            One platform. Every phase of your event.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55]">
            From the first ticket sale to the last card shared.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const IconC = Icon[f.icon];
            return (
              <div key={i} className="cardly-edge bg-surface border border-border rounded-lg p-7">
                <span className="inline-grid place-items-center w-10 h-10 rounded-lg bg-primary-soft text-primary mb-5">
                  <IconC w={22} />
                </span>
                <h3 className="font-display text-[16px] font-semibold text-primary tracking-tight">{f.name}</h3>
                <p className="mt-2 text-ink-soft text-[14px] leading-[1.55]">{f.body}</p>
              </div>
            );
          })}
        </div>

        {/* Karta Card — the accent tile, full width */}
        <div
          className="relative mt-4 rounded-lg overflow-hidden border"
          style={{ borderColor: "#E8C57E" }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, #163828 0%, #1F4D3A 42%, #2A6A50 70%, #C9A45E 130%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(50% 90% at 88% 50%, rgba(232,197,126,0.42), transparent 60%)",
            }}
          />
          <div className="relative grid lg:grid-cols-[1.3fr_1fr] items-center gap-6 p-7 lg:p-9">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-primary-dark bg-accent px-2.5 py-1 rounded-full font-semibold mb-4">
                <Icon.Sparkle w={11} /> Unique to Karta
              </div>
              <h3 className="font-display text-[26px] lg:text-[30px] font-normal tracking-[-0.02em]" style={{ color: "#E8C57E" }}>
                Karta Card
              </h3>
              <p className="mt-2.5 text-cream/85 text-[15px] lg:text-[16px] leading-[1.55] max-w-[460px]">
                Every attendee gets a personalized, branded card at registration —
                the feature no other event platform has.
              </p>
            </div>
            <div className="hidden lg:flex justify-end pr-4">
              <div className="flex items-end gap-3" style={{ filter: "drop-shadow(0 20px 30px rgba(15,31,24,0.4))" }}>
                <MiniCard width={104} variant="cream" org="MTN ACTIVATION" event="MTN 5G is here." role="I'M CELEBRATING" name="Chidinma O." initials="CO" title="Ambassador" date="01 SEP" location="ACCRA" />
                <div style={{ marginBottom: 14 }}>
                  <MiniCard width={124} variant="gold" org="AFRICA TECH FEST" event="Africa Tech Festival 2026" role="I'M SPEAKING AT" name="Kwame Mensah" initials="KM" title="Product Engineer" date="12 MAR" location="LAGOS" />
                </div>
              </div>
            </div>
          </div>
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

Object.assign(window, { PlatformFeatures, KartaDifference, HowItWorks, UseCases, CoverArt });
