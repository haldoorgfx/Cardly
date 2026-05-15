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

/* ── Shared decorative dot grid ───────────────────────────────────────── */
function DotGrid({ opacity = 0.06, size = 24 }: { opacity?: number; size?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(rgba(15,31,24,${opacity}) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/* ─── HERO ──────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      className="relative py-24 md:py-36 text-center overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Mesh gradient blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.1) 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-5%",
          width: "450px",
          height: "450px",
          background:
            "radial-gradient(ellipse, rgba(232,197,126,0.12) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Dot grid */}
      <DotGrid opacity={0.06} size={28} />

      {/* Vignette — fades dots at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 85% 75% at 50% 50%, transparent 40%, #FAF6EE 100%)",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 border border-[#E5E0D4] bg-white text-[12px] font-medium text-[#6B7A72] uppercase tracking-widest px-3 py-1.5 rounded-full">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "#1F4D3A" }}
          />
          For event organizers
        </span>

        {/* Heading */}
        <h1 className="mt-8 text-[48px] md:text-[64px] lg:text-[80px] font-bold leading-none tracking-tight text-[#0F1F18]">
          Personalized event cards,
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            at scale.
          </span>
        </h1>

        <p className="mt-6 text-[16px] text-[#6B7A72] max-w-[480px] mx-auto leading-relaxed">
          Upload your event design. Define editable zones. Share one link —
          attendees personalize and download in seconds.
        </p>

        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="h-10 px-5 text-white text-[14px] font-medium rounded-md hover:bg-[#163828] transition inline-flex items-center gap-2"
            style={{ background: "#1F4D3A" }}
          >
            Create your first event
            <ArrowIcon />
          </Link>
          <a
            href="#how"
            className="h-10 px-5 border border-[#E5E0D4] text-[14px] font-medium text-[#3A4A42] rounded-md hover:bg-[#E8EFEB] transition inline-flex items-center"
          >
            See how it works
          </a>
        </div>

        <p className="mt-8 text-[13px] text-[#6B7A72]">
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
    <section
      className="border-y border-[#E5E0D4] py-10 overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-medium text-[#6B7A72] uppercase tracking-widest mb-6">
          Used by teams behind
        </p>
        <div className="relative overflow-hidden">
          <div
            className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to right, #FAF6EE, transparent)",
            }}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10"
            style={{
              background: "linear-gradient(to left, #FAF6EE, transparent)",
            }}
          />
          <div className="flex items-center gap-14 whitespace-nowrap">
            <div className="flex items-center gap-14 animate-[marquee_28s_linear_infinite]">
              {[...LOGOS, ...LOGOS].map((name, i) => (
                <span key={i} className="text-[15px] font-medium text-[#6B7A72]">
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
      className="relative py-24 lg:py-32 overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Mesh blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          right: "-5%",
          width: "500px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />

      {/* Dot grid */}
      <DotGrid opacity={0.055} size={24} />

      {/* Architectural grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,31,24,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(15,31,24,0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-4">
          How it works
        </div>
        <h2 className="text-[28px] font-bold text-[#0F1F18] tracking-tight">
          Simple by design.
        </h2>

        <div className="mt-16 grid md:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.n}>
              <span
                className="font-bold leading-none select-none block"
                style={{
                  fontSize: 52,
                  background:
                    "linear-gradient(135deg, #1F4D3A, rgba(31,77,58,0.15))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  lineHeight: 1,
                }}
              >
                {step.n}
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-[#0F1F18]">
                {step.title}
              </h3>
              <p className="mt-2 text-[15px] text-[#6B7A72] leading-relaxed">
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
      className="relative py-24 border-t border-[#E5E0D4] overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Dot grid */}
      <DotGrid opacity={0.07} size={20} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, #FAF6EE 100%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-4">
              The problem
            </div>
            <h2 className="text-[28px] md:text-[34px] font-bold text-[#0F1F18] tracking-tight leading-tight">
              Your attendees deserve more than a generic badge.
            </h2>
            <div
              className="mt-8 w-12 h-[3px] rounded-full"
              style={{
                background: "linear-gradient(90deg, #1F4D3A, #E8C57E)",
              }}
            />
          </div>

          <div className="space-y-4 pt-1">
            {points.map((point, i) => (
              <div
                key={point}
                className="flex items-start gap-4 p-5 rounded-xl bg-white border border-[#E5E0D4]"
                style={{ boxShadow: "0 1px 2px rgba(15,31,24,0.04)" }}
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
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
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
    <section
      className="relative py-24 border-t border-[#E5E0D4] overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Dot grid */}
      <DotGrid opacity={0.05} size={24} />

      <div className="relative max-w-5xl mx-auto px-6">
        <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-4">
          Built for designers
        </div>
        <h2 className="text-[28px] md:text-[36px] font-bold text-[#0F1F18] tracking-tight mb-14">
          Everything you need. Nothing you don&apos;t.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="relative rounded-xl p-7 bg-white border border-[#E5E0D4] hover:-translate-y-1 transition-all duration-200"
              style={{ boxShadow: "0 1px 3px rgba(15,31,24,0.04)" }}
            >
              {/* Gradient top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-px rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(31,77,58,0.3), rgba(232,197,126,0.3), transparent)",
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
              <p className="mt-2 text-[14px] text-[#6B7A72] leading-relaxed">
                {f.body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
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
      className="relative py-24 border-t border-[#E5E0D4] overflow-hidden"
      style={{ background: "#FAF6EE" }}
    >
      {/* Mesh blob — centered green glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Dot grid */}
      <DotGrid opacity={0.06} size={24} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, #FAF6EE 100%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6">
        <blockquote className="text-[26px] md:text-[32px] font-semibold text-[#0F1F18] leading-snug tracking-tight">
          &ldquo;Cardly let our identity actually travel with our attendees.
          Every share felt like the festival had designed it.&rdquo;
        </blockquote>
        <figcaption className="mt-8 flex items-center gap-3">
          <span
            className="h-10 w-10 rounded-full shrink-0"
            style={{
              background: "linear-gradient(135deg, #1F4D3A, #E8C57E)",
            }}
          />
          <div>
            <div className="text-[14px] font-semibold text-[#0F1F18]">
              Ifeoma Adesanya
            </div>
            <div className="text-[13px] text-[#6B7A72]">
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
      className="relative py-24 text-center overflow-hidden"
      style={{ background: "#0F1F18" }}
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
            "radial-gradient(ellipse, rgba(232,197,126,0.15) 0%, transparent 70%)",
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
      {/* Architectural grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(15,31,24,0.8) 100%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-6">
        <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-6">
          Get started
        </div>
        <h2 className="text-[32px] md:text-[40px] font-bold text-white tracking-tight leading-tight">
          Ready to ship your first card?
        </h2>
        <p className="mt-4 text-[15px] text-white/45 leading-relaxed">
          Set up an event in under five minutes. Free forever for one event.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-10 px-6 bg-white text-[#0F1F18] text-[14px] font-medium rounded-md hover:bg-neutral-100 transition"
          >
            Get started free
            <ArrowIcon dark />
          </Link>
          <Link
            href="/pricing"
            className="h-10 px-6 border border-white/15 text-white/60 text-[14px] font-medium rounded-md hover:bg-white/[0.06] hover:text-white/90 transition inline-flex items-center"
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

/* ─── SHARED ─────────────────────────────────────────────────────────── */
function ArrowIcon({ dark }: { dark?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={dark ? "#0F1F18" : "currentColor"}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
