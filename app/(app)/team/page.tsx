import Link from 'next/link';

export default function TeamPage() {
  return (
    <div className="px-8 py-8 max-w-[700px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
          <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Team</span>
        </div>
        <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Team</h1>
        <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">Invite collaborators to your workspace.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-10 text-center shadow-soft">
        <div className="h-16 w-16 rounded-2xl mx-auto mb-5 grid place-items-center text-white" style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-[22px] mb-2">Team collaboration</h2>
        <p className="text-[14px] text-[#0f0f1a]/55 max-w-[380px] mx-auto mb-6">
          Invite team members to collaborate on events, share designs, and manage your workspace together. Available on the Studio plan.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-95 transition"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }}
        >
          Upgrade to Studio →
        </Link>
      </div>
    </div>
  );
}
