import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoStrip />
      <HowItWorksSection />
      <ShowcaseSection />
      <PricingTeaserSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

/* ─── HERO ──────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
          style={{
            background: "radial-gradient(closest-side, #f8a4d8, transparent)",
          }}
        />
        <div
          className="absolute -top-10 right-[-120px] h-[520px] w-[520px] rounded-full blur-3xl opacity-30"
          style={{
            background: "radial-gradient(closest-side, #6c63ff, transparent)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-20">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 text-[12px] font-medium tracking-wide px-3 py-1.5 rounded-full grad-border text-brand-ink/80">
              <span className="h-1.5 w-1.5 rounded-full grad-bg" />
              For event designers, not template-pickers
            </span>

            <h1 className="font-display font-bold text-[44px] sm:text-[56px] lg:text-[68px] leading-[1.02] mt-6 text-balance">
              Your design.
              <br />
              Their personalization.
              <br />
              <span className="grad-text">One link.</span>
            </h1>

            <p className="mt-6 text-[18px] leading-relaxed text-brand-ink/70 max-w-[540px]">
              Upload your event design. Define editable zones. Share one link —
              attendees personalize and download their own version. No Canva. No
              mess.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-white grad-bg px-5 py-3.5 rounded-2xl shadow-lift hover:opacity-95 transition"
              >
                Start free — no card needed
                <ArrowIcon />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 text-[15px] font-medium text-brand-ink/80 hover:text-brand-ink px-5 py-3.5 rounded-2xl border border-brand-border hover:bg-brand-offwhite transition"
              >
                <PlayIcon />
                See how it works
              </a>
            </div>

          </div>

          {/* Visual: Editor + Phone */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[5/4] w-full">
              {/* decorative shapes */}
              <div className="absolute -top-6 right-10 h-16 w-16 rounded-2xl grad-bg opacity-90 floatA" />
              <div className="absolute bottom-6 -left-4 h-10 w-10 rounded-full border-2 border-brand-primary/40 floatB" />
              <div className="absolute top-1/3 -right-4 h-4 w-4 rounded grad-bg floatA" />

              {/* Editor mock */}
              <div className="absolute top-0 left-0 w-[78%] rounded-2xl bg-white border border-brand-border shadow-lift overflow-hidden">
                {/* window chrome */}
                <div className="flex items-center justify-between px-4 h-9 border-b border-brand-border bg-brand-offwhite">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6058]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#27c83f]" />
                  </div>
                  <div className="text-[11px] font-mono text-brand-ink/50">
                    cardly.app/edit/web-summit-26
                  </div>
                  <div className="text-[11px] font-medium text-brand-primary">
                    ● Saved
                  </div>
                </div>
                {/* editor body */}
                <div className="grid grid-cols-[40px_1fr_120px] h-[260px]">
                  {/* left tools */}
                  <div className="border-r border-brand-border bg-white py-3 flex flex-col items-center gap-3">
                    <div className="h-7 w-7 rounded-lg grad-bg grid place-items-center text-white">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <path d="M4 7h16M4 12h10M4 17h16" />
                      </svg>
                    </div>
                    {[
                      <circle key="c" cx="12" cy="12" r="8" />,
                      <rect key="r" x="4" y="4" width="16" height="16" rx="2" />,
                      <path key="p" d="M12 5v14M5 12h14" strokeLinecap="round" />,
                    ].map((shape, i) => (
                      <div
                        key={i}
                        className="h-7 w-7 rounded-lg bg-brand-offwhite grid place-items-center text-brand-ink/60"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                        >
                          {shape}
                        </svg>
                      </div>
                    ))}
                  </div>
                  {/* canvas */}
                  <div className="relative bg-[radial-gradient(circle_at_20%_30%,#ffd6ec,transparent_50%),radial-gradient(circle_at_80%_70%,#cdc8ff,transparent_55%),#fafafa] p-6">
                    <div
                      className="relative h-full w-full rounded-xl overflow-hidden shadow-soft"
                      style={{
                        background:
                          "linear-gradient(135deg,#1b1240 0%, #4b2d7a 60%, #f8a4d8 140%)",
                      }}
                    >
                      <div
                        className="absolute -top-6 -right-6 h-24 w-24 rounded-full"
                        style={{
                          background:
                            "radial-gradient(closest-side, rgba(248,164,216,0.6), transparent)",
                        }}
                      />
                      <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-white/80 text-[9px] font-mono tracking-widest">
                        <span>GLOBAL · TECH · SUMMIT</span>
                        <span>NOV 14–16 · 26</span>
                      </div>
                      <div className="absolute top-9 left-4 right-4 text-white font-display font-bold text-[16px] leading-tight">
                        I&apos;m attending
                        <br />
                        Tech Summit 2026.
                      </div>
                      <div className="zone absolute bottom-4 left-4 h-14 w-14 rounded-full border-[1.5px] border-dashed border-brand-primary bg-white/10 backdrop-blur-sm">
                        <span className="absolute -top-5 left-0 text-[9px] font-mono text-brand-primary bg-white px-1.5 py-0.5 rounded">
                          photo
                        </span>
                      </div>
                      <div className="zone zone-delay absolute bottom-6 left-24 right-4 h-10 rounded-md border-[1.5px] border-dashed border-brand-primary">
                        <span className="absolute -top-5 left-0 text-[9px] font-mono text-brand-primary bg-white px-1.5 py-0.5 rounded">
                          name + title
                        </span>
                      </div>
                      <div className="zone zone-delay-2 absolute top-[44%] right-4 h-6 w-20 rounded-md border-[1.5px] border-dashed border-brand-secondary">
                        <span className="absolute -top-5 right-0 text-[9px] font-mono text-brand-secondary bg-white px-1.5 py-0.5 rounded">
                          company
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* right props */}
                  <div className="border-l border-brand-border bg-white p-3 text-[10px]">
                    <div className="font-medium text-brand-ink/70 mb-2">
                      Zone properties
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="text-brand-ink/50 mb-1">Label</div>
                        <div className="h-5 rounded bg-brand-offwhite px-1.5 flex items-center font-mono">
                          Full name
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-ink/50 mb-1">Font</div>
                        <div className="h-5 rounded bg-brand-offwhite px-1.5 flex items-center">
                          DM Sans · 600
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-ink/50 mb-1">Color</div>
                        <div className="flex gap-1">
                          <span className="h-4 w-4 rounded bg-white border border-brand-border ring-1 ring-brand-primary ring-offset-1" />
                          <span className="h-4 w-4 rounded bg-brand-ink" />
                          <span className="h-4 w-4 rounded grad-bg" />
                        </div>
                      </div>
                      <label className="flex items-center justify-between mt-3">
                        <span className="text-brand-ink/60">Required</span>
                        <span className="relative inline-block h-3.5 w-6 rounded-full grad-bg">
                          <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-white" />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone mock */}
              <div className="absolute bottom-0 right-0 w-[42%] aspect-[9/19] rounded-[28px] bg-brand-ink p-2 shadow-lift">
                <div className="relative h-full w-full rounded-[22px] bg-white overflow-hidden">
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-4 w-16 rounded-full bg-brand-ink z-10" />
                  <div className="h-full w-full flex flex-col">
                    <div className="px-3 pt-7 pb-2 flex items-center gap-1.5 text-[8px] font-mono text-brand-ink/60">
                      <span className="h-3.5 w-3.5 rounded grad-bg" />
                      TECH SUMMIT 2026
                    </div>
                    <div
                      className="mx-3 rounded-xl overflow-hidden relative aspect-[3/4]"
                      style={{
                        background:
                          "linear-gradient(135deg,#1b1240 0%, #4b2d7a 60%, #f8a4d8 140%)",
                      }}
                    >
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-white/80 text-[6px] font-mono tracking-widest">
                        <span>GLOBAL · TECH · SUMMIT</span>
                        <span>NOV 14–16</span>
                      </div>
                      <div className="absolute top-6 left-2 right-2 text-white font-display font-bold text-[10px] leading-tight">
                        I&apos;m attending
                        <br />
                        Tech Summit 2026.
                      </div>
                      <div
                        className="absolute bottom-2 left-2 h-9 w-9 rounded-full overflow-hidden"
                        style={{
                          background:
                            "linear-gradient(135deg,#ffd28a,#f8a4d8)",
                        }}
                      >
                        <span className="absolute inset-0 grid place-items-center text-white font-display font-bold text-[10px]">
                          JL
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-12 right-2 text-white">
                        <div className="font-display font-semibold text-[8px] leading-tight">
                          Jordan Lee
                        </div>
                        <div className="font-mono text-[6px] opacity-80">
                          Lead Designer · Figma
                        </div>
                      </div>
                    </div>
                    <div className="px-3 pt-3 pb-2 space-y-1.5 text-[8px]">
                      <div className="text-brand-ink/50 font-medium">
                        Full name
                      </div>
                      <div className="h-6 rounded-md border border-brand-border px-2 flex items-center font-display font-medium">
                        Jordan Lee
                        <span className="caret ml-0.5 w-px h-2.5 bg-brand-primary inline-block" />
                      </div>
                      <div className="text-brand-ink/50 font-medium pt-1">
                        Role · Company
                      </div>
                      <div className="h-6 rounded-md border border-brand-border px-2 flex items-center font-display">
                        Lead Designer · Figma
                      </div>
                    </div>
                    <div className="mt-auto p-3">
                      <div className="h-8 rounded-xl grad-bg grid place-items-center text-white text-[9px] font-semibold tracking-wide">
                        Generate my card
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── EARLY ACCESS BANNER ─────────────────────────────────────────────── */
function LogoStrip() {
  return (
    <section className="border-y border-brand-border bg-brand-offwhite/70">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-2">
              EARLY ACCESS
            </div>
            <p className="font-display font-semibold text-[20px] sm:text-[22px] text-brand-ink">
              The first 50 organizers get founding-member pricing, locked for life.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center gap-2 text-[14px] font-medium text-white grad-bg px-5 py-3 rounded-2xl hover:opacity-95 transition whitespace-nowrap"
          >
            Claim your spot
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section id="how" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl">
          <div className="text-[12px] tracking-[0.18em] font-mono text-brand-primary mb-3">
            HOW IT WORKS
          </div>
          <h2 className="font-display font-bold text-[36px] sm:text-[44px] leading-[1.05] text-balance">
            Three steps from your design to{" "}
            <span className="grad-text">a viral share moment.</span>
          </h2>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <article className="relative rounded-2xl border border-brand-border bg-white p-7 hover:shadow-lift transition group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-brand-ink/40">
                01
              </span>
              <div className="h-9 w-9 rounded-xl bg-brand-offwhite grid place-items-center text-brand-primary group-hover:grad-bg group-hover:text-white transition">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
            </div>
            <h3 className="mt-6 font-display font-semibold text-[22px]">
              Upload your design
            </h3>
            <p className="mt-2 text-[15px] text-brand-ink/60 leading-relaxed">
              Drop in a PNG or JPG. Bring your typography, your colors, your
              brand. We don&apos;t touch a pixel.
            </p>
            <div className="mt-6 h-28 rounded-xl border border-dashed border-brand-border bg-brand-offwhite grid place-items-center text-brand-ink/40 text-[12px] font-mono">
              drop&nbsp;·&nbsp;design.png
            </div>
          </article>

          {/* Step 2 */}
          <article className="relative rounded-2xl border border-brand-border bg-white p-7 hover:shadow-lift transition group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-brand-ink/40">
                02
              </span>
              <div className="h-9 w-9 rounded-xl bg-brand-offwhite grid place-items-center text-brand-primary group-hover:grad-bg group-hover:text-white transition">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 3v18" />
                </svg>
              </div>
            </div>
            <h3 className="mt-6 font-display font-semibold text-[22px]">
              Mark editable zones
            </h3>
            <p className="mt-2 text-[15px] text-brand-ink/60 leading-relaxed">
              Drag boxes onto the canvas. Name, title, company, photo — set
              fonts, colors, shapes. Done.
            </p>
            <div className="mt-6 h-28 rounded-xl bg-brand-offwhite relative overflow-hidden">
              <div
                className="absolute inset-3 rounded-lg"
                style={{
                  background: "linear-gradient(135deg,#1b1240,#4b2d7a)",
                }}
              />
              <div className="absolute left-6 top-6 h-6 w-6 rounded-full border-[1.5px] border-dashed border-brand-primary" />
              <div className="absolute left-14 top-7 right-6 h-4 rounded border-[1.5px] border-dashed border-brand-primary" />
              <div className="absolute left-6 bottom-6 h-3 w-16 rounded border-[1.5px] border-dashed border-brand-secondary" />
            </div>
          </article>

          {/* Step 3 */}
          <article className="relative rounded-2xl border border-brand-border bg-white p-7 hover:shadow-lift transition group">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[12px] text-brand-ink/40">
                03
              </span>
              <div className="h-9 w-9 rounded-xl bg-brand-offwhite grid place-items-center text-brand-primary group-hover:grad-bg group-hover:text-white transition">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
            </div>
            <h3 className="mt-6 font-display font-semibold text-[22px]">
              Share one link
            </h3>
            <p className="mt-2 text-[15px] text-brand-ink/60 leading-relaxed">
              Send attendees one URL. They personalize on their phone and
              download in seconds. You watch downloads tick up.
            </p>
            <div className="mt-6 h-28 rounded-xl bg-brand-offwhite p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[10px] font-mono text-brand-ink/50">
                  cardly.app/
                </div>
                <div className="text-[14px] font-mono font-medium text-brand-ink">
                  /aya-summit-26
                </div>
              </div>
              <div className="h-12 w-12 rounded-md grid place-items-center bg-white border border-brand-border shrink-0">
                <QRPattern />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ─── SHOWCASE ───────────────────────────────────────────────────────── */
const CARDS = [
  {
    bg: "linear-gradient(160deg,#1b1240,#4b2d7a)",
    label: "WEB·SUMMIT·26",
    year: "·26",
    title: "I'm at Web Summit.",
    avatarBg: "linear-gradient(135deg,#ffd28a,#f8a4d8)",
    name: "Jordan Lee",
    role: "CTO · Stripe",
    textColor: "text-white",
  },
  {
    bg: "linear-gradient(160deg,#fff,#ffe7f3)",
    label: "DESIGN·WEEK·BERLIN",
    year: "",
    title: "Speaking at\nDesign Week Berlin.",
    avatarBg: "linear-gradient(135deg,#6c63ff,#f8a4d8)",
    name: "Sofia Chen",
    role: "Design Director",
    textColor: "text-brand-ink",
  },
  {
    bg: "linear-gradient(160deg,#0a3d2e,#1f8a5b)",
    label: "GLOBAL YOUTH SUMMIT '26",
    year: "",
    title: "Global\nYouth Summit '26",
    avatarBg: "linear-gradient(135deg,#f8a4d8,#ffd28a)",
    name: "Priya Sharma",
    role: "Delegate · India",
    textColor: "text-white",
  },
  {
    bg: "linear-gradient(160deg,#6c63ff,#f8a4d8)",
    label: "GLOBAL·AI·SUMMIT",
    year: "",
    title: "I'M\nBUILDING\nWITH AI.",
    avatarBg: "",
    name: "Marcus Kim",
    role: "Founder · Atlas AI",
    textColor: "text-white",
  },
];

function ShowcaseSection() {
  return (
    <section
      id="showcase"
      className="py-24 lg:py-28 bg-brand-ink text-white relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div
          className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(closest-side, #6c63ff, transparent)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(closest-side, #f8a4d8, transparent)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <div className="text-[12px] tracking-[0.18em] font-mono text-brand-secondary mb-3">
              DESIGNER-NATIVE
            </div>
            <h2 className="font-display font-bold text-[36px] sm:text-[48px] leading-[1.05] text-balance">
              You spent weeks on the design.
              <br />
              Don&apos;t hand it to a template tool.
            </h2>
          </div>
          <div className="lg:col-span-5 text-white/70 text-[16px] leading-relaxed">
            Most &ldquo;attendance card&rdquo; tools force you into their
            layouts and their fonts. Cardly does the opposite: bring your file,
            keep your craft, ship the link in one afternoon.
          </div>
        </div>

        {/* showcase grid */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl overflow-hidden relative"
              style={{ background: card.bg }}
            >
              <div
                className={`absolute top-3 left-3 right-3 flex items-center justify-between text-[9px] font-mono tracking-widest ${card.textColor === "text-brand-ink" ? "text-brand-ink/70" : "text-white/70"}`}
              >
                <span>{card.label}</span>
                {card.year && <span>{card.year}</span>}
              </div>
              {i === 3 ? (
                <div
                  className={`absolute top-1/2 -translate-y-1/2 left-3 right-3 text-center font-display font-bold text-[20px] leading-[0.95] ${card.textColor}`}
                >
                  {card.title.split("\n").map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </div>
              ) : (
                <div
                  className={`absolute top-9 left-3 right-3 font-display font-bold text-[15px] leading-tight ${card.textColor}`}
                >
                  {card.title.split("\n").map((line, j) => (
                    <div key={j}>{line}</div>
                  ))}
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                {card.avatarBg && (
                  <div
                    className={`h-9 w-9 rounded-${i === 1 ? "2xl" : "full"} shrink-0`}
                    style={{ background: card.avatarBg }}
                  />
                )}
                <div
                  className={`${i === 3 ? "w-full text-center" : ""} ${card.textColor}`}
                >
                  <div className="font-display font-semibold text-[12px]">
                    {card.name}
                  </div>
                  <div
                    className={`font-mono text-[9px] ${card.textColor === "text-brand-ink" ? "text-brand-ink/60" : "opacity-70"}`}
                  >
                    {card.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-white/50 text-[13px] font-mono">
          Built for events from 50 to 50,000 attendees. Your design file stays yours — attendees never see it.
        </div>
      </div>
    </section>
  );
}


/* ─── PRICING TEASER ─────────────────────────────────────────────────── */
function PricingTeaserSection() {
  return (
    <section
      id="pricing"
      className="py-24 bg-brand-offwhite border-t border-brand-border"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="max-w-xl">
            <div className="text-[12px] tracking-[0.18em] font-mono text-brand-primary mb-3">
              PRICING
            </div>
            <h2 className="font-display font-bold text-[36px] sm:text-[44px] leading-[1.05]">
              Pay for the volume, not the templates.
            </h2>
          </div>
          <Link
            href="/pricing"
            className="text-[14px] font-medium text-brand-ink/70 hover:text-brand-ink inline-flex items-center gap-1.5"
          >
            Full pricing &amp; comparison
            <ArrowIcon />
          </Link>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {/* Free */}
          <div className="rounded-2xl bg-white border border-brand-border p-7 flex flex-col">
            <div className="text-[13px] font-mono text-brand-ink/50 tracking-wide">
              FREE
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display font-bold text-[44px] leading-none">
                $0
              </span>
              <span className="text-brand-ink/50 text-[14px]">/forever</span>
            </div>
            <p className="mt-3 text-[14px] text-brand-ink/60">
              Try the full editor. Ship one event a month with a small Cardly
              watermark.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-brand-ink/80 flex-1">
              {[
                "1 active event / month",
                "Unlimited zones",
                "PNG downloads · watermark",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center text-[14px] font-medium text-brand-ink border border-brand-border rounded-xl py-2.5 hover:bg-brand-offwhite transition"
            >
              Start free
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-2xl bg-white p-7 flex flex-col grad-border relative shadow-lift">
            <span className="absolute -top-3 left-7 text-[10px] font-mono tracking-widest px-2 py-1 rounded-full text-white grad-bg">
              MOST POPULAR
            </span>
            <div className="text-[13px] font-mono text-brand-primary tracking-wide">
              PRO
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display font-bold text-[44px] leading-none grad-text">
                $19
              </span>
              <span className="text-brand-ink/50 text-[14px]">/month</span>
            </div>
            <p className="mt-3 text-[14px] text-brand-ink/60">
              For event organizers running real campaigns. No watermark.
              Analytics.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-brand-ink/80 flex-1">
              {[
                "10 active events",
                "No watermark · custom event URL",
                "Download analytics",
                "WhatsApp & social share buttons",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full grad-bg shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center text-[14px] font-medium text-white grad-bg rounded-xl py-2.5 hover:opacity-95 transition"
            >
              Start 14-day Pro trial
            </Link>
          </div>

          {/* Studio */}
          <div className="rounded-2xl bg-white border border-brand-border p-7 flex flex-col">
            <div className="text-[13px] font-mono text-brand-ink/50 tracking-wide">
              STUDIO
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display font-bold text-[44px] leading-none">
                $49
              </span>
              <span className="text-brand-ink/50 text-[14px]">/month</span>
            </div>
            <p className="mt-3 text-[14px] text-brand-ink/60">
              For agencies and brand teams running concurrent client events.
            </p>
            <ul className="mt-6 space-y-2.5 text-[14px] text-brand-ink/80 flex-1">
              {[
                "Unlimited events",
                "No watermark",
                "Priority support",
                "Team features coming soon",
              ].map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-ink shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="mailto:hello@cardly.app"
              className="mt-8 inline-flex items-center justify-center text-[14px] font-medium text-white bg-brand-ink rounded-xl py-2.5 hover:opacity-90 transition"
            >
              Talk to us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: "Do attendees need an account?",
    a: "No. They open your link, fill in their name and role, upload a photo if your design needs one, and tap Generate. No app download, no login.",
  },
  {
    q: "What file formats can I upload?",
    a: "PNG or JPG, up to 4096px on the long edge. Export at 2× from Figma or Illustrator for crisp results on retina screens. SVG support is on the roadmap.",
  },
  {
    q: "Does the attendee experience work on mobile?",
    a: "Yes — that's the main use case. The attendee page is built for 375px screens first. Works on iOS Safari and Android Chrome without any app download.",
  },
  {
    q: "Do you store attendee photos and data?",
    a: "We store the name, role, and photo the attendee submits — only what's needed to generate their card. We don't sell it or use it for marketing.",
  },
];

function FaqSection() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <h2 className="font-display font-bold text-[32px] sm:text-[36px]">
          Quick questions, fast answers.
        </h2>
        <div className="mt-10 divide-y divide-brand-border border-y border-brand-border">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                <span className="font-display font-medium text-[17px]">
                  {faq.q}
                </span>
                <span className="h-7 w-7 rounded-full bg-brand-offwhite grid place-items-center text-brand-ink/60 group-open:grad-bg group-open:text-white transition shrink-0">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 text-brand-ink/65 text-[15px] leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ──────────────────────────────────────────────────────── */
function FinalCtaSection() {
  return (
    <section className="px-6 lg:px-10 pb-16">
      <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative grad-bg p-10 lg:p-16">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.6), transparent 50%)",
          }}
        />
        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display font-bold text-white text-[40px] sm:text-[52px] leading-[1.02]">
              Your next event
              <br />
              deserves{" "}
              <em className="not-italic underline decoration-white/40 decoration-4 underline-offset-8">
                your
              </em>{" "}
              design.
            </h2>
            <p className="mt-5 text-white/85 text-[17px] max-w-md leading-relaxed">
              Set up your first event link in under five minutes. The free tier
              never expires.
            </p>
          </div>
          <div className="lg:justify-self-end flex flex-col sm:flex-row gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-brand-ink bg-white px-6 py-3.5 rounded-2xl hover:bg-white/90 transition"
            >
              Start free — no card needed
              <ArrowIcon />
            </Link>
            <a
              href="mailto:hello@cardly.app"
              className="inline-flex items-center justify-center text-[15px] font-medium text-white border border-white/30 px-6 py-3.5 rounded-2xl hover:bg-white/10 transition"
            >
              Book a 15-min demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── SHARED ICONS ───────────────────────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  );
}

function QRPattern() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" fill="white" />
      <g fill="#0f0f1a">
        <rect x="2" y="2" width="10" height="10" />
        <rect x="4" y="4" width="6" height="6" fill="white" />
        <rect x="6" y="6" width="2" height="2" />
        <rect x="28" y="2" width="10" height="10" />
        <rect x="30" y="4" width="6" height="6" fill="white" />
        <rect x="32" y="6" width="2" height="2" />
        <rect x="2" y="28" width="10" height="10" />
        <rect x="4" y="30" width="6" height="6" fill="white" />
        <rect x="6" y="32" width="2" height="2" />
        <rect x="14" y="4" width="2" height="2" />
        <rect x="18" y="6" width="2" height="2" />
        <rect x="22" y="2" width="2" height="2" />
        <rect x="14" y="14" width="2" height="2" />
        <rect x="18" y="16" width="2" height="2" />
        <rect x="22" y="14" width="2" height="2" />
        <rect x="26" y="18" width="2" height="2" />
        <rect x="30" y="14" width="2" height="2" />
        <rect x="34" y="18" width="2" height="2" />
        <rect x="14" y="22" width="2" height="2" />
        <rect x="18" y="26" width="2" height="2" />
        <rect x="22" y="22" width="2" height="2" />
        <rect x="26" y="26" width="2" height="2" />
        <rect x="30" y="22" width="2" height="2" />
        <rect x="14" y="30" width="2" height="2" />
        <rect x="18" y="34" width="2" height="2" />
        <rect x="22" y="30" width="2" height="2" />
        <rect x="26" y="34" width="2" height="2" />
        <rect x="30" y="30" width="2" height="2" />
        <rect x="34" y="34" width="2" height="2" />
      </g>
    </svg>
  );
}
