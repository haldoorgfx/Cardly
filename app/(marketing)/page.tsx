import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoStrip />
      <HowItWorksSection />
      <ProblemValueSection />
      <FeatureHighlightsSection />
      <TestimonialSection />
      <FinalCtaSection />
    </>
  );
}

/* ─── HERO ──────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="py-24 md:py-36 text-center">
      <div className="max-w-4xl mx-auto px-6">
        <span className="inline-flex items-center gap-2 border border-neutral-200 text-[12px] font-medium text-neutral-500 uppercase tracking-widest px-3 py-1.5 rounded-full">
          For event organizers
        </span>

        <h1 className="mt-8 text-[48px] md:text-[64px] lg:text-[80px] font-bold leading-none tracking-tight text-[#0a0a0a]">
          Personalized event cards,
          <br />
          at scale.
        </h1>

        <p className="mt-6 text-[16px] text-neutral-500 max-w-[480px] mx-auto leading-relaxed">
          Upload your event design. Define editable zones. Share one link —
          attendees personalize and download in seconds.
        </p>

        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="h-10 px-5 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-md hover:bg-neutral-800 transition inline-flex items-center gap-2"
          >
            Create your first event
            <ArrowIcon />
          </Link>
          <a
            href="#how"
            className="h-10 px-5 border border-neutral-300 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition inline-flex items-center"
          >
            See how it works
          </a>
        </div>

        <p className="mt-8 text-[13px] text-neutral-400">
          Trusted by 1,000+ event organizers across Africa
        </p>
      </div>
    </section>
  );
}

/* ─── LOGO STRIP ─────────────────────────────────────────────────────── */
const LOGOS = [
  "GITEX Africa",
  "Pan-African Youth Forum",
  "IGAD Summit",
  "Africa AI",
  "Africa Tech Festival",
  "Moonshot ·26",
  "Lagos Design Week",
  "DevFest Nairobi",
];

function LogoStrip() {
  return (
    <section className="border-y border-neutral-100 py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-6">
          Used by teams behind
        </p>
        <div className="flex items-center gap-14 whitespace-nowrap overflow-hidden">
          <div className="flex items-center gap-14 animate-[marquee_28s_linear_infinite]">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span
                key={i}
                className="text-[15px] font-medium text-neutral-400"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    {
      n: "01",
      title: "Upload your design",
      body: "Drop a PNG or JPG. Bring your own typography, colors, and layout. We don't touch a pixel.",
    },
    {
      n: "02",
      title: "Define editable zones",
      body: "Drag boxes over the canvas. Name, role, company, photo — configure fonts and shapes.",
    },
    {
      n: "03",
      title: "Share one link",
      body: "Attendees open the link on their phone, fill in their info, and download in seconds.",
    },
  ];

  return (
    <section id="how" className="py-24 lg:py-32">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-[28px] font-bold text-[#0a0a0a] tracking-tight">
          Simple by design.
        </h2>

        <div className="mt-16 grid md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.n}>
              <span className="text-[48px] font-bold text-neutral-100 leading-none select-none">
                {step.n}
              </span>
              <h3 className="mt-3 text-[17px] font-semibold text-[#0a0a0a]">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] text-neutral-500 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PROBLEM / VALUE ────────────────────────────────────────────────── */
function ProblemValueSection() {
  const points = [
    "Attendees get a card that actually looks like your event",
    "No Canva. No Google Slides. No back-and-forth with a team",
    "Your design file stays yours — attendees never see it",
  ];

  return (
    <section className="py-24 border-t border-neutral-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-[28px] md:text-[34px] font-bold text-[#0a0a0a] tracking-tight leading-tight">
              Your attendees deserve more than a generic badge.
            </h2>
          </div>

          <div className="space-y-6 pt-1">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <span className="mt-1 text-[#1F4D3A] font-bold text-[14px] shrink-0">
                  —
                </span>
                <p className="text-[15px] text-neutral-500 leading-relaxed">
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURE HIGHLIGHTS ─────────────────────────────────────────────── */
function FeatureHighlightsSection() {
  const features = [
    {
      title: "Upload any design",
      body: "Export from Figma, Illustrator, or Photoshop. PNG or JPG, any resolution. Your craft, untouched.",
    },
    {
      title: "Define editable zones",
      body: "Draw zones over your design. Set fonts, sizes, alignment, and shapes for each field.",
    },
    {
      title: "Share one link",
      body: "One URL. Attendees fill in their info on mobile and download a ready-to-share PNG.",
    },
  ];

  return (
    <section className="py-24 border-t border-neutral-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-10">
          {features.map((f) => (
            <div key={f.title}>
              <div className="w-4 h-[2px] bg-[#1F4D3A] mb-5" />
              <h3 className="text-[17px] font-semibold text-[#0a0a0a]">
                {f.title}
              </h3>
              <p className="mt-2 text-[15px] text-neutral-500 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIAL ────────────────────────────────────────────────────── */
function TestimonialSection() {
  return (
    <section className="py-24 border-t border-neutral-100">
      <div className="max-w-3xl mx-auto px-6">
        <blockquote className="text-[26px] md:text-[32px] font-semibold text-[#0a0a0a] leading-snug tracking-tight">
          &ldquo;Cardly let our identity actually travel with our attendees.
          Every share felt like the festival had designed it.&rdquo;
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-3">
          <span className="h-10 w-10 rounded-full bg-neutral-200 shrink-0" />
          <div>
            <div className="text-[14px] font-semibold text-[#0a0a0a]">
              Ifeoma Adesanya
            </div>
            <div className="text-[13px] text-neutral-500">
              Brand Lead · Africa Tech Festival
            </div>
          </div>
        </figcaption>
      </div>
    </section>
  );
}

/* ─── FINAL CTA BAND ─────────────────────────────────────────────────── */
function FinalCtaSection() {
  return (
    <section className="bg-[#0a0a0a] py-24 text-center">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-[32px] md:text-[40px] font-bold text-white tracking-tight leading-tight">
          Ready to ship your first card?
        </h2>
        <p className="mt-4 text-[15px] text-neutral-400 leading-relaxed">
          Set up an event in under five minutes. Free forever for one event.
        </p>
        <div className="mt-8">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-10 px-6 bg-white text-[#0a0a0a] text-[14px] font-medium rounded-md hover:bg-neutral-100 transition"
          >
            Get started free
            <ArrowIcon dark />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── SHARED ─────────────────────────────────────────────────────────── */
function ArrowIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={dark ? "#0a0a0a" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
