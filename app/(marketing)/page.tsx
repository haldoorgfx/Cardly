import Link from "next/link";
import React from "react";
import { ArrowRight, Upload, Link2, Settings2, Image as ImageIcon, Maximize2, Plus, Minus, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoStrip />
      <HowItWorksSection />
      <ShowcaseSection />
      <TestimonialSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}

/* ── Shared helpers ─────────────────────────────────────────────────── */

function DotGrid({
  opacity = 0.06,
  size = 24,
  light = false,
}: {
  opacity?: number;
  size?: number;
  light?: boolean;
}) {
  const color = light ? "rgba(255,255,255," : "rgba(15,31,24,";
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(${color}${opacity}) 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

function ArrowIcon({ dark }: { dark?: boolean }) {
  return <ArrowRight size={14} strokeWidth={2.2} color={dark ? "#0F1F18" : "currentColor"} />;
}

/* ─── HERO ──────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#FAF6EE" }}>
      {/* Mesh gradient blobs */}
      <div className="absolute pointer-events-none" style={{ top: "-15%", right: "-5%", width: 700, height: 600, background: "radial-gradient(ellipse, rgba(31,77,58,0.09) 0%, transparent 70%)", filter: "blur(90px)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: "-10%", left: "-5%", width: 500, height: 500, background: "radial-gradient(ellipse, rgba(232,197,126,0.1) 0%, transparent 70%)", filter: "blur(80px)" }} />

      {/* Vignette — fades edges */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 35%, #FAF6EE 100%)" }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-8 lg:pt-28 lg:pb-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── Left: copy ── */}
          <div className="flex-1 min-w-0 text-center lg:text-left">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 border border-[#E5E0D4] bg-white text-[12px] font-medium text-[#6B7A72] tracking-widest uppercase px-3 py-1.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#1F4D3A" }} />
              For event organizers
            </div>

            {/* Heading */}
            <h1 className="mt-6 font-display font-bold text-[46px] md:text-[58px] lg:text-[66px] leading-[0.95] tracking-tight text-[#0F1F18]">
              Personalized event cards,{" "}
              <span style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                at scale.
              </span>
            </h1>

            <p className="mt-6 text-[16px] text-[#6B7A72] leading-relaxed max-w-[480px] mx-auto lg:mx-0">
              Upload your event design. Define editable zones. Share one link —
              attendees personalize and download their card in seconds.
            </p>

            <div className="mt-8 flex items-center gap-3 justify-center lg:justify-start flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-11 px-6 text-white text-[14px] font-semibold rounded-lg hover:opacity-90 transition"
                style={{ background: "#1F4D3A" }}
              >
                Create your first event
                <ArrowIcon />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center h-11 px-6 border border-[#E5E0D4] text-[14px] font-medium text-[#3A4A42] rounded-lg hover:bg-[#E8EFEB] transition"
              >
                See how it works
              </a>
            </div>

            {/* Trust row */}
            <div className="mt-8 flex items-center gap-5 justify-center lg:justify-start flex-wrap">
              <span className="text-[13px] text-[#6B7A72] flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                1,000+ events shipped
              </span>
              <span className="text-[#C9C3B1]">·</span>
              <span className="text-[13px] text-[#6B7A72]">No credit card required</span>
              <span className="text-[#C9C3B1]">·</span>
              <span className="text-[13px] text-[#6B7A72]">Free to start</span>
            </div>
          </div>

          {/* ── Right: editor + phone visual ── */}
          <div className="hidden lg:block w-[52%] shrink-0 relative" style={{ height: 460 }}>

            {/* Floating decorations */}
            <div className="absolute z-30 h-14 w-14 rounded-2xl animate-floatA" style={{ top: 0, right: 20, background: "rgba(232,197,126,0.18)", border: "1px solid rgba(232,197,126,0.35)" }} />
            <div className="absolute z-30 h-8 w-8 rounded-full animate-floatB" style={{ top: 52, right: 90, background: "linear-gradient(135deg, #1F4D3A, #2A6A50)" }} />
            <div className="absolute z-30 h-10 w-10 rounded-xl animate-floatA" style={{ bottom: 28, left: 0, background: "rgba(31,77,58,0.12)", border: "1px solid rgba(31,77,58,0.2)", animationDelay: "1s" }} />

            {/* Editor window */}
            <div
              className="absolute z-10 rounded-2xl bg-white overflow-hidden"
              style={{ top: 0, left: 0, right: 112, bottom: 40, border: "1px solid #E5E0D4", boxShadow: "0 28px 80px rgba(15,31,24,0.12)" }}
            >
              {/* Window chrome */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b" style={{ background: "#FAF6EE", borderColor: "#E5E0D4" }}>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                  <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                  <span className="h-3 w-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="flex-1 h-5 rounded flex items-center justify-center" style={{ background: "white", border: "1px solid #E5E0D4" }}>
                  <span className="font-mono text-[9px] text-[#6B7A72]/60">cardly.app/edit/aya-summit-26</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-1 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Saved
                </span>
              </div>

              {/* Editor body */}
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 120px", height: "calc(100% - 38px)" }}>

                {/* Left toolbar */}
                <div className="flex flex-col items-center py-3 gap-1.5" style={{ background: "#FAF6EE", borderRight: "1px solid #E5E0D4" }}>
                  {[
                    { icon: <ImageIcon size={13} strokeWidth={1.8} />, active: true },
                    { icon: <Maximize2 size={13} strokeWidth={1.8} />, active: false },
                    { icon: <Settings2 size={13} strokeWidth={1.8} />, active: false },
                  ].map((item, i) => (
                    <button key={i} className="h-8 w-8 rounded-md grid place-items-center shrink-0" style={item.active ? { background: "#1F4D3A", color: "white" } : { color: "#6B7A72" }}>
                      {item.icon}
                    </button>
                  ))}
                </div>

                {/* Canvas */}
                <div className="relative overflow-hidden" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(31,77,58,0.07), rgba(232,197,126,0.04) 60%, #FAF6EE)" }}>
                  {/* Canvas dot grid */}
                  <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(15,31,24,0.05) 1px, transparent 1px)", backgroundSize: "14px 14px" }} />

                  {/* Event card on canvas */}
                  <div className="absolute rounded-xl overflow-hidden" style={{ top: 18, left: 22, right: 20, height: "calc(100% - 36px)", background: "linear-gradient(155deg, #0F1F18 0%, #1F4D3A 55%, #E8C57E 130%)" }}>
                    <div className="absolute" style={{ top: 12, left: 14, right: 14 }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 7, fontFamily: "JetBrains Mono", letterSpacing: "0.18em" }}>AYA SUMMIT · 2026</div>
                      <div style={{ color: "white", fontWeight: 700, fontSize: 17, lineHeight: 1.15, marginTop: 5 }}>I&apos;m attending<br />Aya Summit.</div>
                    </div>

                    {/* Name zone */}
                    <div className="absolute animate-zonePulse" style={{ bottom: "22%", left: 14, right: 14, height: 28, border: "1.5px dashed rgba(232,197,126,0.7)", borderRadius: 5 }}>
                      <span style={{ position: "absolute", top: -8, left: 6, background: "#1F4D3A", color: "white", fontSize: 7, padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>FULL NAME</span>
                    </div>

                    {/* Photo zone */}
                    <div style={{ position: "absolute", bottom: "8%", left: 14, width: 28, height: 28, border: "1.5px dashed rgba(232,197,126,0.55)", borderRadius: "50%" }}>
                      <span style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: "#1F4D3A", color: "white", fontSize: 7, padding: "1px 5px", borderRadius: 3, fontFamily: "JetBrains Mono", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>PHOTO</span>
                    </div>
                  </div>
                </div>

                {/* Properties panel */}
                <div className="overflow-hidden" style={{ background: "white", borderLeft: "1px solid #E5E0D4" }}>
                  <div className="px-3 pt-3 pb-2 border-b" style={{ borderColor: "#E5E0D4" }}>
                    <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "#6B7A72", letterSpacing: "0.12em", marginBottom: 8, textTransform: "uppercase" }}>Zone · Full Name</div>
                    {[["Font", "DM Sans"], ["Size", "28"], ["Weight", "700"]].map(([label, val]) => (
                      <div key={label} style={{ marginBottom: 7 }}>
                        <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "#6B7A72", letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>{label}</div>
                        <div style={{ height: 21, border: "1px solid #E5E0D4", borderRadius: 4, background: "#FAF6EE", fontSize: 11, color: "#0F1F18", display: "flex", alignItems: "center", paddingLeft: 7 }}>{val}</div>
                      </div>
                    ))}
                    <div>
                      <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "#6B7A72", letterSpacing: "0.1em", marginBottom: 3, textTransform: "uppercase" }}>Align</div>
                      <div style={{ display: "flex", gap: 3 }}>
                        {["L", "C", "R"].map((a, i) => (
                          <div key={a} style={{ flex: 1, height: 21, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, background: i === 0 ? "#1F4D3A" : "#FAF6EE", color: i === 0 ? "white" : "#6B7A72", border: i !== 0 ? "1px solid #E5E0D4" : "none" }}>{a}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 pt-3">
                    <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "#6B7A72", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>Color</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {["#FFFFFF", "#0F1F18", "#E8C57E", "#1F4D3A"].map(c => (
                        <div key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: "1.5px solid rgba(15,31,24,0.12)" }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone overlay */}
            <div className="absolute z-20" style={{ bottom: 0, right: 0, width: 126 }}>
              <div style={{ border: "5px solid #0F1F18", borderRadius: 22, overflow: "hidden", background: "white", boxShadow: "0 20px 50px rgba(0,0,0,0.28)" }}>
                <div style={{ height: 14, background: "#0F1F18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 30, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
                </div>
                <div style={{ padding: "8px 8px 10px", background: "#FAF6EE" }}>
                  <div style={{ borderRadius: 7, height: 58, background: "linear-gradient(155deg, #0F1F18 0%, #1F4D3A 55%, #E8C57E 130%)", marginBottom: 8, padding: "6px 8px" }}>
                    <div style={{ fontSize: 6, color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono", letterSpacing: "0.15em" }}>AYA SUMMIT</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "white", lineHeight: 1.1, marginTop: 2 }}>Attending<br />Aya Summit.</div>
                  </div>
                  {["FULL NAME", "ROLE"].map(label => (
                    <div key={label} style={{ marginBottom: 5 }}>
                      <div style={{ fontSize: 6, color: "#6B7A72", fontFamily: "JetBrains Mono", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</div>
                      <div style={{ height: 16, border: "1px solid #E5E0D4", borderRadius: 4, background: "white" }} />
                    </div>
                  ))}
                  <div style={{ height: 20, borderRadius: 5, background: "#1F4D3A", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 6 }}>
                    <span style={{ fontSize: 6.5, color: "white", fontFamily: "JetBrains Mono", letterSpacing: "0.08em" }}>GENERATE CARD</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-12 lg:h-16" />
      </div>
    </section>
  );
}

/* ─── LOGO STRIP ─────────────────────────────────────────────────────── */
const LOGOS = [
  "GITEX Africa",
  "Pan-African Youth Forum",
  "IGAD Summit",
  "Africa AI Summit",
  "Africa Tech Festival",
  "Moonshot ·26",
  "Lagos Design Week",
  "DevFest Nairobi",
];

function LogoStrip() {
  return (
    <section className="border-y border-[#E5E0D4] py-9 overflow-hidden" style={{ background: "#FAF6EE" }}>
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[11px] font-mono font-medium text-[#6B7A72] tracking-widest uppercase mb-6">
          Used by teams behind
        </p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10" style={{ background: "linear-gradient(to right, #FAF6EE, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10" style={{ background: "linear-gradient(to left, #FAF6EE, transparent)" }} />
          <div className="flex items-center whitespace-nowrap">
            <div className="flex items-center gap-12 animate-marquee">
              {[...LOGOS, ...LOGOS].map((name, i) => (
                <span key={i} className="text-[14px] font-medium text-[#6B7A72]/70">
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
const HOW_ICONS: React.ReactNode[] = [
  <Upload key="upload" size={15} strokeWidth={1.8} color="#1F4D3A" />,
  <Maximize2 key="maximize" size={15} strokeWidth={1.8} color="#1F4D3A" />,
  <Link2 key="link" size={15} strokeWidth={1.8} color="#1F4D3A" />,
];

const HOW_STEPS = [
  { n: "01", title: "Upload your design", body: "Drop a PNG or JPG. Bring your own typography, colors, and layout. We don't touch a pixel." },
  { n: "02", title: "Mark the zones", body: "Drag boxes where attendee info goes. Name, role, company, photo — configure fonts and shapes per zone." },
  { n: "03", title: "Share one link", body: "Attendees open the link on their phone, fill in their details, and download a ready-to-share PNG in seconds." },
];

function HowItWorksSection() {
  return (
    <section id="how" className="relative py-24 lg:py-32 overflow-hidden border-t border-[#E5E0D4]" style={{ background: "#FAF6EE" }}>
      <DotGrid opacity={0.055} size={24} />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-3">How it works</div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16">
          <h2 className="font-display font-bold text-[32px] lg:text-[38px] text-[#0F1F18] tracking-tight leading-tight">
            Simple by design.
          </h2>
          <a href="#" className="text-[13px] text-[#1F4D3A] font-medium hover:underline shrink-0">
            Watch the 60-second tour →
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.n}
              className="relative bg-white rounded-2xl p-6 hover:-translate-y-1 transition-transform duration-200"
              style={{ border: "1px solid #E5E0D4", boxShadow: "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.05)" }}
            >
              {/* Gradient top accent line */}
              <div className="absolute top-0 left-6 right-6 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(31,77,58,0.25), rgba(232,197,126,0.25), transparent)" }} />

              <div className="flex items-start justify-between mb-5">
                <span className="font-mono text-[11px] text-[#6B7A72]/55">{step.n}</span>
                <div
                  className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
                  style={{ background: "rgba(31,77,58,0.08)", border: "1px solid rgba(31,77,58,0.12)" }}
                >
                  {HOW_ICONS[i]}
                </div>
              </div>

              <h3 className="font-display font-bold text-[17px] text-[#0F1F18]">{step.title}</h3>
              <p className="mt-2 text-[14px] text-[#6B7A72] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SHOWCASE DARK BAND ─────────────────────────────────────────────── */
const SHOWCASE_CARDS = [
  { label: "AFRICA TECH FESTIVAL", heading: "I'm attending\nAfrica Tech Festival.", style: { background: "linear-gradient(155deg, #0a1f14 0%, #1F4D3A 60%, #2A6A50 100%)" } },
  { label: "IGAD SUMMIT · 2026", heading: "Speaking at\nIGAD Summit.", style: { background: "linear-gradient(150deg, #0F1F18 0%, #1F4D3A 55%, #E8C57E 130%)" } },
  { label: "DEVFEST NAIROBI", heading: "Building\nwith the community.", style: { background: "linear-gradient(155deg, #163828 0%, #1F4D3A 50%, #2A9E64 110%)" } },
  { label: "MOONSHOT · 26", heading: "I'm a\nMoonshot delegate.", style: { background: "linear-gradient(155deg, #0F1F18 0%, #2A3020 50%, #E8C57E 130%)" } },
];

const STATS = [
  { value: "38s", label: "avg. card generation time" },
  { value: "6.2×", label: "more shares than a generic badge" },
  { value: "0", label: "accounts required for attendees" },
];

function ShowcaseSection() {
  return (
    <section id="showcase" className="relative py-24 lg:py-32 overflow-hidden" style={{ background: "#0F1F18" }}>
      <DotGrid opacity={0.08} size={24} light />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 40%, rgba(15,31,24,0.7) 100%)" }} />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-3">Showcase</div>
            <h2 className="font-display font-bold text-[32px] lg:text-[40px] text-white tracking-tight leading-tight">
              Your design.<br />Their identity.
            </h2>
          </div>
          <p className="text-[14px] text-white/40 leading-relaxed max-w-[300px]">
            Every attendee walks away with a card that actually looks like your event — not a generic template.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SHOWCASE_CARDS.map((card, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: "3/4", ...card.style }}
            >
              <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
              <div className="absolute inset-0 p-4 flex flex-col justify-between">
                <div>
                  <div style={{ fontSize: 8, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.35)", letterSpacing: "0.18em" }}>{card.label}</div>
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                    {card.heading.split("\n").map((line, j) => (
                      <span key={j}>{line}{j < card.heading.split("\n").length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.2)" }} />
                  <div>
                    <div style={{ height: 6, width: 56, background: "rgba(255,255,255,0.3)", borderRadius: 3, marginBottom: 3 }} />
                    <div style={{ height: 4, width: 40, background: "rgba(255,255,255,0.15)", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="mt-14 grid grid-cols-3 overflow-hidden rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          {STATS.map((s, i) => (
            <div key={i} className="px-8 py-7 text-center" style={{ background: "rgba(255,255,255,0.03)", borderRight: i < 2 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div className="font-display font-bold text-[40px] leading-none text-white tracking-tight">{s.value}</div>
              <div className="mt-2 text-[13px] text-white/35">{s.label}</div>
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
    <section className="relative py-24 border-t border-[#E5E0D4] overflow-hidden" style={{ background: "#FAF6EE" }}>
      <div className="absolute pointer-events-none" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)", filter: "blur(80px)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, #FAF6EE 100%)" }} />

      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="font-display font-bold text-[80px] leading-none text-[#E5E0D4] select-none mb-2" aria-hidden>&ldquo;</div>
        <blockquote className="font-display font-semibold text-[24px] md:text-[30px] text-[#0F1F18] leading-snug tracking-tight -mt-6">
          Cardly let our identity actually travel with every attendee. Each share felt like the festival had designed it personally.
        </blockquote>
        <figcaption className="mt-8 inline-flex items-center gap-3">
          <span className="h-10 w-10 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #1F4D3A, #E8C57E)" }} />
          <div className="text-left">
            <div className="text-[14px] font-semibold text-[#0F1F18]">Ifeoma Adesanya</div>
            <div className="text-[13px] text-[#6B7A72]">Brand Lead · Africa Tech Festival</div>
          </div>
        </figcaption>
      </div>
    </section>
  );
}

/* ─── PRICING ────────────────────────────────────────────────────────── */
const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Try Cardly for your first event.",
    features: ["1 event", "Unlimited attendees", "All zone types", "Cardly watermark on cards"],
    cta: "Get started",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/ month",
    desc: "For active event organizers.",
    features: ["10 events / month", "Unlimited attendees", "No watermark", "Download analytics"],
    cta: "Start Pro",
    href: "/signup?plan=pro",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$49",
    period: "/ month",
    desc: "For agencies and large events.",
    features: ["Unlimited events", "Unlimited attendees", "No watermark", "Priority support"],
    cta: "Start Studio",
    href: "/signup?plan=studio",
    highlight: false,
  },
];

function PricingSection() {
  return (
    <section className="relative py-24 border-t border-[#E5E0D4] overflow-hidden" style={{ background: "#FAF6EE" }}>
      <DotGrid opacity={0.05} size={24} />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10">
        <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-3">Pricing</div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
          <h2 className="font-display font-bold text-[32px] lg:text-[38px] text-[#0F1F18] tracking-tight">
            Simple, transparent pricing.
          </h2>
          <Link href="/pricing" className="text-[13px] text-[#1F4D3A] font-medium hover:underline shrink-0">
            Compare all features →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-7"
              style={plan.highlight
                ? { background: "#0F1F18", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(15,31,24,0.2)" }
                : { background: "white", border: "1px solid #E5E0D4", boxShadow: "0 1px 2px rgba(15,31,24,0.04)" }
              }
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-mono font-medium px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #1F4D3A, #2A6A50)", color: "white", letterSpacing: "0.1em" }}>
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className={`text-[12px] font-medium mb-3 ${plan.highlight ? "text-white/40" : "text-[#6B7A72]"}`}>{plan.name}</div>

              <div className="flex items-baseline gap-1 mb-1">
                <span className={`font-display font-bold text-[38px] leading-none tracking-tight ${plan.highlight ? "text-white" : "text-[#0F1F18]"}`}>{plan.price}</span>
                <span className={`text-[14px] ${plan.highlight ? "text-white/40" : "text-[#6B7A72]"}`}>{plan.period}</span>
              </div>
              <p className={`text-[13px] mb-7 ${plan.highlight ? "text-white/45" : "text-[#6B7A72]"}`}>{plan.desc}</p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className="h-5 w-5 rounded-full grid place-items-center shrink-0"
                      style={plan.highlight
                        ? { background: "rgba(31,77,58,0.5)", border: "1px solid rgba(31,77,58,0.8)" }
                        : { background: "rgba(31,77,58,0.08)", border: "1px solid rgba(31,77,58,0.15)" }
                      }
                    >
                      <Check size={9} strokeWidth={3} color={plan.highlight ? "#a8d5a2" : "#1F4D3A"} />
                    </div>
                    <span className={`text-[13px] ${plan.highlight ? "text-white/65" : "text-[#3A4A42]"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="block w-full text-center h-10 rounded-lg text-[13px] font-semibold transition hover:opacity-90 leading-10"
                style={plan.highlight
                  ? { background: "#1F4D3A", color: "white" }
                  : { background: "#FAF6EE", border: "1px solid #E5E0D4", color: "#0F1F18" }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────────────────────── */
const FAQS = [
  { q: "Who is Cardly for?", a: "Cardly is built for event organizers and designers who want to give attendees a personalized social card — without the manual back-and-forth. It works for conferences, summits, festivals, and corporate events of any size." },
  { q: "What file formats does Cardly support?", a: "You upload your event design as a PNG or JPG. Any resolution works, but we recommend at least 1080×1350px for best quality. Attendees download their personalized card as a PNG." },
  { q: "Do attendees need an account?", a: "No. Attendees open your shareable link on their phone, fill in their details, and download their card — no sign-up, no app required." },
  { q: "Can I use my own fonts?", a: "Any font available on Google Fonts can be configured per zone. Font, size, weight, color, and alignment are all zone-level settings you control in the editor." },
  { q: "What is the watermark on the Free plan?", a: 'On the Free plan, generated cards include a small "Made with Cardly" label at the bottom. Upgrade to Pro or Studio to remove it entirely.' },
];

function FaqSection() {
  return (
    <section id="faq" className="relative py-24 border-t border-[#E5E0D4] overflow-hidden" style={{ background: "#FAF6EE" }}>
      <DotGrid opacity={0.05} size={24} />

      <div className="relative max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-[11px] font-mono text-[#1F4D3A] tracking-widest uppercase mb-3">FAQ</div>
        <h2 className="font-display font-bold text-[32px] text-[#0F1F18] tracking-tight mb-12">Common questions.</h2>

        <div className="divide-y divide-[#E5E0D4]">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group py-5">
              <summary className="flex items-center justify-between gap-6 cursor-pointer [&::-webkit-details-marker]:hidden list-none">
                <span className="font-display font-medium text-[16px] text-[#0F1F18]">{faq.q}</span>
                <span className="h-7 w-7 rounded-full grid place-items-center shrink-0 transition-colors" style={{ background: "#F0EDE6" }}>
                  <Plus size={12} strokeWidth={2.2} color="#6B7A72" className="group-open:hidden" />
                  <Minus size={12} strokeWidth={2.2} color="#1F4D3A" className="hidden group-open:block" />
                </span>
              </summary>
              <p className="mt-4 text-[14px] text-[#6B7A72] leading-relaxed pr-12">{faq.a}</p>
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
    <section className="relative py-16 border-t border-[#E5E0D4] overflow-hidden" style={{ background: "#FAF6EE" }}>
      <DotGrid opacity={0.05} size={24} />

      <div className="relative max-w-5xl mx-auto px-6 lg:px-10">
        {/* Rounded gradient card */}
        <div
          className="relative rounded-3xl overflow-hidden text-center px-8 py-20"
          style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #163828 100%)" }}
        >
          <DotGrid opacity={0.08} size={22} light />
          <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, rgba(232,197,126,0.4), transparent)" }} />

          <div className="relative">
            <div className="text-[11px] font-mono text-white/30 tracking-widest uppercase mb-5">Get started</div>
            <h2 className="font-display font-bold text-[32px] md:text-[44px] text-white tracking-tight leading-tight">
              Ready to ship your first card?
            </h2>
            <p className="mt-4 text-[15px] text-white/45 leading-relaxed max-w-md mx-auto">
              Set up an event in under five minutes. Free forever for your first event.
            </p>
            <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-11 px-7 bg-white text-[#0F1F18] text-[14px] font-semibold rounded-lg hover:bg-neutral-100 transition"
              >
                Get started free
                <ArrowIcon dark />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center h-11 px-7 border border-white/20 text-white/65 text-[14px] font-medium rounded-lg hover:bg-white/[0.07] hover:text-white/90 transition"
              >
                View pricing
              </Link>
            </div>
            <p className="mt-7 text-[12px] text-white/25 font-mono tracking-widest">
              NO CREDIT CARD REQUIRED · CANCEL ANYTIME
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
