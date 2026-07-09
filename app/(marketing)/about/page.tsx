import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-[900px] mx-auto px-6 pt-20 pb-14">
        <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-4">
          ABOUT
        </div>
        <h1 className="font-display font-bold text-[48px] sm:text-[60px] leading-[1.02] tracking-tight text-balance">
          Built in Djibouti,
          <br />
          <span className="grad-text">for the world.</span>
        </h1>
      </section>

      {/* Story */}
      <section className="max-w-[900px] mx-auto px-6 pb-16">
        <div className="prose-like space-y-6 text-[17px] text-brand-ink/75 leading-[1.75]">
          <p>
            I kept seeing the same problem at events. An organizer hires a
            designer to make beautiful &ldquo;I&apos;m attending&rdquo; social
            cards. The design is done. It looks great. Then the question comes:
            how do 400 attendees get their own version?
          </p>
          <p>
            The answer, every time, was the same: a Canva template, a Dropbox
            link, and a voice note explaining how to edit it. Half the attendees
            couldn&apos;t figure it out. The other half did it wrong. The
            designer ended up making 80 individual versions manually, the night
            before the event.
          </p>
          <p>
            Cardly exists to fix that. You upload your design — the real one,
            the one your designer spent time on — and define which parts
            attendees can personalize. Then you share one link. Attendees open
            it on their phone, fill in their name and photo, and download their
            own version in under a minute. No Canva. No instructions. No
            designer doing it manually at midnight.
          </p>
          <p>
            The product is built for designers, not for template-pickers. Bring
            your own file. Keep your craft. The tool stays out of your way.
          </p>
        </div>
      </section>

      {/* Divider */}
      <section className="max-w-[900px] mx-auto px-6 pb-16">
        <div className="border-t border-brand-border" />
      </section>

      {/* Values */}
      <section className="max-w-[900px] mx-auto px-6 pb-16">
        <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-8">
          WHAT WE CARE ABOUT
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Designer ownership",
              body: "Your design file never becomes our template. You own your craft. We make it shareable without touching a pixel.",
            },
            {
              title: "Works anywhere",
              body: "Built to run on any device, any connection speed. The attendee experience works on a phone in a conference hall or a slow hotel Wi-Fi.",
            },
            {
              title: "Honest software",
              body: "No fake stats on the landing page. No features listed that don't exist yet. If something's coming soon, we say so.",
            },
          ].map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-brand-border bg-white p-6"
            >
              <h3 className="font-display font-semibold text-[17px] mb-2">
                {v.title}
              </h3>
              <p className="text-[14px] text-brand-ink/65 leading-relaxed">
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-[900px] mx-auto px-6 pb-16">
        <div className="rounded-3xl border border-brand-border bg-brand-offwhite p-8 lg:p-10 grid sm:grid-cols-[auto_1fr] gap-7 items-start">
          <div
            className="h-16 w-16 rounded-2xl shrink-0"
            style={{
              background: "linear-gradient(135deg,#1F4D3A 0%,#2A6A50 60%,#E8C57E 100%)",
            }}
          />
          <div>
            <div className="font-mono text-[11px] tracking-widest text-brand-ink/40 mb-2">
              FOUNDER
            </div>
            <div className="font-display font-bold text-[22px]">Abdalla</div>
            <p className="mt-2 text-[15px] text-brand-ink/65 leading-relaxed">
              Building Cardly alone for now. If you&apos;re interested in
              working on this — as a designer, engineer, or growth person —
              email me.
            </p>
            <a
              href="mailto:hello@cardly.app"
              className="inline-block mt-3 text-[14px] font-medium text-brand-primary hover:underline"
            >
              hello@cardly.app
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[900px] mx-auto px-6 pb-28">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-white grad-bg px-5 py-3 rounded-2xl hover:opacity-95 transition"
          >
            Try Cardly free
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-brand-ink border border-brand-border px-5 py-3 rounded-2xl hover:bg-brand-offwhite transition"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </>
  );
}
