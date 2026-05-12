import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 border-b border-brand-border/60">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-10 h-16">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-xl grad-bg grid place-items-center text-white font-display font-bold">
            C
          </span>
          <span className="font-display font-bold text-[17px]">Cardly</span>
        </Link>

        <ul className="hidden md:flex items-center gap-9 text-[14px] text-brand-ink/70">
          <li>
            <a className="hover:text-brand-ink transition" href="#how">
              How it works
            </a>
          </li>
          <li>
            <a className="hover:text-brand-ink transition" href="#showcase">
              Showcase
            </a>
          </li>
          <li>
            <Link className="hover:text-brand-ink transition" href="/pricing">
              Pricing
            </Link>
          </li>
          <li>
            <a className="hover:text-brand-ink transition" href="#faq">
              FAQ
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-[14px] text-brand-ink/80 hover:text-brand-ink px-3 py-2 rounded-lg transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white grad-bg px-4 py-2 rounded-xl shadow-soft hover:opacity-95 transition"
          >
            Start free
            <ArrowIcon />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function ArrowIcon() {
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
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
