import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      "Eventera turned 600 attendees into 600 brand ambassadors. The reach was far beyond what we expected — and the visual identity stayed locked the whole way.",
    name: "Amara Yusuf",
    role: "Comms Lead",
    org: "Pan-African Climate Summit",
    initials: "AY",
    gradient: "radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)",
  },
  {
    quote:
      "We used to spend three hours before every event coaching speakers on how to use the Canva template. Now we send one link and it's done in 30 seconds. No exceptions.",
    name: "Chioma Okafor",
    role: "Head of Events",
    org: "TechPoint Africa",
    initials: "CO",
    gradient: "radial-gradient(120% 120% at 30% 25%, #c8e6d4 0%, #5a9e78 55%, #2d6647 100%)",
  },
  {
    quote:
      "Our NGO partners across four countries ran the same campaign look without a single design brief. The brand consistency was the best we've ever achieved.",
    name: "Nadia El-Amin",
    role: "Campaign Director",
    org: "GreenFuture Africa",
    initials: "NE",
    gradient: "radial-gradient(120% 120% at 30% 25%, #dce8f5 0%, #6a9ec9 55%, #2e5f8a 100%)",
  },
];

export function Testimonials() {
  return (
    <section className="relative border-y border-border overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none inset-0 grid place-items-center"
      >
        <div
          style={{
            width: 800,
            height: 500,
            background:
              "radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Testimonials
          </div>
          <h2 className="font-title font-bold text-ink text-[34px] sm:text-[42px] lg:text-[48px] leading-[1.05]">
            Organisers who&apos;ve made the switch.
          </h2>
        </div>

        {/* Three-column grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="relative flex flex-col gap-6 rounded-2xl p-8"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E5E0D4",
                boxShadow:
                  "0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)",
              }}
            >
              {/* Quote icon */}
              <div className="text-accent">
                <Quote size={28} strokeWidth={1.5} style={{ fill: "currentColor" }} />
              </div>

              {/* Quote text */}
              <blockquote className="flex-1 font-display font-medium text-ink text-[18px] leading-[1.45] tracking-[-0.01em] italic">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Attribution */}
              <figcaption className="flex items-center gap-3 pt-4 border-t border-border">
                <div
                  className="w-10 h-10 rounded-full shrink-0 grid place-items-center font-display font-semibold text-[13px]"
                  style={{
                    background: t.gradient,
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-ink leading-tight">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-muted  tracking-[0.1em] uppercase mt-0.5">
                    {t.role} · {t.org}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
