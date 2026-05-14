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
    <section className="relative bg-[#0a0a0a] overflow-hidden">
      {/* Mesh gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute"
          style={{
            top: "-15%",
            left: "50%",
            transform: "translateX(-30%)",
            width: "800px",
            height: "600px",
            background:
              "radial-gradient(ellipse, rgba(31,77,58,0.6) 0%, transparent 70%)",
            filter: "blur(90px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "20%",
            right: "-5%",
            width: "400px",
            height: "400px",
            background:
              "radial-gradient(ellipse, rgba(232,197,126,0.18) 0%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: "-5%",
            left: "-5%",
            width: "350px",
            height: "350px",
            background:
              "radial-gradient(ellipse, rgba(31,77,58,0.3) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Vignette — fades dots at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 40%, #0a0a0a 100%)",
        }}
      />

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-0 md:pt-40 md:pb-0 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] text-[11px] font-medium text-white/55 uppercase tracking-widest px-4 py-1.5 rounded-full mb-10">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#1F4D3A" }}
          />
          For event organizers
        </div>

        {/* Heading */}
        <h1 className="text-[52px] md:text-[72px] lg:text-[88px] font-bold leading-[0.92] tracking-[-0.03em] text-white">
          Personalized event cards,
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #E8C57E 0%, #a8d5a2 50%, #2A9E64 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            at scale.
          </span>
        </h1>

        {/* Subtext */}
        <p className="mt-7 text-[16px] md:text-[18px] text-white/45 max-w-[460px] mx-auto leading-relaxed">
          Upload your design. Define zones. Share one link — attendees
          personalize and download in seconds.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="h-11 px-6 bg-white text-[#0a0a0a] text-[14px] font-semibold rounded-lg hover:bg-neutral-100 transition inline-flex items-center gap-2"
          >
            Create your first event
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="#how"
            className="h-11 px-6 border border-white/12 text-white/60 text-[14px] font-medium rounded-lg hover:bg-white/[0.06] hover:text-white/90 transition inline-flex items-center"
          >
            See how it works
          </a>
        </div>

        <p className="mt-8 text-[13px] text-white/25">
          Trusted by 1,000+ event organizers across Africa
        </p>

        {/* Hero mockup */}
        <HeroMockup />
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="mt-16 relative">
      {/* Glow beneath cards */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "20% 10%",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.5) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Cards fan */}
      <div className="relative flex items-end justify-center gap-3 pb-0">
        {/* Left card */}
        <div
          className="hidden md:block w-[180px] rounded-xl overflow-hidden flex-shrink-0 opacity-40"
          style={{
            height: "252px",
            background:
              "linear-gradient(155deg, #0a2540 0%, #1b4f72 50%, #7be0c0 130%)",
            transform: "rotate(-8deg) translateY(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <MockCard name="Kwame O." role="CEO · TechHub" />
        </div>

        {/* Center card — main */}
        <div
          className="w-[240px] md:w-[280px] rounded-xl overflow-hidden flex-shrink-0 relative"
          style={{
            aspectRatio: "3/4",
            background:
              "linear-gradient(155deg, #0F1F18 0%, #1F4D3A 55%, #E8C57E 130%)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "0 0 0 1px rgba(232,197,126,0.15), 0 40px 80px rgba(0,0,0,0.6)",
          }}
        >
          <MockCard name="Ifeoma A." role="Brand Strategist" large />
          {/* Glow on top edge */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(232,197,126,0.6), transparent)",
            }}
          />
        </div>

        {/* Right card */}
        <div
          className="hidden md:block w-[180px] rounded-xl overflow-hidden flex-shrink-0 opacity-40"
          style={{
            height: "252px",
            background:
              "linear-gradient(155deg, #1b1240 0%, #3a2068 50%, #f8a4d8 130%)",
            transform: "rotate(8deg) translateY(16px)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <MockCard name="Amara K." role="Product Designer" />
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #0a0a0a)",
        }}
      />
    </div>
  );
}

