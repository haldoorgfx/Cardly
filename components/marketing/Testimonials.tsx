import { Sparkles, ScanLine, Globe } from 'lucide-react';

// Honest value props (no fabricated testimonials — the product is pre-launch).
const REASONS = [
  {
    icon: Sparkles,
    title: 'Every attendee leaves with a card',
    body: "The only event platform where registration ends with a personalized, shareable card — your brand, their name, generated automatically. No designer, no Canva.",
    gradient: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
  },
  {
    icon: ScanLine,
    title: 'Run your event from your pocket',
    body: 'Scan attendees in, register walk-ins, take cash at the door, and watch live stats — even when the venue Wi-Fi drops. Offline-tolerant by design.',
    gradient: 'radial-gradient(120% 120% at 30% 25%, #c8e6d4 0%, #5a9e78 55%, #2d6647 100%)',
  },
  {
    icon: Globe,
    title: 'Built for Africa, works everywhere',
    body: 'Mobile-money payments (WaafiPay), WhatsApp-ready communications, and a mobile-first experience — built for how events actually run, wherever you are.',
    gradient: 'radial-gradient(120% 120% at 30% 25%, #dce8f5 0%, #6a9ec9 55%, #2e5f8a 100%)',
  },
];

export function Testimonials() {
  return (
    <section className="relative border-y border-border overflow-hidden">
      {/* Background glow */}
      <div aria-hidden className="absolute pointer-events-none inset-0 grid place-items-center">
        <div
          style={{
            width: 800,
            height: 500,
            background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
            Why Eventera
          </div>
          <h2 className="font-title font-bold text-ink text-[34px] sm:text-[42px] lg:text-[48px] leading-[1.05]">
            Built for how events actually run.
          </h2>
        </div>

        {/* Three-column grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {REASONS.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.title}
                className="relative flex flex-col gap-5 rounded-2xl p-8"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl shrink-0 grid place-items-center"
                  style={{ background: r.gradient, color: 'rgba(255,255,255,0.95)' }}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
                <h3 className="font-display font-semibold text-ink text-[19px] leading-[1.3] tracking-[-0.01em]">
                  {r.title}
                </h3>
                <p className="text-[15px] leading-[1.55] text-muted">
                  {r.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
