import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Features", href: "/#how" },
    { label: "Showcase", href: "/#showcase" },
    { label: "Pricing", href: "/pricing" },
    { label: "Templates", href: "/templates" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Blog", href: "/blog" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "DMCA", href: "/dmca" },
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/eventera-logo.png" alt="Eventera" style={{ height: '28px', objectFit: 'contain' }} />
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
          <span className="text-[12px] text-[#6B7A72]">© 2026 Eventera · Made in Djibouti</span>
          <a href="mailto:hello@eventera.so" className="text-[12px] text-[#3A4A42] hover:text-[#0F1F18] transition">
            hello@eventera.so
          </a>
        </div>
      </div>
    </footer>
  );
}
