import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-brand-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Link href="/" className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-xl grad-bg grid place-items-center text-white font-display font-bold">
                C
              </span>
              <span className="font-display font-bold text-[17px]">Cardly</span>
            </Link>
            <p className="mt-4 text-[14px] text-brand-ink/60 max-w-sm leading-relaxed">
              Designer-native attendance cards for events worldwide.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="text-[12px] font-mono text-brand-ink/40">
                v 1.0 · status
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] font-mono text-brand-ink/60">
                operational
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <div className="text-[12px] font-mono tracking-widest text-brand-ink/40 mb-4">
                PRODUCT
              </div>
              <ul className="space-y-2.5 text-[14px] text-brand-ink/80">
                <li>
                  <Link href="/dashboard" className="hover:text-brand-primary transition">
                    Editor
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-brand-primary transition">
                    How it works
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases" className="hover:text-brand-primary transition">
                    Use cases
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-brand-primary transition">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[12px] font-mono tracking-widest text-brand-ink/40 mb-4">
                COMPANY
              </div>
              <ul className="space-y-2.5 text-[14px] text-brand-ink/80">
                <li>
                  <Link href="/about" className="hover:text-brand-primary transition">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-brand-primary transition">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-[12px] font-mono tracking-widest text-brand-ink/40 mb-4">
                LEGAL
              </div>
              <ul className="space-y-2.5 text-[14px] text-brand-ink/80">
                <li>
                  <Link href="/privacy" className="hover:text-brand-primary transition">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-brand-primary transition">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-brand-border text-[12px] font-mono text-brand-ink/50">
          <span>© 2026 Cardly.</span>
        </div>
      </div>
    </footer>
  );
}
