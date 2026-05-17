// Sections 8-13: Features, Pricing, Testimonial, FAQ, Final CTA, Footer

// ────────────────────────────────────────────────────────────────────
// SECTION 8 — Feature highlights
// ────────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    {
      label: "VARIANTS",
      icon: <Icon.Layers w={20} />,
      title: "One event, multiple roles",
      body: "Attendees, speakers, sponsors — each gets their own card layout from a single design.",
    },
    {
      label: "PHOTO CROP",
      icon: <Icon.Crop w={20} />,
      title: "Smart photo cropping",
      body: "Matches your zone shape — circle, square, hexagon, rounded — automatically.",
    },
    {
      label: "LIVE PREVIEW",
      icon: <Icon.Eye w={20} />,
      title: "What they see is what they get",
      body: "Attendees see their card update as they type. No surprises at download.",
    },
    {
      label: "SHARE BUILT-IN",
      icon: <Icon.Share w={20} />,
      title: "One tap to every platform",
      body: "Instagram Stories, WhatsApp Status, X, Facebook — with caption suggestions.",
    },
    {
      label: "AFRICA-FIRST",
      icon: <Icon.Globe w={20} />,
      title: "Built for how Africa scrolls",
      body: "Low-bandwidth networks, mobile-first phones, WhatsApp-first sharing.",
    },
    {
      label: "NO ACCOUNTS",
      icon: <Icon.UserOff w={20} />,
      title: "Attendees never sign up",
      body: "They tap the link, make their card, move on. No friction. No funnel.",
    },
  ];

  return (
    <section className="bg-primary text-cream relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[760px] mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-accent uppercase mb-5">
            What's inside
          </div>
          <h2 className="font-display font-bold text-cream text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em]">
            Built like a serious tool. Used like a link.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-cream/10 rounded-2xl overflow-hidden border border-cream/15">
          {features.map((f, i) => (
            <div
              key={i}
              className="cardly-edge cardly-edge-on-dark bg-primary p-6 lg:p-7 hover:bg-primary-dark transition-colors"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-10 h-10 rounded-lg grid place-items-center bg-cream/10 text-accent border border-cream/15">
                  {f.icon}
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">
                  {f.label}
                </span>
              </div>
              <h3 className="font-display font-semibold text-cream text-[20px] lg:text-[22px] tracking-[-0.02em] leading-[1.15]">
                {f.title}
              </h3>
              <p className="mt-2.5 text-cream/70 text-[14px] lg:text-[15px] leading-[1.55]">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 9 — Pricing teaser
// ────────────────────────────────────────────────────────────────────
function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      blurb: "For small campaigns and trials",
      features: ["1 event", "Up to 50 cards", "Cardly watermark", "Email support"],
      cta: "Start free",
      style: "default",
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      blurb: "For most organizers",
      features: [
        "5 events",
        "Unlimited cards",
        "No watermark",
        "3 variants per event",
        "Basic analytics",
      ],
      cta: "Start Pro trial",
      style: "primary",
      badge: "Most popular",
    },
    {
      name: "Studio",
      price: "$99",
      period: "/month",
      blurb: "For agencies and large campaigns",
      features: [
        "Unlimited events",
        "Unlimited cards",
        "Unlimited variants",
        "Brand kit",
        "Team accounts",
        "Priority support",
      ],
      cta: "Start Studio trial",
      style: "default",
    },
  ];

  return (
    <section id="pricing" className="">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="max-w-[760px] mb-12 lg:mb-16">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            Pricing
          </div>
          <h2 className="font-display font-bold text-ink text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.02] tracking-[-0.03em]">
            Pay only when you grow.
          </h2>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55]">
            Start free. Upgrade when your campaign goes bigger than 50 cards.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {tiers.map((t, i) => {
            const isPrimary = t.style === "primary";
            return (
              <div
                key={i}
                className={`cardly-edge relative rounded-3xl p-7 lg:p-8 flex flex-col ${
                  isPrimary
                    ? "bg-primary text-cream shadow-xl shadow-primary/20 lg:scale-[1.02]"
                    : "bg-surface border border-border"
                }`}
              >
                {t.badge && (
                  <div className="absolute -top-3 right-7 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase bg-accent text-primary-dark px-2.5 py-1 rounded-full font-semibold">
                    <Icon.Star w={11} /> {t.badge}
                  </div>
                )}
                <div
                  className={`font-display text-[14px] font-medium tracking-tight ${
                    isPrimary ? "text-accent" : "text-primary"
                  }`}
                >
                  {t.name}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`font-display font-bold tracking-[-0.03em] text-[44px] ${
                      isPrimary ? "text-cream" : "text-ink"
                    }`}
                  >
                    {t.price}
                  </span>
                  {t.period && (
                    <span
                      className={`text-[14px] ${
                        isPrimary ? "text-cream/65" : "text-muted"
                      }`}
                    >
                      {t.period}
                    </span>
                  )}
                </div>
                <div
                  className={`mt-1.5 text-[14px] ${
                    isPrimary ? "text-cream/75" : "text-ink-soft"
                  }`}
                >
                  {t.blurb}
                </div>

                <ul className="mt-7 space-y-3">
                  {t.features.map((f, j) => (
                    <li
                      key={j}
                      className={`flex items-start gap-2.5 text-[14px] ${
                        isPrimary ? "text-cream/90" : "text-ink-soft"
                      }`}
                    >
                      <span
                        className={`mt-0.5 ${
                          isPrimary ? "text-accent" : "text-primary"
                        }`}
                      >
                        <Icon.Check w={15} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors ${
                    isPrimary
                      ? "cardly-cta-accent bg-accent text-primary-dark hover:bg-accent-dark"
                      : "cardly-cta bg-ink text-cream hover:bg-primary"
                  }`}
                >
                  {t.cta} <Icon.Arrow w={14} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-primary font-medium text-[14px] hover:gap-2.5 transition-all"
          >
            See full pricing details <Icon.Arrow w={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 10 — Testimonial
// ────────────────────────────────────────────────────────────────────
function Testimonial() {
  return (
    <section className="relative border-y border-border/70">
      <div className="mx-auto max-w-[860px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <div className="text-accent mx-auto mb-6 inline-flex">
          <Icon.Quote w={40} />
        </div>
        <blockquote className="font-display font-medium text-ink text-[26px] sm:text-[32px] lg:text-[38px] leading-[1.2] tracking-[-0.02em] italic">
          "Cardly let us turn 600 attendees into 600 brand ambassadors. The reach
          was 10x what we expected — and the visual identity stayed locked the whole
          way."
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <PhotoCircle initials="AY" size={40} ring="rgba(31, 77, 58, 0.15)" />
          <div className="text-left">
            <div className="font-display font-semibold text-ink text-[15px] tracking-tight">
              Amara Yusuf
            </div>
            <div className="text-ink-soft text-[12px] font-mono tracking-[0.12em] uppercase">
              Comms Lead · Pan-African Climate Summit
            </div>
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
// SECTION 11 — FAQ
// ────────────────────────────────────────────────────────────────────
function FAQ() {
  const items = [
    {
      q: "Do attendees need to sign up?",
      a: "No. Attendees never create an account. They tap your link, fill in their name, upload a photo if your card has one, and download. The whole flow takes under 30 seconds.",
    },
    {
      q: "What file formats can I upload as my design?",
      a: "PNG and JPG. Export from Canva, Figma, Illustrator, or Photoshop. Cardly works at any aspect ratio — portrait Instagram cards, landscape Twitter cards, square LinkedIn cards.",
    },
    {
      q: "Can I have different cards for different roles?",
      a: "Yes. Pro and Studio plans support variants — Attendee, Speaker, Sponsor, Volunteer. Each variant can have its own copy, badge, or layout, all generated from the same base design.",
    },
    {
      q: "Can attendees crop their photos?",
      a: "Yes. Cardly auto-crops to your zone shape (circle, square, hexagon, rounded) and lets attendees pinch-zoom and reposition before downloading.",
    },
    {
      q: "Where can attendees share their card?",
      a: "Anywhere. The download button is followed by one-tap share buttons for Instagram Stories, WhatsApp Status, X, Facebook, and LinkedIn — each with a suggested caption you can pre-write.",
    },
    {
      q: "What languages does Cardly support?",
      a: "Editor UI ships in English, French, Arabic, and Swahili. The attendee form accepts any Unicode text — you can write your card prompts in any language.",
    },
    {
      q: "Can I see analytics on who downloaded their card?",
      a: "Pro and Studio plans include a dashboard with download count, share-platform breakdown, top sharers, and time-of-day patterns. No personal data is collected from attendees.",
    },
    {
      q: "How is Cardly different from Canva templates?",
      a: "Canva templates need every attendee to open Canva, learn the editor, find the right file, and re-save. Cardly is one link — they tap, type, download, share. Most attendees finish in under a minute.",
    },
  ];

  const [open, setOpen] = React.useState(0);

  return (
    <section className="">
      <div className="mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-28">
        <div className="mb-10 lg:mb-14 text-center">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            FAQ
          </div>
          <h2 className="font-display font-bold text-ink text-[34px] sm:text-[42px] lg:text-[48px] leading-[1.02] tracking-[-0.03em]">
            Questions we get every week.
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`bg-surface border rounded-xl overflow-hidden transition-colors ${
                  isOpen ? "border-primary/40" : "border-border"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 lg:px-6 py-4 lg:py-5"
                >
                  <span className="font-display font-semibold text-ink text-[16px] lg:text-[18px] tracking-tight">
                    {it.q}
                  </span>
                  <span
                    className={`text-primary transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <Icon.ChevDown w={18} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 lg:px-6 pb-5 lg:pb-6 -mt-1 text-ink-soft text-[15px] leading-[1.6] max-w-[720px]">
                    {it.a}
                  </div>
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
// SECTION 12 — Final CTA
// ────────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="cardly-mesh cardly-mesh-cta" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232, 197, 126, 0.25), transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-24 lg:py-32 text-center">
        <h2 className="font-display font-bold text-ink text-[44px] sm:text-[58px] lg:text-[72px] leading-[0.98] tracking-[-0.035em]">
          Start your first campaign today.
        </h2>
        <p className="mt-6 text-ink-soft text-[18px] lg:text-[19px] leading-[1.55] max-w-[640px] mx-auto">
          Free for up to 50 cards. No credit card. Most users have their first card
          ready in under five minutes.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            className="cardly-cta inline-flex items-center gap-2 px-7 py-4 rounded-full bg-primary text-cream font-medium text-[16px] hover:bg-primary-dark"
          >
            Start free <Icon.Arrow w={17} />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors text-[15px]"
          >
            or see a live example <Icon.Arrow w={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// SECTION 13 — Footer
// ────────────────────────────────────────────────────────────────────
function Footer() {
  const cols = [
    {
      title: "Product",
      links: ["Use cases", "How it works", "Pricing", "What's new"],
    },
    {
      title: "Company",
      links: ["About", "Blog", "Contact", "Partners"],
    },
    {
      title: "Resources",
      links: ["Help center", "Privacy", "Terms", "Status"],
    },
  ];
  return (
    <footer className="bg-primary-dark text-cream/85 relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-20 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                aria-hidden
                className="inline-block w-6 h-6 rounded-md"
                style={{
                  background:
                    "linear-gradient(135deg, #FAF6EE 0%, #E8C57E 100%)",
                }}
              />
              <span className="font-display text-[24px] font-bold tracking-tight text-cream">
                Cardly
              </span>
            </div>
            <p className="text-cream/65 text-[14px] leading-[1.55] max-w-[280px]">
              Personalized share cards for every campaign.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {[Icon.Linkedin, Icon.Twitter, Icon.Instagram].map((Ic, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 grid place-items-center rounded-full border border-cream/15 hover:bg-cream/10 hover:border-cream/30 transition-colors"
                >
                  <Ic w={15} />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c, i) => (
            <div key={i}>
              <div className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase mb-4">
                {c.title}
              </div>
              <ul className="space-y-2.5">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      className="text-[14px] text-cream/75 hover:text-cream transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-cream/55 text-[13px]">
            © 2026 Cardly. Built with care for organizers everywhere.
          </div>
          <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-accent bg-cream/5 border border-cream/15 px-3 py-1.5 rounded-full">
            <span className="inline-flex items-center gap-1">
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
    </footer>
  );
}

Object.assign(window, {
  Features,
  Pricing,
  Testimonial,
  FAQ,
  FinalCTA,
  Footer,
});
