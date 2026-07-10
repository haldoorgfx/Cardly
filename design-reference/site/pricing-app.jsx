// L3 — Pricing page
// Reuses Nav, Footer, Icon, FinalCTA from prior scripts.

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    blurb: "For trying Karta.",
    headline: "Get a feel for it.",
    features: [
      "1 active event",
      "Up to 50 registrations",
      "Basic event page",
      "QR check-in",
      "Karta Card for every attendee",
      "Karta watermark on cards",
    ],
    cta: "Start free",
    style: "default",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, yearly: 15 },
    blurb: "For organizers running real events.",
    headline: "When your event goes public.",
    features: [
      "Unlimited events",
      "Up to 500 registrations / month",
      "Full agenda builder",
      "Speaker directory",
      "Attendee networking + 1:1 messaging",
      "Remove Karta watermark",
      "Email notifications",
      "Basic analytics",
    ],
    cta: "Start Pro",
    style: "primary",
    badge: "Most popular",
  },
  {
    id: "studio",
    name: "Studio",
    price: { monthly: 49, yearly: 39 },
    blurb: "For agencies and large events.",
    headline: "The whole platform, unlocked.",
    features: [
      "Everything in Pro, plus:",
      "Unlimited registrations",
      "AI matchmaking",
      "Live Q&A & Polls",
      "Gamification & leaderboard",
      "Sponsor tools & lead retrieval",
      "Multiple brand kits + 3 team seats",
      "API access · Priority support",
    ],
    cta: "Start Studio",
    style: "default",
  },
];

const COMPARISON_GROUPS = [
  {
    title: "Registration & ticketing",
    rows: [
      ["Active events", "1", "Unlimited", "Unlimited"],
      ["Registrations", "50", "500 / mo", "Unlimited"],
      ["Free & paid tickets", true, true, true],
      ["Early-bird, VIP & promo codes", false, true, true],
      ["Custom registration forms", false, true, true],
      ["Stripe, Flutterwave, Paystack, M-Pesa", true, true, true],
    ],
  },
  {
    title: "Event experience",
    rows: [
      ["Public event page", true, true, true],
      ["QR check-in (offline-ready)", true, true, true],
      ["Multi-track agenda builder", false, true, true],
      ["Speaker directory & portals", false, true, true],
      ["Live Q&A & polls", false, false, true],
      ["Gamification & leaderboard", false, false, true],
    ],
  },
  {
    title: "Networking",
    rows: [
      ["Attendee profiles & directory", false, true, true],
      ["1:1 messaging", false, true, true],
      ["AI matchmaking suggestions", false, false, true],
    ],
  },
  {
    title: "The Karta Card",
    rows: [
      ["Personalized card for every attendee", true, true, true],
      ["Variants (attendee / speaker / sponsor)", true, true, true],
      ["Remove Karta watermark", false, true, true],
      ["Multiple brand kits", false, false, true],
      ["Card download as animated video", false, false, true],
    ],
  },
  {
    title: "Sponsors & analytics",
    rows: [
      ["Basic analytics", false, true, true],
      ["Registration funnel & card virality", false, true, true],
      ["Sponsor tools & lead retrieval", false, false, true],
      ["CSV export", false, false, true],
      ["API access & webhooks", false, false, true],
    ],
  },
  {
    title: "Team & support",
    rows: [
      ["Team seats", "1", "1", "3"],
      ["Email support", true, true, true],
      ["Priority support", false, false, true],
      ["Onboarding call with our team", false, false, true],
    ],
  },
];

