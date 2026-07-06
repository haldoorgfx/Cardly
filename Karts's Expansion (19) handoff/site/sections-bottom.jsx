// Sections 8-12: Pricing, Testimonial, FAQ, Final CTA, Footer

// ────────────────────────────────────────────────────────────────────
// SECTION 8 — Pricing
// ────────────────────────────────────────────────────────────────────
function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      blurb: "For trying Karta",
      features: [
        "1 active event",
        "Up to 50 registrations",
        "Basic event page",
        "QR check-in",
        "Karta Card for every attendee",
        "Karta watermark on cards",
      ],
      cta: "Start free",
      kind: "ghost",
    },
    {
      name: "Pro",
      price: "$19",
      blurb: "For organizers running real events",
      features: [
        "Unlimited events",
        "Up to 500 registrations/month",
        "Full agenda builder",
        "Speaker directory",
        "Attendee networking",
        "1:1 messaging",
        "Remove Karta watermark",
        "Email notifications",
        "Basic analytics",
      ],
      cta: "Start Pro",
      kind: "fill",
      popular: true,
    },
    {
      name: "Studio",
      price: "$49",
      blurb: "For agencies and large events",
      plus: "Everything in Pro, plus:",
      features: [
        "Unlimited registrations",
        "AI matchmaking",
        "Live Q&A & Polls",
        "Gamification & leaderboard",
        "Sponsor tools & lead retrieval",
        "Multiple brand kits",
        "3 team seats",
        "API access",
        "Priority support",
      ],
      cta: "Start Studio",
      kind: "fill",
    },
  ];

  return (
    <section id="pricing" className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="text-center max-w-[680px] mx-auto mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">Pricing</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            Start free. Pay as you grow.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {tiers.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-2xl bg-surface flex flex-col overflow-hidden ${
                t.popular ? "lg:-mt-3 lg:mb-3 shadow-xl shadow-primary/10" : "border border-border"
              }`}
              style={t.popular ? { border: "1px solid #E8C57E" } : undefined}
            >
              {/* Header band */}
              <div className={`px-7 pt-6 pb-5 ${t.popular ? "bg-primary-soft border-b border-accent/30" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="font-display text-[15px] font-semibold text-primary tracking-tight">{t.name}</div>
                  {t.popular && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] uppercase bg-accent text-primary-dark px-2 py-1 rounded-full font-semibold">
                      <Icon.Star w={10} /> Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-mono font-medium text-primary tracking-[-0.02em]" style={{ fontSize: 32 }}>{t.price}</span>
                  <span className="text-[14px] text-muted">per month</span>
                </div>
                <div className="mt-1.5 text-[14px] text-ink-soft">{t.blurb}</div>
              </div>

              {/* Features */}
              <div className="px-7 py-6 flex-1 flex flex-col">
                {t.plus && (
                  <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-primary mb-3.5">{t.plus}</div>
                )}
                <ul className="space-y-2.5 flex-1">
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[14px] text-ink-soft">
                      <span className="mt-0.5 text-primary shrink-0"><Icon.Check w={15} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className={`mt-7 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium text-[14px] transition-colors ${
                    t.kind === "fill"
                      ? "cardly-cta bg-primary text-cream hover:bg-primary-dark"
                      : "border border-primary/25 text-primary hover:bg-primary-soft/60"
                  }`}
                >
                  {t.cta} <Icon.Arrow w={14} />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-9 text-center text-[14px] text-muted">
          All plans include the Karta Card feature. It's not an add-on — it's standard.{" "}
          <a href="pricing-page.html" className="text-primary font-medium hover:underline underline-offset-4">Compare all features →</a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 9 — Testimonial
// ────────────────────────────────────────────────────────────────────
function Testimonial() {
  return (
    <section className="relative border-y border-border/70 bg-cream/40">
      <div className="mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-8">
          From organizers who've run real events on Karta
        </div>
        <div className="text-accent mx-auto mb-6 inline-flex"><Icon.Quote w={38} /></div>
        <blockquote className="font-display font-normal text-primary text-[24px] sm:text-[30px] lg:text-[34px] leading-[1.25] tracking-[-0.015em]">
          "We ran registration, check-in and the agenda on Karta — but the cards are
          what people remember. 600 attendees, 740 cards shared. The reach was 10x
          what our email kit ever did."
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <PhotoCircle initials="AY" size={40} ring="rgba(31, 77, 58, 0.15)" />
          <div className="text-left">
            <div className="font-display font-semibold text-ink text-[15px] tracking-tight">Amara Yusuf</div>
            <div className="text-ink-soft text-[12px] font-mono tracking-[0.12em] uppercase">Comms Lead · Pan-African Climate Summit</div>
          </div>
        </div>
        <div className="mt-3 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
          [placeholder — replace with real quote after beta interviews]
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 10 — FAQ
// ────────────────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      q: "Is Karta a full event platform, or just cards?",
      a: "A full platform. Karta runs your event end to end — registration and ticketing, a public event page, a multi-track agenda, speaker directory, QR check-in, attendee networking, Q&A, sponsor tools, and analytics. The personalized Karta Card is the one thing no other platform has, not the whole thing.",
    },
    {
      q: "How is Karta different from Eventbrite or Whova?",
      a: "Same core toolkit — registration, tickets, agenda, check-in, networking — plus the part they can't do: every registrant automatically gets a personalized, branded card to share. Registration stops being a confirmation email and becomes a marketing moment. We're also built mobile- and WhatsApp-first for how events actually run in Africa.",
    },
    {
      q: "Do attendees need to download an app?",
      a: "No. Attendees register, get their card, network, and check in entirely from a web link on their phone. No app, no account creation required to register and get a card.",
    },
    {
      q: "What payment methods do you support?",
      a: "Card payments via Stripe, plus Flutterwave, Paystack, M-Pesa and MTN MoMo for African organizers. Free and paid tickets, early-bird, VIP and promo codes are all supported.",
    },
    {
      q: "Does every plan include the Karta Card?",
      a: "Yes. The Karta Card is standard on every plan, including Free — it's not an upsell. Free events show a small Karta watermark on cards; Pro and Studio remove it.",
    },
    {
      q: "Can I check attendees in without internet at the door?",
      a: "Yes. QR check-in works offline on any phone and syncs once you're back online — built for venues with patchy connectivity.",
    },
    {
      q: "What's included in AI matchmaking and networking?",
      a: "Pro includes attendee profiles, 1:1 messaging and a networking directory. Studio adds curated AI connection suggestions that match attendees by interests, goals and sessions — so the right people actually meet.",
    },
    {
      q: "Can I move from a spreadsheet or another platform?",
      a: "Yes. Import your registrant list by CSV, recreate your agenda in the builder, and you're live. Most organizers have a working event page in about ten minutes.",
    },
  ];

  const [open, setOpen] = React.useState(0);
  return (
    <section className="">
      <div className="mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="mb-10 lg:mb-14 text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">FAQ</div>
          <h2 className="font-display text-primary" style={titleStyle(32, 4.4, 50)}>
            Questions we get every week.
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`bg-surface border rounded-xl overflow-hidden transition-colors ${isOpen ? "border-primary/40" : "border-border"}`}>
                <button onClick={() => setOpen(isOpen ? -1 : i)} className="w-full flex items-center justify-between gap-4 text-left px-5 lg:px-6 py-4 lg:py-5">
                  <span className="font-display font-semibold text-ink text-[16px] lg:text-[18px] tracking-tight">{it.q}</span>
                  <span className={`text-primary transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}><Icon.ChevDown w={18} /></span>
                </button>
                {isOpen && (
                  <div className="px-5 lg:px-6 pb-5 lg:pb-6 -mt-1 text-ink-soft text-[15px] leading-[1.6] max-w-[760px]">{it.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 11 — Final CTA (forest-to-gold mesh, white text)
// ────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden" style={{ background: "linear-gradient(150deg, #163828 0%, #1F4D3A 55%, #235741 100%)" }}>
      <div aria-hidden className="cardly-mesh cardly-mesh-cta" />
      <div
        aria-hidden
        className="absolute -bottom-40 right-0 w-[640px] h-[640px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,197,126,0.3), transparent 65%)", filter: "blur(40px)" }}
      />
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-24 lg:py-28 text-center">
        <h2 className="font-display text-cream" style={titleStyle(34, 4.8, 58, 1.06)}>
          Your next event deserves better than a spreadsheet and a Canva template.
        </h2>
        <p className="mt-6 text-cream/80 text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px] mx-auto">
          Set up your event in 10 minutes. Everything else follows.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href="#" className="cardly-cta-accent inline-flex items-center gap-2 px-7 py-4 rounded-full bg-accent text-primary-dark font-semibold text-[16px] hover:bg-accent-dark">
            Start free <Icon.Arrow w={17} />
          </a>
          <a href="#" className="inline-flex items-center gap-2 px-7 py-4 rounded-full border border-cream/30 text-cream font-medium hover:bg-cream/10 transition-colors text-[15px]">
            Talk to us
          </a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 12 — Footer (5 columns)
// ────────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    { title: "Platform", links: ["Registration", "Agenda", "Speakers", "Check-in", "Networking", "Analytics", "Karta Card"] },
    { title: "Use Cases", links: ["Conferences", "NGOs", "Political", "Corporate", "Religious", "African Events"] },
    { title: "Company", links: ["About", "Blog", "Contact", "Partners", "Careers"] },
    { title: "Resources", links: ["Help Center", "API Docs", "Status", "Changelog"] },
    { title: "Legal", links: ["Privacy", "Terms"] },
  ];
  return (
    <footer className="bg-primary-dark text-cream/85 relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-20 pb-8">
        <div className="grid gap-10 grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_0.8fr]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span aria-hidden className="inline-block w-6 h-6 rounded-md" style={{ background: "linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)" }} />
              <span className="font-display text-[24px] font-bold tracking-tight text-cream">Karta</span>
            </div>
            <p className="text-cream/65 text-[14px] leading-[1.55] max-w-[280px]">
              The event platform that makes every attendee proud to be there.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {[Icon.Linkedin, Icon.Twitter, Icon.Instagram].map((Ic, i) => (
                <a key={i} href="#" className="w-9 h-9 grid place-items-center rounded-full border border-cream/15 hover:bg-cream/10 hover:border-cream/30 transition-colors">
                  <Ic w={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c, i) => (
            <div key={i}>
              <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase mb-4">{c.title}</div>
              <ul className="space-y-2.5">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href="#" className="text-[14px] text-cream/75 hover:text-cream transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-cream/55 text-[13px]">© 2026 Karta. Built for organizers everywhere, with Africa at the heart.</div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-accent bg-cream/5 border border-cream/15 px-3 py-1.5 rounded-full">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-2 rounded-sm" style={{ background: "linear-gradient(to bottom, #6AB04C 33%, #FFFFFF 33% 66%, #44A5E0 66%)" }} />
              <span className="inline-block w-2 h-2" style={{ background: "#D62828", clipPath: "polygon(0 0, 100% 50%, 0 100%)" }} />
            </span>
            Made in Djibouti
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Pricing, Testimonial, FAQ, FinalCTA, Footer });