function MockCard({
  name,
  role,
  large = false,
}: {
  name: string;
  role: string;
  large?: boolean;
}) {
  return (
    <div className="h-full p-4 flex flex-col justify-between">
      <div className="opacity-30">
        <span className="text-white font-mono text-[7px] tracking-[0.18em]">
          CARDLY · EVENT
        </span>
      </div>
      <div className="flex items-center justify-center">
        <div
          className="rounded-full border border-white/25 bg-white/10"
          style={{ width: large ? 72 : 52, height: large ? 72 : 52 }}
        />
      </div>
      <div>
        <div
          className="text-white font-bold leading-tight"
          style={{ fontSize: large ? 15 : 12 }}
        >
          {name}
        </div>
        <div
          className="text-white/45 mt-0.5"
          style={{ fontSize: large ? 11 : 9 }}
        >
          {role}
        </div>
        <div className="text-white/20 font-mono text-[7px] tracking-widest mt-2">
          I&apos;M ATTENDING
        </div>
      </div>
    </div>
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
    <section className="bg-white border-b border-neutral-100 py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-medium text-neutral-400 uppercase tracking-widest mb-6">
          Used by teams behind
        </p>
        <div className="relative overflow-hidden">
          {/* Left fade */}
          <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10"
            style={{ background: "linear-gradient(to right, white, transparent)" }} />
          {/* Right fade */}
          <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
            style={{ background: "linear-gradient(to left, white, transparent)" }} />
          <div className="flex items-center gap-14 whitespace-nowrap">
            <div className="flex items-center gap-14 animate-[marquee_28s_linear_infinite]">
              {[...LOGOS, ...LOGOS].map((name, i) => (
                <span
                  key={i}
                  className="text-[14px] font-medium text-neutral-400"
                >
                  {name}
                </span>
              ))}
            </div>
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
    <section
      id="how"
      className="relative overflow-hidden py-28 lg:py-36"
      style={{ background: "#0F1F18" }}
    >
      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Mesh blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(232,197,126,0.1) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          left: "-5%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.5) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Label */}
        <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-4">
          How it works
        </div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-white tracking-tight leading-tight">
          Simple by design.
        </h2>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.n}
              className="rounded-xl p-7"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span
                className="font-bold leading-none select-none"
                style={{
                  fontSize: 56,
                  background: "linear-gradient(135deg, #1F4D3A, rgba(31,77,58,0.1))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  display: "block",
                  lineHeight: 1,
                }}
              >
                {step.n}
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-white leading-snug">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] text-white/45 leading-relaxed">
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
    <section
      className="relative py-28 overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,31,24,0.09) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Radial fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, #FAF6EE 100%)",
        }}
      />
      {/* Mesh blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          right: "-5%",
          width: "450px",
          height: "450px",
          background:
            "radial-gradient(ellipse, rgba(232,197,126,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="text-[11px] font-mono text-[#1F4D3A]/60 tracking-widest uppercase mb-4">
              The problem
            </div>
            <h2 className="text-[28px] md:text-[38px] font-bold text-[#0F1F18] tracking-tight leading-tight">
              Your attendees deserve more than a generic badge.
            </h2>
            {/* Decorative line */}
            <div
              className="mt-8 w-12 h-[3px] rounded-full"
              style={{
                background: "linear-gradient(90deg, #1F4D3A, #E8C57E)",
              }}
            />
          </div>

          <div className="space-y-6 pt-2">
            {points.map((point, i) => (
              <div
                key={point}
                className="flex items-start gap-4 p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(229,224,212,0.8)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] shrink-0 mt-0.5"
                  style={{ background: "#1F4D3A" }}
                >
                  {i + 1}
                </div>
                <p className="text-[15px] text-[#3A4A42] leading-relaxed">
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
const FEATURE_ICONS = [
  // Upload icon
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  // Layers / zones icon
  '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  // Share icon
  '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
];

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
    <section className="relative bg-white py-28 overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,31,24,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-[11px] font-mono text-[#1F4D3A]/60 tracking-widest uppercase mb-4">
          Built for designers
        </div>
        <h2 className="text-[28px] md:text-[36px] font-bold text-[#0a0a0a] tracking-tight mb-14">
          Everything you need. Nothing you don&apos;t.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="relative rounded-xl p-7 group hover:-translate-y-1 transition-all duration-200"
              style={{
                background: "#ffffff",
                border: "1px solid #E5E0D4",
                boxShadow: "0 1px 3px rgba(15,31,24,0.04)",
              }}
            >
              {/* Gradient top line */}
              <div
                className="absolute top-0 left-6 right-6 h-px rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(31,77,58,0.4), rgba(232,197,126,0.4), transparent)",
                }}
              />

              {/* Icon */}
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center mb-5"
                style={{
                  background: "rgba(31,77,58,0.07)",
                  border: "1px solid rgba(31,77,58,0.12)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1F4D3A"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: FEATURE_ICONS[i] }}
                />
              </div>

              <h3 className="text-[16px] font-semibold text-[#0F1F18]">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] text-neutral-500 leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA link */}
        <div className="mt-12 flex items-center gap-2">
          <Link
            href="/pricing"
            className="text-[14px] font-medium text-[#1F4D3A] hover:text-[#163828] transition inline-flex items-center gap-1.5"
          >
            See all features
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIAL ────────────────────────────────────────────────────── */
function TestimonialSection() {
  return (
    <section
      className="relative py-28 overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Mesh */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.35) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Huge decorative quote mark */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 select-none pointer-events-none font-bold leading-none"
        style={{
          fontSize: 280,
          color: "rgba(255,255,255,0.025)",
          lineHeight: 0.8,
        }}
      >
        &ldquo;
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, #0a0a0a 100%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <blockquote className="text-[24px] md:text-[32px] font-semibold text-white leading-snug tracking-tight">
          &ldquo;Cardly let our identity actually travel with our attendees.
          Every share felt like the festival had designed it.&rdquo;
        </blockquote>
        <figcaption className="mt-10 flex items-center justify-center gap-3">
          <div
            className="h-10 w-10 rounded-full shrink-0"
            style={{
              background: "linear-gradient(135deg, #1F4D3A, #E8C57E)",
            }}
          />
          <div className="text-left">
            <div className="text-[14px] font-semibold text-white">
              Ifeoma Adesanya
            </div>
            <div className="text-[13px] text-white/40">
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
    <section
      className="relative py-28 text-center overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #0F1F18 0%, #1a3828 60%, #0F2A1C 100%)",
      }}
    >
      {/* Mesh blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(232,197,126,0.18) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-20%",
          right: "10%",
          width: "400px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.6) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(15,31,24,0.8) 100%)",
        }}
      />

      {/* Grid lines — architectural */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6">
        <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-6">
          Get started
        </div>
        <h2 className="text-[36px] md:text-[48px] font-bold text-white tracking-tight leading-tight">
          Ready to ship your first card?
        </h2>
        <p className="mt-4 text-[16px] text-white/45 leading-relaxed">
          Set up an event in under five minutes. Free forever for one event.
        </p>

        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="h-11 px-6 bg-white text-[#0F1F18] text-[14px] font-semibold rounded-lg hover:bg-neutral-100 transition inline-flex items-center gap-2"
          >
            Get started free
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <Link
            href="/pricing"
            className="h-11 px-6 border border-white/15 text-white/60 text-[14px] font-medium rounded-lg hover:bg-white/[0.06] hover:text-white/90 transition inline-flex items-center"
          >
            View pricing
          </Link>
        </div>

        <p className="mt-8 text-[12px] text-white/25">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}
