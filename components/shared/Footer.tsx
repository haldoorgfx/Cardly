import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#how" },
    { label: "Showcase", href: "/#showcase" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Security", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-[#E5E0D4]" style={{ background: "#FAF6EE" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-14 pb-10">

        {/* Top: brand col + link cols */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <span className="font-display font-semibold text-[18px] text-[#0F1F18] tracking-tight">Karta</span>
            </Link>
            <p className="mt-3 text-[13px] text-[#6B7A72] leading-relaxed max-w-[200px]">
              Personalized event cards for every attendee, at any scale.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[12px] text-[#6B7A72]">All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <div className="text-[11px] font-medium text-[#6B7A72] tracking-widest uppercase mb-4">
                {section}
              </div>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-[#3A4A42] hover:text-[#0F1F18] transition">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#E5E0D4]" />

        {/* Bottom row */}
        <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[12px] text-[#6B7A72]">© 2026 Karta · Made with care in Lagos</span>
          <div className="flex items-center gap-5">
            <a href="#" className="text-[#6B7A72] hover:text-[#3A4A42] transition" aria-label="Twitter / X">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-[#6B7A72] hover:text-[#3A4A42] transition" aria-label="LinkedIn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="#" className="text-[#6B7A72] hover:text-[#3A4A42] transition" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
