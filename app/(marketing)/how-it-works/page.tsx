import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Upload your design",
    duration: "2 minutes",
    what: "Export your card design from Figma, Illustrator, or any tool as a PNG or JPG. Bring your own typography, colors, and layout.",
    detail:
      "Cardly doesn't touch a pixel of your design. It becomes the background of every card. Export at 2× for retina-quality results. Maximum 4096px on the long edge.",
    visual: (
      <div className="mt-6 rounded-2xl border border-dashed border-brand-border bg-brand-offwhite h-28 grid place-items-center">
        <div className="text-center">
          <div className="font-mono text-[11px] text-brand-ink/40 mb-1">
            drag or click to upload
          </div>
          <div className="font-mono text-[13px] text-brand-ink/60">
            design.png · 2160 × 2160
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    title: "Define editable zones",
    duration: "5–15 minutes",
    what: "Drag boxes onto the canvas to mark where attendees can type or upload a photo. Each zone has a label, font settings, and an optional/required flag.",
    detail:
      "Common zones: Full name, Job title, Company, Photo. You control the font, size, color, and alignment of each text zone. Photo zones can be circular or square. Zones auto-save as you work.",
    visual: (
      <div className="mt-6 rounded-2xl bg-brand-offwhite h-28 relative overflow-hidden">
        <div
          className="absolute inset-3 rounded-xl"
          style={{ background: "linear-gradient(135deg,#1F4D3A,#2A6A50)" }}
        />
        <div className="absolute left-6 bottom-6 h-7 w-7 rounded-full border-[1.5px] border-dashed border-brand-primary" />
        <div className="absolute left-16 bottom-7 right-6 h-5 rounded-md border-[1.5px] border-dashed border-brand-primary" />
        <div className="absolute left-6 bottom-[52px] h-3 w-14 rounded border-[1.5px] border-dashed border-brand-secondary" />
      </div>
    ),
  },
  {
    number: "03",
    title: "Publish and share one link",
    duration: "30 seconds",
    what: "Click Publish. Cardly generates a permanent link: cardly.app/c/your-event-name. Share it anywhere — WhatsApp, email, your event registration confirmation, a QR code.",
    detail:
      "The link never changes. You can update zones after publishing without breaking the URL. Attendees who visit before your changes still get the latest version.",
    visual: (
      <div className="mt-6 rounded-2xl bg-brand-offwhite h-28 p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="font-mono text-[10px] text-brand-ink/40">
            cardly.app/c/
          </div>
          <div className="font-mono text-[15px] font-medium text-brand-ink">
            web-summit-26
          </div>
        </div>
        <div className="h-14 w-14 rounded-lg bg-white border border-brand-border grid place-items-center shrink-0">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
            <rect width="36" height="36" fill="white" />
            <g fill="#0f0f1a">
              <rect x="2" y="2" width="9" height="9" />
              <rect x="3" y="3" width="7" height="7" fill="white" />
              <rect x="5" y="5" width="3" height="3" />
              <rect x="25" y="2" width="9" height="9" />
              <rect x="26" y="3" width="7" height="7" fill="white" />
              <rect x="28" y="5" width="3" height="3" />
              <rect x="2" y="25" width="9" height="9" />
              <rect x="3" y="26" width="7" height="7" fill="white" />
              <rect x="5" y="28" width="3" height="3" />
              <rect x="13" y="4" width="2" height="2" />
              <rect x="17" y="6" width="2" height="2" />
              <rect x="13" y="13" width="2" height="2" />
              <rect x="17" y="17" width="2" height="2" />
              <rect x="13" y="21" width="2" height="2" />
              <rect x="21" y="17" width="2" height="2" />
              <rect x="25" y="17" width="2" height="2" />
            </g>
          </svg>
        </div>
      </div>
    ),
  },
  {
    number: "04",
    title: "Attendees personalize and download",
    duration: "Under a minute per attendee",
    what: "Attendees open the link on any device, fill in the zones you defined, and tap Generate. Their personalized PNG downloads immediately.",
    detail:
      "No account needed. No app to install. Works on iOS Safari and Android Chrome. The generated card matches your design exactly — attendees only see what they typed, not your source file.",
    visual: (
      <div className="mt-6 rounded-2xl bg-brand-offwhite h-28 flex items-center justify-center gap-4 px-4">
        <div className="text-center">
          <div className="h-8 w-24 rounded-lg bg-white border border-brand-border mb-2 grid place-items-center">
            <span className="font-mono text-[9px] text-brand-ink/60">
              Sofia Reyes
            </span>
          </div>
          <div className="h-8 w-24 rounded-lg bg-white border border-brand-border grid place-items-center">
            <span className="font-mono text-[9px] text-brand-ink/60">
              Product Manager
            </span>
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1F4D3A"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <div
          className="h-[72px] w-[54px] rounded-lg overflow-hidden shrink-0"
          style={{
            background: "linear-gradient(135deg,#1F4D3A,#2A6A50)",
          }}
        >
          <div className="h-full w-full relative">
            <div className="absolute bottom-1 left-1 h-5 w-5 rounded-full bg-brand-secondary/70" />
            <div className="absolute bottom-2 left-7 right-1 h-2 rounded bg-white/30" />
          </div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-6 pt-20 pb-14">
        <div className="max-w-2xl">
          <div className="text-[11px] tracking-[0.18em] font-mono text-brand-primary mb-4">
            HOW IT WORKS
          </div>
          <h1 className="font-display font-bold text-[48px] sm:text-[60px] leading-[1.02] tracking-tight">
            Four steps. One afternoon.
          </h1>
          <p className="mt-5 text-[17px] text-brand-ink/65 max-w-[520px] leading-relaxed">
            You bring the design. Cardly handles personalization. Here&apos;s
            the full flow from first upload to attendees sharing cards.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-[1240px] mx-auto px-6 pb-24">
        <div className="space-y-5">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-3xl border border-brand-border bg-white p-8 lg:p-10 grid lg:grid-cols-[1fr_340px] gap-10 items-start"
            >
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <span className="font-mono text-[12px] text-brand-ink/40">
                    {step.number}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-brand-offwhite text-brand-ink/50">
                    {step.duration}
                  </span>
                </div>
                <h2 className="font-display font-bold text-[28px] sm:text-[32px] leading-tight">
                  {step.title}
                </h2>
                <p className="mt-3 text-[16px] text-brand-ink/70 leading-relaxed font-medium">
                  {step.what}
                </p>
                <p className="mt-3 text-[15px] text-brand-ink/55 leading-relaxed">
                  {step.detail}
                </p>
              </div>
              <div>{step.visual}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo note */}
      <section className="max-w-[1240px] mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-brand-offwhite border border-brand-border p-8 text-center">
          <div className="font-mono text-[11px] tracking-widest text-brand-ink/40 mb-3">
            DEMO
          </div>
          <p className="text-[16px] text-brand-ink/70 max-w-[480px] mx-auto">
            Demo video coming soon. For now, create a free account and try it
            with your own design — setup takes less than 20 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 mt-6 text-[14px] font-medium text-white grad-bg px-5 py-3 rounded-2xl hover:opacity-95 transition"
          >
            Start free — no card needed
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1240px] mx-auto px-6 pb-28">
        <div className="grad-bg rounded-3xl p-10 lg:p-14 text-white flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div
            className="absolute -top-20 -right-20 h-56 w-56 rounded-full opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(closest-side, white, transparent)",
            }}
          />
          <div className="relative">
            <h2 className="font-display font-bold text-[28px] sm:text-[32px]">
              Ready to ship your first event?
            </h2>
            <p className="mt-2 text-white/80 text-[16px]">
              Free tier, no card required.
            </p>
          </div>
          <Link
            href="/signup"
            className="relative shrink-0 inline-flex items-center gap-2 text-[15px] font-semibold text-brand-ink bg-white px-6 py-3.5 rounded-2xl hover:bg-white/90 transition"
          >
            Get started free
          </Link>
        </div>
      </section>
    </>
  );
}
