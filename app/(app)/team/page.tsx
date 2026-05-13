import Link from 'next/link';

export default function TeamPage() {
  return (
    <div className="px-8 py-8 max-w-[700px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#0F1F18]/40">
          <span>WORKSPACE</span><span>/</span><span className="text-[#0F1F18]/70">Team</span>
        </div>
        <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Team</h1>
        <p className="text-[#0F1F18]/60 mt-1 text-[14.5px]">Invite collaborators to your workspace.</p>
      </div>

      {/* Upgrade card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-soft mb-6">
        <div className="h-2 w-full bg-primary" />
        <div className="p-8 text-center">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-5 grid place-items-center text-white bg-primary">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h2 className="font-display font-bold text-[22px] mb-2">Team collaboration</h2>
          <p className="text-[14px] text-[#0F1F18]/55 max-w-[380px] mx-auto mb-7">
            Invite team members to collaborate on events, share designs, and manage your workspace together.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-2 max-w-[380px] mx-auto mb-7 text-left">
            {[
              'Unlimited team seats',
              'Role-based permissions',
              'Shared brand kit',
              'Collaborative editing',
              'Team analytics',
              'Priority support',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-[13px] text-[#0F1F18]/70">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {f}
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-white px-6 py-3 rounded-xl bg-primary hover:opacity-95 transition"
          >
            Upgrade to Studio →
          </Link>
          <div className="mt-3 text-[11.5px] text-[#0F1F18]/40">Available on the Studio plan · from $49/mo</div>
        </div>
      </div>

      {/* Placeholder members list */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-soft">
        <div className="text-[11px] font-mono tracking-widest text-[#0F1F18]/45 mb-4">MEMBERS</div>
        <div className="flex items-center gap-3 py-3 border-b border-cream">
          <div className="h-9 w-9 rounded-full grid place-items-center text-white font-bold text-[13px] shrink-0 bg-primary">
            You
          </div>
          <div className="flex-1">
            <div className="text-[13.5px] font-medium">You</div>
            <div className="text-[11.5px] text-[#0F1F18]/45">Owner</div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary">Owner</span>
        </div>
        <div className="pt-4 text-center">
          <div className="text-[13px] text-[#0F1F18]/40 mb-3">No team members yet.</div>
          <button disabled className="inline-flex items-center gap-2 text-[13px] font-medium text-[#0F1F18]/30 border border-border px-4 py-2 rounded-xl cursor-not-allowed">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Invite team member
          </button>
          <div className="mt-2 text-[11px] text-[#0F1F18]/35">Requires Studio plan</div>
        </div>
      </div>
    </div>
  );
}
