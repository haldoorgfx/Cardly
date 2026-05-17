import Link from "next/link";

const USE_CASES = [
  {
    label: "Tech Conferences & Summits",
    color: "linear-gradient(135deg,#1b1240,#4b2d7a)",
    textColor: "text-white",
    scenarios: [
      {
        event: "Africa Tech Festival 2026",
        description:
          'Speakers get a branded "I\'m speaking at ATF" card. Attendees get an "I\'m attending" version with their name and company. Both versions, one design, one link per audience segment.',
      },
      {
        event: "GITEX Africa",
        description:
          "300 exhibitors, 4,000 registered attendees. The design team uploads one card template, sets two zones (name + company), and shares the link in the confirmation email. Cards are downloaded before the event opens.",
      },
    ],
  },
  {
    label: "Youth & Student Events",
    color: "linear-gradient(135deg,#0a3d2e,#1f8a5b)",
    textColor: "text-white",
    scenarios: [
      {
        event: "Pan-African Youth Forum",
        description:
          "Delegates from 30 countries, each with a different title (Delegate, Observer, Facilitator). One card design, one zone for role — each person fills in their own. No manual editing by the organizer.",
      },
      {
        event: "University Entrepreneurship Summit",
        description:
          "Student organizers with zero design budget. They use a Canva-exported PNG as the background, define a photo zone and name zone, publish, and paste the link into WhatsApp groups.",
      },
    ],
  },
  {
    label: "Cultural Festivals",
    color: "linear-gradient(135deg,#6c63ff,#f8a4d8)",
    textColor: "text-white",
    scenarios: [
      {
        event: "Lagos Design Week",
        description:
          "The festival's visual identity is already designed — bold typography, specific Pantone colors. Cardly lets that identity extend to every attendee's social post, without giving attendees access to the source files.",
      },
      {
        event: "Nairobi Film Festival",
        description:
          "Film fans share that they're attending specific screenings. The card design changes per screening; the zone for the film title is editable. Organic social reach, zero extra work from the marketing team.",
      },
    ],
  },
  {
    label: "Corporate & Government Events",
    color: "linear-gradient(135deg,#0f0f1a,#1e1e3a)",
    textColor: "text-white",
    scenarios: [
      {
        event: "IGAD Summit",
        description:
          "Official delegate cards with country flags and ministry titles. The design follows protocol guidelines — Cardly just makes each delegate's name and role personalized without reprinting anything.",
      },
      {
        event: "Brand Activation Campaign",
        description:
          "A telecom running a regional campaign gives supporters a branded card to share on Instagram. The campaign team tracks how many cards were generated per city from the analytics dashboard.",
      },
    ],
  },
  {
    label: "NGO & Advocacy Campaigns",
    color: "linear-gradient(135deg,#1a4a3a,#2d7a5b)",
    textColor: "text-white",
    scenarios: [
      {
        event: "Climate Action Coalition",
        description:
          "Supporters share a card showing their pledge: their name, their city, their commitment. The organizer defined the zones; each supporter fills in their own version in 30 seconds.",
      },
      {
        event: "Women in Tech Africa",
        description:
          "Conference attendees get a card template designed by the organization's in-house designer. No template tool involved — the designer's Figma export becomes the card background.",
      },
    ],
  },
  {
    label: "Awards & Recognition",
    color: "linear-gradient(135deg,#3d2a00,#7a5500)",
    textColor: "text-white",
    scenarios: [
      {
        event: "African Innovation Awards",
        description:
          "Nominees share a card announcing their nomination. Winners get a different card — same event, two published links. The design team controls which version each group gets.",
      },
      {
        event: "Company All-Hands",
        description:
          "Employee of the month cards, team award announcements. HR uploads the design, fills in the winner's name themselves, downloads, shares to Slack. Done in two minutes.",
      },
    ],
  },
];

export default function UseCasesPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-6 pt-20 pb-14">
        <div className="max-w-2xl">
          <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-4">
            USE CASES
          </div>
          <h1 className="font-display font-bold text-[48px] sm:text-[60px] leading-[1.02] tracking-tight">
            What organizers actually use it for.
          </h1>
          <p className="mt-5 text-[17px] text-brand-ink/65 max-w-[520px] leading-relaxed">
            Cardly works for any event where attendees want to share that
            they&apos;re there. Here&apos;s how different organizers use it.
          </p>
        </div>
      </section>

      {/* Use case grid */}
      <section className="max-w-[1240px] mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-8">
          {USE_CASES.map((uc) => (
            <div
              key={uc.label}
              className="rounded-3xl overflow-hidden border border-brand-border"
            >
              {/* Category header */}
              <div
                className="px-7 py-5"
                style={{ background: uc.color }}
              >
                <div
                  className={`font-display font-bold text-[20px] ${uc.textColor}`}
                >
                  {uc.label}
                </div>
              </div>

              {/* Scenarios */}
              <div className="bg-white divide-y divide-brand-border">
                {uc.scenarios.map((s) => (
                  <div key={s.event} className="px-7 py-6">
                    <div className="font-mono text-[11px] tracking-widest text-brand-primary mb-2">
                      {s.event.toUpperCase()}
                    </div>
                    <p className="text-[15px] text-brand-ink/75 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="rounded-3xl border border-brand-border bg-brand-offwhite p-10 lg:p-14 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-display font-bold text-[28px] sm:text-[32px]">
              Don&apos;t see your use case?
            </h2>
            <p className="mt-2 text-[16px] text-brand-ink/65">
              Email us — if your event has a design and needs attendee cards,
              Cardly can probably do it.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href="mailto:hello@cardly.app"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-brand-ink border border-brand-border rounded-xl px-5 py-3 hover:bg-white transition"
            >
              Email us
            </a>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-white grad-bg rounded-xl px-5 py-3 hover:opacity-95 transition"
            >
              Try it free
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