// ────────────────────────────────────────────────────────────────────
// Pricing hero + billing toggle
// ────────────────────────────────────────────────────────────────────
function PricingHero({ billing, setBilling }) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="cardly-mesh cardly-mesh-hero" />
      <div className="relative mx-auto max-w-[1100px] px-5 lg:px-10 pt-16 lg:pt-24 pb-10 lg:pb-14 text-center">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Pricing
        </div>
        <h1 className="font-display text-primary max-w-[880px] mx-auto" style={titleStyle(40, 5.4, 72, 1.0)}>
          Simple pricing.{" "}
          <span className="text-primary">Pay only when you grow.</span>
        </h1>
        <p className="mt-6 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55] max-w-[640px] mx-auto">
          Start free with up to 50 registrations. Upgrade the day your event goes bigger.
          Cancel anytime. No setup fees, no contract.
        </p>

        {/* Billing toggle */}
        <div className="mt-9 inline-flex items-center gap-1 p-1 bg-surface border border-border rounded-full">
          {[
            ["monthly", "Monthly"],
            ["yearly", "Yearly"],
          ].map(([id, label]) => {
            const active = billing === id;
            return (
              <button
                key={id}
                onClick={() => setBilling(id)}
                className={`relative px-5 py-2.5 rounded-full text-[13px] font-medium transition-colors ${
                  active ? "bg-primary text-cream" : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
                {id === "yearly" && (
                  <span
                    className={`ml-2 text-[10px] font-mono tracking-[0.14em] uppercase px-1.5 py-0.5 rounded ${
                      active
                        ? "bg-accent text-primary-dark"
                        : "bg-primary-soft text-primary"
                    }`}
                  >
                    −20%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Plan cards
// ────────────────────────────────────────────────────────────────────
function PlanCard({ plan, billing }) {
  const isPrimary = plan.style === "primary";
  const price = plan.price[billing];
  return (
    <div
      className={`cardly-edge relative rounded-3xl p-7 lg:p-8 flex flex-col ${
        isPrimary
          ? "bg-primary text-cream shadow-xl shadow-primary/20"
          : "bg-surface border border-border"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-3 right-7 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase bg-accent text-primary-dark px-2.5 py-1 rounded-full font-semibold">
          <Icon.Star w={11} /> {plan.badge}
        </div>
      )}
      <div
        className={`font-display text-[14px] font-medium tracking-tight ${
          isPrimary ? "text-accent" : "text-primary"
        }`}
      >
        {plan.name}
      </div>
      <div
        className={`mt-1 font-display text-[16px] tracking-tight ${
          isPrimary ? "text-cream/85" : "text-ink"
        }`}
      >
        {plan.headline}
      </div>

      <div className="mt-5 flex items-baseline gap-1.5">
        <span
          className={`font-display font-bold tracking-[-0.03em] text-[48px] leading-none ${
            isPrimary ? "text-cream" : "text-ink"
          }`}
        >
          ${price}
        </span>
        <span
          className={`text-[14px] ${isPrimary ? "text-cream/65" : "text-muted"}`}
        >
          /month
        </span>
      </div>
      <div
        className={`mt-1.5 font-mono text-[10px] tracking-[0.16em] uppercase ${
          isPrimary ? "text-cream/55" : "text-muted"
        }`}
      >
        {billing === "yearly" ? `Billed $${price * 12} yearly` : "Billed monthly"}
        {plan.id !== "free" && billing === "yearly" && " · save 20%"}
      </div>

      <div
        className={`mt-3 text-[14px] ${
          isPrimary ? "text-cream/75" : "text-ink-soft"
        }`}
      >
        {plan.blurb}
      </div>

      <ul className="mt-7 space-y-3 flex-1">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 text-[14px] ${
              isPrimary ? "text-cream/90" : "text-ink-soft"
            }`}
          >
            <span className={isPrimary ? "text-accent" : "text-primary"}>
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
        {plan.cta} <Icon.Arrow w={14} />
      </a>
    </div>
  );
}

function PlansSection({ billing }) {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-10 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-5 items-stretch">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} billing={billing} />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Icon.Check w={14} /> Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon.Check w={14} /> No setup fees
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon.Check w={14} /> 14-day trial on paid plans
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Icon.Check w={14} /> Cards live forever
          </span>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Comparison table (collapsed by default)
// ────────────────────────────────────────────────────────────────────
function CellValue({ value, isPrimary }) {
  if (value === true)
    return (
      <span className={isPrimary ? "text-primary" : "text-success"}>
        <Icon.Check w={18} />
      </span>
    );
  if (value === false)
    return <span className="text-muted/50">—</span>;
  return (
    <span
      className={`font-display font-medium text-[14px] tracking-tight ${
        isPrimary ? "text-primary" : "text-ink"
      }`}
    >
      {value}
    </span>
  );
}

function ComparisonTable({ expanded, setExpanded }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1100px] px-5 lg:px-10 py-16 lg:py-20">
        <div className="text-center mb-10 lg:mb-12">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Full comparison
          </div>
          <h2 className="font-display text-primary" style={titleStyle(28, 3.8, 46)}>
            Compare every feature, side by side.
          </h2>
        </div>

        <div
          className={`relative bg-surface border border-border rounded-2xl overflow-hidden ${
            expanded ? "" : "max-h-[480px]"
          }`}
        >
          <table className="w-full text-left">
            <thead className="bg-cream/60 border-b border-border sticky top-0">
              <tr>
                <th className="py-4 px-5 lg:px-7 font-mono text-[10px] tracking-[0.22em] uppercase text-muted w-[40%] sm:w-auto">
                  Feature
                </th>
                <th className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-ink">
                  Free
                </th>
                <th className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-primary bg-primary-soft/40">
                  Pro
                </th>
                <th className="py-4 px-3 lg:px-5 text-center font-display text-[14px] font-semibold text-ink">
                  Studio
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_GROUPS.map((g, gi) => (
                <React.Fragment key={gi}>
                  <tr className="bg-cream/40">
                    <td
                      colSpan={4}
                      className="py-3 px-5 lg:px-7 font-mono text-[10px] tracking-[0.22em] uppercase text-primary border-t border-border"
                    >
                      {g.title}
                    </td>
                  </tr>
                  {g.rows.map(([label, free, pro, studio], ri) => (
                    <tr key={ri} className="border-t border-border/60">
                      <td className="py-3.5 px-5 lg:px-7 text-[14px] text-ink-soft leading-tight">
                        {label}
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center">
                        <CellValue value={free} />
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center bg-primary-soft/30">
                        <CellValue value={pro} isPrimary />
                      </td>
                      <td className="py-3.5 px-3 lg:px-5 text-center">
                        <CellValue value={studio} />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {!expanded && (
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0), #FAF6EE 80%)",
              }}
            />
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-surface text-ink font-medium text-[14px] hover:border-primary hover:text-primary transition-colors"
          >
            {expanded ? "Collapse comparison" : "Show all features"}
            <Icon.ChevDown
              w={15}
              style={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform .2s",
              }}
            />
          </button>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Pricing-specific FAQ
// ────────────────────────────────────────────────────────────────────
function PricingFAQ() {
  const items = [
    {
      q: "Can I switch plans anytime?",
      a: "Yes. Upgrade and the change takes effect immediately, prorated for the rest of your billing cycle. Downgrade and the change takes effect at the end of your current cycle.",
    },
    {
      q: "What happens to my event if I downgrade?",
      a: "Your event pages, registrations and the cards your attendees generated stay live forever — attendees can always re-download what they made. New registrations after a downgrade follow the limits of the new plan.",
    },
    {
      q: "Do you offer discounts for nonprofits, students, or political campaigns?",
      a: "Yes. Registered nonprofits get 40% off Pro and Studio. Verified educational institutions get 30% off. Email us with a letterhead or domain proof and we'll set you up within 24 hours.",
    },
    {
      q: "What counts as a registration?",
      a: "One registration = one attendee signing up for your event. Each registrant automatically gets their personalized Karta Card included — generating or re-downloading a card never counts as an extra registration.",
    },
    {
      q: "Can I pay annually by bank transfer or mobile money?",
      a: "Yes. Studio annual plans accept SWIFT bank transfer (USD/EUR/GBP), M-Pesa, MTN MoMo, and Paystack. Email billing@karta.app to set it up.",
    },
    {
      q: "Do you have an enterprise plan?",
      a: "Studio is our top tier and works for almost everyone. If you need volume seat licensing, custom MSA, or SSO via SAML, email us and we'll cut a custom Studio agreement — but the feature surface is the same.",
    },
    {
      q: "Can I get a refund?",
      a: "Yes — within the first 14 days of a paid plan, no questions asked. After that, we'll prorate any unused billing cycle if you cancel mid-cycle.",
    },
  ];
  const [open, setOpen] = React.useState(0);
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-24">
        <div className="mb-10 lg:mb-12">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Pricing FAQ
          </div>
          <h2 className="font-display text-primary" style={titleStyle(28, 3.6, 44)}>
            Money questions, answered.
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
                  <span className="font-display font-semibold text-ink text-[16px] lg:text-[17px] tracking-tight">
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
// Trust / refund strip
// ────────────────────────────────────────────────────────────────────
function TrustStrip() {
  const items = [
    { t: "14-day refund", b: "No questions. Cancel within 14 days for a full refund." },
    { t: "Cards live forever", b: "Even if you cancel — your attendee links never expire." },
    { t: "40% off for NGOs", b: "Verified nonprofits and registered campaigns get a discount." },
    { t: "Pay how you want", b: "Card, M-Pesa, MoMo, Paystack, SWIFT — we accept it." },
  ];
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border">
          {items.map((it, i) => (
            <div key={i} className="bg-cream p-5 lg:p-6">
              <div className="font-display font-semibold text-ink text-[18px] lg:text-[20px] tracking-tight">
                {it.t}
              </div>
              <div className="mt-2 text-ink-soft text-[13px] lg:text-[14px] leading-[1.5]">
                {it.b}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Final CTA — page-specific
// ────────────────────────────────────────────────────────────────────
function PricingCTA() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="cardly-mesh cardly-mesh-cta" />
      <div className="relative mx-auto max-w-[900px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <h2 className="font-display text-primary" style={titleStyle(34, 4.6, 56, 1.04)}>
          Start free. Upgrade when you're ready.
        </h2>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px] mx-auto">
          Most teams ship their first event on the Free plan, then upgrade the
          day they pass 50 registrations.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#"
            className="cardly-cta inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-cream font-medium hover:bg-primary-dark"
          >
            Start free <Icon.Arrow w={16} />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-primary hover:text-primary transition-colors text-[15px]"
          >
            Talk to sales <Icon.Arrow w={14} />
          </a>
        </div>
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────
// Page shell
// ────────────────────────────────────────────────────────────────────
function PricingApp() {
  const [billing, setBilling] = React.useState("yearly");
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="text-ink min-h-screen">
      <Nav />
      <main>
        <PricingHero billing={billing} setBilling={setBilling} />
        <PlansSection billing={billing} />
        <TrustStrip />
        <ComparisonTable expanded={expanded} setExpanded={setExpanded} />
        <PricingFAQ />
        <div className="section-wash" aria-hidden />
        <PricingCTA />
      </main>
      <Footer />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PricingApp />);
