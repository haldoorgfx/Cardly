import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-[16px] text-[#0a0a0a]">
              Cardly
            </Link>
            <span className="text-[13px] text-neutral-400">© 2026 Cardly Labs</span>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-neutral-400">
            <a href="#" className="hover:text-neutral-600 transition">Privacy</a>
            <span className="text-neutral-200">·</span>
            <a href="#" className="hover:text-neutral-600 transition">Terms</a>
            <span className="text-neutral-200">·</span>
            <a href="#" className="hover:text-neutral-600 transition">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
